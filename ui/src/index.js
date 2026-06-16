import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { Provider } from 'react-redux'
import store from "./redux/store.js"
import { getDailyBookingAdmin } from './redux/features/adminPageSlices/adminDailyBookingSlice.js';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import theme from './theme.js';

const root = ReactDOM.createRoot(document.getElementById('root'));
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("/service-worker.js")
    .then(reg => console.log("Service Worker was registered: ", reg.scope))
    .catch(err => console.error("Service Worker registiration error: ", err));
}
document.addEventListener('visibilitychange', async () => {
  // App is visible again, reconnect if needed
  if (window.matchMedia('(display-mode: standalone)').matches && document.visibilityState === 'visible' && !window.location.pathname.includes('/admin')) {
    store.dispatch(getDailyBookingAdmin())
  }
});
root.render(
  <Provider store={store}>
    <React.StrictMode>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <App />
      </ThemeProvider>
    </React.StrictMode>
  </Provider>
);
