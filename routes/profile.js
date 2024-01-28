const {Router} = require("express")
const { UserSchema, BlogSchema, FollowSchema } = require("../db/schema")
const { isValidObjectId } = require("mongoose")
const { CheckIfUserLoggedIn } = require("../helpers/authHelper")
const sanitize = require("sanitize-html")
const router = Router()
const fs = require('fs')
const { upload } = require("../helpers/imageUploader")

router.get("/writers/:id" , CheckIfUserLoggedIn ,async (req , res) => {
    const {id} = req.params
    
    if(!isValidObjectId(id)){
        return res.status(400).send("invalid params")
    }
    const user = await UserSchema.findById(id)

    if(!user){
        return res.sendStatus(404)
    }

    // user.followers
    const userBlogs = await BlogSchema.find({author: user.id}).populate("author")

    const checkUserFollowed = await FollowSchema.findOne({$and: [{follower: req.user.id} , {following: id}]})
    
    const followers = (await FollowSchema.find({following: id})).length
    const followings = (await FollowSchema.find({follower: id})).length
    
    const pageCount = Math.ceil(userBlogs.length / 10);
    let page = parseInt(req.query.page);
    if (!page) { page = 1;}
    if (page > pageCount) {
        page = pageCount
    }
    res.render("singleUser.ejs" , {
        pageCount: pageCount,
        page: page,
        isAuthenticated: req.isAuthenticated(),
        writer: user,
        blogs: userBlogs.slice(page * 10 - 10 , page * 10),
        message: req.flash("message"),
        error: req.flash("error"),
        isFollowing: checkUserFollowed ? true : false,
        followersCount: followers,
        followingsCount: followings,
    })
})

router.post("/follow/:id" , CheckIfUserLoggedIn , async (req , res) => {
    const { id: followerId } = req.user
    const { id: followingId } = req.params

    if (followerId == followingId) {
        req.flash("error" , `you can't follow yourself`)
        return res.redirect(403 ,req.headers.referer)
    }

    const followUser = await UserSchema.findById(followingId)

    const checkUserFollowed = await FollowSchema.findOneAndDelete({$and: [{follower: followerId} , {following: followingId}]})
    
    if (checkUserFollowed) {
        req.flash("error" , `${followUser.username} removed from your followings`)
        return res.redirect(req.headers.referer)
    }

    const record = await FollowSchema.create({follower: followerId , following: followingId})
    

    if (!record) {
        req.flash("error" , "Something Went Wrong Try Again")
        return res.redirect('/profile')
    }

    req.flash("message" , `${followUser.username} added to your followings`)
    res.redirect(req.headers.referer)
})


router.route("/profile" , CheckIfUserLoggedIn)
.get( async (req , res) => {
    const { id } = req.user
    const user = await UserSchema.findById(id).select("+email")
    res.render("profile" , {
        message: req.flash("message"),
        error: req.flash("error"),
        isAuthenticated: req.isAuthenticated(),
        user,
    })
})
.post(upload.single("profile") ,async (req , res) => {
    let { username , name , email , profile } = req.body
    username = sanitize(username)
    email = sanitize(email)
    name = sanitize(name)
    if (req.file) {
        profile = "../" + req.file.path
    }
    const user = await UserSchema.findByIdAndUpdate(req.user.id , {name , username , email , profile_picture: profile})
    // delete previous profile picture
    if (user.profile_picture !== "../uploads/noprofile.png" && !user.profile_picture.includes("https")) {
        fs.unlinkSync(user.profile_picture.replace("../" , ""))
    }
    if (!user) {
        req.flash("error" , "something went wrong try again")
        return res.redirect('/profile')
    }
    req.flash("message" , "your profile changes applied successfully")
    res.redirect('/profile')
})


router.post("/writers/:id/delete" , CheckIfUserLoggedIn , async (req , res) => {
    const { id: userId } = req.params
    const { id: loggedInUserId } = req.user

    if (userId !== loggedInUserId) {
        req.flash("error" , "Permission Denied")
        return res.redirect(req.headers.referer || "/profile")
    }

    const user = await UserSchema.findOneAndDelete({_id: userId})

    if (user.profile_picture !== "../uploads/noprofile.png" && !user.profile_picture.includes("https")) {
        fs.rmSync(`uploads/${user.id}` , { recursive: true, force: true })
    } 

    if (!user) {
        req.flash("error" , "user not found")
        return res.redirect(req.headers.referer || "/profile")
    }
    req.logOut((err) => {
        if (err) { 
            delete req.user
        }
    })
    
    req.flash("message" , `your account deleted successfully`)
    res.redirect("/auth/register")
})

module.exports = router