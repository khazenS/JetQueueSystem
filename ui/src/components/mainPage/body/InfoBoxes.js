import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { jwtDecode } from "jwt-decode";
import {
    Alert, Box, Button, Dialog, FormHelperText, IconButton,
    InputAdornment, Slide, Stack, TextField, ToggleButton, ToggleButtonGroup,
    Typography, useMediaQuery, useTheme
} from "@mui/material";
import ScheduleRoundedIcon from '@mui/icons-material/ScheduleRounded';
import GroupRoundedIcon from '@mui/icons-material/GroupRounded';
import StorefrontRoundedIcon from '@mui/icons-material/StorefrontRounded';
import AddCircleRoundedIcon from '@mui/icons-material/AddCircleRounded';
import LogoutRoundedIcon from '@mui/icons-material/LogoutRounded';
import PersonIcon from '@mui/icons-material/Person';
import PhoneIcon from '@mui/icons-material/Phone';
import CloseIcon from "@mui/icons-material/Close";
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import HowToRegRoundedIcon from '@mui/icons-material/HowToRegRounded';
import CampaignRoundedIcon from '@mui/icons-material/CampaignRounded';
import { cancelQue, checkQueueToken, registerUser, resetQueueToken, setServiceID, updateRegisterState } from "../../../redux/features/mainPageSlices/registerSlice.js";
import { socket } from "../../../helpers/socketio.js";
import { changeOrderF, removeUserFromQue } from "../../../redux/features/mainPageSlices/dailyBookingSlice.js";
import { decryptData } from "../../../helpers/cryptoProcess.js";

const DialogTransition = React.forwardRef(function DialogTransition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});

function InfoBoxes(){
    const theme = useTheme()
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'))
    const dispatch = useDispatch()
    const [userName,setUserName] = useState(null)
    const [myPosition,setMyPosition] = useState(null)
    const [costumerCount,setCostumerCount] = useState(null)
    const [estimatedHour,setEstimatedHour] = useState(null)
    const [estimatedMunite,setEstimatedMunite] = useState(null)
    const [calculateFlag, setCalculateFlag] = useState(false);

    const [open, setOpen] = useState(false)
    // This is for setting errors for fetch data
    const [samePhoneError,setSamePhoneError] = useState(false)
    const [nameError,setNameError] = useState(false)
    const [phoneError,setPhoneError] = useState(false)
    const [noServiceError,setServiceError] = useState(false)
    // orderFeature  for button visibility
    const orderFeature = useSelector(state => state.booking.orderFeature)
    //registerSlice state
    const state = useSelector(state => state.register.values)
    // queueToken state
    const queueToken = useSelector(state => state.register.queueToken)
    // daily queue state
    const dailyQue = useSelector( state => state.booking.dailyQueue)
    // services state
    const services = useSelector( state => state.booking.services)
    // Verified user state
    const verifiedUser = useSelector( state => state.verification.user)
    // Announcement message (fetched/updated in BodyInformation, read here)
    const message = useSelector( state => state.showMessage.message)
    // Getting

    // set serviceID as a default value
    useEffect( () => {
        if(services && services.length > 0 && !state.serviceID){
        dispatch(updateRegisterState({'nameType':'serviceID','value':services[0].serviceID}))
        }
    },[services])


    // queue token processes
    useEffect( () => {
        const token = localStorage.getItem('queueToken')
        if(token && !queueToken.token){
        dispatch(checkQueueToken(token))
        }
    },[dispatch])

    //Functions for model process
    const handleOpen = () => setOpen(true);
    const handleClose = () => {
        dispatch(updateRegisterState({'nameType':'name','value':''}))
        dispatch(updateRegisterState({'nameType':'phoneNumber','value':''}))
        setOpen(false)
    };
    const onInpF = (name,value)=>{
        dispatch(updateRegisterState({'nameType':name,'value':value}))

        // reset all errors when typing
        setNameError(false)
        setPhoneError(false)
        setSamePhoneError(false)
    }

    // print out the count of costumer of the line
    useEffect(() => {
        if (dailyQue && services && services.length > 0) {
            setCalculateFlag(true)
            let totalCustomer = 0;
            let totalMinute = 0;
            let name = null;
            let position = null;

            if (queueToken.token) {
                const index = dailyQue.findIndex(person =>
                    person.userBookingID === jwtDecode(queueToken.token).userBookingID
                );
                if (index !== -1) {
                    name = dailyQue[index].name;
                    position = index + 1;
                    const newDailyQue = dailyQue.slice(0, index);
                    for (const person of newDailyQue) {
                        totalCustomer += person.comingWith;
                        totalMinute += person.service.estimatedTime;
                        totalMinute += (person.comingWith - 1) * services[0].estimatedTime;
                    }
                }
            } else {
                for (const person of dailyQue) {
                    totalCustomer += person.comingWith;
                    totalMinute += person.service.estimatedTime;
                    totalMinute += (person.comingWith - 1) * services[0].estimatedTime;
                }
            }

            setUserName(name);
            setMyPosition(position);
            setCostumerCount(totalCustomer);
            setEstimatedHour(Math.floor(totalMinute / 60));
            setEstimatedMunite(totalMinute % 60);
            setCalculateFlag(false);
        }
    }, [dailyQue, services, queueToken.token]);

    //submit process
    const handleSubmit = () =>{
        let isSame = false
        if(verifiedUser.token){
            // controlling phone numbers is same
            dailyQue.forEach(user => {
            if(user.phoneNumber != null && decryptData(user.phoneNumber) === verifiedUser.phoneNumber){
                isSame = true
            }
            });
            if(isSame === true){
                setSamePhoneError(true)
                return
            }
            dispatch(registerUser({
                name:verifiedUser.name,
                phoneNumber:verifiedUser.phoneNumber,
                serviceID:verifiedUser.service.serviceID,
                comingWithValue:verifiedUser.comingWith,
                token:verifiedUser.token
            }))
        }else{
            let isNameError = false;
            let isPhoneError = false;

            // controlling there are any error on inputs
            if(state.name.length < 3 || state.name.length > 18){
            isNameError = true
            setNameError(true)
            }
            if(state.phoneNumber.toString().length !== 10){
            isPhoneError = true
            setPhoneError(true)
            }
            // controlling phone numbers is same
            dailyQue.forEach(user => {
            if(user.phoneNumber != null && decryptData(user.phoneNumber) === state.phoneNumber){
                isSame = true
            }
            });

            if(isNameError){
            setNameError(true)
            }else if(isPhoneError){
            setPhoneError(true)
            }else if(services === null || services.length === 0){
            setServiceError(true)
            }else{
            if(isSame === true){
                setSamePhoneError(true)
            }else{
                if(state.serviceID === null) setServiceID(services[0].serviceID);
                dispatch(registerUser(state))
                setOpen(false)
            }
            }
        }
    }

    // remove socket for cancelling on admin panel
    useEffect( () => {
        socket.on('remove',({userBookingID,bookingToken}) =>{
        const localToken = localStorage.getItem('queueToken')
        if(bookingToken !== null){
            const bodyID = jwtDecode(bookingToken).userBookingID
            if(bodyID === userBookingID && bookingToken === localToken){
            localStorage.removeItem('queueToken')
            dispatch(resetQueueToken())
            }
        }
        dispatch(removeUserFromQue(userBookingID))
        })
        return () => {
        socket.off('remove')
        }
    },[dispatch])

    // finis cut on admin panel
    useEffect( () => {
        socket.on('finished-cut',({userBookingID,bookingToken}) =>{
        const localToken = localStorage.getItem('queueToken')
        if(bookingToken !== null){
            const bodyID = jwtDecode(bookingToken).userBookingID
            if(bodyID === userBookingID && bookingToken === localToken){
            localStorage.removeItem('queueToken')
            dispatch(resetQueueToken())
            }
        }
        dispatch(removeUserFromQue(userBookingID))
        })
        return () => {
        socket.off('finished-cut')
        }
    },[dispatch])

    useEffect( () => {
        socket.on('changeOrderFeature', (newOrderFeature) => {
        dispatch(changeOrderF(newOrderFeature))
        })

        return () => {
        socket.off('changedOrderFeature')

        }
    },[dispatch])

    const handleCancel = () => {
        dispatch(cancelQue(queueToken.token))
    }

    // ── presentational helpers ────────────────────────────────────────────
    const hasToken = Boolean(queueToken.token)
    const countReady = !((!costumerCount && costumerCount !== 0) || calculateFlag)
    const timeReady = !(costumerCount === null || estimatedHour === null || estimatedMunite === null || calculateFlag)
    const estimatedTimeText =
        costumerCount === 0 || (estimatedHour === 0 && estimatedMunite === 0)
            ? '. . .'
            : estimatedHour === 0
                ? `${estimatedMunite} Dk`
                : estimatedMunite === 0
                    ? `${estimatedHour} Saat`
                    : `${estimatedHour}s ${estimatedMunite}dk`

    const cardSx = {
        bgcolor: theme.jqs.surfaceLowest,
        borderRadius: '12px',
        boxShadow: theme.jqs.cardShadow,
        border: `1px solid ${theme.jqs.surfaceVariant}`,
    }

    // horizontal status row (main_page bento)
    const StatusRow = ({ icon, circleBg, iconColor, label, value, leftBorder, delay }) => (
        <Box
            sx={{
                ...cardSx,
                p: 2.5,
                display: 'flex', alignItems: 'center', gap: 2,
                ...(leftBorder && { borderLeft: `4px solid ${leftBorder}` }),
                animation: `jqsFadeUp 0.45s ease ${delay}s both`,
            }}
        >
            <Box
                sx={{
                    width: 48, height: 48, borderRadius: '50%', flexShrink: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    bgcolor: circleBg,
                }}
            >
                {icon}
            </Box>
            <Box sx={{ minWidth: 0 }}>
                <Typography variant="subtitle2" sx={{ color: 'text.secondary' }}>{label}</Typography>
                <Typography sx={{ fontWeight: 600, fontSize: '1.25rem', lineHeight: '28px', color: 'text.primary' }}>
                    {value}
                </Typography>
            </Box>
        </Box>
    )

    return (
        <Box sx={{ mt: 3, display: 'flex', flexDirection: 'column', gap: 2 }}>
            {hasToken ? (
                /* ── In-queue: position + wait cards ── */
                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                    <Box sx={{ ...cardSx, border: `1px solid ${theme.palette.primary.main}33`, p: 2, textAlign: 'center', animation: 'jqsPop 0.4s ease both' }}>
                        <Typography variant="overline" sx={{ color: 'text.secondary', display: 'block' }}>SIRADAKİ YERİNİZ</Typography>
                        <Typography variant="h3" sx={{ color: 'primary.main' }}>
                            {myPosition ? `#${myPosition}` : '—'}
                        </Typography>
                    </Box>
                    <Box sx={{ ...cardSx, p: 2, textAlign: 'center', animation: 'jqsPop 0.4s ease 0.07s both' }}>
                        <Typography variant="overline" sx={{ color: 'text.secondary', display: 'block' }}>TAHMİNİ BEKLEME</Typography>
                        <Stack direction="row" spacing={0.5} alignItems="center" justifyContent="center">
                            <ScheduleRoundedIcon sx={{ color: theme.jqs.statusWarning }} />
                            <Typography variant="h5" sx={{ color: 'text.primary' }}>
                                {timeReady ? `~${estimatedTimeText}` : '—'}
                            </Typography>
                        </Stack>
                    </Box>
                </Box>
            ) : (
                /* ── Guest: shop status + wait + count bento ── */
                <>
                    {orderFeature === true ? (
                        <StatusRow
                            delay={0}
                            leftBorder={theme.jqs.statusSuccess}
                            circleBg={theme.jqs.secondaryContainer}
                            icon={<StorefrontRoundedIcon sx={{ color: theme.jqs.statusSuccess }} />}
                            label="Dükkan Durumu"
                            value="AÇIK"
                        />
                    ) : (
                        <StatusRow
                            delay={0}
                            leftBorder={theme.jqs.statusWarning}
                            circleBg="rgba(255,160,0,0.18)"
                            icon={<StorefrontRoundedIcon sx={{ color: theme.jqs.statusWarning }} />}
                            label="Dükkan Durumu"
                            value="Sıra Alımı Durduruldu"
                        />
                    )}
                    <StatusRow
                        delay={0.07}
                        circleBg={theme.jqs.tertiaryContainer}
                        icon={<ScheduleRoundedIcon sx={{ color: '#fff' }} />}
                        label="Tahmini Bekleme"
                        value={timeReady ? `~${estimatedTimeText}` : '—'}
                    />
                    <StatusRow
                        delay={0.14}
                        circleBg={theme.jqs.secondaryContainer}
                        icon={<GroupRoundedIcon sx={{ color: theme.jqs.statusSuccess }} />}
                        label="Sıradaki Kişi Sayısı"
                        value={countReady ? `${costumerCount} Kişi Bekliyor` : '—'}
                    />
                </>
            )}

            {/* Primary action */}
            {hasToken ? (
                <Button
                    fullWidth
                    variant="contained"
                    onClick={handleCancel}
                    startIcon={<LogoutRoundedIcon />}
                    sx={{
                        mt: 1,
                        bgcolor: '#8a0e0e',
                        color: '#fff',
                        boxShadow: '0 6px 16px rgba(138,14,14,0.28)',
                        '&:hover': { bgcolor: '#6e0a0a' },
                    }}
                >
                    Sıradan Ayrıl
                </Button>
            ) : orderFeature === true ? (
                <Button
                    fullWidth
                    variant="contained"
                    color="primary"
                    onClick={verifiedUser.token ? handleSubmit : handleOpen}
                    startIcon={<AddCircleRoundedIcon />}
                    sx={{
                        mt: 1,
                        fontSize: '1.05rem',
                        py: 1.6,
                        animation: 'jqsPulseGlow 2.8s ease-in-out infinite',
                    }}
                >
                    Sıra Al
                </Button>
            ) : (
                <Alert
                    severity="warning"
                    icon={false}
                    sx={{
                        mt: 1, borderRadius: 2, fontWeight: 600,
                        justifyContent: 'center', textAlign: 'center',
                        bgcolor: 'rgba(255,160,0,0.15)', color: '#7a4f00',
                    }}
                >
                    Şu an dükkan sahibi sıra almayı durdurmuştur, lütfen daha sonra tekrar deneyiniz.
                </Alert>
            )}

            {/* Announcement (message) — shown right below the primary action */}
            {message && (
                <Box
                    sx={{
                        ...cardSx,
                        p: 2.5,
                        borderLeft: `4px solid ${theme.palette.primary.main}`,
                        display: 'flex', gap: 1.5,
                        animation: 'jqsFadeUp 0.5s ease 0.05s both',
                    }}
                >
                    <CampaignRoundedIcon sx={{ color: 'primary.main', mt: 0.25 }} />
                    <Box>
                        <Typography sx={{ color: 'text.primary', lineHeight: 1.45 }}>{message}</Typography>
                        <Typography variant="overline" sx={{ color: 'text.secondary', textTransform: 'none' }}>Bugün</Typography>
                    </Box>
                </Box>
            )}

            {/* ── Quick (unverified) registration modal — bottom sheet ─────── */}
            <Dialog
                open={open}
                onClose={handleClose}
                TransitionComponent={DialogTransition}
                slotProps={{ backdrop: { sx: { backdropFilter: 'blur(6px)', backgroundColor: 'rgba(26,28,28,0.4)' } } }}
                PaperProps={{
                    sx: isMobile
                        ? {
                              position: 'fixed', bottom: 0, left: 0, right: 0, m: 0,
                              width: '100%', maxWidth: '100%',
                              borderRadius: 0, borderTopLeftRadius: 24, borderTopRightRadius: 24,
                              maxHeight: '94vh',
                          }
                        : { borderRadius: '16px', width: '100%', maxWidth: 480 },
                }}
            >
                <Box>
                    {/* grab handle + header */}
                    <Box sx={{ pt: 1.5, pb: 1, display: 'flex', justifyContent: 'center' }}>
                        <Box sx={{ width: 40, height: 4, borderRadius: 999, bgcolor: theme.jqs.surfaceVariant }} />
                    </Box>
                    <Box sx={{ px: 3, pb: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Stack direction="row" spacing={1.25} alignItems="center">
                            <Box sx={{ width: 40, height: 40, borderRadius: '50%', bgcolor: theme.jqs.secondaryContainer, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <HowToRegRoundedIcon sx={{ color: theme.jqs.onSecondaryContainer }} />
                            </Box>
                            <Typography variant="h6" sx={{ color: 'primary.main', fontWeight: 700 }}>
                                Sıraya Gir
                            </Typography>
                        </Stack>
                        <IconButton onClick={handleClose} sx={{ color: 'text.secondary' }}>
                            <CloseIcon />
                        </IconButton>
                    </Box>

                    <Box sx={{ px: 3, pb: 4, pt: 1 }}>
                        <TextField
                            fullWidth
                            onChange={(e) => onInpF('name', e.target.value)}
                            error={nameError}
                            helperText={nameError ? "Lütfen tam isminizi giriniz." : ""}
                            label="İsminiz"
                            variant="outlined"
                            inputProps={{ maxLength: 20 }}
                            InputLabelProps={{ shrink: true }}
                            InputProps={{ startAdornment: (<InputAdornment position="start"><PersonIcon sx={{ color: 'text.secondary' }} /></InputAdornment>) }}
                            sx={{ mb: 2.5 }}
                        />

                        <TextField
                            fullWidth
                            onChange={(e) => onInpF('phoneNumber', e.target.value)}
                            error={phoneError}
                            helperText={phoneError ? "Lütfen numaranızı eksiksiz giriniz." : ""}
                            type="number"
                            InputLabelProps={{ shrink: true }}
                            label="Telefon Numaranız"
                            variant="outlined"
                            sx={{ mb: 3 }}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <PhoneIcon sx={{ color: 'text.secondary', mr: 0.5 }} />+90
                                    </InputAdornment>
                                )
                            }}
                        />

                        {services.length > 0 ? (
                            <Box sx={{ mb: 3 }}>
                                <Typography variant="subtitle2" sx={{ mb: 1, color: 'text.secondary' }}>Hizmet seçiniz</Typography>
                                <ToggleButtonGroup
                                    value={state.serviceID ?? services[0].serviceID}
                                    exclusive
                                    onChange={(e, val) => { if (val !== null) onInpF('serviceID', val) }}
                                    sx={{ flexWrap: 'wrap', gap: 1, '& .MuiToggleButton-root': { borderRadius: '8px !important', border: `1px solid ${theme.jqs.outlineVariant} !important`, px: 2 } }}
                                >
                                    {services.map((service) => (
                                        <ToggleButton key={service.serviceID} value={service.serviceID}>
                                            {service.name}
                                        </ToggleButton>
                                    ))}
                                </ToggleButtonGroup>
                                <FormHelperText>Bu, tahmini süre hesaplamada önemlidir.</FormHelperText>
                            </Box>
                        ) : (
                            <Box sx={{ mb: 3 }}>
                                <Typography variant="h6">Dükkan sahibinin hizmet eklemesini bekleyiniz.</Typography>
                            </Box>
                        )}

                        <Box sx={{ mb: 1 }}>
                            <Typography variant="subtitle2" sx={{ mb: 1, color: 'text.secondary' }}>Kaç kişisiniz?</Typography>
                            <ToggleButtonGroup
                                value={state.comingWithValue ?? 1}
                                exclusive
                                onChange={(e, val) => { if (val !== null) onInpF('comingWithValue', val) }}
                                sx={{ gap: 1, '& .MuiToggleButton-root': { borderRadius: '8px !important', border: `1px solid ${theme.jqs.outlineVariant} !important`, minWidth: 56 } }}
                            >
                                <ToggleButton value={1}>Tekim</ToggleButton>
                                <ToggleButton value={2}>2</ToggleButton>
                                <ToggleButton value={3}>3</ToggleButton>
                                <ToggleButton value={4}>4</ToggleButton>
                            </ToggleButtonGroup>
                            <FormHelperText>Bu, sıralamada önemlidir.</FormHelperText>
                        </Box>

                        {samePhoneError === true && (
                            <Alert sx={{ mt: 2, mb: 1, borderRadius: 2 }} severity="error" variant="filled">Bu telefon numarası zaten sırada</Alert>
                        )}
                        {noServiceError && (
                            <Alert sx={{ mt: 2, mb: 1, borderRadius: 2 }} severity="error" variant="filled">Lütfen hizmet seçiniz.</Alert>
                        )}

                        <Button
                            variant="contained"
                            onClick={handleSubmit}
                            color="primary"
                            fullWidth
                            endIcon={<ArrowForwardIcon />}
                            sx={{ mt: 2, py: 1.4 }}
                        >
                            Sıraya gir
                        </Button>
                    </Box>
                </Box>
            </Dialog>
        </Box>
    )
}
export default InfoBoxes
