import { useEffect } from "react";
import AdminFirstPart from "../components/adminPage/AdminFirstPart.js";
import { useDispatch, useSelector } from 'react-redux';
import { controlAdminAccessToken } from "../redux/features/adminPageSlices/adminLoginSlice.js";
import { useNavigate } from 'react-router-dom';
import CircularProgress from '@mui/material/CircularProgress';
import Box from '@mui/material/Box';
import { AppBar, Button, Container, Toolbar, Typography, useTheme } from "@mui/material";
import LogoutRoundedIcon from '@mui/icons-material/LogoutRounded';
import AdminQueTable from "../components/adminPage/AdminQueTable.js";
import FastOperations from "../components/adminPage/FastOperations.js";
import ShopSettings from "../components/adminPage/ShopSettings.js";
import ShopStats from "../components/adminPage/ShopStats.js";
import { updateStatus } from "../redux/features/adminPageSlices/shopStatusSlice.js";
import { socket } from "../helpers/socketio.js";
import Notification from "../components/adminPage/Notification.js"

function AdminPage() {
    const theme = useTheme();
    const dispatch = useDispatch();
    const tokenError = useSelector(state => state.adminLogin.expiredError);
    const isLoading = useSelector(state => state.adminLogin.isLoading);
    const navigate = useNavigate();

    // Token control process
    useEffect(() => {
        dispatch(controlAdminAccessToken());
    }, [dispatch]);

    useEffect(() => {
        if (tokenError === true) {
            navigate('/adminLogin');
        }
    }, [tokenError, navigate]);

    // socket for oto opening
    useEffect(()=>{
        socket.on('oto-status-change',(datas) => {
          dispatch(updateStatus(datas.status))
        })

        return () => {
          socket.off('oto-status-change')
        }
      },[])

    const handleLogout = () => {
        localStorage.removeItem("adminAccessToken");
        navigate("/adminLogin");
    };

    if (isLoading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box sx={{ minHeight: '100vh', bgcolor: theme.jqs.surface, pb: 6 }}>
            <Notification />

            {/* Top app bar */}
            <AppBar
                position="sticky"
                elevation={0}
                sx={{
                    bgcolor: theme.jqs.surfaceLowest,
                    color: 'text.primary',
                    borderBottom: `1px solid ${theme.jqs.surfaceVariant}`,
                }}
            >
                <Container maxWidth="md" disableGutters>
                    <Toolbar sx={{ gap: 1.5, px: { xs: 2, sm: 2 } }}>
                        <Box
                            sx={{
                                width: 42,
                                height: 42,
                                borderRadius: '50%',
                                bgcolor: '#fff',
                                border: `1px solid ${theme.jqs.surfaceVariant}`,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                overflow: 'hidden',
                                flexShrink: 0,
                            }}
                        >
                            <img
                                src={`/${process.env.REACT_APP_LOGO_NAME}`}
                                alt={process.env.REACT_APP_LOGO_ALT_TEXT}
                                style={{ width: '78%', height: '78%', objectFit: 'contain' }}
                            />
                        </Box>
                        <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                            <Typography sx={{ fontWeight: 700, lineHeight: 1.2, color: 'primary.main', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {process.env.REACT_APP_SHOP_NAME}
                            </Typography>
                            <Typography variant="overline" sx={{ color: 'text.secondary', lineHeight: 1.2, textTransform: 'none' }}>
                                Yönetim Paneli
                            </Typography>
                        </Box>
                        <Button
                            onClick={handleLogout}
                            color="error"
                            variant="outlined"
                            startIcon={<LogoutRoundedIcon />}
                            sx={{ minHeight: 40, py: 0.75, borderWidth: 1.5, '&:hover': { borderWidth: 1.5 }, '& .MuiButton-startIcon': { mr: { xs: 0, sm: 1 } }, '& .jqs-logout-label': { display: { xs: 'none', sm: 'inline' } } }}
                        >
                            <span className="jqs-logout-label">Çıkış Yap</span>
                        </Button>
                    </Toolbar>
                </Container>
            </AppBar>

            {/* Sections */}
            <Container maxWidth="md" sx={{ mt: 3, display: 'flex', flexDirection: 'column', gap: 3 }}>
                <AdminFirstPart />
                <AdminQueTable />
                <FastOperations />
                <ShopSettings />
                <ShopStats />
            </Container>
        </Box>
    );
}

export default AdminPage;
