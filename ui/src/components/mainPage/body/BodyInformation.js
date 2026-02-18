import { Accordion, AccordionDetails, AccordionSummary, Box, Container, Stack, Typography , Alert, LinearProgress, CircularProgress, Avatar, Grid, Button, RadioGroup, FormControlLabel, Radio, FormHelperText } from "@mui/material"
import { useEffect , useState} from "react";
import { useDispatch, useSelector } from "react-redux";
import { getMessage, updateMessage } from "../../../redux/features/mainPageSlices/showMessageSlice";
import { socket } from "../../../helpers/socketio";
import CampaignIcon from '@mui/icons-material/Campaign';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import UserRegister from "../UserRegister";
import { getUserInfo, logoutVerifiedUser, resetGetUserInfoStatus, resetLogoutFeedback, resetUpdateFeedback, resetVerifyStatus, updateVerifiedUserService } from "../../../redux/features/mainPageSlices/verificationUserSlice";
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import LogoutIcon from '@mui/icons-material/Logout';
import ChangeCircleIcon from '@mui/icons-material/ChangeCircle';
import DoneIcon from '@mui/icons-material/Done';
import { jwtDecode } from 'jwt-decode';

function BodyInformation(){
    const dispatch = useDispatch()
    const message = useSelector( state => state.showMessage.message)
    const services = useSelector( state => state.booking.services)
    const userToken = useSelector( state => state.verification.user.token)
    const verificationStatus = useSelector( state => state.verification.verify.status)
    const getUserInfoState = useSelector ( state => state.verification.getUserInfo)
    const userState = useSelector ( state => state.verification.user)
    const updateServiceState = useSelector( state => state.verification.update)
    const logoutState = useSelector( state => state.verification.logout)

    const [showAlert, setShowAlert] = useState(false)
    const [progress, setProgress] = useState(100)

    const [changeService,setChangeService] = useState(false)
    const [newService,setNewService] = useState(null)
    const [newComingWith,setNewComingWith] = useState(null)
    const [changeServiceError,setChangeServiceError] = useState(false)
    const [sameUpdateInputs,setSameUpdateInputs] = useState(false)
    
    // Initial data fetch
    useEffect(() => {
      dispatch(getMessage())
      
      const storedToken = localStorage.getItem('userToken')
      if (storedToken) {
        dispatch(getUserInfo(storedToken))
        .unwrap()
        .then((userInfo) => {
          if(userInfo.status === true){
          setNewService(userInfo.user.service.serviceID)
          setNewComingWith(userInfo.user.comingWith)            
          }
        })
      }
    }, [dispatch])

    // This is for setting default values when verified
    useEffect( () => {
      if(verificationStatus){
        setNewService(userState.service.serviceID)
        setNewComingWith(userState.comingWith)
      }
    },[userState.service.serviceID, userState.comingWith,verificationStatus])

    // Socket connections
    useEffect(() => {
      // Message listeners
      socket.on('sended-message', (message) => {
          dispatch(updateMessage(message))
      })

      socket.on('deleted-message', () => {
          dispatch(updateMessage(null))
      })

      // Cleanup
      return () => {
          socket.off('sended-message')
          socket.off('deleted-message')
      }
  }, [dispatch])

  // progress bar for feedbacks
  useEffect(() => {
    let timer;
    const shouldShowAlert = verificationStatus || 
    getUserInfoState.status === false || 
    changeServiceError || 
    sameUpdateInputs ||
    updateServiceState.status ||
    logoutState.status;

    if (shouldShowAlert) {
      setShowAlert(true);
      setProgress(100);
      
      timer = setInterval(() => {
        setProgress((prev) => {
          if (prev <= 0) {
            clearInterval(timer);
            setShowAlert(false);
            
            // State'leri progress bar bittikten sonra sıfırla
            setTimeout(() => {
              if (verificationStatus) dispatch(resetVerifyStatus());
              if (getUserInfoState.status === false) dispatch(resetGetUserInfoStatus());
              if (changeServiceError) setChangeServiceError(false);
              if (sameUpdateInputs) setSameUpdateInputs(false);
              if (updateServiceState.status) dispatch(resetUpdateFeedback());
              if (logoutState.status) dispatch(resetLogoutFeedback());
            }, 0);
            
            return 0;
          } 
          return prev - (100/30);
        });
      }, 100);
    }

    return () => {
      if (timer) {
        clearInterval(timer);
      }
    };
  }, [verificationStatus, getUserInfoState.status, changeServiceError, 
  sameUpdateInputs, updateServiceState.status, logoutState.status, dispatch]);

  // Function to get alert properties based on the current state
  const getAlertProps = () => {
    if (verificationStatus) {
        return {
            severity: "success",
            message: "SMS doğrulama başarılı."
        }
    } else if (getUserInfoState.status === false) {
        return {
            severity: "error",
            message: getUserInfoState.message || "Kullanıcı bilgileri alınamadı."
        }
    } else if (changeServiceError){
        return {
          severity: 'error',
          message: 'Güncelleme yaparken bir hata oluştu. Lütfen sayfayı yenileyiniz.'
        }
    } else if (sameUpdateInputs) {
      return {
        severity: 'success',
        message: 'Başarıyla güncellendi.'
      }
    } else if(updateServiceState.status) {
      return {
        severity: 'success',
        message: updateServiceState.message || 'Hizmet başarıyla güncellendi.'
      }
    } else if (logoutState.status) {
      return {
        severity: 'success',
        message: logoutState.message || 'Başarıyla çıkış yapıldı.'
      }
    }
    return null
  }
  // It formats phone to like that 'xxx xxx xxxx' 
  const formatPhoneNumber = (phoneNumber) => {
    if (phoneNumber) {
      const phoneStr = phoneNumber.toString();
      // Get Last 4 digit
      const lastFour = phoneStr.slice(-4);
      // mask between +90 and last 4 digit
      return `+90 *** *** ${lastFour}`;
    }
    return '';
  }
  // Getting JWT payload
  const getJWTPayload = () => {
    if(userToken){
      try{
        const decoded = jwtDecode(userToken)
        return decoded
      } catch (error) {
        changeServiceError(true)
        console.error('Invalid token:', error);
        return null
      }
    }
    return null
  }
  // Handle service change
  const handleChangeService = async () => {
    const decoded = getJWTPayload()
    if( decoded.serviceID == newService && decoded.comingWith == newComingWith){
      setSameUpdateInputs(true)
      setChangeService(false)
      return
    }
    try {
      await dispatch(updateVerifiedUserService({
        token: userToken,
        newServiceID: parseInt(newService),
        newComingWith: parseInt(newComingWith)
      })).unwrap()
      setChangeService(false)
  } catch (error) {
      console.error('Service update failed:', error)
      setChangeServiceError(true)
  }
  }
    return (
        <div>
        <Container sx={{display:"flex",justifyContent:"center",p:2,marginTop:5}}>
            <Typography variant="h4" sx={{fontStyle: 'italic',textShadow: '1px 1px 2px rgba(0,0,0,0.3)'}}>
                {process.env.REACT_APP_SHOP_NAME} Hoşgeldiniz
            </Typography>
        </Container>


        <Accordion sx={{
            marginTop:3,
            boxShadow:'none',
            border: "2px solid rgba(0.75,0.75,0.75,0.2)",
            borderRadius:'3%'
        }}>
        <AccordionSummary
          expandIcon={<ArrowDownwardIcon />}
        >
          <InfoOutlinedIcon />
          <Typography component="span" sx={{fontWeight:'bold',marginLeft:1}}>Genel Bilgilendirme</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Typography>
            - Sıra sistemi uygulanmaktadır.
          </Typography>
          <Typography sx={{marginTop:2}}>
            - Eğer dükkan açıksa ve dükkan sahibi sıra almayı kapatmamışsa "Hemen Sıra Al" kısmından sıra alabilirsiniz , sıra size geldiğinde aranacaksınız.
          </Typography>
        </AccordionDetails>
      </Accordion>


      <Accordion sx={{
            marginTop:3,
            boxShadow:'none',
            border: "2px solid rgba(0.75,0.75,0.75,0.2) ",
            borderRadius:'3%'
        }}>
        <AccordionSummary
          expandIcon={<ArrowDownwardIcon />}
        >
          <InfoOutlinedIcon />
          <Typography component="span" sx={{fontWeight:'bold',marginLeft:1}}>Sıra Iptali Bilgilendirmesi</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Typography>
            - Sıraya girdikten sonra sıranızı iptal edebilirsiniz.
          </Typography>
          <Typography sx={{marginTop:2}}>
            - Güvenlik nedeniyle 6 saat içerisinde maksimum 2 kere sıranızı iptal edebilirsiniz.
          </Typography>
        </AccordionDetails>
      </Accordion>

      {/* Feedback for external verification operations*/}
      {
        (verificationStatus || getUserInfoState.status === false || logoutState.status )  ? 
          <Box sx={{ 
            marginTop: 2,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            width: '100%'
        }}>
            <Alert 
                severity={getAlertProps()?.severity}
                sx={{ 
                  width: '90%',
                  maxWidth: '400px',
                  boxShadow: 3,
                    '& .MuiAlert-message': {
                        textAlign: 'center',
                        width: '100%',
                        fontWeight: 'bold'
                    },
                    ...(getAlertProps()?.severity === 'error' && {
                      boxShadow: '0 0 10px rgba(211, 47, 47, 0.3)'
                    })
                }}
            >
              {getAlertProps()?.message}
            </Alert>
            <LinearProgress 
              variant="determinate" 
              value={progress}
              sx={{
                width: '100%',
                maxWidth: '400px',
                height: 4,
                borderRadius: 2,
                bgcolor: 'background.paper',
                '& .MuiLinearProgress-bar': {
                  bgcolor: getAlertProps()?.severity === 'error' ? 'error.main' : 'success.main'
                }
              }}
            />
        </Box>
        :
        <></>
      }
      {/* Information about verified user */}
      {
        getUserInfoState.isLoading ?
        <>
        <Container sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', my: 3 }}>
          <CircularProgress size={40} thickness={4} />
        </Container>        
        </>

        :
        userToken ?        
        <Box sx={{ maxWidth: 800, margin: 'auto', mt: 2 }}>
            {/* Logout Button */}
            <Box sx={{ display : 'flex', justifyContent:'center', marginBottom:2 }}>
              <Button 
              sx={{width:'50%',fontWeight:'bold',borderRadius:'50px'}}
              variant="outlined" color='error' startIcon={<LogoutIcon />} 
              onClick={() => {dispatch(logoutVerifiedUser(userToken))}}
              >
              Çıkış Yap
              </Button>
            </Box>

            {/* Avatar */}
            <Box sx={{ display:'flex', justifyContent:'center', alignItems: 'center' }}>
              <Avatar 
              sx={{ width: 100, height: 80 }}
              src="/avatar.jpg"
              />
            </Box>
            
            {/* Name */}
            <Grid container spacing={2}>
              <Grid item xs={12} sx={{ 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center',
                textAlign: 'center'
              }}>
              <Typography sx={{ fontWeight:'bold' , fontSize:'1.15rem' }}>
              {userState.name}
              </Typography>
              <Box sx={{
                display: 'flex',
                alignItems: 'center',
                fontSize: '0.85rem'
              }}>
              <CheckCircleOutlineIcon 
                sx={{ 
                  fontSize: '1rem',
                  color: 'success.main'
                }} 
              />
              <Typography sx={{ fontSize: '0.75rem' , color :'secondary.ligth'  }}>
                Doğrulanmış Kullanıcı
              </Typography>
              </Box>
              </Grid>

              {/* Tel Number */}
              <Grid item xs={6} sx={{alignItems:'center' , display:'flex', justifyContent:'center', margin:0}}>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary" sx={{ fontWeight:'bold'}}>
                    Telefon Numaram
                  </Typography>
                  <Typography sx={{fontSize:'0.9rem'}}>
                    {formatPhoneNumber(userState.phoneNumber)}
                  </Typography>
                </Box>
              </Grid>

              {/* Service and ComingWith */}
              <Grid item xs={6} sx={{ textAlign: 'center' }}>
                  <Typography variant="subtitle2" color="text.secondary" sx={{fontWeight:'bold'}}>
                    Seçili Hizmet
                  </Typography>
                  {
                      services.length > 0 && changeService ?
                      <Box sx={{ display:'flex',flexDirection: 'column', alignItems: 'center' }}>
                          <RadioGroup 
                              onChange={(e) => setNewService(e.target.value)} 
                              value={newService}  
                              name="radio-buttons-group"
                          >
                              <Grid container spacing={2} sx={{ maxWidth: '600px' }}>
                                  {services.map((service) => (
                                      <Grid item xs={6} key={service.serviceID}>
                                          <FormControlLabel 
                                              value={service.serviceID} 
                                              control={<Radio size="small" />} 
                                              label={<Typography sx={{ fontSize: '0.9rem' }}>{service.name}</Typography>}
                                              sx={{ 
                                                  margin: '0px',
                                                  '.MuiFormControlLabel-label': {
                                                      whiteSpace: 'nowrap'
                                                  }
                                              }}
                                          />
                                      </Grid>
                                  ))}
                              </Grid>
                          </RadioGroup>  
                          <FormHelperText sx={{ mt: 1}}>*Hizmet seçiniz.</FormHelperText>
                      </Box>
                      :
                      <Typography>
                          {userState.service.name}
                      </Typography>                    
                }

                <Box sx={{marginTop:3,textAlign: 'center'}}>
                  <Typography variant="subtitle2" color="text.secondary" sx={{fontWeight:'bold'}}>
                  Kişi Sayısı
                  </Typography>
                {
                  changeService ?
                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <RadioGroup 
                          onChange={(e) => setNewComingWith(e.target.value)} 
                          value={newComingWith} 
                          name="radio-buttons-group"
                      >
                          <Grid container spacing={1} sx={{ maxWidth: '200px' }}>
                              {[1,2,3,4].map((number) => (
                                  <Grid item xs={6} key={number}>
                                      <FormControlLabel 
                                          value={number.toString()} 
                                          control={<Radio size="small" />} 
                                          label={<Typography sx={{ fontSize: '0.9rem' }}>{number}</Typography>}
                                          sx={{ 
                                              margin: '0px',
                                              '.MuiFormControlLabel-label': {
                                                  whiteSpace: 'nowrap'
                                              }
                                          }}
                                      />
                                  </Grid>
                              ))}
                          </Grid>
                      </RadioGroup>
                      <FormHelperText sx={{mt: 1}}>*Kişi sayısı seçiniz.</FormHelperText> 
                  </Box>
                  :
                  <Typography>
                    {userState.comingWith}
                  </Typography>
                }
                </Box>
              </Grid>
              
              {/* Feedback for is there any problem for changing service or coming with state */}
              {
                changeServiceError || sameUpdateInputs || updateServiceState.status ?
                <Grid item xs={12}>
                  <Box sx={{ 
                  marginTop: 2,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  width: '100%'
                  }}>
                  <Alert 
                      severity={getAlertProps()?.severity}
                      sx={{ 
                        width: '90%',
                        maxWidth: '400px',
                        boxShadow: 3,
                          '& .MuiAlert-message': {
                              textAlign: 'center',
                              width: '100%',
                              fontWeight: 'bold'
                          },
                          ...(getAlertProps()?.severity === 'error' && {
                            boxShadow: '0 0 10px rgba(211, 47, 47, 0.3)'
                          })
                      }}
                  >
                    {getAlertProps()?.message}
                  </Alert>
                  <LinearProgress 
                    variant="determinate" 
                    value={progress}
                    sx={{
                      width: '100%',
                      maxWidth: '400px',
                      height: 4,
                      borderRadius: 2,
                      bgcolor: 'background.paper',
                      '& .MuiLinearProgress-bar': {
                        bgcolor: getAlertProps()?.severity === 'error' ? 'error.main' : 'success.main'
                      }
                    }}
                  />
                  </Box>
                </Grid>                
                :
                <></>
              }

              <Grid item xs={12} sx={{textAlign:'center' }}>
                {
                  changeService ? 
                    <Button startIcon={<DoneIcon />} variant="contained" color="success" sx={{borderRadius:'25px' , width:'60%'}}
                    onClick={handleChangeService}
                    >
                      Onayla
                    </Button>
                  :
                    <Button startIcon={<ChangeCircleIcon />} variant="outlined" color="warning" sx={{borderRadius:'25px' , width:'60%'}}
                    onClick={ () => setChangeService(!changeService)}
                    >
                      Hizmet Değiştir
                    </Button>                  
                }

              </Grid>
            </Grid>
        </Box>
        :
        <UserRegister />
      }
      
      {/* For showing message part*/}
      {
        message ? 
          <Box sx={{marginTop:3,display:'flex',justifyContent:'center',marginY:5}} >
                    <Stack>
                        <Typography variant="h5" sx={{fontWeight:'bold',textAlign:'center',justifyContent:'center',alignItems:'center'}}>
                            <CampaignIcon fontSize="small" sx={{color:'blue'}}/>   DUYURU  <CampaignIcon fontSize="small" sx={{color:'blue'}}/> 
                        </Typography>
                        <Typography sx={{fontWeight:'bold',textAlign:'center'}}>{message}</Typography>            
                    </Stack>             

                
          </Box>
          :
          <></>            
      }
        </div>
    )


}

export default BodyInformation