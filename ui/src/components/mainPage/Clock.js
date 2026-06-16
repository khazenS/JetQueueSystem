import React, { useState, useEffect } from "react";
import { Typography, Box, useTheme } from "@mui/material";
import AccessTimeRoundedIcon from '@mui/icons-material/AccessTimeRounded';
import { DateTime } from "luxon";

export default function Clock(){
    const theme = useTheme()
    const [now, setNow] = useState(DateTime.now().setLocale("tr"));

    useEffect(() => {
      const interval = setInterval(() => {
        setNow(DateTime.now().setLocale("tr"));
      }, 1000);

      return () => clearInterval(interval);
    }, []);

    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2.5 }}>
        <Box
          sx={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 1.25,
            bgcolor: '#fff',
            border: `1px solid ${theme.jqs.surfaceVariant}`,
            borderRadius: 2,
            px: 2.25,
            py: 1,
            boxShadow: '0 3px 12px rgba(27,94,32,0.07)',
            animation: 'jqsFadeUp 0.6s ease 0.15s both',
          }}
        >
          <AccessTimeRoundedIcon sx={{ fontSize: '1.15rem', color: 'secondary.main' }} />
          <Typography sx={{ fontWeight: 700, color: 'primary.dark', fontVariantNumeric: 'tabular-nums', lineHeight: 1, letterSpacing: '0.04em' }}>
            {now.toFormat("HH:mm:ss")}
          </Typography>
          <Box sx={{ width: '1px', height: 18, bgcolor: theme.jqs.surfaceVariant }} />
          <Typography sx={{ fontSize: '0.82rem', color: 'text.secondary', textTransform: 'capitalize', lineHeight: 1 }}>
            {now.toFormat("d LLLL, cccc")}
          </Typography>
        </Box>
      </Box>
    );
  };
