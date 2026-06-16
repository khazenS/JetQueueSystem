import { useState } from 'react';
import { Alert, AppBar, Box, IconButton, Snackbar, Toolbar, Typography, useTheme } from '@mui/material'
import PhoneIcon from '@mui/icons-material/Phone';
import NotificationsOutlinedIcon from '@mui/icons-material/NotificationsOutlined';

function Header(){
    const theme = useTheme()
    const raw = process.env.REACT_APP_PHONE_NUMBER
    const [snackOpen, setSnackOpen] = useState(false)

    const iconBtnSx = {
        color: theme.jqs.onSurfaceVariant,
        p: 1,
        transition: 'background-color .2s ease, transform .2s ease',
        '&:hover': { bgcolor: theme.jqs.surfaceLow },
        '&:active': { transform: 'scale(0.95)' },
    }

    return (
        <AppBar
            position="sticky"
            elevation={0}
            sx={{
                top: 0,
                bgcolor: theme.jqs.surface,
                mx: { xs: -2.5, sm: 0 },
                width: { xs: 'auto', sm: '100%' },
                animation: 'jqsFadeDown 0.5s ease both',
            }}
        >
            <Toolbar sx={{ minHeight: 64, justifyContent: 'space-between', px: 2.5 }}>
                <IconButton href={`tel:+90${raw}`} aria-label="Ara" sx={iconBtnSx}>
                    <PhoneIcon />
                </IconButton>

                <Typography
                    noWrap
                    sx={{
                        fontWeight: 700,
                        fontSize: '1.25rem',
                        lineHeight: '28px',
                        color: 'primary.main',
                        maxWidth: { xs: 200, sm: 'none' },
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                    }}
                >
                    {process.env.REACT_APP_SHOP_NAME}
                </Typography>

                <IconButton aria-label="Bildirimler" sx={iconBtnSx} onClick={() => setSnackOpen(true)}>
                    <NotificationsOutlinedIcon />
                </IconButton>
            </Toolbar>
            <Box sx={{ height: '1px', bgcolor: theme.jqs.surfaceVariant, opacity: 0.6 }} />

            <Snackbar
                open={snackOpen}
                autoHideDuration={2800}
                onClose={() => setSnackOpen(false)}
                anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
                sx={{ mt: 7 }}
            >
                <Alert
                    onClose={() => setSnackOpen(false)}
                    severity="info"
                    variant="filled"
                    icon={<NotificationsOutlinedIcon />}
                    sx={{ borderRadius: 2, fontWeight: 600, bgcolor: 'primary.main' }}
                >
                    Bildirimler yakında gelecek bir özellik!
                </Alert>
            </Snackbar>
        </AppBar>
    )
}
export default Header
