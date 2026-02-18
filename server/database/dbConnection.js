const mongoose = require("mongoose");
const { createAdminDefault, createShopDefault } = require("../helpers/createDefaults.js");


const dbConnection = () => {
    mongoose.connect(process.env.DB_URL, {
        dbName:process.env.DB_NAME, // Replace with your actual database name
    }).then( async () => {
        console.log("Connected to DB successfully")
        await createAdminDefault()
        await createShopDefault()  
    }).catch((err) => {
        console.log("There is an error on DB!" + err)
    })
}

module.exports = dbConnection