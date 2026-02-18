const { RequestLimiterSMS } = require("../database/schemas/smsLimiterSchema")
const { BlockedUsers } = require("../database/schemas/blockedUsersSchema")
const axios = require('axios');
const { SMSVerification } = require("../database/schemas/smsVerification");
const { logReportWithErrorMessage } = require("../helpers/reportLogger");


const smsReqestLimiter = async (req,res,next) => {
    // Requirements
    const ip = req.ip
    const fingerprint = req.headers['fingerprint']
    const phoneNumber = req.body.phoneNumber.replace(/\s+/g, '').trim();      
    const reCAPTCHAToken = req.body.reCAPTCHAToken
    const name = req.body.name;
    // reCAPTCHA verification
    try {
        // Google'a doğrulama isteği
        const response = await axios.post(
          `https://www.google.com/recaptcha/api/siteverify`,
          null,
          {
            params: {
              secret: process.env.RECAPTCHA_SECRET_KEY,
              response: reCAPTCHAToken
            }
          }
        );
    
        const recaptcha_data = response.data;
    
        if (!recaptcha_data.success) {
          return res.json({ status:false , message: 'Token doğrulaması hatası.' });
        }

        if (recaptcha_data.score < 0.5 || recaptcha_data.action !== 'send_sms') {
            await BlockedUsers.create({
                IP: ip,
                fp_key: fingerprint,
                phoneNumber: phoneNumber,
                reason: 'reCAPTCHA low score or invalid action'
            })
            return res.json({ status:false , message: 'Bot davranışı şüphesi, kara listeye alındınız. Dükkan sahibiyle iletişime geçiniz.'});
        }
      } catch (err) {
        logReportWithErrorMessage('reCAPTCHA Verification Error', err.message || 'reCAPTCHA doğrulaması sırasında beklenmedik bir hata oluştu.')
        return res.json({ status:false , message: 'Beklenmedik bir hata oluştu. reCAPTCHA' });
    }


    let smsRequestDoc = await RequestLimiterSMS.findOne({ fp_key: fingerprint })

    if(!smsRequestDoc) {
        smsRequestDoc = await RequestLimiterSMS.create({
            name: name,
            ip : {
                current_ip: ip,
                last_ip:null
            },
            fp_key: fingerprint,
            phoneNumbers: [phoneNumber],
            isIPChanged: false
        })
    }else{
        if(name !== smsRequestDoc.name) smsRequestDoc.name = name
        // Change IP address if it is different from the current one
        if(ip !== smsRequestDoc.ip.current_ip && smsRequestDoc.ip.last_ip === null){
            smsRequestDoc.ip.last_ip = smsRequestDoc.ip.current_ip
            smsRequestDoc.ip.current_ip = ip
        }
        await smsRequestDoc.save()
    }

    // Suspected behaviour, IP address has changed 2 times , block him
    if(ip !== smsRequestDoc.ip.current_ip && ip !== smsRequestDoc.ip.last_ip) {
        smsReqestLimiter.ip.last_ip = smsRequestDoc.ip.current_ip
        smsRequestDoc.ip.current_ip = ip
        await smsRequestDoc.save()
        // Suspected behaviour, IP address has changed 2 times , block him
        await BlockedUsers.create({
            name: name,
            IP: ip,
            fp_key: fingerprint,
            phoneNumber: phoneNumber,
            reason: 'IP address changed multiple times'
        })
        return res.json({
            status: false,
            message: 'Kara listeye alındınız.Dükkan sahibiyle iletişime geçiniz.Son denemelerinizde IP adresiniz çok fazla değişti.'
        })
    }

    // If phone number is not in the list, add it and check if it exceeds the limit
    if(!smsRequestDoc.phoneNumbers.includes(phoneNumber)){
        smsRequestDoc.phoneNumbers.push(phoneNumber)
        await smsRequestDoc.save()
        if(smsRequestDoc.phoneNumbers.length > 2) {
            await BlockedUsers.create({
                IP: ip,
                fp_key: fingerprint,
                phoneNumber: phoneNumber,
                reason: 'Tried to send SMS to multiple phone numbers'
            })
            return res.json({
                status: false,
                message: 'Farklı telefon numaralarıyla kayıt denediz. Dükkan sahibiyle iletişime geçiniz.'
            })
        }
    }


    const firstTimeLimitation = 1000 * 60 * 60 * 12// 12 hour in milliseconds
    smsRequestDoc.counter += 1
    const nowTime = new Date().getTime()
    // If the request is made within the first 12 hours and the counter is 4, reject the request
    if((nowTime - smsRequestDoc.createdAt.getTime()) <= firstTimeLimitation && smsRequestDoc.counter == 4) {
        return res.json({
            status: false,
            message: `Çok fazla SMS gönderme denemesi yaptınız. Lütfen daha sonra tekrar deneyiniz.`,
        })
    }
    // If the request is made after the first 12 hours and the counter is 7, block the user
    if( (nowTime - smsRequestDoc.createdAt.getTime()) > firstTimeLimitation && smsRequestDoc.counter >= 7){
        await BlockedUsers.create({
            name: name,
            IP: ip,
            fp_key: fingerprint,
            phoneNumber: phoneNumber,
            reason: 'Too many SMS requests in a short time'
        })
        return res.json({
            status: false,
            message: 'Çok fazla SMS gönderme denemesi yaptınız. Kara listeye alındınız. Dükkan sahibiyle iletişime geçiniz.',
        })
    }
    await smsRequestDoc.save()
    next()
}

const checkBlockedUser = async (req, res, next) => {
    let ip,fingerprint;
    ip = req.ip
    fingerprint = req.headers['fingerprint']        
    const phoneNumber = req.body.phoneNumber.replace(/\s+/g, '').trim();   

    const blockedUser = await BlockedUsers.findOne({ fp_key: fingerprint })
    if (blockedUser) {
        if(blockedUser.IP !== ip) {
            blockedUser.IP = ip
            await blockedUser.save()
        }
        if(blockedUser.phoneNumber !== phoneNumber) {
            blockedUser.phoneNumber = phoneNumber
            await blockedUser.save()
        }
        return res.json({
            status: false,
            message: 'Kara listeye alındınız. Dükkan sahibiyle iletişime geçiniz.',
        })
    }

    next()
}

const verifyLimiter = async (req,res,next) => {
    const token = req.body.token
    const code = req.body.code
    
    if(!token || !code) {
        return res.json({
            status: false,
            message: "Eksik alanlar. Lütfen yeniden deneyin."
        });
    }
    next()
}

module.exports = {
    smsReqestLimiter,
    checkBlockedUser,
    verifyLimiter
}