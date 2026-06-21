import React, { useEffect, useRef, useState } from 'react';
import {
  Button,
  Dialog,
  Box,
  IconButton,
  Typography,
  Checkbox,
  FormControlLabel,
  TextField,
  InputAdornment,
  Slide,
  CircularProgress,
  useMediaQuery,
  useTheme
} from "@mui/material";
import CloseIcon from '@mui/icons-material/Close';
import PersonIcon from '@mui/icons-material/Person';
import PhoneIcon from '@mui/icons-material/Phone';
import PersonAddAlt1RoundedIcon from '@mui/icons-material/PersonAddAlt1Rounded';
import DialpadRoundedIcon from '@mui/icons-material/DialpadRounded';
import RefreshRoundedIcon from '@mui/icons-material/RefreshRounded';
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import { resetSendStatus, send_sms, updateExpiresTime, verify_sms } from '../../redux/features/mainPageSlices/verificationUserSlice';
import { useDispatch, useSelector } from 'react-redux';
import FingerprintJS from '@fingerprintjs/fingerprintjs';

const DialogTransition = React.forwardRef(function DialogTransition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});

export default function UserRegister() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const sendErrorMessage = useSelector((state) => state.verification.send.errorMessage);
  const sendStatus = useSelector((state) => state.verification.send.status);
  const sendIsLoading = useSelector((state) => state.verification.send.isLoading);
  const sendToken = useSelector((state) => state.verification.send.token);
  const expireTime = useSelector((state) => state.verification.send.expireTime);
  const dispatch = useDispatch();
  const [openRegisterModal, setOpenRegisterModal] = useState(false);

  const [isCheckboxChecked, setIsCheckboxChecked] = useState(false);
  const [showError, setShowError] = useState(false);

  const [fullName, setFullName] = useState('');
  const [nameError, setNameError] = useState(false);
  const [nameErrorMessage, setNameErrorMessage] = useState('');

  const [phoneNumber, setPhoneNumber] = useState('');
  const [phoneError, setPhoneError] = useState(false);
  const [phoneErrorMessage, setPhoneErrorMessage] = useState('');

  const [smsCode , setSmsCode] = useState('');
  const [codeError, setCodeError] = useState(false);
  const [codeErrorMessage, setCodeErrorMessage] = useState('');

  const [fingerprint, setFingerprint] = useState(null);
  const [fpError, setfpError] = useState(false);

  const [rpeError,setRpeError] = useState(false);

  const [remainingTime, setRemainingTime] = useState(expireTime)
  // This is for a bug that status doesnt change when verification is successful
  const [verifyStatus,setVerifyStatus] = useState(null)
  const [verifyMessage,setVerifyMessage] = useState('')

  const otpRefs = useRef([]);

  // Load FingerprintJS and get the visitor ID
  useEffect( () => {
    const loadFingerprint = async () => {
      try {
        const fp = await FingerprintJS.load();
        const result = await fp.get();
        setFingerprint(result.visitorId);
      } catch (error) {
        // If fingerprinting fails the user can never send an SMS; surface it.
        console.error('[UserRegister] FingerprintJS yüklenemedi:', error);
        setfpError(true);
      }
    };

    loadFingerprint();
  },[])

  // Load recaptcha script
  useEffect(() => {
    const script = document.createElement("script");
    script.src = `https://www.google.com/recaptcha/api.js?render=${process.env.REACT_APP_RECAPTCHA_SITE_KEY}`;
    script.async = true;
    document.body.appendChild(script);
  }, []);

  // Update remainingTime when it changes
  useEffect(() => {
    if (!expireTime || expireTime <= 0 ) {
      return;
    }
    setRemainingTime(expireTime);
    const interval = setInterval(() => {
      setRemainingTime(prev => {
        const newTime = prev - 1000;
        if (newTime <= 0) {
          clearInterval(interval);
          return 0;
        }
        return newTime;
      });
    }, 1000);

    // Cleanup function
    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [expireTime]);

  const formatTime = (ms) => {
    if (ms <= 0) return "00:00";
    const totalSeconds = Math.ceil(ms / 1000);
    const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, "0");
    const seconds = String(totalSeconds % 60).padStart(2, "0");
    return `${minutes}:${seconds}`;
  };

  const checkeInputField = () => {
    let isError = false;
    if (!fullName || fullName.trim() === '') {
      setNameError(true);
      setNameErrorMessage('Lütfen adınızı giriniz.');
      isError = true;
    }
    if(fullName.trim().length < 3 || fullName.trim().length > 20) {
      setNameError(true);
      setNameErrorMessage('Adınız 3 ile 20 karakter arasında olmalıdır.');
      isError = true;
    }
    if (!phoneNumber || phoneNumber.trim() === '') {
      setPhoneError(true);
      setPhoneErrorMessage('Lütfen telefon numaranızı giriniz.');
      isError = true;
    }
    if(phoneNumber.length != 12) {
      setPhoneError(true);
      setPhoneErrorMessage('Lütfen geçerli bir telefon numarası giriniz.');
      isError = true;
    }

    return isError;
  }

  const handlePhoneNumberChange = (event) => {
    const input = event.target.value;
    // Remove the prefix, spaces, and any non-digit characters
    let digitsOnly = input.replace(/\+90\s?/, '').replace(/\D/g, '');
    // Limit to 10 digits
    digitsOnly = digitsOnly.slice(0, 10);

    // Format the phone number with spaces (XXX XXX XXXX)
    let formatted = '';
    if (digitsOnly.length > 0) {
      formatted = digitsOnly.slice(0, 3);
      if (digitsOnly.length > 3) {
        formatted += ' ' + digitsOnly.slice(3, 6);
      }
      if (digitsOnly.length > 6) {
        formatted += ' ' + digitsOnly.slice(6);
      }
    }

    // Update the state with the prefix and formatted number
    setPhoneNumber(formatted);
    // Reset errors
    setPhoneError(false);
    setPhoneErrorMessage('');
  }

  const handleSendSMS = async () => {
    if (!isCheckboxChecked) {
      setShowError(true);
      return;
    }
    if(checkeInputField() == true) return;

    if (!fingerprint) {
      setfpError(true);
      return;
    }

    let reCAPTCHAToken;
    try{
      reCAPTCHAToken = await window.grecaptcha.execute(process.env.REACT_APP_RECAPTCHA_SITE_KEY, { action: 'send_sms' });
    }catch(error) {
      console.error('[UserRegister] reCAPTCHA (send_sms) cannot work:', error, 'siteKey set?', !!process.env.REACT_APP_RECAPTCHA_SITE_KEY, 'grecaptcha?', typeof window.grecaptcha);
      setRpeError(true);
      return;
    }

    dispatch(send_sms({name:fullName, phoneNumber: phoneNumber, reCAPTCHAToken:reCAPTCHAToken , fingerprint: fingerprint}))
  };

  const handleVerifySMS = async () => {
    if(!smsCode || smsCode.trim() === '' || smsCode.length < 4) {
      setCodeError(true);
      setCodeErrorMessage('**Lütfen geçerli bir kod giriniz.');
      return;
    }

    if(remainingTime <= 0) {
      setCodeError(true);
      setCodeErrorMessage('* Kodun süresi dolmuştur. Lütfen tekrar sms isteyiniz.');
      return;
    }

    let reCAPTCHAToken;
    try{
      reCAPTCHAToken = await window.grecaptcha.execute(process.env.REACT_APP_RECAPTCHA_SITE_KEY, { action: 'send_sms' });
    }catch(error) {
      console.error('[UserRegister] reCAPTCHA (verify_sms) can not work:', error, 'siteKey set?', !!process.env.REACT_APP_RECAPTCHA_SITE_KEY, 'grecaptcha?', typeof window.grecaptcha);
      setRpeError(true);
      return;
    }

    try{
    const result = await dispatch(verify_sms({token: sendToken, code: smsCode, reCAPTCHAToken: reCAPTCHAToken})).unwrap()
    if(result.status) resetForm()
    setVerifyStatus(result.status);
    setVerifyMessage(result.message);
  }catch(error){
    console.error('Error verifying SMS:', error);
    setVerifyStatus(false);
    }
  }

  const handleCheckboxChange = (event) => {
    setIsCheckboxChecked(event.target.checked);
    if (event.target.checked) {
      setShowError(false);
    }
  };

  // When verification successful, close the modal and reset the form
  const resetForm = () => {
    setOpenRegisterModal(false);
    dispatch(resetSendStatus())
    setFullName('');
    setPhoneNumber('');
    setSmsCode('');
    setIsCheckboxChecked(false);
    setShowError(false);
    setNameError(false);
    setPhoneError(false);
    setCodeError(false);
    setfpError(false);
    setRpeError(false);
    dispatch(updateExpiresTime(0))
  }

  // ── OTP box handling (keeps the single `smsCode` string canonical) ──────
  const handleOtpChange = (i, raw) => {
    const digits = raw.replace(/[^0-9]/g, '');
    const chars = Array.from({ length: 4 }, (_, k) => smsCode[k] || '');
    if (digits === '') {
      chars[i] = '';
      setSmsCode(chars.join(''));
      return;
    }
    const d = digits.slice(-1);
    chars[i] = d;
    setSmsCode(chars.join('').slice(0, 4));
    setCodeError(false);
    setCodeErrorMessage('');
    if (i < 3) otpRefs.current[i + 1]?.focus();
  };

  const handleOtpKeyDown = (i, e) => {
    if (e.key === 'Backspace' && !smsCode[i] && i > 0) {
      otpRefs.current[i - 1]?.focus();
    }
  };

  const maskedPhone = (() => {
    const d = phoneNumber.replace(/\D/g, '');
    if (d.length < 3) return '';
    return `+90 ${d[0]}** *** ** ${d.slice(-2)}`;
  })();

  const closeModal = () => setOpenRegisterModal(false);

  const showAnyError = fpError || rpeError || sendErrorMessage || verifyStatus === false;
  const errorText = verifyMessage
    || sendErrorMessage
    || (rpeError
      ? "Güvenlik doğrulaması (reCAPTCHA) yapılamadı. Lütfen sayfayı yenileyip tekrar deneyin."
      : "Cihaz bilgileri alınamadı. Lütfen izinlerinizi kontrol edin ve sayfayı yenileyin.");

  return (
      <Box>
        {/* Register / verify trigger (blue outline, matches "Kayıt Ol") */}
        <Button
          variant="outlined"
          fullWidth
          color="info"
          startIcon={<PersonAddAlt1RoundedIcon />}
          sx={{ borderWidth: 2, '&:hover': { borderWidth: 2 } }}
          onClick={() => setOpenRegisterModal(true)}
        >
          Kayıt Ol
        </Button>
        <Typography sx={{ textAlign: 'center', fontSize: '0.8rem', color: 'text.secondary', mt: 1.25 }}>
          Doğrulanmış kullanıcılar sıraya tek dokunuşla girer.
        </Typography>

        <Dialog
          open={openRegisterModal}
          TransitionComponent={DialogTransition}
          onClose={closeModal}
          aria-labelledby="register-dialog-title"
          slotProps={{ backdrop: { sx: { backdropFilter: 'blur(6px)', backgroundColor: 'rgba(26,28,28,0.4)' } } }}
          PaperProps={{
            sx: isMobile
              ? {
                  position: 'fixed', bottom: 0, left: 0, right: 0, m: 0,
                  width: '100%', maxWidth: '100%',
                  borderRadius: 0, borderTopLeftRadius: 24, borderTopRightRadius: 24,
                  maxHeight: '94vh',
                }
              : { borderRadius: '16px', width: '100%', maxWidth: 448 },
          }}
        >
          {/* Close */}
          <IconButton
            aria-label="close"
            onClick={closeModal}
            sx={{ position: 'absolute', top: 12, right: 12, color: 'text.secondary', zIndex: 2 }}
          >
            <CloseIcon />
          </IconButton>

          {sendIsLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 240 }}>
              <CircularProgress size={40} thickness={4} />
            </Box>
          ) : sendStatus ? (
            /* ─── OTP verification step (mirrors verify_modal) ─── */
            <Box sx={{ px: 2.5, pt: 5, pb: 4 }}>
              <Box sx={{ textAlign: 'center' }}>
                <Box sx={{ width: 48, height: 48, borderRadius: '50%', mx: 'auto', mb: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: theme.jqs.secondaryContainer }}>
                  <DialpadRoundedIcon sx={{ color: theme.jqs.onSecondaryContainer }} />
                </Box>
                <Typography id="register-dialog-title" variant="h5" sx={{ color: 'primary.main', fontWeight: 700, mb: 1 }}>
                  Onay Kodu
                </Typography>
                <Typography sx={{ color: 'text.secondary', px: 2 }}>
                  Telefonunuza gönderdiğimiz 4 haneli doğrulama kodunu girin.
                </Typography>
                {maskedPhone && (
                  <Typography variant="overline" sx={{ color: 'primary.main', fontWeight: 600, textTransform: 'none', display: 'block', mt: 0.5 }}>
                    {maskedPhone}
                  </Typography>
                )}
              </Box>

              {/* OTP inputs */}
              <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1.5, mt: 3 }}>
                {[0, 1, 2, 3].map((i) => (
                  <TextField
                    key={i}
                    inputRef={(el) => (otpRefs.current[i] = el)}
                    value={smsCode[i] || ''}
                    onChange={(e) => handleOtpChange(i, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(i, e)}
                    error={codeError}
                    inputProps={{ inputMode: 'numeric', maxLength: 1, style: { textAlign: 'center', fontSize: '1.5rem', fontWeight: 600, padding: 0 } }}
                    sx={{ width: 56, '& .MuiOutlinedInput-root': { height: 64, borderRadius: '8px' } }}
                  />
                ))}
              </Box>
              {codeError && (
                <Typography sx={{ textAlign: 'center', color: 'error.main', fontSize: '0.8rem', mt: 1 }}>
                  {codeErrorMessage}
                </Typography>
              )}

              {/* Resend + countdown */}
              <Box sx={{ textAlign: 'center', mt: 2.5 }}>
                <Button
                  onClick={handleSendSMS}
                  startIcon={<RefreshRoundedIcon />}
                  sx={{ color: 'secondary.main', textTransform: 'none', fontWeight: 600, minHeight: 0, py: 0.5 }}
                >
                  Kodu Tekrar Gönder
                </Button>
                <Typography sx={{ color: 'text.secondary', opacity: 0.75, fontSize: '0.875rem' }}>
                  ({formatTime(remainingTime)})
                </Typography>
              </Box>

              {showAnyError && <ErrorLine text={errorText} />}

              <Button
                fullWidth
                variant="contained"
                color="primary"
                onClick={handleVerifySMS}
                endIcon={<ArrowForwardRoundedIcon />}
                sx={{ mt: 3, py: 1.5 }}
              >
                Onayla
              </Button>
            </Box>
          ) : (
            /* ─── Registration entry step ─── */
            <Box sx={{ px: 2.5, pt: 5, pb: 4 }}>
              <Box sx={{ textAlign: 'center', mb: 1 }}>
                <Box sx={{ width: 48, height: 48, borderRadius: '50%', mx: 'auto', mb: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: theme.jqs.secondaryContainer }}>
                  <PersonAddAlt1RoundedIcon sx={{ color: theme.jqs.onSecondaryContainer }} />
                </Box>
                <Typography variant="h5" sx={{ color: 'primary.main', fontWeight: 700, mb: 1 }}>
                  Kayıt Ol
                </Typography>
                <Typography sx={{ color: 'text.secondary', px: 1 }}>
                  Bilgileriniz gizli tutulur ve yalnızca sizinle iletişim için kullanılır.
                </Typography>
              </Box>

              <Box sx={{ mt: 3 }}>
                <TextField
                  variant="outlined"
                  fullWidth
                  value={fullName}
                  onChange={(e) => { setFullName(e.target.value); setNameError(false); setNameErrorMessage(''); }}
                  error={nameError}
                  helperText={nameError ? nameErrorMessage : ''}
                  placeholder="Adınızı Giriniz"
                  InputProps={{ startAdornment: (<InputAdornment position="start"><PersonIcon sx={{ color: 'text.secondary' }} /></InputAdornment>) }}
                  sx={{ mb: 2.5 }}
                />
                <TextField
                  variant="outlined"
                  fullWidth
                  value={phoneNumber}
                  onChange={handlePhoneNumberChange}
                  placeholder="Telefon Numaranız"
                  error={phoneError}
                  helperText={phoneError ? phoneErrorMessage : ''}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <PhoneIcon sx={{ color: 'text.secondary', mr: 0.5 }} />
                        <Typography sx={{ color: 'text.secondary' }}>+90</Typography>
                      </InputAdornment>
                    ),
                    inputProps: { maxLength: 12, inputMode: 'numeric' },
                  }}
                />
              </Box>

              <ConsentRow isChecked={isCheckboxChecked} showError={showError} onCheckboxChange={handleCheckboxChange} />

              {showAnyError && <ErrorLine text={errorText} />}

              <Button
                fullWidth
                variant="contained"
                color="primary"
                onClick={handleSendSMS}
                disabled={fpError || rpeError}
                sx={{ mt: 1, py: 1.5 }}
              >
                Kodu Yolla
              </Button>
            </Box>
          )}
        </Dialog>
      </Box>
  );
}


// Consent checkbox row
function ConsentRow({ isChecked, showError, onCheckboxChange }) {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2.5 }}>
      <FormControlLabel
        sx={{
          m: 0, px: 1, py: 0.5, borderRadius: 2,
          backgroundColor: showError ? 'rgba(186, 26, 26, 0.06)' : 'transparent',
          border: showError ? '1px solid rgba(186, 26, 26, 0.3)' : '1px solid transparent',
          transition: 'all 0.3s ease',
          '& .MuiFormControlLabel-label': { marginLeft: '4px' },
        }}
        control={
          <Checkbox
            checked={isChecked}
            onChange={onCheckboxChange}
            sx={{ color: showError ? 'error.main' : undefined, '&.Mui-checked': { color: showError ? 'error.main' : 'primary.main' } }}
          />
        }
        label={
          <Typography color={showError ? 'error' : 'inherit'} sx={{ fontWeight: 600, fontSize: '0.9rem' }}>
            Şartları onaylıyorum
          </Typography>
        }
      />
    </Box>
  );
}

// Inline error line
function ErrorLine({ text }) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5, mt: 2, color: 'error.main' }}>
      <ErrorOutlineIcon sx={{ fontSize: '1.3rem' }} />
      <Typography variant="caption" sx={{ fontWeight: 600 }}>{text}</Typography>
    </Box>
  );
}
