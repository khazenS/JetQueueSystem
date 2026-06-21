const express = require('express');
const dotenv = require('dotenv');
const dbConnection = require('./database/dbConnection.js');
const { accessMiddleware } = require('./middleware/accessMiddleware.js');
const adminRouter = require('./routes/adminRoute/adminRoute.js');
const publicRouter = require('./routes/publicRoute/publicRoute.js');
const cors = require('cors');
const { createServer } = require('http');
const { cryptoMiddleware } = require('./middleware/cryptoMiddleware.js');
const { initializeSocket } = require('./helpers/socketio.js');
const webpush = require('web-push');
// Load environment variables
const dotenvResult = dotenv.config();
// NODE_ENV genelde process yöneticisi/hosting tarafından önceden set edilir ve
// dotenv mevcut bir değişkenin ÜZERİNE YAZMAZ; bu yüzden .env'deki NODE_ENV
// görmezden gelinir. Diğer host değişkenlerine (PORT vb.) dokunmadan sadece
// NODE_ENV'i .env'deki değerle zorla.
if (dotenvResult.parsed && dotenvResult.parsed.NODE_ENV) {
  process.env.NODE_ENV = dotenvResult.parsed.NODE_ENV;
}
// Express app setup
const app = express();

// Setup of socket
const server = createServer(app);

// Initilize the socket here
initializeSocket(server)

// Basic route for testing
app.get('/helloworld', (req, res) => {
  res.send('<h1 style="text-align:center; margin-top:1em;">Hello World</h1>');
});

// CORS middleware
app.use(cors());

// JSON body parsing middleware
app.use(express.json());
 
// Crypto Middleware
app.use(cryptoMiddleware);

// Web Push Configs
webpush.setVapidDetails(
  'mailto:yourmail@gmail.com',
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
)

// PUBLIC API
app.use("/api/public",publicRouter);

// PRIVATE API
app.use("/api/admin",accessMiddleware, adminRouter);

// Database Connection
dbConnection();

// Start the server
server.listen(process.env.PORT, '0.0.0.0', () => {
  console.log('The app is working on that port: ', process.env.PORT);
});
