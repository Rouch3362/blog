const {Router} = require("express")
const { UserSchema, BlogSchema, FollowSchema } = require("../db/schema")
const { isValidObjectId } = require("mongoose")
const { CheckIfUserLoggedIn, ValidateEmail, checkFieldsLength } = require("../helpers/authHelper")
const sanitize = require("sanitize-html")
const router = Router()
const fs = require('fs')
const { upload } = require("../helpers/imageUploader")

router.get("/writers/:username" , CheckIfUserLoggedIn ,async (req , res) => {
    const {username} = req.params

    const user = await UserSchema.findOne({username})

    if(!user){
        return res.sendStatus(404)
    }

    // user.followers

    const checkUserFollowed = await FollowSchema.findOne({$and: [{follower: req.user.id} , {following: user.id}]})
    
    const followers = await FollowSchema.countDocuments({following: user.id})
    const followings = await FollowSchema.countDocuments({follower: user.id})
    
    const pageCount = Math.ceil(await BlogSchema.countDocuments({author: user.id}) / 10);

    let page = parseInt(req.query.page);

    if (!page) { page = 1;}

    const blogsPerPage = 10

    const userBlogs = await BlogSchema.find({author: user.id}).sort({createdAt: -1}).populate("author").skip(page * blogsPerPage - 10).limit(blogsPerPage)

    if (page > pageCount) {
        page = pageCount
    }
    res.render("singleUser.ejs" , {
        pageCount: pageCount,
        page: page,
        isAuthenticated: req.isAuthenticated(),
        writer: user,
        blogs: userBlogs,
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
    let { username , name , email , profile , about} = req.body
    username = sanitize(username)
    email = sanitize(email)
    name = sanitize(name)
    about = sanitize(about)

    if (!username || !name || !email) {
        req.flash("error" , "username, name, email field are required")
        return res.redirect("/profile")
    }

    // checks length of fields
    if (about.length > 255) {
        req.flash("error" , "about field must be maximum 255 characters")
        return res.redirect("/profile")
    }

    if (name.length > 128) {
        req.flash("error" , "name field must be maximum 128 characters")
        return res.redirect("/profile")
    }

    if (username.length > 32) {
        req.flash("error" , "username field must be maximum 32 characters")
        return res.redirect("/profile")
    }

    const usernameReg = /^[a-z0-9_\.]+$/

    if (!username.match(usernameReg)) {
        req.flash("error" , "invalid username")
        return res.redirect("/auth/register")
    }

    const userExist = await UserSchema.findOne({$and: [{username: username} , {_id: {$ne: req.user.id}}]})
    const userExistByEmail = await UserSchema.findOne({$and: [{email: email} , {_id: {$ne: req.user.id}}]})
    

    if (userExist) {
        req.flash("error" , "username most be unique")
        return res.redirect("/profile")
    }

    if (userExistByEmail) {
        req.flash("error" , "email address is for another user")
        return res.redirect("/profile")
    }

    if (!ValidateEmail(email)) {
        req.flash("error" , "email address is invalid please enter a valid one")
        return res.redirect("/profile")
    }


    if (req.file) {
        profile = "../" + req.file.path.replace("public" , "")
    }
    const user = await UserSchema.findByIdAndUpdate(req.user.id , {name , username , email , profile_picture: profile , about} , {runValidators: true})
    // delete previous profile picture
    if (req.file && user.profile_picture !== "../uploads/noprofile.png" && !user.profile_picture.includes("https")) {
        fs.unlinkSync("public/"+user.profile_picture.replace("../" , ""))
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
        fs.rmSync(`public/uploads/${user.id}` , { recursive: true, force: true })
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