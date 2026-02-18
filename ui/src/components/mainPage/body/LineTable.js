import {  Table, TableBody, TableCell, TableContainer, TableHead, TableRow , CircularProgress , Box, Typography, Button, Backdrop, Collapse, Fab} from "@mui/material";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { downMove, newUserToQue, removeUserFromQue, upMove } from "../../../redux/features/mainPageSlices/dailyBookingSlice";
import { socket } from "../../../helpers/socketio.js";
import { jwtDecode } from "jwt-decode";
import { decryptData } from "../../../helpers/cryptoProcess.js";
import ListIcon from '@mui/icons-material/List';
import PersonIcon from '@mui/icons-material/Person';
import HelpIcon from '@mui/icons-material/Help';
import VerifiedIcon from '@mui/icons-material/Verified';

export default function LineTable(){
    const dispatch = useDispatch()
    const dailyQue = useSelector( state => state.booking.dailyQueue )
    // queueToken
    const queueToken = useSelector( state => state.register.queueToken.token)
    // Decoded queue token
    const decodedQueueToken = queueToken ? jwtDecode(queueToken) : null

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

    if(dailyQue){
    return (
        <div style={{
          backgroundImage: `url("${process.env.REACT_APP_TRANSPARENT_LOGO}")`,
          backgroundSize: "contain", 
          backgroundPosition: "center",
          backgroundRepeat:'no-repeat', 
          height:'45vh'
        }}>
          { dailyQue.length !== 0  ? 
          <>
          <TableContainer sx={{marginTop:5}}>
                <Table>
                    <TableHead sx={{marginBottom:5}}>
                        <TableRow sx={{marginBottom:5}}>
                            <TableCell sx={{fontWeight:"bold",padding:0}}>
                            <Box sx={{display:'flex',justifyContent:'center',alignItems:'center'}}>
                            <ListIcon fontSize="small"/>
                            Sıra
                            </Box>
                            </TableCell>

                            <TableCell align="center" sx={{fontWeight:"bold",padding:0}}>
                            <Box sx={{display:'flex',justifyContent:"center",alignItems:'center'}}>
                              <PersonIcon fontSize="small" />
                              İsim
                            </Box>
                            </TableCell>

                            <TableCell align="center" sx={{fontWeight:"bold",padding:0}}>
                            <Box sx={{display:'flex',justifyContent:"center",alignItems:'center'}}>
                              <HelpIcon fontSize="small"/>
                              Kaç Kişi
                            </Box>
                            </TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {dailyQue.map((data) => (
                          <TableRow key={dailyQue.indexOf(data)} sx={{  border: 
                          queueToken && data.userBookingID === decodedQueueToken?.userBookingID ? '2px solid rgba(255,0,0,0.55)'
                          : 'none'
                          }}>
                            <TableCell >{dailyQue.indexOf(data) + 1}</TableCell>
                            <TableCell align="center">  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
                                {data.name}
                                {data.isVerified && (
                                <VerifiedIcon 
                                  sx={{ 
                                    fontSize: '1rem',
                                    color: 'primary.main'
                                  }}
                                />
                              )}
                              </Box>
                            </TableCell>
                            <TableCell align="center">{data.comingWith}</TableCell>
                          </TableRow>
                        ))
                        }
                    </TableBody>
                </Table>
            </TableContainer>
          </>
          :
          <></>
          }
        </div>
    )        
    }
    else{
        return (
            <Box
              sx={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                height: "50vh",
              }}
            >
              <CircularProgress />
            </Box>
          );    
    }

}