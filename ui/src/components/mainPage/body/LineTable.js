import { CircularProgress, Box, Button, Collapse, Typography, useTheme } from "@mui/material";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { downMove, newUserToQue, removeUserFromQue, upMove } from "../../../redux/features/mainPageSlices/dailyBookingSlice";
import { socket } from "../../../helpers/socketio.js";
import { jwtDecode } from "jwt-decode";
import { decryptData } from "../../../helpers/cryptoProcess.js";
import GroupRoundedIcon from '@mui/icons-material/GroupRounded';
import ContentCutRoundedIcon from '@mui/icons-material/ContentCutRounded';
import VerifiedIcon from '@mui/icons-material/Verified';
import HourglassTopRoundedIcon from '@mui/icons-material/HourglassTopRounded';
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded';
import ExpandMoreRoundedIcon from '@mui/icons-material/ExpandMoreRounded';

const LIMIT = 5;

export default function LineTable(){
    const theme = useTheme()
    const dispatch = useDispatch()
    const dailyQue = useSelector( state => state.booking.dailyQueue )
    // queueToken
    const queueToken = useSelector( state => state.register.queueToken.token)
    // Decoded queue token
    const decodedQueueToken = queueToken ? jwtDecode(queueToken) : null

    const [expanded, setExpanded] = useState(false)
    const [showAll, setShowAll] = useState(false)

    useEffect(()=>{
      // Listen socket for new user to write it on ui
      socket.on('newUser',(cryptedData) => {
        const decryptedData = decryptData(cryptedData)
        dispatch(newUserToQue(decryptedData))
      })
      // Listen socket for new fast user to write it on ui
      socket.on('fastUser-register',(fastUserDatas) => {
        const decryptedData = decryptData(fastUserDatas)
        dispatch(newUserToQue(decryptedData))
      })
      // Listen socket for cancel specialized que on daily que and
      socket.on('cancel',(userBookingID) =>{
        dispatch(removeUserFromQue(userBookingID))
      })
      // Listen up move socket for moving the user from admin panel
      socket.on('up-moved',(index) => {
        dispatch(upMove(index))
      })
      // Listen down move socket for moving the user from admin panel
      socket.on('down-moved',(index) => {
        dispatch(downMove(index))
      })

      return () => {
        socket.off('newUser')
        socket.off('fastUser-register')
        socket.off('cancel')
        socket.off('up-moved')
        socket.off('down-moved')
      }
    },[dispatch])

    const cardSx = {
      bgcolor: theme.jqs.surfaceLowest,
      borderRadius: '12px',
      boxShadow: theme.jqs.cardShadow,
      border: `1px solid ${theme.jqs.surfaceVariant}`,
      overflow: 'hidden',
    }

    if(!dailyQue){
      return (
        <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "30vh" }}>
          <CircularProgress />
        </Box>
      )
    }

    // queue intelligence for the in-queue user
    const myIndex = queueToken ? dailyQue.findIndex(p => p.userBookingID === decodedQueueToken?.userBookingID) : -1
    const inQueue = myIndex !== -1
    const peopleAhead = inQueue ? dailyQue.slice(0, myIndex).reduce((sum, p) => sum + (p.comingWith || 1), 0) : 0
    const progressFill = inQueue && dailyQue.length > 0
      ? Math.max(8, Math.round(((dailyQue.length - myIndex) / dailyQue.length) * 100))
      : 0

    // when in queue, the detailed live status stays hidden until requested
    const showDetailed = !inQueue || expanded

    const QueueRow = ({ data, index }) => {
      const isMe = queueToken && data.userBookingID === decodedQueueToken?.userBookingID
      const inSeat = index === 0
      return (
        <Box
          sx={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            gap: 1.5, p: 1.5, borderRadius: '8px',
            bgcolor: isMe ? `${theme.palette.primary.main}0D` : theme.jqs.surface,
            border: isMe ? `1px solid ${theme.palette.primary.main}55` : '1px solid transparent',
            opacity: (!inSeat && !isMe) ? 0.85 : 1,
            animation: `jqsFadeUp 0.4s ease ${Math.min((index % LIMIT) * 0.05, 0.4)}s both`,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, minWidth: 0 }}>
            <Box
              sx={{
                width: 40, height: 40, borderRadius: '50%', flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 700, fontSize: '1.05rem',
                bgcolor: inSeat ? theme.jqs.primaryContainer : theme.jqs.surfaceHigh,
                color: inSeat ? '#fff' : theme.jqs.onSurfaceVariant,
              }}
            >
              {index + 1}
            </Box>
            <Box sx={{ minWidth: 0 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Typography noWrap sx={{ fontWeight: 600, color: 'text.primary' }}>{data.name}</Typography>
                {data.isVerified && <VerifiedIcon sx={{ fontSize: '1rem', color: theme.jqs.tertiary, flexShrink: 0 }} />}
                {isMe && (
                  <Box sx={{ ml: 0.5, px: 0.85, py: '2px', borderRadius: '6px', fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.05em', bgcolor: 'primary.main', color: '#fff' }}>
                    SİZ
                  </Box>
                )}
              </Box>
              {data.service?.name && (
                <Typography noWrap sx={{ color: 'text.secondary', fontSize: '0.875rem' }}>{data.service.name}</Typography>
              )}
            </Box>
          </Box>

          {inSeat ? (
            <Box sx={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 0.5, color: theme.jqs.statusWarning }}>
              <HourglassTopRoundedIcon sx={{ fontSize: '1rem' }} />
              <Typography variant="overline" sx={{ color: theme.jqs.statusWarning, textTransform: 'none', fontWeight: 600 }}>Şu an Koltukta</Typography>
            </Box>
          ) : (
            <Typography variant="overline" sx={{ flexShrink: 0, color: 'text.secondary', textTransform: 'none' }}>Bekliyor</Typography>
          )}
        </Box>
      )
    }

    return (
      <Box sx={{ ...cardSx, mt: 3, animation: 'jqsFadeUp 0.5s ease 0.1s both' }}>
        {/* header */}
        <Box
          sx={{
            px: 2.5, py: 2,
            bgcolor: theme.jqs.surfaceLow,
            borderBottom: `1px solid ${theme.jqs.surfaceVariant}`,
            display: 'flex', alignItems: 'center', gap: 1,
          }}
        >
          <GroupRoundedIcon sx={{ color: 'primary.main' }} />
          <Typography variant="h6" sx={{ color: 'primary.main', fontWeight: 600 }}>
            {inQueue ? 'Canlı Sıra Durumu' : 'Aktif Sıra Durumu'}
          </Typography>
        </Box>

        <Box sx={{ p: 2.5 }}>
          {dailyQue.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 5, animation: 'jqsFadeUp 0.5s ease both' }}>
              <ContentCutRoundedIcon sx={{ fontSize: 48, color: 'primary.main', mb: 1.5, animation: 'jqsFloat 3.6s ease-in-out infinite' }} />
              <Typography variant="h6" sx={{ color: 'primary.main', mb: 0.5 }}>Sıra Boş</Typography>
              <Typography sx={{ color: 'text.secondary' }}>Şu an sırada bekleyen kimse yok. İlk siz olun!</Typography>
            </Box>
          ) : !showDetailed ? (
            /* ── Minimal in-queue screen (detail hidden until requested) ── */
            <Box sx={{ textAlign: 'center', py: 1, animation: 'jqsFadeUp 0.4s ease both' }}>
              <Typography sx={{ color: 'text.secondary', mb: 0.5 }}>
                Sıradaki yerinizi koruyoruz.
              </Typography>
              <Typography sx={{ mb: 2 }}>
                Önünüzde <strong style={{ color: theme.jqs.onSurface }}>{peopleAhead}</strong> kişi var.
              </Typography>
              <Button
                fullWidth
                variant="outlined"
                color="primary"
                endIcon={<ArrowForwardRoundedIcon />}
                onClick={() => setExpanded(true)}
                sx={{ borderWidth: 2, '&:hover': { borderWidth: 2 } }}
              >
                Tüm Sırayı Gör
              </Button>
            </Box>
          ) : (
            /* ── Detailed live status ── */
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              {inQueue && (
                <Box sx={{ mb: 1 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.75 }}>
                    <Typography variant="overline" sx={{ color: 'text.secondary' }}>Sıra Başlangıcı</Typography>
                    <Typography variant="overline" sx={{ color: 'text.secondary' }}>Senin Sıran</Typography>
                  </Box>
                  <Box sx={{ height: 16, borderRadius: 999, bgcolor: theme.jqs.surfaceHigh, overflow: 'hidden' }}>
                    <Box
                      sx={{
                        height: '100%', borderRadius: 999,
                        width: `${progressFill}%`,
                        bgcolor: theme.jqs.secondaryContainer,
                        transition: 'width .6s cubic-bezier(0.22, 1, 0.36, 1)',
                      }}
                    />
                  </Box>
                  <Typography sx={{ textAlign: 'center', color: 'text.secondary', fontSize: '0.875rem', mt: 1 }}>
                    Önünüzde <strong style={{ color: theme.jqs.onSurface }}>{peopleAhead}</strong> kişi var.
                  </Typography>
                </Box>
              )}

              {dailyQue.slice(0, LIMIT).map((data, index) => (
                <QueueRow key={index} data={data} index={index} />
              ))}

              {/* extra rows expand smoothly */}
              {dailyQue.length > LIMIT && (
                <Collapse in={showAll} timeout="auto" unmountOnExit>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                    {dailyQue.slice(LIMIT).map((data, i) => (
                      <QueueRow key={LIMIT + i} data={data} index={LIMIT + i} />
                    ))}
                  </Box>
                </Collapse>
              )}

              {dailyQue.length > LIMIT && (
                <Button
                  fullWidth
                  variant="text"
                  color="primary"
                  endIcon={<ExpandMoreRoundedIcon sx={{ transform: showAll ? 'rotate(180deg)' : 'none', transition: 'transform .2s ease' }} />}
                  onClick={() => setShowAll(s => !s)}
                  sx={{ mt: 0.5 }}
                >
                  {showAll ? 'Daha Az Göster' : `Daha Fazla Listele (+${dailyQue.length - LIMIT})`}
                </Button>
              )}

              {inQueue && (
                <Button
                  fullWidth
                  variant="text"
                  onClick={() => { setExpanded(false); setShowAll(false); }}
                  sx={{ color: 'text.secondary', mt: 0.5 }}
                >
                  Gizle
                </Button>
              )}
            </Box>
          )}
        </Box>
      </Box>
    )
}
