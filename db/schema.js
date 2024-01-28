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
        select: false
    },
    password: {
        type: String,
        required: true,
        select: false
    },
    profile_picture:{
        type: String,
        default: '../uploads/noprofile.png'
    },
    about:{
        type: String
    }
} , {timestamps: true})





// twitter users collection this saves in user collection
const TwitterUser = new mongoose.Schema({
    twitterId: {
        type: String,
        required: true,
    },
    username:{
        type: String,
        required: true
    },
    name: {
        type: String
    },
    profile_picture: mongoose.SchemaTypes.String
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
    preview:{
        type: String,
        required: true
    },
    thumbnail: {
        type: String,
        default: null
    },
    tags: {
        type: [String]
    }
} , {timestamps: true})


// like collection
const Like = new mongoose.Schema({
    user: {
        type: mongoose.SchemaTypes.ObjectId,
        ref: 'user'
    },
    blog: {
        type: mongoose.SchemaTypes.ObjectId,
        ref: 'blog'
    }
})



// comment schema for blogs "user" field is who writes the comment and have a relation with users 
const Comment = new mongoose.Schema({
    user: {
        type: mongoose.SchemaTypes.ObjectId,
        ref: "user"
    },
    blog: {
        type: mongoose.SchemaTypes.ObjectId,
        ref: "blog"
    },
    body:{
        type: String,
        required: true
    },
} , {timestamps: true})
Comment.add({
    replies: [Comment]
})


const Follow = new mongoose.Schema({
    follower: {
        type: mongoose.SchemaTypes.ObjectId,
        ref: 'user'
    },
    following: {
        type: mongoose.SchemaTypes.ObjectId,
        ref: "user"
    }
},
{
    timestamps: true
})


User.pre('findOneAndDelete' , async function (next) {
    const userId = this._conditions._id
    await mongoose.model("blog").deleteMany({author: userId})
    await mongoose.model("like").deleteMany({user: userId})
    await mongoose.model("comment").deleteMany({user: userId})
    await mongoose.model("follow").deleteMany({follower: userId})
    next()
})

Blog.pre('findOneAndDelete' , async function (next) {
    const blogId = this._conditions._id
    await mongoose.model("comment").deleteMany({blog: blogId})
    await mongoose.model("like").deleteMany({blog: blogId})
    next()
})

module.exports = {
    UserSchema: mongoose.model("user" , User),
    BlogSchema: mongoose.model("blog" , Blog),
    LikeSchema: mongoose.model("like" , Like),
    CommentSchema: mongoose.model("comment" , Comment),
    TwitterUser: mongoose.model("twitterUser" , TwitterUser , "users"),
    FollowSchema: mongoose.model("follow" , Follow)
}