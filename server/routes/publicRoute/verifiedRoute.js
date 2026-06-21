
const express = require('express');
const { checkingInfos, generateCode } = require('../../helpers/smsVerificationHelper');
const { checkBlockedUser, smsReqestLimiter, verifyLimiter } = require('../../middleware/requestLimiter');
const { SMSVerification } = require('../../database/schemas/smsVerification');
const { User } = require('../../database/schemas/userSchema');
const { Shop } = require('../../database/schemas/shopSchema');
const { getTokenforVerifiedUser, verificationTokenforVerifiedUser } = require('../../helpers/jwtProcesses');
const { v4: uuidv4 } = require('uuid');
const { logReportWithErrorMessage } = require('../../helpers/reportLogger');
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

            // We send SMS for code verification in production, but in development, we skip this step to avoid unnecessary SMS costs and just log the code to the console for testing purposes.
            try {
                const params = {
                    // api_id: process.env.API_ID,
                    api_key: process.env.API_KEY,
                    sender: process.env.SENDER,
                    message_type: "normal",
                    message:`${process.env.SHOP_NAME} kayıt kodu ${code}. Sistemin gelişmesi için sizin geri dönüşleriniz çok önemli.`,
                    phones: [phoneNumber]
                }

                const smsResponse = await axios.post(process.env.API_URL, params);
                logReportWithErrorMessage('SEND_SMS_PROVIDER_RESPONSE', `phoneNumber: ${phoneNumber}, status: ${smsResponse.status}, data: ${JSON.stringify(smsResponse.data)}`);
            }catch (error) {
                logReportWithErrorMessage('SEND_SMS_PROVIDER_ERROR', `phoneNumber: ${phoneNumber}, message: ${error.message}, status: ${error.response && error.response.status}, data: ${JSON.stringify(error.response && error.response.data)}, API_URL set?: ${!!process.env.API_URL}`);
                return res.json({
                    status: false,
                    message: 'SMS gönderilirken bir hata oluştu. Lütfen tekrar deneyin.'
                })
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

        const defaultService = await Shop.findOne().then(shop => shop.services[0]); // Get the first service from the shop

        if (verifiedUser) {
            if (verifiedUser.name !== tokenDoc.name) verifiedUser.name = tokenDoc.name;
        }
        else{
            const now = new Date();
            const localDate = new Date(new Date().getTime() - (now.getTimezoneOffset() * 60 * 1000))
            // If no verified user exists, create a new one with default preferences
            verifiedUser = new User({
                name: tokenDoc.name,
                phoneNumber: tokenDoc.phoneNumber,
                userType: 'verified',
                createdAt: localDate,
                preferredServiceID: defaultService ? defaultService.serviceID : null,
                preferredComingWith: 1
            });
        }
        // New users need to be saved first so mongoose-sequence assigns userID
        // before we mint the (userID-based) token.
        if(!verifiedUser.userID){
            await verifiedUser.save();
        }
        // Always re-mint the identity token on every verification. It is
        // deterministic (userID + current JWT_SECRET), so under a stable secret
        // the same string is reproduced and other devices stay valid — but if
        // JWT_SECRET ever changed, this self-heals by re-issuing a token signed
        // with the current secret instead of returning a stale, unverifiable one.
        verifiedUser.token = getTokenforVerifiedUser(verifiedUser.userID);
        await verifiedUser.save();
        // SMS doğrulama belgesini sil
        await SMSVerification.deleteOne({ token: token });

        // Resolve the user's stored service preference for the response
        const userService = await Shop.findOne()
            .then(shop => shop.services.find(s => s.serviceID == verifiedUser.preferredServiceID)) || defaultService;

        // Başarılı yanıt gönder
        res.json({
            status: true,
            message: 'SMS dogrulama başarılı.',
            user: {
                token: verifiedUser.token,
                name: verifiedUser.name,
                userID: verifiedUser.userID,
                phoneNumber: verifiedUser.phoneNumber,
                service: userService ? {
                    serviceID : userService.serviceID,
                    name: userService.name
                } : null,
                comingWith: verifiedUser.preferredComingWith
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

    // Validate by signature only. Guard before touching userInfo.userID, since
    // a failed verification returns `false`.
    const userInfo = verificationTokenforVerifiedUser(userToken)
    if(userInfo === false){
        return res.json({
            status:false,
            invalidIdentity:true,
            message:'Doğrulamanız artık geçersiz. Lütfen tekrar doğrulayın.'
        })
    }

    const user = await User.findOne({userType : 'verified',userID:userInfo.userID})
    if(!user){
        return res.json({
            status:false,
            invalidIdentity:true,
            message:'Doğrulamanız artık geçersiz. Lütfen tekrar doğrulayın.'
        })
    }

    // Service/comingWith come from the user's stored preferences, not the token.
    // Fall back to the shop's default service for users predating these fields.
    const shop = await Shop.findOne()
    let service = shop.services.find(service => service.serviceID == user.preferredServiceID) || shop.services[0]
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
            comingWith: user.preferredComingWith
        }
    })



})


verifiedRouter.post('/update-verified-user-service', async (req,res) => {
    let serviceName
    // Identify the user by the signature-validated token, not an exact match.
    const userInfo = verificationTokenforVerifiedUser(req.body.userToken)
    const user = userInfo === false ? null : await User.findOne({userID:userInfo.userID,userType:'verified'})
    if(!user){
        return res.json({
            status:false,
            invalidIdentity:true,
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
        // Update stored preferences only; the identity token stays unchanged.
        user.preferredServiceID = newServiceID
        user.preferredComingWith = newComingWith
        await user.save()
    }

    res.json({
        status:true,
        message:'Servis başarıyla güncellendi.',
        serviceID: req.body.newServiceID,
        comingWith: req.body.newComingWith,
        serviceName: serviceName
    })
})

// Logout for verified users
verifiedRouter.post('/logout', async (req,res) => {
    // Identity is now signature-based, so logout is effectively a client-side
    // clear. We still acknowledge it; we intentionally do NOT null the stored
    // token, since it is shared/stable across the user's devices and the JWT is
    // deterministic anyway.
    res.json({
        status:true,
        message:'Çıkış işlemi başarılı.'
    })
})
module.exports = verifiedRouter;