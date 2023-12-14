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


// session and cookie settings
const session = require("express-session")
app.use(session({ 
    secret:'amirali3362', 
    saveUninitialized: true, 
    resave: true
})); 
// for messaging
const flash = require("connect-flash")
app.use(flash());

// serving static files
const path = require("path")
app.use(express.static(path.join(__dirname , "public")))


// add database functionalities to app
require("./db")


// adding route files to main file
app.use("/auth" , require("./routes/auth"))


app.listen(port ,() => {
    console.log(`Server Is Listening On Port ${port}`)
})