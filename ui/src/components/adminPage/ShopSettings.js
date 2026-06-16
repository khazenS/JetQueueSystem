import { Box, Typography, TextField, Button, Collapse, Grid, IconButton, ButtonGroup, useTheme } from "@mui/material";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { addMessage, addService, cancelCostumOpen, deleteMessage, deleteService, getShop, resetOtoDate, setTimeCostumOpen, updateShowMessage } from "../../redux/features/adminPageSlices/shopSettingsSlice";
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import DeleteIcon from '@mui/icons-material/Delete';
import SettingsRoundedIcon from '@mui/icons-material/SettingsRounded';
import AccessTimeRoundedIcon from '@mui/icons-material/AccessTimeRounded';
import PaymentsRoundedIcon from '@mui/icons-material/PaymentsRounded';

export default function ShopSettings(){
    const theme = useTheme()
    const navigate = useNavigate()
    const dispatch = useDispatch()

    const [openShowMessage,setShowMessage] = useState(false)
    const [showMessageError,setShowMessageError] = useState(false)

    const [openCostumOpen,setCostumOpen] = useState(null)
    const [hour, setHour] = useState('10')
    const [minute, setMinute] = useState('00')
    const [nowDate,setNowDate] = useState(null)

    const shopData = useSelector( state => state.shopSettings.shopData)
    const showMessage = useSelector( state => state.shopSettings.showMessage)
    const tokenError = useSelector( state => state.shopSettings.expiredError)
    const shopStatus = useSelector(state => state.shopStatus.status)
    const costumShopOpeningState =useSelector( state => state.shopSettings.costumShopOpening)
    const services = useSelector( state => state.shopSettings.services)

    // This part for services
    const [openServices,setOpenServices] = useState(false)
    const [openAddService,setAddService] = useState(false)

    const [serviceName,setserviceName] = useState('')
    const [serviceTime,setServiceTime] = useState('')
    const [serviceAmount,setServiceAmount] = useState('')

    const [sNameErr,setSNameErr] = useState(false)
    const [sTimeErr,setSTimeErr] = useState(false)
    const [sAmountErr,setSAmountErr] = useState(false)

    // token error exists
    useEffect( () => {
        if(tokenError === true){
            navigate('/adminLogin')
        }
    },[tokenError,navigate])

    //get shop settings when page rendered
    useEffect( () => {
        dispatch(getShop())
    },[dispatch])

    // sumbit for show message
    const showMessageSubmit = () => {
        if(showMessage.length < 250){
            dispatch(addMessage(showMessage))
            setShowMessage(false)
            dispatch(updateShowMessage(''))
        }else{
            setShowMessageError(true)
        }

    }

    const deleteMessageSubmit = () => {
        dispatch(deleteMessage())
        setShowMessage(false)
    }

    // Costum Day Opening Processes
    const handleCostumShopOpen = () => {
        setCostumOpen(!openCostumOpen)
    }

    const handleHourChange = (e) => {
        const value = e.target.value;
        // Sadece sayıları ve belirtilen aralıkta olanları kabul et
        if (value === '' || (value >= 0 && value <= 24)) {
            setHour(value);
        }
    };

    const handleMinuteChange = (e) => {
        const value = e.target.value;
        // Sadece sayıları ve belirtilen aralıkta olanları kabul et
        if (value === '' || (value >= 0 && value < 60)) {
            setMinute(value)
        }
    };

    useEffect( () => {
        if(costumShopOpeningState.date === null){
            if(openCostumOpen){
                let now = new Date()
                now.setDate(now.getDate() + 1);
                setNowDate(now)
            }else{
                setHour('10')
                setMinute('0')
                setNowDate(null)
            }
        }

    },[openCostumOpen])

    const submitCostumShop = () => {
        nowDate.setHours(hour)
        nowDate.setMinutes(minute)
        const utcDate = new Date(nowDate.getTime() - nowDate.getTimezoneOffset() * 60000)
        dispatch(setTimeCostumOpen(utcDate))

        setCostumOpen(false)
    }

    useEffect( () => {
        dispatch(resetOtoDate())
        setCostumOpen(false)
    },[shopStatus,dispatch])

    const submitAddService = () => {
        if(serviceName.length < 3 || serviceName.length > 15){
            setSNameErr(true)
        }else if(isNaN(serviceTime) || !serviceTime){
            setSTimeErr(true)
        }else if(isNaN(serviceAmount) || !serviceAmount){
            setSAmountErr(true)
        }else{
            dispatch(addService({name:serviceName,estimatedTime:Number(serviceTime),amount:Number(serviceAmount)}))
            resetAddServiceSettings()
            setAddService(false)
        }
    }

    const resetAddServiceSettings = () => {
        setserviceName('')
        setServiceTime('')
        setServiceAmount('')
        setSNameErr(false)
        setSTimeErr(false)
        setSAmountErr(false)
    }

    // shared styles
    const rowHeaderSx = {
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        width: '100%',
        py: 1.5,
        cursor: 'pointer',
    }

    return (
        <Box
            sx={{
                bgcolor: theme.jqs.surfaceLowest,
                borderRadius: '16px',
                boxShadow: theme.jqs.cardShadow,
                border: `1px solid ${theme.jqs.surfaceVariant}`,
                p: { xs: 2.5, sm: 3 },
                animation: 'jqsFadeUp 0.5s ease both',
            }}
        >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, mb: 1 }}>
                <SettingsRoundedIcon sx={{ color: 'primary.main' }} />
                <Typography variant="h6">Dükkan Ayarları</Typography>
            </Box>

            {/* Announcement */}
            <Box sx={{ borderTop: `1px solid ${theme.jqs.surfaceVariant}` }}>
                <Box
                    sx={rowHeaderSx}
                    onClick={() => {
                        setShowMessage(!openShowMessage)
                        dispatch(updateShowMessage(''))
                        setShowMessageError(false)
                    }}
                >
                    <Typography sx={{ flexGrow: 1, fontWeight: 600 }}>
                        {shopData.showMessage ? 'Duyuru Kaldır' : 'Duyuru Yayınla'}
                    </Typography>
                    <IconButton size="small">
                        {openShowMessage ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
                    </IconButton>
                </Box>
                <Collapse in={openShowMessage} timeout="auto" unmountOnExit>
                    <Box sx={{ pb: 2, pt: 0.5 }}>
                        {shopData.showMessage ? (
                            <Button onClick={() => deleteMessageSubmit()} variant="contained" color="error" fullWidth>
                                Duyuruyu bitir
                            </Button>
                        ) : (
                            <>
                                <TextField
                                    onChange={(e) => {
                                        setShowMessageError(false)
                                        dispatch(updateShowMessage(e.target.value))
                                    }}
                                    multiline
                                    rows={4}
                                    value={showMessage}
                                    helperText={showMessageError === true ? 'Maksimum 250 karakter giriniz' : `${showMessage.length}/250`}
                                    error={showMessageError}
                                    size="small" required label="Duyuru mesajı" variant="outlined"
                                    fullWidth
                                />
                                <Button onClick={() => showMessageSubmit()} variant="contained" color="primary" fullWidth sx={{ mt: 1.5 }}>
                                    Yayınla
                                </Button>
                            </>
                        )}
                    </Box>
                </Collapse>
            </Box>

            {shopStatus === false && (
                <>
                    {/* Services */}
                    <Box sx={{ borderTop: `1px solid ${theme.jqs.surfaceVariant}` }}>
                        <Box
                            sx={rowHeaderSx}
                            onClick={() => {
                                setOpenServices(!openServices)
                                setAddService(false)
                                resetAddServiceSettings()
                            }}
                        >
                            <Typography sx={{ flexGrow: 1, fontWeight: 600 }}>Hizmet Ekle-Çıkar</Typography>
                            <IconButton size="small">
                                {openServices ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
                            </IconButton>
                        </Box>
                        <Collapse in={openServices} timeout="auto" unmountOnExit>
                            <Box sx={{ pb: 2, pt: 0.5 }}>
                                <Button
                                    onClick={() => {
                                        setAddService(!openAddService)
                                        resetAddServiceSettings()
                                    }}
                                    variant={openAddService ? "outlined" : "contained"}
                                    color={openAddService ? "error" : "success"}
                                    startIcon={openAddService ? <RemoveIcon /> : <AddIcon />}
                                    fullWidth
                                    sx={openAddService ? { borderWidth: 1.5, '&:hover': { borderWidth: 1.5 } } : {}}
                                >
                                    {openAddService ? 'Vazgeç' : 'Yeni Hizmet'}
                                </Button>

                                <Collapse in={openAddService} timeout="auto" unmountOnExit>
                                    <Box
                                        sx={{
                                            mt: 1.5,
                                            p: 2,
                                            borderRadius: '12px',
                                            bgcolor: theme.jqs.surfaceLow,
                                            border: `1px solid ${theme.jqs.surfaceVariant}`,
                                        }}
                                    >
                                        <Grid container spacing={2}>
                                            <Grid item xs={12}>
                                                <TextField
                                                    value={serviceName}
                                                    onChange={(e) => {
                                                        setserviceName(e.target.value)
                                                        setSNameErr(false)
                                                    }}
                                                    error={sNameErr}
                                                    helperText={sNameErr ? "Lütfen 3-15 karakter aralığında isim giriniz." : "* Ekranda gözükecek bir isim giriniz."}
                                                    variant="outlined"
                                                    label="Hizmet İsmi"
                                                    size="small"
                                                    fullWidth
                                                />
                                            </Grid>
                                            <Grid item xs={12} sm={6}>
                                                <TextField
                                                    value={serviceTime}
                                                    onChange={(e) => {
                                                        setServiceTime(e.target.value)
                                                        setSTimeErr(false)
                                                    }}
                                                    error={sTimeErr}
                                                    helperText={sTimeErr ? "Lütfen geçerli bir sayı giriniz." : "* Dakika cinsinden süre."}
                                                    variant="outlined"
                                                    label="Tahmini süre"
                                                    size="small"
                                                    fullWidth
                                                />
                                            </Grid>
                                            <Grid item xs={12} sm={6}>
                                                <TextField
                                                    value={serviceAmount}
                                                    onChange={(e) => {
                                                        setServiceAmount(e.target.value)
                                                        setSAmountErr(false)
                                                    }}
                                                    error={sAmountErr}
                                                    helperText={sAmountErr ? "Lütfen geçerli bir sayı giriniz." : "* TL olarak ücret."}
                                                    size="small" variant="outlined"
                                                    label="Hizmet ücreti"
                                                    fullWidth
                                                />
                                            </Grid>
                                            <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'center' }}>
                                                <Button
                                                    onClick={submitAddService}
                                                    variant="contained"
                                                    color="success"
                                                    startIcon={<AddIcon />}
                                                    sx={{ width: { xs: '100%', sm: '60%' } }}
                                                >
                                                    Ekle
                                                </Button>
                                            </Grid>
                                        </Grid>
                                    </Box>
                                </Collapse>

                                {services && services.length !== 0 ? (
                                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.25, mt: 1.5 }}>
                                        {services.map((service) => (
                                            <Box
                                                key={service.serviceID}
                                                sx={{
                                                    display: 'flex',
                                                    justifyContent: 'space-between',
                                                    alignItems: 'center',
                                                    gap: 1,
                                                    p: 1.5,
                                                    borderRadius: '12px',
                                                    bgcolor: theme.jqs.surfaceLow,
                                                    border: `1px solid ${theme.jqs.surfaceVariant}`,
                                                }}
                                            >
                                                <Typography sx={{ fontWeight: 600, flexGrow: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                    {service.name}
                                                </Typography>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.4, color: 'text.secondary', flexShrink: 0 }}>
                                                    <AccessTimeRoundedIcon sx={{ fontSize: '0.95rem' }} />
                                                    <Typography variant="body2" sx={{ fontWeight: 600 }}>{service.estimatedTime}dk</Typography>
                                                </Box>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.4, color: 'primary.main', flexShrink: 0 }}>
                                                    <PaymentsRoundedIcon sx={{ fontSize: '0.95rem' }} />
                                                    <Typography variant="body2" sx={{ fontWeight: 700 }}>{service.amount}₺</Typography>
                                                </Box>
                                                <IconButton color="error" size="small" onClick={() => dispatch(deleteService(service.serviceID))} sx={{ flexShrink: 0 }}>
                                                    <DeleteIcon fontSize="small" />
                                                </IconButton>
                                            </Box>
                                        ))}
                                    </Box>
                                ) : null}
                            </Box>
                        </Collapse>
                    </Box>

                    {/* Custom opening time */}
                    <Box sx={{ borderTop: `1px solid ${theme.jqs.surfaceVariant}` }}>
                        <Box sx={rowHeaderSx} onClick={handleCostumShopOpen}>
                            <Typography sx={{ flexGrow: 1, fontWeight: 600 }}>Dükkan Açılış Saati Ayarla</Typography>
                            <IconButton size="small">
                                {openCostumOpen ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
                            </IconButton>
                        </Box>
                        <Collapse in={openCostumOpen} timeout="auto" unmountOnExit>
                            <Box sx={{ pb: 2, pt: 0.5 }}>
                                {costumShopOpeningState.date === null ? (
                                    <>
                                        <Box
                                            sx={{
                                                p: 1.5,
                                                borderRadius: '12px',
                                                bgcolor: theme.jqs.surfaceLow,
                                                border: `1px solid ${theme.jqs.surfaceVariant}`,
                                            }}
                                        >
                                            İşlem yapılacak tarih
                                            <Box component="span" sx={{ fontWeight: 700 }}>
                                                {' '}{nowDate !== null ? nowDate.toLocaleDateString('tr-TR') : ''} , {nowDate !== null ? nowDate.toLocaleDateString('tr-TR', { weekday: 'long' }) : ''}
                                            </Box>
                                        </Box>

                                        <ButtonGroup
                                            sx={{ display: 'flex', justifyContent: 'center', mt: 1.5 }}
                                            variant="contained"
                                            aria-label="Basic button group"
                                        >
                                            <Button
                                                onClick={() => { setNowDate(new Date(nowDate.setDate(nowDate.getDate() + 1))); }}
                                                color="success" size="small" fullWidth sx={{ whiteSpace: 'nowrap' }}
                                            >
                                                Gün Arttır
                                            </Button>
                                            <Button
                                                onClick={() => { setNowDate(new Date(nowDate.setDate(nowDate.getDate() - 1))); }}
                                                color="error" size="small" fullWidth sx={{ whiteSpace: 'nowrap' }}
                                            >
                                                Gün Azalt
                                            </Button>
                                        </ButtonGroup>

                                        <Box sx={{ mt: 2 }}>
                                            İşlem yapılacak saat:
                                            <Box component="span" sx={{ fontWeight: 700 }}> {hour} : {minute < 10 ? '0' + minute : minute}</Box>
                                        </Box>

                                        <Grid container spacing={2} justifyContent="center" sx={{ mt: 0.5 }}>
                                            <Grid item xs={6}>
                                                <TextField
                                                    label="Saat" type="number"
                                                    inputProps={{ max: 24, min: 0 }}
                                                    value={hour} onChange={handleHourChange}
                                                    variant="outlined" fullWidth
                                                />
                                            </Grid>
                                            <Grid item xs={6}>
                                                <TextField
                                                    label="Dakika" type="number"
                                                    inputProps={{ max: 59, min: 0 }}
                                                    value={minute} onChange={handleMinuteChange}
                                                    variant="outlined" fullWidth
                                                />
                                            </Grid>
                                        </Grid>

                                        <Button onClick={() => { submitCostumShop() }} variant="contained" fullWidth sx={{ mt: 2.5, fontWeight: 700 }}>
                                            Dükkan açılışını onayla
                                        </Button>
                                    </>
                                ) : (
                                    <>
                                        <Box
                                            sx={{
                                                p: 1.5,
                                                borderRadius: '12px',
                                                bgcolor: theme.jqs.surfaceLow,
                                                border: `1px solid ${theme.jqs.surfaceVariant}`,
                                            }}
                                        >
                                            İşlem tarihi <Box component={'span'} sx={{ fontWeight: 700 }}>{costumShopOpeningState.date}</Box>
                                        </Box>
                                        <Button
                                            onClick={() => {
                                                dispatch(cancelCostumOpen())
                                                setCostumOpen(!openCostumOpen)
                                            }}
                                            variant="contained" fullWidth color="error" sx={{ mt: 1.5 }}
                                        >
                                            iptal et
                                        </Button>
                                    </>
                                )}
                            </Box>
                        </Collapse>
                    </Box>
                </>
            )}
        </Box>
    )
}
