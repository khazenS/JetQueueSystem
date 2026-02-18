const jwt = require('jsonwebtoken');

// Admin token processes
function getTokenforAdmin(){
    const token = jwt.sign({
        type:'admin',
        expiresTime:'1w'
    },process.env.JWT_SECRET,{expiresIn: '1w'})

    return token
}

function verificationToken(firstToken){
    let response = ""
    jwt.verify(firstToken,process.env.JWT_SECRET, (err,decode) => {
        if (err) {
            response = false
        }
        else{
            response = decode
        }
    })

    return response
}

// Que token processes
function getTokenforQue(userBookingID,dayBookingID){
    const token = jwt.sign({
        type:'Queue',
        userBookingID,
        dayBookingID
    },process.env.JWT_SECRET,{expiresIn: '1d'})

    return token
}

function verificationQueToken(firstToken){
    let response = ""
    jwt.verify(firstToken,process.env.JWT_SECRET, (err,decode) => {
        if (err) {
            response = false
        }
        else{
            response = decode
        }
    })

    return response 
}

// Verified User token processes
function getTokenforVerifiedUser(userID,serviceID,comingWith){
    const token = jwt.sign({
        userType:'verified',
        userID,
        serviceID,
        comingWith
    },process.env.JWT_SECRET)

    return token
}

function verificationTokenforVerifiedUser(firstToken){
    let response = ""
    jwt.verify(firstToken,process.env.JWT_SECRET, (err,decode) => {
        if (err) {
            response = false
        }
        else{
            response = decode
        }
    })

    return response 
}

module.exports = {
    getTokenforAdmin,
    verificationToken,
    getTokenforQue,
    verificationQueToken,
    getTokenforVerifiedUser,
    verificationTokenforVerifiedUser
}