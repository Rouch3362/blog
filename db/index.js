const mongoose = require("mongoose")


mongoose.connect(process.env.MONGO_URI)
.then((res) => {
    console.log("Connected To DB")
})
.catch((err) => {
    console.log(err.message)
})