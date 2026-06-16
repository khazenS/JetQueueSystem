import { Alert, Box, Button, Collapse, IconButton, InputAdornment, Typography, useTheme } from '@mui/material'
import LoginRoundedIcon from '@mui/icons-material/LoginRounded';
import PersonRoundedIcon from '@mui/icons-material/PersonRounded';
import LockRoundedIcon from '@mui/icons-material/LockRounded';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import AdminPanelSettingsRoundedIcon from '@mui/icons-material/AdminPanelSettingsRounded';
import CircularProgress from '@mui/material/CircularProgress';
import TextField from '@mui/material/TextField';
import { useDispatch, useSelector } from 'react-redux';
import { useEffect, useState } from 'react';
import { adminLogin, resetAdminDatas, resetExpiredError, resetTotalReqError, updatePassword, updateUsername } from '../redux/features/adminPageSlices/adminLoginSlice';
import { useNavigate } from 'react-router-dom';
import { resetShopStatusExpiredError } from '../redux/features/adminPageSlices/shopStatusSlice';
import { resetCancelExpiredError } from '../redux/features/adminPageSlices/adminDailyBookingSlice';
import { resetFastOpsExpiredError } from '../redux/features/adminPageSlices/fastOpsSlice';
import { resetShopSettingsExpiredError } from '../redux/features/adminPageSlices/shopSettingsSlice';
import { resetNotificationExpiredError } from '../redux/features/adminPageSlices/notificationSlice';
function AdminEntryPage(){
    const theme = useTheme()
    const dispatch = useDispatch()
    const adminDatas = useSelector( state => state.adminLogin.adminDatas)
    const isLoading = useSelector( state => state.adminLogin.isLoading)
    const isLogin = useSelector( state => state.adminLogin.isLogin)
    const wrongInputs = useSelector( state => state.adminLogin.wrongInputs)
    const navigate = useNavigate()

    const [showPassword, setShowPassword] = useState(false)

    const adminExpired = useSelector( state => state.adminLogin.expiredError)
    const shopExpired = useSelector( state => state.shopStatus.expiredError)
    const bookingExpired = useSelector( state => state.adminBooking.expiredError)
    const fastOpsExpired = useSelector( state => state.fastOps.expiredError)
    const shopSettingsExpired = useSelector( state => state.shopSettings.expiredError)
    const notificationExpired = useSelector( state => state.notification.expiredError)
    const totalReqError = useSelector( state => state.adminLogin.totalReqError)

    // When login was succesfully navigate admin panel
    useEffect( () => {
        if(isLogin === true){
            navigate('/admin')
            dispatch(resetAdminDatas())
        }
    },[dispatch,navigate,isLogin,isLoading])

    // Reset all adminTokenErrors for navigate loop bug
    useEffect( () => {
        dispatch(resetExpiredError())
        dispatch(resetShopStatusExpiredError())
        dispatch(resetCancelExpiredError())
        dispatch(resetFastOpsExpiredError())
        dispatch(resetShopSettingsExpiredError())
        dispatch(resetNotificationExpiredError())
    },[dispatch,adminExpired,shopExpired,bookingExpired,fastOpsExpired,shopSettingsExpired])

    // Reset total request error after 3 sec
    useEffect( () => {
        if(totalReqError ===true){
            setTimeout( () => {
                dispatch(resetTotalReqError())
            },3000)
        }
    },[dispatch,totalReqError])

    const handleLogin = () => {
        dispatch(adminLogin({
            username: adminDatas.username,
            password: adminDatas.password
        }))
    }

    return (
        <Box
            sx={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                px: 2.5,
                py: 4,
                bgcolor: theme.jqs.surface,
                backgroundImage: `radial-gradient(circle at 15% 15%, ${theme.jqs.secondaryContainer}55, transparent 38%), radial-gradient(circle at 85% 85%, ${theme.jqs.surfaceHigh}, transparent 40%)`,
            }}
        >
            {/* Too-many-requests banner */}
            <Collapse
                in={totalReqError === true}
                sx={{ position: 'fixed', top: 16, left: 12, right: 12, zIndex: 1300 }}
            >
                <Alert severity="error" variant="filled" sx={{ fontWeight: 600, borderRadius: 2, maxWidth: 480, mx: 'auto' }}>
                    Sunucuya çok fazla istek attınız. Lütfen daha sonra tekrar deneyiniz.
                </Alert>
            </Collapse>

            <Box
                sx={{
                    width: '100%',
                    maxWidth: 400,
                    bgcolor: theme.jqs.surfaceLowest,
                    borderRadius: '20px',
                    boxShadow: theme.jqs.cardShadow,
                    border: `1px solid ${theme.jqs.surfaceVariant}`,
                    px: { xs: 3, sm: 4 },
                    py: 4.5,
                    animation: 'jqsFadeUp 0.5s ease both',
                }}
            >
                {/* Brand / header */}
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', mb: 3.5 }}>
                    <Box
                        sx={{
                            width: 72,
                            height: 72,
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            bgcolor: 'primary.main',
                            boxShadow: '0 6px 18px rgba(13,99,27,0.28)',
                            mb: 2,
                        }}
                    >
                        <AdminPanelSettingsRoundedIcon sx={{ color: '#fff', fontSize: '2.1rem' }} />
                    </Box>
                    <Typography variant="h5" sx={{ color: 'text.primary' }}>
                        Yönetici Girişi
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
                        {process.env.REACT_APP_SHOP_NAME} yönetim paneli
                    </Typography>
                </Box>

                {/* Form */}
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <TextField
                        onChange={(e) => { dispatch(updateUsername(e.target.value)) }}
                        label="Kullanıcı Adı"
                        variant="outlined"
                        fullWidth
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <PersonRoundedIcon sx={{ color: 'text.secondary' }} />
                                </InputAdornment>
                            ),
                        }}
                    />
                    <TextField
                        onChange={(e) => { dispatch(updatePassword(e.target.value)) }}
                        onKeyDown={(e) => { if (e.key === 'Enter') handleLogin() }}
                        label="Şifre"
                        type={showPassword ? 'text' : 'password'}
                        variant="outlined"
                        fullWidth
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <LockRoundedIcon sx={{ color: 'text.secondary' }} />
                                </InputAdornment>
                            ),
                            endAdornment: (
                                <InputAdornment position="end">
                                    <IconButton onClick={() => setShowPassword((v) => !v)} edge="end" size="small">
                                        {showPassword ? <VisibilityOff /> : <Visibility />}
                                    </IconButton>
                                </InputAdornment>
                            ),
                        }}
                    />

                    <Collapse in={wrongInputs === true}>
                        <Alert variant="filled" severity="error" sx={{ borderRadius: 2, fontWeight: 600 }}>
                            Girdiğiniz kullanıcı adı veya şifre yanlış.
                        </Alert>
                    </Collapse>

                    <Button
                        onClick={handleLogin}
                        disabled={isLoading}
                        size="large"
                        variant="contained"
                        color="primary"
                        fullWidth
                        endIcon={!isLoading && <LoginRoundedIcon />}
                        sx={{ mt: 0.5 }}
                    >
                        {isLoading ? <CircularProgress size={24} sx={{ color: '#fff' }} /> : 'Giriş Yap'}
                    </Button>
                </Box>
            </Box>
        </Box>
    );
}

export default AdminEntryPage
