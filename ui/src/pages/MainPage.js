import Container from '@mui/material/Container'
import Header from '../components/mainPage/Header.js';
import Body from '../components/mainPage/body/Body.js';
import BodyInformation from '../components/mainPage/body/BodyInformation.js';
import { Alert } from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import { useEffect } from 'react';
import { resetReqError } from '../redux/features/mainPageSlices/registerSlice.js';
import { dailyResetTRE } from '../redux/features/mainPageSlices/dailyBookingSlice.js';
import { resgisterResetTRE } from '../redux/features/mainPageSlices/registerSlice.js';
import { messageResetTRE } from '../redux/features/mainPageSlices/showMessageSlice.js';

function MainPage(){
    const dispatch = useDispatch()
    const registerReqError = useSelector(state => state.register.registerReqError)
    const registerErrMessage = useSelector(state => state.register.registerErrMessage)

    const dailyBookingTotalError = useSelector(state => state.booking.totalReqError)
    const registerTotalError = useSelector( state => state.register.totalReqError)
    const messageTotalError = useSelector(state=> state.showMessage.totalReqError)

    useEffect( () => {
        if(registerReqError === true){
            setTimeout(() => {
                dispatch(resetReqError())
              }, 3000)
        }
    },[registerReqError])
    useEffect( () => {
        if(dailyBookingTotalError === true || registerTotalError === true || messageTotalError === true){
            {
                setTimeout(() => {
                    dispatch(dailyResetTRE())
                    dispatch(resgisterResetTRE())
                    dispatch(messageResetTRE ())
                }, 4000)
            }            
        }
    },[dailyBookingTotalError,registerTotalError,messageTotalError])
    return (
        <Container
            maxWidth="sm"
            disableGutters
            sx={{
                px: 2.5,
                pb: 8,
                minHeight: '100vh',
                bgcolor: 'background.default',
            }}
        >
            {
                registerReqError === true ?
                <div style={{zIndex:'999',position:'fixed',marginTop:5,top:'20px',left:'10px',right:'20px'}}>
                    <Alert severity="error" variant='filled' sx={{fontWeight:'bold', borderRadius:3, boxShadow:'0 8px 24px rgba(198,40,40,0.3)'}}> {registerErrMessage} </Alert>
                </div> :
                <></>
            }
            {
                dailyBookingTotalError === true || registerTotalError === true || messageTotalError === true ?
                <div style={{zIndex:'999',position:'fixed',marginTop:5,top:'20px',left:'10px',right:'20px'}}>
                    <Alert severity="error" variant='filled' sx={{fontWeight:'bold', borderRadius:3, boxShadow:'0 8px 24px rgba(198,40,40,0.3)'}}> Sunucuya çok fazla istek attınız.Lütfen daha sonra tekrar deneyiniz. </Alert>
                </div> :
                <></>
            }
            <Header></Header>
            <BodyInformation></BodyInformation>
            <Body></Body>
        </Container>

    )
}

export default MainPage