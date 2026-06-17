const mongoose = require('mongoose')
const mongooseSequence = require('mongoose-sequence')

const AutoIncrement = mongooseSequence(mongoose)


const userSchema = new mongoose.Schema({
    name:{
        type:String
    },
    phoneNumber:{
        type:Number
    },
    userType: {
        type: String,
        enum: ['verified', 'unverified'],
        required: true
    },
    userCount:{
        type:[{
            serviceID:Number,
            count:Number
        }],
        default:[]
    },
    paid:{
        type:Number,
        default:0
    },
    createdAt:{
        type:Date
    },
    token : {
        type: String,
        default: null
    },
    // Persisted service preferences for verified users. Kept on the document
    // (instead of being encoded in the identity token) so the token can stay
    // stable and changing the service never invalidates it.
    preferredServiceID : {
        type: Number,
        default: null
    },
    preferredComingWith : {
        type: Number,
        default: 1
    },

})

// This is for only there will be one user with same phone number and user type
userSchema.index(
    { phoneNumber: 1, userType: 1 }, 
    { unique: true }
)
userSchema.plugin(AutoIncrement,{ inc_field: 'userID' })

const User = mongoose.model('User',userSchema,'Users');

module.exports = {User};