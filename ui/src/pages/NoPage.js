import { Box, Button, Typography, useTheme } from "@mui/material";
import HomeRoundedIcon from "@mui/icons-material/HomeRounded";
import SearchOffRoundedIcon from "@mui/icons-material/SearchOffRounded";

function NoPage() {
  const theme = useTheme();

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        px: 3,
        bgcolor: theme.jqs.surface,
      }}
    >
      <Box
        sx={{
          width: "100%",
          maxWidth: 420,
          bgcolor: theme.jqs.surfaceLowest,
          borderRadius: "20px",
          boxShadow: theme.jqs.cardShadow,
          border: `1px solid ${theme.jqs.surfaceVariant}`,
          px: { xs: 3, sm: 5 },
          py: 5,
          animation: "jqsPop 0.5s ease both",
        }}
      >
        <Box
          sx={{
            width: 88,
            height: 88,
            mx: "auto",
            mb: 2.5,
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            bgcolor: theme.jqs.secondaryContainer,
          }}
        >
          <SearchOffRoundedIcon sx={{ fontSize: "2.5rem", color: theme.jqs.onSecondaryContainer }} />
        </Box>

        <Typography
          sx={{
            fontSize: "4rem",
            fontWeight: 800,
            lineHeight: 1,
            color: "primary.main",
            letterSpacing: "-0.03em",
          }}
        >
          404
        </Typography>
        <Typography variant="h5" sx={{ mt: 1.5, color: "text.primary" }}>
          Sayfa Bulunamadı
        </Typography>
        <Typography sx={{ mt: 1, color: "text.secondary", maxWidth: 320, mx: "auto" }}>
          Aradığınız sayfa taşınmış veya hiç var olmamış olabilir.
        </Typography>

        <Button
          href="#/"
          variant="contained"
          color="primary"
          startIcon={<HomeRoundedIcon />}
          sx={{ mt: 4, px: 4 }}
        >
          Ana Sayfaya Dön
        </Button>
      </Box>
    </Box>
  );
}

export default NoPage;
