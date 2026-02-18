# Jet Queue System ( JQS ) <-> MERN Stack Project
This app facilitates life of costumers and barber shop owner. Costumers enroll and look at the queue as clearly and easily. Shop ownner has a lot of feature on admin panel.

## 🚀 Admin Panel Features
- You can close/open shop manually and automatically.
- You can manipulate queue that processes are fast-call,cancel,finish-cut,up-down move.
- You can see and analyze your stats that daily,weekly,monthly.
- You can get notification about queue when permissions are granted.
<img width="200" height="433" alt="admin1" src="https://github.com/user-attachments/assets/3967e6a5-1e68-41b3-9eaf-9437e59e8b72" />
<img width="200" height="433" alt="Admin4" src="https://github.com/user-attachments/assets/6644cf02-811d-40d4-bb62-240aa8e42615" />
<img width="200" height="433" alt="Admin2" src="https://github.com/user-attachments/assets/1fadcecf-7997-46ba-8272-925d6d516232" />
<img width="200" height="433" alt="Admin3" src="https://github.com/user-attachments/assets/dc4ec089-1466-415e-9cf2-3c055bb8db6c" />


## 🚀 Costumer Page Features
- You can look at queue clearly and enroll it. When your turn was came , you will be called by the shop owner.
- Verify yourself! You can enroll the queue more easily.
<img width="200" height="432" alt="main1" src="https://github.com/user-attachments/assets/636166b6-b7e1-4204-82e4-e5eab2de9e5d" />
<img width="200" height="432" alt="main2" src="https://github.com/user-attachments/assets/bee91ce7-fcbf-4348-9e71-4e45de42c325" />


# ⚙️ How to Setup
- First of all, you need to download Node.js and have a MongoDB account for database.
- The setup has 2 side server and client.
  
### ⚙️ Server Side Setup
- We dive into server folder and copy env file for to enter our information out there.
```sh
cd server
cp .env.example
```
Get your DB URL from MongoDB , PORT is 3001 as default , create VAPID keys for web push notification , reCAPTCHA key from Google Cloud.
After all of that you can determine crypto and jwt keys whatever you want.

### ⚙️ Client Side Setup
- We are going to set .env file.
```sh
cd ui
cp .env.example
```
Copy + Paste keys from server/.env except reCAPTCHA site that is another key from Google Cloud.

### 🌐 Start App
- Client works on 3000 port as a default and server works on 3001.
- We install our node modules and start for ui.
```sh
npm i 
npm start
```
- We install our node modules and start for server.
```sh
npm i 
npm run start
```
- Enter 'http://localhost:3000/#/adminLogin' this url and type 'admin' for username and password.
- Now, you need to add new service from 'Hizmet ekle-çıkar' button.
- After that the app completely ready for use.



