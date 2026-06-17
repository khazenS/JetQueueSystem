import { Box, Chip, Container, Typography , Alert, LinearProgress, CircularProgress, Avatar, Grid, Button, ToggleButton, ToggleButtonGroup, FormHelperText, useTheme } from "@mui/material"
import { useEffect , useState} from "react";
import { useDispatch, useSelector } from "react-redux";
import { getMessage, updateMessage } from "../../../redux/features/mainPageSlices/showMessageSlice";
import { socket } from "../../../helpers/socketio";
import UserRegister from "../UserRegister";
import { getUserInfo, logoutVerifiedUser, resetGetUserInfoStatus, resetLogoutFeedback, resetUpdateFeedback, resetVerifyStatus, updateVerifiedUserService } from "../../../redux/features/mainPageSlices/verificationUserSlice";
import VerifiedRoundedIcon from '@mui/icons-material/VerifiedRounded';
import LogoutIcon from '@mui/icons-material/Logout';
import ChangeCircleIcon from '@mui/icons-material/ChangeCircle';
import DoneIcon from '@mui/icons-material/Done';
import PhoneRoundedIcon from '@mui/icons-material/PhoneRounded';
import ContentCutRoundedIcon from '@mui/icons-material/ContentCutRounded';
import GroupRoundedIcon from '@mui/icons-material/GroupRounded';

function BodyInformation(){
    const theme = useTheme()
    const dispatch = useDispatch()
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
  // Handle service change
  const handleChangeService = async () => {
    // Compare against the current preferences in state (sourced from the DB),
    // not the token — the token no longer encodes service/comingWith.
    if( userState.service.serviceID == newService && userState.comingWith == newComingWith){
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

  // ── shared bits ───────────────────────────────────────────────────────
  const cardSx = {
    bgcolor: theme.jqs.surfaceLowest,
    borderRadius: '12px',
    boxShadow: theme.jqs.cardShadow,
    border: `1px solid ${theme.jqs.surfaceVariant}`,
  }

  const infoRowSx = {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 1.5,
    p: 1.5,
    borderRadius: '12px',
    bgcolor: theme.jqs.surfaceLow,
  }

  const infoIconSx = {
    width: 40,
    height: 40,
    flexShrink: 0,
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  }

  const FeedbackAlert = () => (
    <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
      <Alert
        severity={getAlertProps()?.severity}
        sx={{
          width: '90%', maxWidth: 400, borderRadius: 2,
          '& .MuiAlert-message': { textAlign: 'center', width: '100%', fontWeight: 600 },
        }}
      >
        {getAlertProps()?.message}
      </Alert>
      <LinearProgress
        variant="determinate"
        value={progress}
        sx={{
          width: '100%', maxWidth: 400, height: 4, borderRadius: 999, mt: 0.5,
          bgcolor: theme.jqs.surfaceHigh,
          '& .MuiLinearProgress-bar': { bgcolor: getAlertProps()?.severity === 'error' ? 'error.main' : theme.jqs.secondaryContainer }
        }}
      />
    </Box>
  )

    return (
        <Box sx={{ mt: 3, display: 'flex', flexDirection: 'column', gap: 3 }}>
        {/* Hero */}
        <Box
            sx={{
                ...cardSx,
                display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center',
                px: 2.5, py: 4, gap: 1.5,
                animation: 'jqsFadeUp 0.5s ease both',
            }}
        >
            <Box
                sx={{
                    width: 96, height: 96, borderRadius: '50%', bgcolor: '#fff',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
                    boxShadow: '0 2px 10px rgba(0,0,0,0.06)',
                }}
            >
                <img
                    src={`/${process.env.REACT_APP_LOGO_NAME}`}
                    alt={process.env.REACT_APP_LOGO_ALT_TEXT}
                    style={{ width: '78%', height: '78%', objectFit: 'contain' }}
                />
            </Box>
            <Typography variant="h4" sx={{ color: 'primary.main' }}>
                {process.env.REACT_APP_SHOP_NAME}'ne Hoş Geldiniz
            </Typography>
            <Typography sx={{ color: 'text.secondary', maxWidth: 360 }}>
                Hemen sıraya girin, bekleme sürenizi kontrol edin ve zamanınızı verimli kullanın.
            </Typography>
        </Box>

        {/* Feedback for external verification operations*/}
      {
        (verificationStatus || getUserInfoState.status === false || logoutState.status )  ?
          <FeedbackAlert />
        :
        <></>
      }
      {/* Information about verified user */}
      {
        getUserInfoState.isLoading ?
        <>
        <Container sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', my: 1 }}>
          <CircularProgress size={40} thickness={4} />
        </Container>
        </>

        :
        userToken ?
        <Box
          sx={{
            ...cardSx,
            p: 3,
            animation: 'jqsFadeUp 0.5s ease both',
          }}
        >
            {/* Avatar + identity */}
            <Box sx={{ display:'flex', flexDirection: 'column', alignItems: 'center' }}>
              <Box
                sx={{
                  p: '3px',
                  borderRadius: '50%',
                  bgcolor: theme.jqs.secondaryContainer,
                  display: 'inline-flex',
                }}
              >
                <Avatar sx={{ width: 84, height: 84, border: '3px solid #fff' }} src="/avatar.jpg" />
              </Box>
              <Typography sx={{ fontWeight: 600, fontSize:'1.25rem', mt: 1.75 }}>
                {userState.name}
              </Typography>
              <Chip
                icon={<VerifiedRoundedIcon sx={{ color: `${theme.jqs.onSecondaryContainer} !important` }} />}
                label="Doğrulanmış Kullanıcı"
                size="small"
                sx={{ mt: 0.75, fontWeight: 600, borderRadius: 1.5, bgcolor: theme.jqs.secondaryContainer, color: theme.jqs.onSecondaryContainer }}
              />
            </Box>

            {/* Stacked info rows */}
            <Box sx={{ mt: 3, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              {/* Telefon Numaram */}
              <Box sx={infoRowSx}>
                <Box sx={{ ...infoIconSx, bgcolor: theme.jqs.tertiaryContainer }}>
                  <PhoneRoundedIcon sx={{ color: '#fff', fontSize: '1.2rem' }} />
                </Box>
                <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                  <Typography variant="overline" sx={{ color: 'text.secondary', display: 'block', lineHeight: 1.4 }}>
                    Telefon Numaram
                  </Typography>
                  <Typography sx={{ fontWeight: 600 }}>
                    {formatPhoneNumber(userState.phoneNumber)}
                  </Typography>
                </Box>
              </Box>

              {/* Seçili Hizmet */}
              <Box sx={infoRowSx}>
                <Box sx={{ ...infoIconSx, bgcolor: theme.jqs.secondaryContainer }}>
                  <ContentCutRoundedIcon sx={{ color: theme.jqs.onSecondaryContainer, fontSize: '1.2rem' }} />
                </Box>
                <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                  <Typography variant="overline" sx={{ color: 'text.secondary', display: 'block', lineHeight: 1.4 }}>
                    Seçili Hizmet
                  </Typography>
                  {services.length > 0 && changeService ? (
                    <ToggleButtonGroup
                      exclusive
                      value={newService}
                      onChange={(e, val) => { if (val !== null) setNewService(val) }}
                      sx={{ mt: 0.75, flexWrap: 'wrap', gap: 0.75, '& .MuiToggleButton-root': { borderRadius: '8px !important', border: `1px solid ${theme.jqs.outlineVariant} !important`, py: 0.4, px: 1.25, fontSize: '0.85rem' } }}
                    >
                      {services.map((service) => (
                        <ToggleButton key={service.serviceID} value={service.serviceID}>
                          {service.name}
                        </ToggleButton>
                      ))}
                    </ToggleButtonGroup>
                  ) : (
                    <Typography sx={{ fontWeight: 600 }}>{userState.service.name}</Typography>
                  )}
                </Box>
              </Box>

              {/* Kişi Sayısı */}
              <Box sx={infoRowSx}>
                <Box sx={{ ...infoIconSx, bgcolor: theme.jqs.secondaryContainer }}>
                  <GroupRoundedIcon sx={{ color: theme.jqs.onSecondaryContainer, fontSize: '1.2rem' }} />
                </Box>
                <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                  <Typography variant="overline" sx={{ color: 'text.secondary', display: 'block', lineHeight: 1.4 }}>
                    Kişi Sayısı
                  </Typography>
                  {changeService ? (
                    <ToggleButtonGroup
                      exclusive
                      value={newComingWith}
                      onChange={(e, val) => { if (val !== null) setNewComingWith(val) }}
                      sx={{ mt: 0.75, gap: 0.75, display: 'flex', width: '100%', '& .MuiToggleButton-root': { flex: 1, borderRadius: '8px !important', border: `1px solid ${theme.jqs.outlineVariant} !important`, py: 0.4 } }}
                    >
                      {[1,2,3,4].map((number) => (
                        <ToggleButton key={number} value={number}>{number}</ToggleButton>
                      ))}
                    </ToggleButtonGroup>
                  ) : (
                    <Typography sx={{ fontWeight: 600 }}>{userState.comingWith}</Typography>
                  )}
                </Box>
              </Box>

              {/* Feedback for change service / coming with */}
              {(changeServiceError || sameUpdateInputs || updateServiceState.status) && <FeedbackAlert />}

              {/* Actions */}
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mt: 1 }}>
                {changeService ? (
                  <Button fullWidth startIcon={<DoneIcon />} variant="contained" color="success" onClick={handleChangeService}>
                    Onayla
                  </Button>
                ) : (
                  <Button fullWidth startIcon={<ChangeCircleIcon />} variant="outlined" color="primary" sx={{ borderWidth: 2, '&:hover': { borderWidth: 2 } }} onClick={() => setChangeService(!changeService)}>
                    Hizmet Değiştir
                  </Button>
                )}
                <Button fullWidth variant="text" color="error" startIcon={<LogoutIcon />} onClick={() => { dispatch(logoutVerifiedUser(userToken)) }}>
                  Çıkış Yap
                </Button>
              </Box>
            </Box>
        </Box>
        :
        <UserRegister />
      }
        </Box>
    )


}

export default BodyInformation
