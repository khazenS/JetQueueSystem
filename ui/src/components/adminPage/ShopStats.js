import { Alert, Box, Collapse, IconButton, Typography, useTheme } from "@mui/material";
import { useEffect, useState } from "react";
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import InsightsRoundedIcon from '@mui/icons-material/InsightsRounded';
import { useDispatch, useSelector } from "react-redux";
import {
    getDailyStats,
  getMonthlyStats,
  getWeeklyStats,
  resetDaily,
} from "../../redux/features/adminPageSlices/shopStatsSlice";
import { socket } from "../../helpers/socketio";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, CartesianGrid } from "recharts";

export default function ShopStats() {
  const theme = useTheme();
  const dispatch = useDispatch();

  const dailyStatsValue = useSelector((state) => state.shopStats.dailyStats);
  const weeklyStatsValue = useSelector((state) => state.shopStats.weeklyStats);
  const monthlyStatsValue = useSelector((state) => state.shopStats.monthlyStats);

  const [openDailyStats,setDailyStats] = useState(false)
  const [openWeeklyStats,setWeeklyStats] = useState(false)
  const [openMonthlyStats,setMonthlyStats] = useState(false)

  // When status changed socket
  useEffect(() => {
    socket.on("changedStatus", (datas) => {
      if (datas === true) {
        dispatch(resetDaily());
      }
    });
    return () => {
      socket.off("changedStatus");
    };
  }, [dispatch]);

  const submitDaily = () => {
    if(openDailyStats === false && !dailyStatsValue.dataIsReady) dispatch(getDailyStats())
    setDailyStats(!openDailyStats)
  }

  const submitWeekly = () => {
    if(openWeeklyStats === false && !weeklyStatsValue.dataIsReady) dispatch(getWeeklyStats())
    setWeeklyStats(!openWeeklyStats)
  }

  const submitMonthly = () => {
    if(openMonthlyStats === false && !monthlyStatsValue.dataIsReady) dispatch(getMonthlyStats())
    setMonthlyStats(!openMonthlyStats)
  }

  const rowHeaderSx = {
    display: 'flex',
    alignItems: 'center',
    gap: 1,
    width: '100%',
    py: 1.5,
    cursor: 'pointer',
  }
  const emptyAlertSx = { borderRadius: 2, fontWeight: 600 }

  // Center overlay showing the total income inside a donut chart
  const DonutCenter = ({ label, value }) => (
    <Box
      sx={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        pointerEvents: 'none',
      }}
    >
      <Typography variant="overline" sx={{ color: 'text.secondary', lineHeight: 1.2 }}>{label}</Typography>
      <Typography sx={{ fontWeight: 800, fontSize: '1.6rem', color: 'primary.main', lineHeight: 1.1 }}>
        {value} ₺
      </Typography>
    </Box>
  )

  // Rounded tooltip card shared by the charts
  const tooltipContentStyle = {
    borderRadius: 12,
    border: `1px solid ${theme.jqs.surfaceVariant}`,
    boxShadow: theme.jqs.cardShadow,
    fontWeight: 600,
  }

  const monthlyTotal = monthlyStatsValue.counts.reduce((sum, c) => sum + (Number(c.income) || 0), 0)

  return (
    <Box
      sx={{
        bgcolor: theme.jqs.surfaceLowest,
        borderRadius: '16px',
        boxShadow: theme.jqs.cardShadow,
        border: `1px solid ${theme.jqs.surfaceVariant}`,
        p: { xs: 2.5, sm: 3 },
        animation: 'jqsFadeUp 0.5s ease both',
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, mb: 1 }}>
        <InsightsRoundedIcon sx={{ color: 'primary.main' }} />
        <Typography variant="h6">Dükkan İstatistikleri</Typography>
      </Box>

      {/* Daily */}
      <Box sx={{ borderTop: `1px solid ${theme.jqs.surfaceVariant}` }}>
        <Box sx={rowHeaderSx} onClick={submitDaily}>
          <Typography sx={{ flexGrow: 1, fontWeight: 600 }}>Günlük İstatistikler</Typography>
          <IconButton size="small">
            {openDailyStats ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
          </IconButton>
        </Box>
        <Collapse in={openDailyStats} timeout="auto" unmountOnExit>
          <Box sx={{ pb: 2, pt: 0.5 }}>
            {dailyStatsValue.dataIsReady && dailyStatsValue.dailyIncome === 0 ? (
              <Alert variant="filled" severity="error" sx={emptyAlertSx}>Henüz siftah yapmadınız.</Alert>
            ) : (
              <>
                <Box sx={{ position: 'relative' }}>
                  <ResponsiveContainer width="100%" height={260}>
                    <PieChart>
                      <Pie
                        data={dailyStatsValue.counts.filter(service => service.income > 0)}
                        dataKey="income"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={68}
                        outerRadius={100}
                        paddingAngle={3}
                        cornerRadius={6}
                        stroke="none"
                      >
                        {(dailyStatsValue?.counts.filter(service => service.income > 0) || []).map((service, index) => (
                          <Cell key={`cell-${index}`} fill={service.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={tooltipContentStyle}
                        formatter={(value, name, props) => [`${value} ₺  •  ${props.payload.count} adet`, name]}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <DonutCenter label="Toplam" value={dailyStatsValue.dailyIncome} />
                </Box>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 1.5, mt: 1 }}>
                  {(dailyStatsValue?.counts.filter(service => service.income > 0) || []).map((service) => (
                    <Box key={service.name} sx={{ display: 'flex', alignItems: 'center', gap: 0.6 }}>
                      <Box sx={{ width: 12, height: 12, borderRadius: '4px', bgcolor: service.color }} />
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>{service.name}</Typography>
                    </Box>
                  ))}
                </Box>
              </>
            )}
          </Box>
        </Collapse>
      </Box>

      {/* Weekly */}
      <Box sx={{ borderTop: `1px solid ${theme.jqs.surfaceVariant}` }}>
        <Box sx={rowHeaderSx} onClick={submitWeekly}>
          <Typography sx={{ flexGrow: 1, fontWeight: 600 }}>Haftalık İstatistikler</Typography>
          <IconButton size="small">
            {openWeeklyStats ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
          </IconButton>
        </Box>
        <Collapse in={openWeeklyStats} timeout="auto" unmountOnExit>
          <Box sx={{ pb: 2, pt: 0.5 }}>
            {weeklyStatsValue.dataIsReady && weeklyStatsValue.weeklyIncome === 0 ? (
              <Alert variant="filled" severity="error" sx={emptyAlertSx}>Henüz siftah yapmadınız.</Alert>
            ) : (
              <>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={weeklyStatsValue.counts} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                    <defs>
                      <linearGradient id="weeklyBar" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={theme.jqs.statusSuccess} />
                        <stop offset="100%" stopColor={theme.jqs.primary} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke={theme.jqs.surfaceVariant} vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 12, fill: theme.jqs.onSurfaceVariant }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 12, fill: theme.jqs.onSurfaceVariant }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={tooltipContentStyle} formatter={(value) => [`${value} ₺`, 'Gelir']} cursor={{ fill: `${theme.jqs.secondaryContainer}40` }} />
                    <Bar dataKey="income" fill="url(#weeklyBar)" radius={[8, 8, 0, 0]} maxBarSize={42} />
                  </BarChart>
                </ResponsiveContainer>
                <Box
                  sx={{
                    mt: 1.5,
                    py: 1.25,
                    textAlign: 'center',
                    borderRadius: '12px',
                    bgcolor: `${theme.jqs.secondaryContainer}33`,
                  }}
                >
                  <Typography variant="overline" sx={{ color: 'text.secondary' }}>Haftalık Toplam</Typography>
                  <Typography sx={{ fontWeight: 800, fontSize: '1.4rem', color: 'primary.main', lineHeight: 1.1 }}>
                    {weeklyStatsValue.weeklyIncome} ₺
                  </Typography>
                </Box>
              </>
            )}
          </Box>
        </Collapse>
      </Box>

      {/* Monthly */}
      <Box sx={{ borderTop: `1px solid ${theme.jqs.surfaceVariant}` }}>
        <Box sx={rowHeaderSx} onClick={submitMonthly}>
          <Typography sx={{ flexGrow: 1, fontWeight: 600 }}>Aylık İstatistikler</Typography>
          <IconButton size="small">
            {openMonthlyStats ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
          </IconButton>
        </Box>
        <Collapse in={openMonthlyStats} timeout="auto" unmountOnExit>
          <Box sx={{ pb: 2, pt: 0.5 }}>
            {monthlyStatsValue.dataIsReady && monthlyStatsValue.counts[0].income === 0 ? (
              <Alert variant="filled" severity="error" sx={emptyAlertSx}>Henüz siftah yapmadınız.</Alert>
            ) : (
              <>
                <Box sx={{ position: 'relative' }}>
                  <ResponsiveContainer width="100%" height={260}>
                    <PieChart>
                      <Pie
                        data={monthlyStatsValue.counts}
                        dataKey="income"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={68}
                        outerRadius={100}
                        paddingAngle={3}
                        cornerRadius={6}
                        stroke="none"
                      >
                        <Cell key="cell-0" fill={theme.jqs.primaryContainer} />
                        <Cell key="cell-1" fill={theme.jqs.statusWarning} />
                      </Pie>
                      <Tooltip contentStyle={tooltipContentStyle} formatter={(value, name) => [`${value} ₺`, name]} />
                    </PieChart>
                  </ResponsiveContainer>
                  <DonutCenter label="Toplam" value={monthlyTotal} />
                </Box>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 1.5, mt: 1 }}>
                  {monthlyStatsValue.counts.map((item, index) => (
                    <Box key={item.name} sx={{ display: 'flex', alignItems: 'center', gap: 0.6 }}>
                      <Box sx={{ width: 12, height: 12, borderRadius: '4px', bgcolor: index === 0 ? theme.jqs.primaryContainer : theme.jqs.statusWarning }} />
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>{item.name}</Typography>
                    </Box>
                  ))}
                </Box>
              </>
            )}
          </Box>
        </Collapse>
      </Box>
    </Box>
  );
}
