const { SchemaTypes } = require("mongoose")
const mongoose = require("mongoose")



// declare User schema for database
const User = new mongoose.Schema({
    name: {
        type: String,
    },
    username: {
        type: String,
        required: true
    },
    email: {
        type: String,
    },
    password: {
        type: String,
        required: true
    },
    profile_picture:{
        type: String
    }
} , {timestamps: true})

// twitter users collection this saves in user collection
const TwitterUser = new mongoose.Schema({
    twitterId: {
        type: String

    },
    username:{
        tpye: String
    },
    name: {
        type: String
    },
    profile_picture: {
        type: String
    }
} , {timestamps: true})

// blog (post) schema for storing posts 
const Blog = new mongoose.Schema({
    author:{
        type: mongoose.SchemaTypes.ObjectId,
        ref: "user"
    },
    title: {
        type: String,
        required: true
    },
    body: {
        type: String,
        required: true
    },
    thumbnail: {
        type: Object({
            data: Buffer,
            contentType: String,
        }),
        default: null
        
    },
    likes: {
        type: Number,
        default: 0
    },
    tags: {
        type: [String]
    }
} , {timestamps: true})




// comment schema for blogs "user" field is who writes the comment and have a relation with users 
const Comment = new mongoose.Schema({
    user: {
        type: mongoose.SchemaTypes.ObjectId,
        ref: "User"
    },
    blog: {
        type: mongoose.SchemaTypes.ObjectId,
        ref: "Blog"
    },
    body:{
        type: String,
        required: true
    }
} , {timestamps: true})

module.exports = {
    UserSchema: mongoose.model("user" , User),
    BlogSchema: mongoose.model("blog" , Blog),
    CommentSchema: mongoose.model("comment" , Comment),
    TwitterUser: mongoose.model("twitterUser" , TwitterUser , "users")
}