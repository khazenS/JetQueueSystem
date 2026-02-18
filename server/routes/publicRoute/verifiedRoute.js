
const express = require('express');
const { checkingInfos, generateCode } = require('../../helpers/smsVerificationHelper');
const { checkBlockedUser, smsReqestLimiter, verifyLimiter } = require('../../middleware/requestLimiter');
const { SMSVerification } = require('../../database/schemas/smsVerification');
const { User } = require('../../database/schemas/userSchema');
const { Shop } = require('../../database/schemas/shopSchema');
const { getTokenforVerifiedUser, verificationTokenforVerifiedUser } = require('../../helpers/jwtProcesses');
const { v4: uuidv4 } = require('uuid');
const axios = require('axios');

const verifiedRouter = express.Router();
// Sending SMS for verification
verifiedRouter.post('/send-sms', checkingInfos, checkBlockedUser, smsReqestLimiter ,async (req,res) => {
    let phoneNumber, code, token, name
    try {
        phoneNumber = req.body.phoneNumber.replace(/\s+/g, '').trim()
        code = generateCode(4)
        token = uuidv4();
        name = req.body.name


        await SMSVerification.create({
            name: name,
            phoneNumber: phoneNumber,
            code: code,
            token: token
        })        
    }catch (error) {
        return res.json({
            status: false,
            message: 'SMS doğrulama kaydı oluşturulurken bir hata oluştu. Lütfen tekrar deneyin.'
        })
    }


    if (process.env.NODE_ENV === 'production') {
        // We send SMS for code verification in production, but in development, we skip this step to avoid unnecessary SMS costs and just log the code to the console for testing purposes.
        try {
            const params = {
                api_id: process.env.API_ID,
                api_key: process.env.API_KEY,
                sender: process.env.SENDER,
                message_type: "normal",
                message:`${process.env.SHOP_NAME} kayıt kodu ${code}. Sistemin gelişmesi için sizin geri dönüşleriniz çok önemli.`,
                phones: [phoneNumber]
            }

            const smsResponse = await axios.post(process.env.API_URL, params);  
        }catch (error) {
            return res.json({
                status: false,
                message: error.message || 'SMS gönderilirken bir hata oluştu. Lütfen tekrar deneyin.' 
            })
        }
    } else {
        console.log(`SMS sent to ${phoneNumber} with code: ${code}`);
    }
    
    res.json({
        status:true,
        message:'SMS sent successfully.',
        token: token,
        expireTime: 1000 * 60 * 2
    })
})

verifiedRouter.post('/verify-sms', verifyLimiter , async (req,res) => {
    const token =req.body.token
    const code = req.body.code
    const tokenDoc = await SMSVerification.findOne({token : token})

    // Check conditions
    if(!tokenDoc){
        return res.json({
            status:false,
            message:'Gerçersiz token. Lütfen yeniden SMS isteyin.'
        })
    }

    tokenDoc.count += 1
    await tokenDoc.save()
    if(tokenDoc.count >= 3){
        return res.json({
            status:false,
            message:'Çok fazla deneme yaptınız. Lütfen yeniden SMS isteyin.'
        })
    }

    if(tokenDoc.code !== code){
        return res.json({
            status:false,
            message:'SMS doğrulama kodu yanlış. Lütfen tekrar deneyin.'
        })
    }


    try {
        // Check if a verified user already exists with the same phone number
        let verifiedUser = await User.findOne({
            phoneNumber: tokenDoc.phoneNumber,
            userType: 'verified'
        });
    
        if (verifiedUser) {
            if (verifiedUser.name !== tokenDoc.name) verifiedUser.name = tokenDoc.name;
            await verifiedUser.save();
        }
        else{
            const now = new Date();
            const localDate = new Date(new Date().getTime() - (now.getTimezoneOffset() * 60 * 1000))
            // If no verified user exists, create a new one
            verifiedUser = await new User({
                name: tokenDoc.name,
                phoneNumber: tokenDoc.phoneNumber,
                userType: 'verified',
                createdAt: localDate
            }).save();    
        }
        let service = await Shop.findOne().then(shop => shop.services[0]); // Get the first service from the shop
        // Create a token for the verified user
        const userToken = getTokenforVerifiedUser(verifiedUser.userID,service.serviceID,1); 
        verifiedUser.token = userToken;
        await verifiedUser.save();
        // SMS doğrulama belgesini sil
        await SMSVerification.deleteOne({ token: token });

        // Başarılı yanıt gönder
        res.json({
            status: true,
            message: 'SMS dogrulama başarılı.',
            user: {
                token: userToken,
                name: verifiedUser.name,
                userID: verifiedUser.userID,
                phoneNumber: verifiedUser.phoneNumber,
                service: service ? {
                    serviceID : service.serviceID,
                    name: service.name
                } : null,
                comingWith: 1
            }
        });        
        }catch (error) {
        console.error('User creation error:', error);
        res.json({
            status: false,
            message: 'Kullanıcı oluşturulurken bir hata oluştu. Lütfen tekrar deneyin.'
        });
    }
})


verifiedRouter.post('/get-user-info', async (req,res) => {
    const userToken = req.body.userToken
    if(!userToken){
        return res.json({
            status:false,
            message:'Token bulunamadı. Lütfen tekrar doğrulayın.'
        })
    }

    const userInfo = verificationTokenforVerifiedUser(userToken)
    const user = await User.findOne({userType : 'verified',userID:userInfo.userID})
    if(!user || userInfo === false){
        return res.json({
            status:false,
            message:'Doğrulamanız artık geçersiz. Lütfen tekrar doğrulayın.'
        })
    }

    if(userToken !== user.token){
        return res.json({
            status:false,
            message:'Eski token kullanılıyor. Lütfen tekrar doğrulayın.'
        })
    }

    let service = await Shop.findOne().then(shop => shop.services.find(service => service.serviceID == userInfo.serviceID))
    res.json({
        status:true,
        user:{
            token:user.token,
            userID:user.userID,
            name:user.name,
            phoneNumber:user.phoneNumber,
            service:service ? {
                serviceID: service.serviceID,
                name:service.name
            } : null,
            comingWith: userInfo.comingWith
        }
    })
    
    
    
})


verifiedRouter.post('/update-verified-user-service', async (req,res) => {
    let newToken,serviceName
    const user = await User.findOne({token:req.body.userToken,userType:'verified'})
    if(!user){
        return res.json({
            status:false,
            message:'Kullanıcı bulunamadı. Lütfen tekrar doğrulayın.'
        })
    }else{
        const shop = await Shop.findOne()
        const newServiceID = req.body.newServiceID
        const newComingWith = req.body.newComingWith

        if(!shop.services.some(service => service.serviceID == newServiceID) || newComingWith < 1 || newComingWith > 5){
            return res.json({
                status:false,
                message:'Geçersiz servis seçimi veya kişi sayısı.'
            })
        }
        serviceName = shop.services.find(service => service.serviceID == newServiceID).name
        newToken = getTokenforVerifiedUser(user.userID,newServiceID,newComingWith)
        user.token = newToken
        await user.save()
    }

    res.json({
        status:true,
        message:'Servis başarıyla güncellendi.',
        token:newToken,
        serviceID: req.body.newServiceID,
        comingWith: req.body.newComingWith,
        serviceName: serviceName
    })
})

// Logout for verified users
verifiedRouter.post('/logout', async (req,res) => {
    const verifiedUser = await User.findOne({userType : 'verified',token: req.body.userToken})
    if(!verifiedUser){
        return res.json({
            status:false,
            message:'Kullanıcı bulunamadı. Lütfen tekrar doğrulayın.'
        })
    }

    verifiedUser.token = null
    await verifiedUser.save()
    res.json({
        status:true,
        message:'Çıkış işlemi başarılı.'
    })
})
module.exports = verifiedRouter;