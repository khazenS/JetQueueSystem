import { Box, Button, Chip, Collapse, IconButton, Typography, useTheme } from "@mui/material"
import React, { useEffect, useState } from "react"
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import LocalPhoneIcon from '@mui/icons-material/LocalPhone';
import CloseIcon from '@mui/icons-material/Close';
import ContentCutIcon from '@mui/icons-material/ContentCut';
import GroupRoundedIcon from '@mui/icons-material/GroupRounded';
import ScheduleRoundedIcon from '@mui/icons-material/ScheduleRounded';
import PeopleAltRoundedIcon from '@mui/icons-material/PeopleAltRounded';
import {useDispatch,useSelector} from 'react-redux'
import { addNewUser, getDailyBookingAdmin, cancelUserFromAdminQue, resetDailyQueue, removeUserFromAdminQue, cutFinished, upMoveReq, downMoveReq } from "../../redux/features/adminPageSlices/adminDailyBookingSlice";
import { socket } from "../../helpers/socketio";
import { useNavigate } from "react-router-dom";
import { newFinishedCut } from "../../redux/features/adminPageSlices/shopStatsSlice";
import { decryptData } from "../../helpers/cryptoProcess";
import VerifiedIcon from '@mui/icons-material/Verified';

// Pill used for the service / date row inside an expanded entry
const infoPillSx = (theme) => ({
    flex: 1,
    minWidth: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 0.5,
    py: 0.85,
    px: 1,
    borderRadius: '8px',
    bgcolor: theme.jqs.surfaceLowest,
    border: `1px solid ${theme.jqs.outlineVariant}`,
})

// Action buttons inside the expanded entry — responsive so labels never clip on small phones
const actionButtonSx = {
    minWidth: 0,
    py: 1,
    px: { xs: 0.75, sm: 1.5 },
    fontSize: { xs: '0.8rem', sm: '0.875rem' },
    whiteSpace: 'nowrap',
    '& .MuiButton-startIcon': { mr: { xs: 0.5, sm: 0.75 } },
    '& .MuiButton-startIcon > svg': { fontSize: { xs: '1.1rem', sm: '1.25rem' } },
}

const outlinedActionButtonSx = {
    ...actionButtonSx,
    borderWidth: 1.5,
    '&:hover': { borderWidth: 1.5 },
}

//Row
function Row(props){
    const { row, dailyQueue, index } = props
    const theme = useTheme()
    const [open,setOpen] = useState(false)
    const dispatch = useDispatch()
    const isFirst = index === 0
    const isLast = index === dailyQueue.length - 1

    const handleCancel = (userBookingID) => {
        dispatch(removeUserFromAdminQue(userBookingID))
        setOpen(false)
    }

    const handleFinishCut = (userBookingID) => {
        dispatch(cutFinished(userBookingID))
        .then((result) => {
            // This is for uupdating shop stats
            dispatch((newFinishedCut({income:result.payload.finishedDatas.income,serviceName:result.payload.finishedDatas.serviceName,comingWith:result.payload.finishedDatas.comingWith,serviceIncome:result.payload.finishedDatas.serviceIncome})))
        })
        setOpen(false)
    }

    const handleUpMove = () => {
        dispatch(upMoveReq(index))
        setOpen(false)
    }

    const handleDownMove = () => {
        dispatch(downMoveReq(index))
        setOpen(false)
    }

    return (
        <Box
            sx={{
                borderRadius: '12px',
                border: `1px solid ${isFirst ? theme.palette.primary.main : theme.jqs.surfaceVariant}`,
                bgcolor: isFirst ? `${theme.jqs.secondaryContainer}22` : theme.jqs.surfaceLow,
                overflow: 'hidden',
                transition: 'border-color .2s ease',
            }}
        >
            {/* Main row */}
            <Box
                onClick={() => setOpen(!open)}
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: { xs: 1.5, sm: 1.75 },
                    px: { xs: 2, sm: 2.25 },
                    py: { xs: 1.85, sm: 2 },
                    minHeight: { xs: 74, sm: 78 },
                    cursor: 'pointer',
                    '&:active': { bgcolor: theme.jqs.surfaceContainer },
                }}
            >
                {/* Order badge */}
                <Box
                    sx={{
                        width: { xs: 40, sm: 42 },
                        height: { xs: 40, sm: 42 },
                        flexShrink: 0,
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 700,
                        fontSize: '1.05rem',
                        lineHeight: 1,
                        bgcolor: isFirst ? theme.palette.primary.main : theme.jqs.surfaceHigh,
                        color: isFirst ? '#fff' : theme.jqs.onSurfaceVariant,
                    }}
                >
                    {index + 1}
                </Box>

                {/* Name + phone */}
                <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Typography sx={{ fontWeight: 600, fontSize: '1.02rem', lineHeight: 1.45, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {row.name}
                        </Typography>
                        {row.isVerified && (
                            <VerifiedIcon sx={{ fontSize: '1rem', color: 'primary.main', flexShrink: 0 }} />
                        )}
                        {isFirst && (
                            <Chip label="Sırada" size="small" sx={{ height: 20, fontSize: '0.7rem', fontWeight: 600, flexShrink: 0, bgcolor: theme.jqs.secondaryContainer, color: theme.jqs.onSecondaryContainer }} />
                        )}
                    </Box>
                    {row.phoneNumber !== null && (
                        <Typography variant="body2" sx={{ color: 'text.secondary', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {row.phoneNumber}
                        </Typography>
                    )}
                </Box>

                {/* Coming with */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.4, color: 'text.secondary', flexShrink: 0 }}>
                    <GroupRoundedIcon sx={{ fontSize: '1.05rem' }} />
                    <Typography sx={{ fontWeight: 600 }}>{row.comingWith}</Typography>
                </Box>

                <IconButton size="small" sx={{ color: 'primary.main', flexShrink: 0 }}>
                    {open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
                </IconButton>
            </Box>

            {/* Expanded detail */}
            <Collapse in={open} timeout="auto" unmountOnExit>
                <Box sx={{ px: 1.5, pb: 1.5 }}>
                    {/* Service + date — side by side, fill the row */}
                    <Box sx={{ display: 'flex', gap: 1, mb: 1.5 }}>
                        <Box sx={infoPillSx(theme)}>
                            <ContentCutIcon sx={{ fontSize: '1rem', flexShrink: 0, color: 'text.secondary' }} />
                            <Typography variant="body2" sx={{ fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {row.service.name}
                            </Typography>
                        </Box>
                        <Box sx={infoPillSx(theme)}>
                            <ScheduleRoundedIcon sx={{ fontSize: '1rem', flexShrink: 0, color: 'text.secondary' }} />
                            <Typography variant="body2" sx={{ fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {row.shownDate}
                            </Typography>
                        </Box>
                    </Box>

                    {/* Call (only when phone exists) */}
                    {row.phoneNumber !== null && (
                        <Button
                            component="a"
                            href={`tel:+90${row.phoneNumber}`}
                            fullWidth
                            variant="outlined"
                            color="success"
                            startIcon={<LocalPhoneIcon />}
                            sx={{ mb: 1, borderWidth: 1.5, '&:hover': { borderWidth: 1.5 } }}
                        >
                            Ara
                        </Button>
                    )}

                    {/* Actions — 2x2 grid */}
                    <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1 }}>
                        <Button
                            onClick={() => handleFinishCut(row.userBookingID)}
                            variant="contained"
                            color="primary"
                            startIcon={<ContentCutIcon />}
                            sx={actionButtonSx}
                        >
                            Kesimi Bitir
                        </Button>
                        <Button
                            onClick={() => handleCancel(row.userBookingID)}
                            variant="outlined"
                            color="error"
                            startIcon={<CloseIcon />}
                            sx={outlinedActionButtonSx}
                        >
                            İptal
                        </Button>
                        <Button
                            onClick={isFirst ? undefined : handleUpMove}
                            disabled={isFirst}
                            variant="outlined"
                            color="info"
                            startIcon={<KeyboardArrowUpIcon />}
                            sx={outlinedActionButtonSx}
                        >
                            Yukarı
                        </Button>
                        <Button
                            onClick={isLast ? undefined : handleDownMove}
                            disabled={isLast}
                            variant="outlined"
                            color="info"
                            startIcon={<KeyboardArrowDownIcon />}
                            sx={outlinedActionButtonSx}
                        >
                            Aşağı
                        </Button>
                    </Box>
                </Box>
            </Collapse>
        </Box>
    )
}
// How many entries are shown before the "show more" toggle kicks in
const INITIAL_VISIBLE = 6

export default function AdminQueTable(){
    const theme = useTheme()
    const dispatch = useDispatch()
    const shopStatus = useSelector( state => state.shopStatus.status)
    const dailyQueue = useSelector( state => state.adminBooking.dailyQueue)
    const cancelTokenError = useSelector( state => state.adminBooking.expiredError)
    const [showAll, setShowAll] = useState(false)

    const navigate = useNavigate()

    // token error exists
    useEffect( () => {
        if(cancelTokenError === true){
            navigate('/adminLogin')
        }
    },[cancelTokenError,navigate])
    // Control of shop that is close or open if shopStatus is false then convert value of que to null for new opening
    useEffect(() => {
        if(shopStatus === true){
            dispatch(getDailyBookingAdmin());
        }else{
            dispatch(resetDailyQueue())
        }

    },[dispatch,shopStatus])

    // Listen socket for adding new user to que then print it out
    useEffect(()=>{
        socket.on('newUser',(cryptedData) => {
          const decryptedData = decryptData((cryptedData))
          dispatch(addNewUser(decryptedData))
        })

        return () => {
          socket.off('newUser')
        }
    },[dispatch])

    // Listen socket for cancelling process
    useEffect( () => {
        socket.on('cancel',(userBookingID) =>{
            dispatch(cancelUserFromAdminQue(userBookingID))
        })
        return () => {
          socket.off('cancel')
        }
    },[dispatch])

    if(shopStatus !== true || dailyQueue === null){
        return null
    }

    const totalPeople = dailyQueue.reduce((sum, u) => sum + (Number(u.comingWith) || 0), 0)
    const hasOverflow = dailyQueue.length > INITIAL_VISIBLE
    const visibleQueue = (hasOverflow && !showAll) ? dailyQueue.slice(0, INITIAL_VISIBLE) : dailyQueue
    const hiddenCount = dailyQueue.length - INITIAL_VISIBLE

    return (
        <Box
            sx={{
                bgcolor: theme.jqs.surfaceLowest,
                borderRadius: '16px',
                boxShadow: theme.jqs.cardShadow,
                border: `1px solid ${theme.jqs.surfaceVariant}`,
                overflow: 'hidden',
                animation: 'jqsFadeUp 0.5s ease both',
            }}
        >
            {/* Header */}
            <Box
                sx={{
                    p: 2.5,
                    borderBottom: `1px solid ${theme.jqs.surfaceVariant}`,
                    bgcolor: theme.jqs.surfaceLow,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 1,
                }}
            >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
                    <PeopleAltRoundedIcon sx={{ color: 'primary.main' }} />
                    <Typography variant="h6">Günlük Sıra</Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 0.75 }}>
                    <Chip label={`${dailyQueue.length} kişi`} size="small" sx={{ fontWeight: 600, bgcolor: theme.jqs.surfaceHigh }} />
                    {totalPeople > dailyQueue.length && (
                        <Chip label={`${totalPeople} kişi (toplam)`} size="small" sx={{ fontWeight: 600, bgcolor: theme.jqs.secondaryContainer, color: theme.jqs.onSecondaryContainer }} />
                    )}
                </Box>
            </Box>

            {/* Body */}
            <Box sx={{ p: 2 }}>
                {dailyQueue.length === 0 ? (
                    <Box sx={{ textAlign: 'center', py: 5 }}>
                        <PeopleAltRoundedIcon sx={{ fontSize: '3rem', color: theme.jqs.outlineVariant }} />
                        <Typography variant="h6" sx={{ fontWeight: 700, color: 'text.secondary', mt: 1 }}>
                            Sıra Boş
                        </Typography>
                        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                            Henüz sıraya kimse katılmadı.
                        </Typography>
                    </Box>
                ) : (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.25 }}>
                        {visibleQueue.map((user, index) => (
                            <Row key={user.userBookingID} row={user} dailyQueue={dailyQueue} index={index} />
                        ))}

                        {hasOverflow && (
                            <Button
                                onClick={() => setShowAll(!showAll)}
                                fullWidth
                                variant="text"
                                color="primary"
                                startIcon={showAll ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
                                sx={{
                                    mt: 0.25,
                                    py: 1.25,
                                    fontWeight: 600,
                                    borderRadius: '12px',
                                    border: `1px dashed ${theme.jqs.outlineVariant}`,
                                    bgcolor: theme.jqs.surfaceLow,
                                    '&:hover': { bgcolor: theme.jqs.surfaceContainer },
                                }}
                            >
                                {showAll ? 'Daha az göster' : `Kalan ${hiddenCount} kişiyi göster`}
                            </Button>
                        )}
                    </Box>
                )}
            </Box>
        </Box>
    )
}
