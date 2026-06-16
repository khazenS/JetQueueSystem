import { createTheme } from "@mui/material/styles";

// ── JetQueueSystem — "Vibrant Grooming" Theme ─────────────────────────────
// Mirrors the reference design system: Inter type, forest-green primary,
// lime secondary, blue tertiary, crisp white cards on a soft grey surface.

const PRIMARY = "#0d631b"; // forest green (buttons, brand, headers)
const PRIMARY_CONTAINER = "#2e7d32"; // medium green (numbered badges)
const SURFACE_TINT = "#1b6d24"; // hover for primary
const SECONDARY = "#3e6a00"; // olive-green accent text
const SECONDARY_CONTAINER = "#b9f474"; // lime (icon circles, progress)
const ON_SECONDARY_CONTAINER = "#437000";
const TERTIARY = "#00569f"; // blue accent
const TERTIARY_CONTAINER = "#006eca"; // blue icon circle
const SURFACE = "#f9f9f9"; // page background
const SURFACE_LOWEST = "#ffffff"; // cards
const SURFACE_LOW = "#f3f3f3";
const SURFACE_CONTAINER = "#eeeeee";
const SURFACE_HIGH = "#e8e8e8";
const SURFACE_VARIANT = "#e2e2e2";
const ON_SURFACE = "#1a1c1c";
const ON_SURFACE_VARIANT = "#40493d";
const OUTLINE_VARIANT = "#bfcaba";
const ERROR = "#ba1a1a";
const STATUS_SUCCESS = "#4CAF50";
const STATUS_WARNING = "#FFA000";

const CARD_SHADOW = "0px 4px 20px rgba(0,0,0,0.05)";

const theme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: PRIMARY,
      light: PRIMARY_CONTAINER,
      dark: SURFACE_TINT,
      contrastText: "#ffffff",
    },
    secondary: {
      main: SECONDARY,
      light: SECONDARY_CONTAINER,
      dark: ON_SECONDARY_CONTAINER,
      contrastText: "#ffffff",
    },
    info: {
      main: TERTIARY,
      light: TERTIARY_CONTAINER,
      contrastText: "#ffffff",
    },
    success: {
      main: PRIMARY,
      light: STATUS_SUCCESS,
      dark: SURFACE_TINT,
      contrastText: "#ffffff",
    },
    warning: {
      main: STATUS_WARNING,
      contrastText: "#ffffff",
    },
    error: {
      main: ERROR,
      contrastText: "#ffffff",
    },
    background: {
      default: SURFACE,
      paper: SURFACE_LOWEST,
    },
    text: {
      primary: ON_SURFACE,
      secondary: ON_SURFACE_VARIANT,
    },
    divider: SURFACE_VARIANT,
  },
  shape: {
    borderRadius: 8,
  },
  typography: {
    fontFamily: '"Inter", system-ui, -apple-system, sans-serif',
    h3: { fontWeight: 700, fontSize: "2rem", lineHeight: "40px", letterSpacing: "-0.02em" },
    h4: { fontWeight: 700, fontSize: "2rem", lineHeight: "40px", letterSpacing: "-0.02em" },
    h5: { fontWeight: 600, fontSize: "1.5rem", lineHeight: "32px", letterSpacing: "-0.01em" },
    h6: { fontWeight: 600, fontSize: "1.25rem", lineHeight: "28px" },
    subtitle2: { fontWeight: 600, fontSize: "0.875rem", letterSpacing: "0.01em" },
    body1: { fontSize: "1rem", lineHeight: "24px" },
    body2: { fontSize: "0.875rem", lineHeight: "20px" },
    button: { fontWeight: 600, fontSize: "0.875rem", letterSpacing: "0.01em" },
    overline: { fontWeight: 500, fontSize: "0.75rem", lineHeight: "16px", letterSpacing: "0.05em" },
  },
  // Custom tokens reused across components.
  jqs: {
    primary: PRIMARY,
    primaryContainer: PRIMARY_CONTAINER,
    surfaceTint: SURFACE_TINT,
    secondary: SECONDARY,
    secondaryContainer: SECONDARY_CONTAINER,
    onSecondaryContainer: ON_SECONDARY_CONTAINER,
    tertiary: TERTIARY,
    tertiaryContainer: TERTIARY_CONTAINER,
    surface: SURFACE,
    surfaceLowest: SURFACE_LOWEST,
    surfaceLow: SURFACE_LOW,
    surfaceContainer: SURFACE_CONTAINER,
    surfaceHigh: SURFACE_HIGH,
    surfaceVariant: SURFACE_VARIANT,
    onSurface: ON_SURFACE,
    onSurfaceVariant: ON_SURFACE_VARIANT,
    outlineVariant: OUTLINE_VARIANT,
    statusSuccess: STATUS_SUCCESS,
    statusWarning: STATUS_WARNING,
    cardShadow: CARD_SHADOW,
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        "@keyframes jqsFadeUp": {
          from: { opacity: 0, transform: "translateY(16px)" },
          to: { opacity: 1, transform: "translateY(0)" },
        },
        "@keyframes jqsFadeDown": {
          from: { opacity: 0, transform: "translateY(-14px)" },
          to: { opacity: 1, transform: "translateY(0)" },
        },
        "@keyframes jqsPop": {
          "0%": { opacity: 0, transform: "scale(0.95)" },
          "60%": { transform: "scale(1.02)" },
          "100%": { opacity: 1, transform: "scale(1)" },
        },
        "@keyframes jqsFloat": {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-6px)" },
        },
        "@keyframes jqsPulseGlow": {
          "0%, 100%": { boxShadow: "0 6px 18px rgba(13,99,27,0.25)" },
          "50%": { boxShadow: "0 8px 26px rgba(141,195,74,0.55)" },
        },
        body: {
          backgroundColor: SURFACE,
        },
      },
    },
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: {
          borderRadius: 8,
          textTransform: "none",
          fontWeight: 600,
          paddingTop: 12,
          paddingBottom: 12,
          minHeight: 48,
          transition: "transform .15s ease, box-shadow .2s ease, background-color .2s ease",
          "&:active": { transform: "scale(0.97)" },
        },
        containedPrimary: {
          boxShadow: "0 6px 18px rgba(13,99,27,0.22)",
          "&:hover": { backgroundColor: SURFACE_TINT, boxShadow: "0 8px 24px rgba(13,99,27,0.3)" },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        rounded: { borderRadius: 12 },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: { borderRadius: 8, backgroundColor: "#ffffff" },
      },
    },
    MuiAccordion: {
      styleOverrides: {
        root: { borderRadius: 12, "&:before": { display: "none" } },
      },
    },
    MuiToggleButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          textTransform: "none",
          fontWeight: 600,
          borderColor: OUTLINE_VARIANT,
          color: ON_SURFACE_VARIANT,
          transition: "all .15s ease",
          "&.Mui-selected": {
            backgroundColor: PRIMARY,
            color: "#ffffff",
            "&:hover": { backgroundColor: SURFACE_TINT },
          },
        },
      },
    },
  },
});

export default theme;
