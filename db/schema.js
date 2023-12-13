const mongoose = require("mongoose")


const User = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    username: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    profile_picture:{
        type: String
    }
})



module.exportsn = {
    UserSchema: mongoose.model("user" , User),
}