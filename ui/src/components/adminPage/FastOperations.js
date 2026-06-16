import { Box, Button, Collapse, IconButton, InputAdornment, TextField, Typography, useTheme } from "@mui/material";
import AccountCircle from '@mui/icons-material/AccountCircle';
import BoltRoundedIcon from '@mui/icons-material/BoltRounded';
import { useDispatch, useSelector } from "react-redux";
import { decreaseAmount, increaseAmount, registerFastUser, updateAmount, updateFastName } from "../../redux/features/adminPageSlices/fastOpsSlice";
import { useEffect, useState } from "react";
import { addNewUser } from "../../redux/features/adminPageSlices/adminDailyBookingSlice";
import { useNavigate } from "react-router-dom";
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import { decryptData } from "../../helpers/cryptoProcess";
import { decreaseAmountStats, increaseAmountStats } from "../../redux/features/adminPageSlices/shopStatsSlice";

export default function FastOperations(){
    const theme = useTheme()
    const dispatch = useDispatch()
    const [nameError,setNameError] = useState(false)
    const [amountError,setAmountError] = useState(false)

    const shopStatus = useSelector(state => state.shopStatus.status)
    const fastName = useSelector( state => state.fastOps.fastName)
    const changeAmount = useSelector( state => state.fastOps.changeAmount)

    const tokenError = useSelector( state => state.fastOps.expiredError)
    const navigate = useNavigate()

    const [openFast,setOpenFast] = useState(false)
    const [openChangeA,setOpenChangeA] = useState(false)

    // token error exists
    useEffect( () => {
        if(tokenError === true){
            navigate('/adminLogin')
        }
    },[tokenError,navigate])

    // submit handle for fast name
    const handleFastNameSubmit = () => {
        if(fastName.length > 2 && fastName.length < 15){
            dispatch(registerFastUser(fastName))
            .then( (result) => {
                const decryptedData = decryptData(result.payload.fastUserDatas)
                dispatch(addNewUser(decryptedData))
            })

            setOpenFast(false)
        }else{
            setNameError(true)
        }
    }

    // increace and decrease process handle
    const handleIncreaseSubmit = () => {
        if(changeAmount > 0){
            dispatch(increaseAmount(changeAmount))
            .then( (result) => {
                dispatch(increaseAmountStats(result.payload.increasedAmount))
            })
            dispatch(updateAmount(0))
            setOpenChangeA(false)
        }else{
            setAmountError(true)
        }

    }
    const handleDecreaseSubmit = () => {
        if(changeAmount > 0){
            dispatch(decreaseAmount(changeAmount))
            .then( (result) => {
                dispatch(decreaseAmountStats(result.payload.decreasedAmount))
            })
            dispatch(updateAmount(0))
            setOpenChangeA(false)
        }else{
            setAmountError(true)
        }
    }

    if(shopStatus !== true){
        return null
    }

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
                <BoltRoundedIcon sx={{ color: 'primary.main' }} />
                <Typography variant="h6">Hızlı İşlemler</Typography>
            </Box>

            {/* Quick add */}
            <Box sx={{ borderTop: `1px solid ${theme.jqs.surfaceVariant}` }}>
                <Box
                    sx={rowHeaderSx}
                    onClick={() => {
                        setOpenFast(!openFast)
                        dispatch(updateFastName(''))
                        setNameError(false)
                    }}
                >
                    <Typography sx={{ flexGrow: 1, fontWeight: 600 }}>Hızlı ekle</Typography>
                    <IconButton size="small">
                        {openFast ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
                    </IconButton>
                </Box>

                <Collapse in={openFast} timeout="auto" unmountOnExit>
                    <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 1.5, pb: 2, pt: 0.5 }}>
                        <TextField
                            onChange={(e) => {
                                setNameError(false)
                                dispatch(updateFastName(e.target.value))
                            }}
                            value={fastName}
                            onKeyDown={(e) => { if (e.key === 'Enter') handleFastNameSubmit() }}
                            helperText={nameError === true ? '3-15 karakter aralığı isim giriniz.' : ''}
                            error={nameError}
                            size="small" required label="İsim" variant="outlined"
                            sx={{ flexGrow: 1 }}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <AccountCircle sx={{ color: 'text.secondary' }} />
                                    </InputAdornment>
                                ),
                            }}
                        />
                        <Button
                            onClick={() => { handleFastNameSubmit() }}
                            variant="contained" color="primary"
                            sx={{ fontWeight: 600, whiteSpace: 'nowrap', minWidth: { sm: 140 } }}
                        >
                            Sıraya Al
                        </Button>
                    </Box>
                </Collapse>
            </Box>

            {/* Income update */}
            <Box sx={{ borderTop: `1px solid ${theme.jqs.surfaceVariant}` }}>
                <Box
                    sx={rowHeaderSx}
                    onClick={() => {
                        setOpenChangeA(!openChangeA)
                        dispatch(updateAmount(0))
                        setAmountError(false)
                    }}
                >
                    <Typography sx={{ flexGrow: 1, fontWeight: 600 }}>Gelirde güncelleme yap</Typography>
                    <IconButton size="small">
                        {openChangeA ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
                    </IconButton>
                </Box>

                <Collapse in={openChangeA} timeout="auto" unmountOnExit>
                    <Box sx={{ display: 'flex', gap: 1, pb: 2, pt: 0.5, alignItems: 'flex-start' }}>
                        <TextField
                            onChange={(e) => {
                                setAmountError(false)
                                dispatch(updateAmount(e.target.value))
                            }}
                            value={changeAmount}
                            helperText={amountError === true ? 'Lütfen düzgün bir sayı giriniz.' : ''}
                            error={amountError}
                            size="small" type="number" required label="Lira" sx={{ flexGrow: 1 }} variant="outlined"
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">₺</InputAdornment>
                                ),
                            }}
                        />
                        <Button onClick={() => { handleIncreaseSubmit() }} variant="contained" color="success" sx={{ fontWeight: 700, fontSize: '1.1rem', minWidth: 52, px: 0 }}> + </Button>
                        <Button onClick={() => { handleDecreaseSubmit() }} variant="contained" color="error" sx={{ fontWeight: 700, fontSize: '1.1rem', minWidth: 52, px: 0 }}> − </Button>
                    </Box>
                </Collapse>
            </Box>
        </Box>
    )
}
