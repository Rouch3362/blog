const mongoose = require("mongoose")



// declare User schema for database
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

// blog (post) schema for storing posts 
const Blog = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    body: {
        type: String,
        required: true
    },
    thumbnail: {
        type: String,
    },
    likes: {
        type: Number,
        default: 0
    }
})




// comment schema for blogs "user" field is who writes the comment and have a relation with users 
const Comment = new mongoose.Schema({
    user: User,
    blog: Blog,
    body:{
        type: String,
        required: true
    }
})

module.exports = {
    UserSchema: mongoose.model("user" , User),
    BlogSchema: mongoose.model("blog" , Blog),
    CommentSchema: mongoose.model("comment" , Comment)
}