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
// Stable identity token: encodes only the userID (+ type). No expiry and
// `noTimestamp` so the same user always yields the same string, meaning a
// re-mint never invalidates a previously issued token. Service preferences are
// stored on the User document, not in the token.
function getTokenforVerifiedUser(userID){
    const token = jwt.sign({
        userType:'verified',
        userID
    },process.env.JWT_SECRET,{noTimestamp: true})

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