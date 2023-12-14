const express =  require("express")
const app = express()


// template engine settings
const ejs = require("ejs")
app.set("view engine" , "ejs")

// env settings for secret keys
require("dotenv").config()
const port = process.env.PORT || 3000

// data parsing settings
const bodyParser = require("body-parser")
app.use(bodyParser.urlencoded({extended: false}))
app.use(bodyParser.json())


// add database functionalities to app
require("./db")



app.listen(port ,() => {
    console.log(`Server Is Listening On Port ${port}`)
})