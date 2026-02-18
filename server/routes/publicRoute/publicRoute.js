const express = require('express');
const { getTokenforAdmin, getTokenforQue, verificationQueToken, getTokenforVerifiedUser, verificationTokenforVerifiedUser } = require('../../helpers/jwtProcesses.js');
const { Shop } = require('../../database/schemas/shopSchema.js');
const { User } = require('../../database/schemas/userSchema.js');
const { DayBooking } = require('../../database/schemas/dayBookingSchema.js');
const { encryptData } = require('../../helpers/cryptoProcess.js');
const { MonthBooking } = require('../../database/schemas/monthBookingSchema.js');
const { UserBooking } = require('../../database/schemas/userBookingSchema.js');
const { Admin } = require('../../database/schemas/adminSchema.js');
const { getIO } = require('../../helpers/socketio.js');
const webpush = require('web-push');
const verifiedRouter = require('./verifiedRoute.js');
const { logReport_TwoData } = require('../../helpers/reportLogger.js');
const publicRouter = express.Router()

//Learn the shop open or close
publicRouter.get('/getShopStatus',async (req,res)=>{
    const shop = await Shop.findOne({shopID:1})

    const now = new Date()
    // It is giving difference between UTC time and local time in type of minute so now its logging -180 
    const offset = now.getTimezoneOffset()
    const localDate = new Date(now.getTime() - (offset * 60 * 1000))

    if(shop.costumOpeningDate && localDate >= shop.costumOpeningDate){
        shop.shopStatus = true
        shop.costumOpeningDate = null
        shop.costumFormattedOpeningDate = null
        await shop.save()
        const newDayBooking = await new DayBooking({
            existDayDate :  localDate
        }).save()

        const monthDate = new Date(Date.UTC(now.getFullYear(), now.getMonth(), 1))
        const currentMonthRecord = await MonthBooking.findOne({existMonthDate:monthDate})
        // Checking current month exist or not then to save new day booking into it
        if(currentMonthRecord){
            currentMonthRecord.dayBooking.push(newDayBooking.dayBookingID)
            await currentMonthRecord.save()
        }        
        else{
            const newMonthRecord = await new MonthBooking({
                existMonthDate: monthDate
            })
            newMonthRecord.dayBooking.push(newDayBooking.dayBookingID)
            await newMonthRecord.save()
        }
        getIO().emit('oto-status-change', {status: true});
        res.json({
            status:true,
            shopStatus: shop.shopStatus,
            orderFeature : shop.orderFeature,
            costumOpeningDate:shop.costumOpeningDate
        })
    }else{
        res.json({
            status:false,
            shopStatus: shop.shopStatus,
            orderFeature : shop.orderFeature,
            costumOpeningDate:shop.costumOpeningDate
        })
    }
})

publicRouter.post('/register-user',async (req,res) => {
    const isVerified = req.body.data.isVerified
    const user = isVerified ? await User.findOne({phoneNumber:req.body.data.phoneNumber, userType:'verified'}) : await User.findOne({phoneNumber:req.body.data.phoneNumber, userType:'unverified'})
    const adminDoc = await Admin.findOne()
    // date 
    const now = new Date();
    const offset = now.getTimezoneOffset()
    const localDate = new Date(now.getTime() - (offset * 60 * 1000))

    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = String(now.getFullYear()).slice(-2);
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');

    const formattedDate = `${day}-${month}-${year} ${hours}:${minutes}`;
    // get current daily shop
    const lastDayBooking = await DayBooking.findOne().sort({existDayDate : -1})
    
    let updatedUser = null

    // Controlling for is user exists
    if(isVerified){
        const userToken = req.body.data.token
        if(verificationTokenforVerifiedUser(userToken) && user && user.token === userToken){
            // user exists and verified
            updatedUser = user
        }else{
            return res.json({
                status:false,
                message:'Verified token is not valid. Please try again.'
            })
        }
    }else{
        if(!user){
            // new user record
            updatedUser = await new User({
                userType:'unverified',
                name:req.body.data.name,
                phoneNumber:req.body.data.phoneNumber,
                createdAt:localDate
            }).save()
        }else{
            //update user
            user.name = req.body.data.name
            updatedUser = await user.save()
        }        
    }

    const shop = await Shop.findOne()
    const service = !req.body.data.serviceID ? shop.services[0] : shop.services.find(service => service.serviceID == req.body.data.serviceID)
    if(!service || !shop){
        return res.json({
            status:false,
            message:'Dükkanın veya hizmet bulunamadı. Sayfayı yenileyip tekrar deneyiniz.'
        })
    }

    // Control if users still exists in que for today
    for (const userBookingId of lastDayBooking.usersBooking) {
            const existingBooking = await UserBooking.findOne({ userBookingID: userBookingId });
            if (existingBooking && existingBooking.userID === updatedUser.userID) {
                
                // We log for find the problem.
                logReport_TwoData('User Already Exists in Que', 'userID', updatedUser.userID, 'userBookingID ', existingBooking.userBookingID)

                // This migth be crash
                /* return res.json({
                    status: false,
                    message: 'Bu kullanıcı zaten bugün için kayıtlıdır.'
                }); */
            }
        }
    //new user booking record
    let newUserBooking = await new UserBooking({
        userID:updatedUser.userID,
        serviceID: service.serviceID,
        comingWith:req.body.data.comingWithValue,
        bookingToken:null,
        registerTime:localDate
    }).save()
    const bookingToken = getTokenforQue(newUserBooking.userBookingID,lastDayBooking.dayBookingID)
    newUserBooking.bookingToken = bookingToken
    await newUserBooking.save()

    // This is for a bug that I lived once so its just prevention.
    if(!updatedUser || !newUserBooking){
        console.err('updatedUser is null or undefined')
        return res.json({
            status:false,
            message:'There is an error while creating user.'
        })
    } 

    //push to que new user
    lastDayBooking.usersBooking.push(newUserBooking.userBookingID)
    await lastDayBooking.save()


    const cryptedData = encryptData(
        {
            name:req.body.data.name,
            service:{
                name:service.name,
                estimatedTime:service.estimatedTime
            },
            serviceEstimatedTime:service.estimatedTime,
            comingWith:req.body.data.comingWithValue,
            userBookingID:newUserBooking.userBookingID,
            phoneNumber:req.body.data.phoneNumber,
            shownDate:formattedDate,
            isVerified: updatedUser.userType === 'verified' ? true : false
        }
    )
    // This part for sending notification to admin
    const messagePayload = JSON.stringify({
        title: 'Sıra Güncellemesi',
        body: `${req.body.data.name} isimli müşteri sıraya girdi.`
    })

    try{
        await webpush.sendNotification(adminDoc.subscription, messagePayload)
    }catch(err){
        console.error("There is an notification error.")
    }

    getIO().emit('newUser',cryptedData)
    return res.json({
        status:true,
        queueToken:bookingToken
    })
})

// If exists get daily booking or create new one
publicRouter.get('/get-dailyBooking', async (req,res) => {
    const latestRecord = await DayBooking.findOne().sort({existDayDate : -1})
    const shop = await Shop.findOne()
    const responseArray = []
    for(const userBookingID of latestRecord.usersBooking){
        const currentUserBooking = await UserBooking.findOne({userBookingID:userBookingID})
        const service = shop.services.find(service => service.serviceID == currentUserBooking.serviceID)
        if(currentUserBooking.userID === undefined){
            const responseData = {
                name:currentUserBooking.name,
                service:{
                    name:service.name,
                    estimatedTime:service.estimatedTime
                },
                comingWith:currentUserBooking.comingWith,
                userBookingID:userBookingID,
                phoneNumber : null,
                isVerified:false
            }
            responseArray.push(responseData)
        }else{
            const currentUser = await User.findOne({userID:currentUserBooking.userID})
            const responseData = {
                name:currentUser.name,
                service:{
                    name:service.name,
                    estimatedTime:service.estimatedTime
                },
                comingWith:currentUserBooking.comingWith,
                userBookingID:userBookingID,
                phoneNumber : encryptData(currentUser.phoneNumber),
                isVerified : currentUser.userType === 'verified' ? true : false
            }
            responseArray.push(responseData)
        }
    }

    
    res.json({
        status: true,
        dailyQue : encryptData(responseArray),
        dayBookingID: encryptData(latestRecord.dayBookingID),
        services: shop.services
    })

    
})

// Check the que token when page uploaded
publicRouter.post('/check-queue-token',async (req,res) => {
    const tokenBody = verificationQueToken(req.body.queueToken)
    if(tokenBody !== false){
        res.json({
            status: true,
            queueToken: req.body.queueToken,
            message: 'token is valid'
        })
    }else{
        res.json({
            status:false,
            message:'token is not valid'
        })
    }       
})

// Controlling queueToken for cancel the order and then cancel
publicRouter.post('/cancel-queue', async (req,res) => {
    const tokenBody = verificationQueToken(req.body.queueToken)
    const adminDoc = await Admin.findOne({})
    if(tokenBody){
        const userBooking = await UserBooking.findOne({userBookingID:tokenBody.userBookingID})
        const dayBooking = await DayBooking.findOne({dayBookingID:tokenBody.dayBookingID})
        if(req.body.queueToken === userBooking.bookingToken && dayBooking.usersBooking.indexOf(userBooking.userBookingID) > -1){
            const user = await User.findOne({userID:userBooking.userID})
            dayBooking.usersBooking = dayBooking.usersBooking.filter( userBookingID => userBookingID !== userBooking.userBookingID)
            await dayBooking.save()
            getIO().emit('cancel', userBooking.userBookingID)
            // This part for sending notification to admin
            const messagePayload = JSON.stringify({
                title: 'Sıra Güncellemesi',
                body: `${user.name} isimli müşteri sırasını iptal etti.`
            })
            try{
                await webpush.sendNotification(adminDoc.subscription, messagePayload)
            }catch(err){
                console.error("There is an notification error.")
            }   
            res.json({
                status:true,
                userBookingID:userBooking.userBookingID
            })
        }else{
            res.json({
                status:false,
                message:'Token is not valid'
            })
        }
    }else{
        res.json({
            status:false,
            message:'Token is not valid'
        })
    }
})


//Create a admin access token and send to ui 
publicRouter.post('/admin-login' , async (req,res) => {
    const admin = await Admin.findOne()
    if(admin.username === req.body.username && admin.password === req.body.password){
        const adminAccessToken = getTokenforAdmin()
        admin.adminAccessToken = adminAccessToken
        await admin.save()

        res.json({
            status:true,
            adminAccessToken
        })
    }else{
        res.json({
            status:false,
            message:'Invalid username or password.'
        })
    }

})

// getting message for announcment
publicRouter.get('/get-message' , async (req,res) => {
    const shop = await Shop.findOne()
    const message = shop.showMessage
    res.json({
        message:message
    })
})

// This route is for verify and relatred operations
publicRouter.use('/verified', verifiedRouter )

module.exports = publicRouter