const {Router} = require("express")
const { UserSchema, BlogSchema, FollowSchema } = require("../db/schema")
const { isValidObjectId } = require("mongoose")
const { CheckIfUserLoggedIn } = require("../helpers/authHelper")
const router = Router()


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
        user: user,
        blogs: userBlogs.slice(page * 10 - 10 , page * 10),
        message: req.flash("message"),
        error: req.flash("error"),
        isFollowing: checkUserFollowed ? true : false,
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

module.exports = router