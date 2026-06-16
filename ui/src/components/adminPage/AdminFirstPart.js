import { Button, Chip, Typography, useTheme } from "@mui/material";
import { useDispatch, useSelector } from "react-redux";
import React, { useEffect, useState } from "react";
import {
  changeStatus,
  defineStatus,
  changeOrderFeature,
} from "../../redux/features/adminPageSlices/shopStatusSlice";
import Alert from "@mui/material/Alert";
import CircularProgress from "@mui/material/CircularProgress";
import Box from "@mui/material/Box";
import { useNavigate } from "react-router-dom";
import Clock from "../mainPage/Clock.js";
import StorefrontRoundedIcon from "@mui/icons-material/StorefrontRounded";
import PlaylistAddCheckRoundedIcon from "@mui/icons-material/PlaylistAddCheckRounded";
import PauseCircleOutlineRoundedIcon from "@mui/icons-material/PauseCircleOutlineRounded";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";

export default function AdminFirstPart() {
  const theme = useTheme();
  const dispatch = useDispatch();
  const shopStatusState = useSelector((state) => state.shopStatus);
  const navigate = useNavigate();
  // These for confirmation before change shop status
  const [openConfirmModal, setOpenConfirmModal] = useState(false);
  const [pendingStatus, setPendingStatus] = useState(null);

  // defining the first value of shopStatusState.status
  useEffect(() => {
    dispatch(defineStatus());
  }, [dispatch]);

  useEffect(() => {
    if (shopStatusState.expiredError === true) {
      navigate("/adminLogin");
    }
  }, [shopStatusState.expiredError, navigate]);

  // Confirmation Functions
  const handleOpenConfirmModal = (status) => {
    setPendingStatus(status);
    setOpenConfirmModal(true);
  };

  const handleCloseConfirmModal = () => {
    setOpenConfirmModal(false);
    setPendingStatus(null);
  };
  //Button Click Fucntion
  const changeProcessFunc = (status) => {
    dispatch(changeStatus(status));
    setOpenConfirmModal(false);
  };

  const cardSx = {
    bgcolor: theme.jqs.surfaceLowest,
    borderRadius: "16px",
    boxShadow: theme.jqs.cardShadow,
    border: `1px solid ${theme.jqs.surfaceVariant}`,
  };

  if (shopStatusState.defineRequest.isLoading === true) {
    return (
      <Box sx={{ ...cardSx, display: "flex", justifyContent: "center", alignItems: "center", py: 6 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (shopStatusState.defineRequest.error === true) {
    return (
      <Alert variant="filled" severity="error" sx={{ borderRadius: 3, fontWeight: 600 }}>
        Yüklenirken bir hata oluştu lütfen sayfayı yenileyiniz.
      </Alert>
    );
  }

  if (shopStatusState.status !== null) {
    const isOpen = shopStatusState.status === true;
    const orderFeature = shopStatusState.orderFeature;
    return (
      <Box sx={{ ...cardSx, p: { xs: 2.5, sm: 3 }, animation: "jqsFadeUp 0.5s ease both" }}>
        {/* Status indicator */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <Box
            sx={{
              width: 56,
              height: 56,
              flexShrink: 0,
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              bgcolor: isOpen ? theme.jqs.secondaryContainer : theme.jqs.surfaceHigh,
            }}
          >
            <StorefrontRoundedIcon
              sx={{ fontSize: "1.8rem", color: isOpen ? theme.jqs.statusSuccess : "text.secondary" }}
            />
          </Box>
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="overline" sx={{ color: "text.secondary", display: "block", lineHeight: 1.4 }}>
              Dükkan Durumu
            </Typography>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Box
                sx={{
                  width: 10,
                  height: 10,
                  borderRadius: "50%",
                  bgcolor: isOpen ? theme.jqs.statusSuccess : theme.palette.error.main,
                  boxShadow: isOpen ? `0 0 0 4px ${theme.jqs.statusSuccess}33` : "none",
                }}
              />
              <Typography variant="h5" sx={{ color: isOpen ? "text.primary" : "text.secondary" }}>
                {isOpen ? "AÇIK" : "KAPALI"}
              </Typography>
            </Box>
            {isOpen && (
              <Chip
                size="small"
                label={orderFeature === true ? "Sıra alımı açık" : "Sıra alımı durduruldu"}
                sx={{
                  mt: 0.75,
                  fontWeight: 600,
                  bgcolor: orderFeature === true ? theme.jqs.secondaryContainer : "rgba(255,160,0,0.18)",
                  color: orderFeature === true ? theme.jqs.onSecondaryContainer : "#7a4f00",
                }}
              />
            )}
          </Box>
        </Box>

        {/* Open/Close action + order toggle (side by side) */}
        <Box sx={{ display: "flex", gap: 1.25, mt: 2.5 }}>
          <Button
            startIcon={<StorefrontRoundedIcon />}
            variant="contained"
            color={isOpen ? "error" : "success"}
            size="large"
            sx={{ fontWeight: 700, flex: 1 }}
            onClick={() => {
              handleOpenConfirmModal(shopStatusState.status);
            }}
          >
            Dükkanı {isOpen ? "kapat" : "aç"}
          </Button>
          {isOpen && (
            <Button
              startIcon={orderFeature === true ? <PauseCircleOutlineRoundedIcon /> : <PlaylistAddCheckRoundedIcon />}
              variant={orderFeature === true ? "outlined" : "contained"}
              color={orderFeature === true ? "error" : "success"}
              size="large"
              sx={{ fontWeight: 700, flex: 1, ...(orderFeature === true && { borderWidth: 1.5, "&:hover": { borderWidth: 1.5 } }) }}
              onClick={() => { dispatch(changeOrderFeature(orderFeature)); }}
            >
              Sıra almayı {orderFeature === true ? "kapat" : "aç"}
            </Button>
          )}
        </Box>

        <Clock />

        <Dialog
          open={openConfirmModal}
          onClose={handleCloseConfirmModal}
          aria-labelledby="confirm-dialog-title"
          aria-describedby="confirm-dialog-description"
          PaperProps={{ sx: { borderRadius: 3, p: 1 } }}
        >
          <DialogTitle id="confirm-dialog-title" sx={{ fontWeight: 700 }}>
            Onay Gerekli
          </DialogTitle>
          <DialogContent>
            <DialogContentText id="confirm-dialog-description">
              Dükkanı {isOpen ? "kapatmak" : "açmak"} istediğinizden emin misiniz?
            </DialogContentText>
          </DialogContent>
          <DialogActions sx={{ justifyContent: "space-between", px: 3, pb: 2 }}>
            <Button onClick={handleCloseConfirmModal} color="inherit" variant="text" sx={{ fontWeight: 600 }}>
              İptal
            </Button>
            <Button
              onClick={() => changeProcessFunc(pendingStatus)}
              color={isOpen ? "error" : "success"}
              variant="contained"
              sx={{ fontWeight: 700 }}
              autoFocus
            >
              Onayla
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    );
  }

  return null;
}
