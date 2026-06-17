import { createAsyncThunk, createSlice } from "@reduxjs/toolkit"
import axios from "axios"

let initialState ={
    send : {
        status:null,
        isLoading:false,
        errorMessage:'',
        token:null,
        expireTime:null
    },
    verify : {
        status:null,
        isLoading:false,
        message:'',
    },
    update : {
        status:null,
        isLoading:false,
        message:''
    },
    logout : {
        status:null,
        isLoading:false,
        message:''
    },
    getUserInfo:{
        status:null,
        isLoading:false,
        message:''
    },
    user : {
        token: null,
        userID: null,
        name: '',
        phoneNumber: '',
        service: {
            serviceID: null,
            name : '',
        },
        comingWith: ''
    }
}

export const send_sms = createAsyncThunk('verificationUserSlice/send_sms', async (datas) => {
    const response = await axios.post(process.env.REACT_APP_SERVER_URL + 'public/verified/send-sms', {
        name:datas.name,
        phoneNumber:datas.phoneNumber,
        reCAPTCHAToken: datas.reCAPTCHAToken
    },
    {
        headers: {
            'fingerprint': datas.fingerprint
        }
    })
    return response.data
})

export const verify_sms = createAsyncThunk('verificationUserSlice/verify_sms', async (datas) => {
    const response = await axios.post(process.env.REACT_APP_SERVER_URL + 'public/verified/verify-sms', {
        token: datas.token,
        code: datas.code,
        reCAPTCHAToken: datas.reCAPTCHAToken
    })

    return response.data
})

export const getUserInfo = createAsyncThunk('verificationUserSlice/getUserInfo', async (token) => {
    const response = await axios.post(process.env.REACT_APP_SERVER_URL + 'public/verified/get-user-info', {
        userToken: token
    })
    return response.data
})

export const updateVerifiedUserService = createAsyncThunk('verificationUserSlice/updateVerifiedUserService', 
    async (datas) => {
    const response = await axios.post(process.env.REACT_APP_SERVER_URL + 'public/verified/update-verified-user-service', {
        userToken: datas.token,
        newServiceID: datas.newServiceID,
        newComingWith: datas.newComingWith
    })

    return response.data
})

export const logoutVerifiedUser = createAsyncThunk('verificationUserSlice/logoutVerifiedUser', async (token) => {
    const response = await axios.post(process.env.REACT_APP_SERVER_URL + 'public/verified/logout', {
        userToken: token
    })
    return response.data
})

export const verificationUserSlice = createSlice({
    name:'verificationUserSlice',
    initialState,
    reducers:{
        updateStatus: (state, action) => {
            state.status = action.payload
        },
        updateExpiresTime : (state, action) => {
            state.send.expireTime = action.payload
        },
        resetVerifyStatus : (state) => {
            state.verify.status = null
        },
        resetGetUserInfoStatus : (state) => {
            state.getUserInfo.status = null
            state.getUserInfo.message = ''
        },
        resetUpdateFeedback : (state) => {
            state.update.status = null
            state.update.message = ''
        },
        resetLogoutFeedback : (state) => {
            state.logout.status = null
            state.logout.message = ''
        },
        resetSendStatus : (state) => {
            state.send.status = null
            state.send.isLoading = false
            state.send.errorMessage = ''
            state.send.token = null
            state.send.expireTime = null
        }
    },
    extraReducers: (builder) => {
        // Send sms
        builder.addCase(send_sms.pending, (state) => {
            state.send.isLoading = true
            state.send.expireTime = null
            state.send.status = null
            state.send.errorMessage = ''
            state.send.token = null
        })
        builder.addCase(send_sms.fulfilled, (state,action) => {
            if(action.payload.status){
                state.send.status = true
                state.send.expireTime = action.payload.expireTime
                state.send.token = action.payload.token
            }else{
                state.send.status = false
                state.send.errorMessage = action.payload.message
            }
            state.send.isLoading = false
        })
        builder.addCase(send_sms.rejected, (state, action) => {
            state.send.status = false
            state.send.expireTime = null
            state.send.errorMessage = action.error.message
            state.send.token = null
            state.send.isLoading = false
        })
        // Verify sms
        builder.addCase(verify_sms.pending, (state) => {
            state.verify.isLoading = true
            state.verify.status = null
            state.verify.message = ''
        })
        builder.addCase(verify_sms.fulfilled, (state, action) => {
            if(action.payload.status === true){
                state.verify.status = true
                state.verify.message = action.payload.message
                state.user = action.payload.user
                localStorage.setItem('userToken', action.payload.user.token)
            }else{
                state.verify.status = false
                state.verify.message = action.payload.message
            }
            state.verify.isLoading = false
        })
        builder.addCase(verify_sms.rejected, (state, action) => {
            state.verify.status = false
            state.verify.message = action.error.message
            state.verify.isLoading = false
        })
        // Get user info
        builder.addCase(getUserInfo.pending, (state) => {
            state.getUserInfo.isLoading = true
            state.getUserInfo.status = null
            state.getUserInfo.message = ''
        })
        builder.addCase(getUserInfo.fulfilled, (state,action) => {
            if(action.payload.status){
                state.getUserInfo.status = true
                state.user = action.payload.user
                localStorage.setItem('userToken', action.payload.user.token)
            }else{
                state.getUserInfo.status = false
                state.getUserInfo.message = action.payload.message
                // Only clear the stored token when the server says the identity
                // itself is invalid (bad signature / user no longer verified).
                // Benign/transient failures must NOT log the user out.
                if(action.payload.invalidIdentity){
                    localStorage.removeItem('userToken')
                }
            }
            state.getUserInfo.isLoading = false
        })
        builder.addCase(getUserInfo.rejected, (state, action) => {
            state.getUserInfo.status = false
            state.getUserInfo.message = action.error.message
            state.getUserInfo.isLoading = false
        })
        // Update verified user service
        builder.addCase(updateVerifiedUserService.pending, (state) => {
            state.update.isLoading = true
            state.update.status = null
            state.update.message = ''
        })
        builder.addCase(updateVerifiedUserService.fulfilled, (state, action) => {
            if(action.payload.status){
                state.update.status = true
                state.update.message = action.payload.message
                state.user.service.serviceID = action.payload.serviceID
                state.user.service.name = action.payload.serviceName
                state.user.comingWith = action.payload.comingWith
                // The identity token is no longer rotated on service changes,
                // so there is nothing to re-store here.
            }else{
                state.update.status = false
                state.update.message = action.payload.message
            }
            state.update.isLoading = false
        })
        builder.addCase(updateVerifiedUserService.rejected, (state, action) => {
            state.update.status = false
            state.update.message = action.error.message
            state.update.isLoading = false
        })
        // Logout verified user
        builder.addCase(logoutVerifiedUser.pending, (state) => {
            state.logout.isLoading = true
            state.logout.status = null
            state.logout.message = ''
        }) 
        builder.addCase(logoutVerifiedUser.fulfilled, (state, action) => {
            if(action.payload.status){
                state.logout.status = true
                state.logout.message = action.payload.message

            }else{
                state.logout.status = false
                state.logout.message = action.payload.message
            }
            state.user = {
                token: null,
                userID: null,
                name: '',
                phoneNumber: '',
                service: {
                    serviceID: null,
                    name : '',
                },
                comingWith: ''
            }
            localStorage.removeItem('userToken')
            state.logout.isLoading = false
        })
        builder.addCase(logoutVerifiedUser.rejected, (state, action) => {
            state.logout.status = false
            state.logout.message = action.error.message
            state.logout.isLoading = false
        })
    }
})


export const {  resetSendStatus ,resetLogoutFeedback,updateStatus , updateExpiresTime , resetVerifyStatus , resetGetUserInfoStatus, resetUpdateFeedback } = verificationUserSlice.actions
export default verificationUserSlice.reducer