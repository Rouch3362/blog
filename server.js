const express =  require("express")
const app = express()
const bodyParser = require("body-parser")
require("dotenv").config()
const port = process.env.PORT || 3000

app.use(bodyParser.urlencoded({extended: false}))
app.use(bodyParser.json())



app.listen(port ,() => {
    console.log(`Server Is Listening On Port ${port}`)
})