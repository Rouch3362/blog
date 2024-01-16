const { Router } = require("express")
const { CheckIfUserLoggedIn } = require("../helpers/authHelper")
const { BlogSchema, LikeSchema, FollowSchema } = require("../db/schema")
const { toBinary , upload} = require("../helpers/imageToBinary")
const { isValidObjectId } = require("mongoose")
const sanitizeHtml = require("sanitize-html")
const router = Router()


router.get("/" , async (req , res) => {
    const blogs = await BlogSchema.find({}).sort({_id: -1}).populate("author")
    const pageCount = Math.ceil(blogs.length / 10);
    let page = parseInt(req.query.page);
    if (!page) { page = 1;}
    if (page > pageCount) {
        page = pageCount
    }
    
    
    
    res.render("home" , {
        page: page,
        pageCount: pageCount,
        blogs: blogs.slice(page * 10 - 10 , page * 10),
        message: req.flash("message") , 
        error: req.flash("error") , 
        isAuthenticated: req.isAuthenticated()
    })
})


router.route("/post")
.get(CheckIfUserLoggedIn , (req ,res) => {
    res.render("editor.ejs" , {
        message: req.flash("message") , 
        error: req.flash("error") , 
        isAuthenticated: req.isAuthenticated()
    })
})
.post(upload.single('thumbnail') , async (req , res) => {
    let { body , title , preview , thumbnail , tags } = req.body
    tags = sanitizeHtml(tags)
    body = sanitizeHtml(body)
    title = sanitizeHtml(title)
    previw = sanitizeHtml(preview)
    tags = tags.split(",")
    if (req.file) {
        thumbnail = toBinary(req)
    }

    // if body or title is empty user can not save the blog
    if(!title || !body) {
        req.flash("error" , "title or body of blog can not be empty")
        return res.redirect("/post")
    }

    // save the blog to database
    const blog = await BlogSchema.create({author: req.user.id , title , body , preview , thumbnail , tags})
    
    if (blog){
        req.flash("message" , "congrats!! your blog posted successfully")
    
        res.redirect("/")
    }
    else{
        req.flash("error" , "something went wrong try again")
    }
    
    
})


router.get("/blogs/:id" , async (req , res) => {
    const { id } = req.params
    if(!isValidObjectId(id)){
        return res.status(400).send("invalid params")
    }

    const blog = await BlogSchema.findById(id).populate('author')
    if (!blog){
        return res.sendStatus(404)
    }
    if(req.user){
        // add two properties like and likeCount for accessing if user liked the post(blog) in view and seconde one for count of likes
        blog.liked = await LikeSchema.findOne({user: req.user.id , blog: id}) ? true : false
        blog.likeCount = (await LikeSchema.find({blog: id})).length
    }

    const checkUserFollowed = await FollowSchema.findOne({$and: [{follower: req.user.id} , {following: blog.author.id}]})

    res.render("singleBlog.ejs" , {
        blog: blog,
        message: req.flash("message") , 
        error: req.flash("error") , 
        isAuthenticated: req.isAuthenticated(),
        isFollowing: checkUserFollowed ? true : false,
        authenticatedUser: req.user
    })
})


router.post('/blogs/:id/like', CheckIfUserLoggedIn , async (req , res) => {
    const { id } = req.params
    const liked = await LikeSchema.findOne({blog: id , user: req.user.id})

    if(liked){
        // if it's liked by this user before it will be unliked
        await LikeSchema.findOneAndDelete({blog: id , user: req.user.id})
    }
    else{
        // add a recored to db
        await LikeSchema.create({blog: id, user: req.user.id})
    }
    res.redirect(`/blogs/${id}`)

})


module.exports = router