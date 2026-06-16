import { Box, Stack, Typography, useTheme } from '@mui/material'
import StorefrontRoundedIcon from '@mui/icons-material/StorefrontRounded';
import ScheduleRoundedIcon from '@mui/icons-material/ScheduleRounded';
import BedtimeRoundedIcon from '@mui/icons-material/BedtimeRounded';
import { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'

export default function CloseShop(){
    const theme = useTheme()
    const openingDate = useSelector( state => state.booking.otoOpeningDate)

    const [isDayEqual,setIDE] = useState(false)
    const [time,setTime] = useState(null)

    useEffect( () => {
        const newDate = new Date(openingDate)
        newDate.setHours(newDate.getHours() - 3)
        const nowDate = new Date()

        if(openingDate && newDate.getDay() === nowDate.getDay()){
            setIDE(true)
        }
        if(openingDate !== null){
            const hours = newDate.getHours().toString().padStart(2, '0')
            const minutes = newDate.getMinutes().toString().padStart(2, '0')

            setTime(`${hours}:${minutes}`)
        }

    },[openingDate])

    const willAutoOpen = openingDate && isDayEqual

    return (
        <Box
            sx={{
                mt: 3,
                py: 6,
                px: 3,
                textAlign: 'center',
                bgcolor: theme.jqs.surfaceLowest,
                borderRadius: '12px',
                boxShadow: theme.jqs.cardShadow,
                border: `1px solid ${theme.jqs.surfaceVariant}`,
                animation: 'jqsFadeUp 0.5s ease both',
            }}
        >
            <Box
                sx={{
                    width: 96, height: 96, mx: 'auto', mb: 3,
                    borderRadius: '50%',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    bgcolor: willAutoOpen ? theme.jqs.tertiaryContainer : theme.jqs.secondaryContainer,
                    animation: 'jqsFloat 3.6s ease-in-out infinite',
                }}
            >
                {willAutoOpen
                    ? <ScheduleRoundedIcon sx={{ fontSize: 48, color: '#fff' }} />
                    : <BedtimeRoundedIcon sx={{ fontSize: 46, color: theme.jqs.onSecondaryContainer }} />}
            </Box>

            <Stack direction="row" spacing={1} justifyContent="center" alignItems="center" sx={{ mb: 1.5 }}>
                <StorefrontRoundedIcon sx={{ color: 'primary.main' }} />
                <Typography variant="h5" sx={{ color: 'primary.main' }}>
                    Dükkan Şu An Kapalı
                </Typography>
            </Stack>

            {willAutoOpen ? (
                <>
                    <Typography sx={{ color: 'text.secondary', maxWidth: 320, mx: 'auto', mb: 3.5 }}>
                        Sabrınız için teşekkürler. Dükkan otomatik olarak açılacaktır.
                    </Typography>
                    <Box
                        sx={{
                            display: 'inline-flex', alignItems: 'center', gap: 2,
                            px: 3, py: 1.75, borderRadius: '12px',
                            border: `1px solid ${theme.jqs.tertiary}55`,
                            bgcolor: theme.jqs.surface,
                            animation: 'jqsPop 0.5s ease 0.2s both',
                        }}
                    >
                        <ScheduleRoundedIcon sx={{ color: theme.jqs.tertiary, fontSize: '2rem' }} />
                        <Box sx={{ textAlign: 'left' }}>
                            <Typography variant="overline" sx={{ color: 'text.secondary', display: 'block', lineHeight: 1.4 }}>
                                Açılış saati
                            </Typography>
                            <Typography sx={{ fontWeight: 700, fontSize: '1.6rem', color: theme.jqs.tertiary, lineHeight: 1.1 }}>
                                {time}
                            </Typography>
                        </Box>
                    </Box>
                </>
            ) : (
                <Typography sx={{ color: 'text.secondary', maxWidth: 320, mx: 'auto' }}>
                    Lütfen dükkan sahibinin dükkanı açmasını bekleyiniz.
                </Typography>
            )}
        </Box>
    )
}
