import {   Button, Grid,  Typography } from '@mui/material'
import LocalPhoneOutlinedIcon from '@mui/icons-material/LocalPhoneOutlined';

function formatPhoneNumber(value) {
    const digits = (value || '').replace(/\D/g, '');
    const match = digits.match(/^(\d{3})(\d{3})(\d{4})$/);
    if (match) {
      return `(${match[1]}) ${match[2]}-${match[3]}`;
    }
    return value;
  }


function Header(){
    // Phone number href
    const raw = process.env.REACT_APP_PHONE_NUMBER
    // Format the phone number for display
    const formattedPhoneNumber = formatPhoneNumber(raw)

    return (
        <Grid container spacing={2} sx={{marginBottom:3}}>
        <Grid item xs={3}  sx={{display:'flex',justifyContent:'center'}}>
            <img src={`/${process.env.REACT_APP_LOGO_NAME}`} alt={process.env.REACT_APP_LOGO_ALT_TEXT} height={60} width={60} />
        </Grid>
        <Grid item xs={9}  sx={{display:'flex',justifyContent:'center',alignItems:'center'}}>
            <Button href={`tel:+90${raw}`} variant='contained' size='medium' color='success'>
            <LocalPhoneOutlinedIcon fontSize="medium"></LocalPhoneOutlinedIcon>
            <Typography sx={{marginLeft:1,fontWeight:'bold'}}>Ara +90 {formattedPhoneNumber}</Typography>
            </Button>
        </Grid>
        </Grid>
    )
}
export default Header