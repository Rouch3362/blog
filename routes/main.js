const { Router } = require("express")
const { CheckIfUserLoggedIn } = require("../helpers/authHelper")
const { BlogSchema, LikeSchema, FollowSchema, CommentSchema } = require("../db/schema")
const { toBinary , upload} = require("../helpers/imageToBinary")
const { Types , isValidObjectId } = require("mongoose")
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
    
        res.redirect(req.headers.referer || `/blogs/${blog.id}`)
    }
    else{
        req.flash("error" , "something went wrong try again")
        res.redirect("/post")
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

    blog.comments = await CommentSchema.find({blog: id}).populate('user').populate({path: "replies" , populate: [{path: 'user' , model: "user"} , {path: 'blog', model: "blog"}]})
    
    if (req.isAuthenticated()) {
        var checkUserFollowed = await FollowSchema.findOne({$and: [{follower: req.user.id} , {following: blog.author.id}]})
    }

    res.render("singleBlog.ejs" , {
        blog: blog,
        message: req.flash("message") , 
        error: req.flash("error") , 
        isAuthenticated: req.isAuthenticated(),
        isFollowing: checkUserFollowed ? true : false,
    })
})


router.post('/blogs/:id/like', CheckIfUserLoggedIn , async (req , res) => {
    const { id } = req.params
    // if user already liked deletes it
    const liked = await LikeSchema.findOneAndDelete({blog: id , user: req.user.id})


    if (!liked){
        // add a recored to db
        await LikeSchema.create({blog: id, user: req.user.id})
    }
    res.redirect(`/blogs/${id}`)

})




router.post('/blogs/delete/:id' , CheckIfUserLoggedIn , async (req , res) => {
    const { id: blogId } = req.params
    const blog = await BlogSchema.findById(blogId)

    if (!blog) {
        req.flash("error" , "blog not found")
        return res.redirect(404, req.headers.referer || "/")
    }

    if (req.user.id != blog.author._id) {
        req.flash("error" , "Permission Denied")
        return res.redirect(403 , req.headers.referer || `/blogs/${blogId}`)
    }
    
    const deletedBlog = await BlogSchema.deleteOne({_id: blogId})

    if (!deletedBlog) {
        req.flash("error" , "something went wrong try again")
        return res.redirect(req.headers.referer || `/blogs/${blogId}`)
    }
    req.flash("message" , `"${blog.title}" blog deleted successfully`)
    res.redirect('/')
})

router.post("/blogs/comment/:id" , CheckIfUserLoggedIn , async (req , res) => {
    const { id: blogId } = req.params
    let { body } = req.body
    body = sanitizeHtml(body)
    if (body.trim() == "") {
        req.flash("error" , "Comment can not be empty")
        return res.redirect(400 , req.headers.referer || `/blogs/${blogId}`)
    }

    const comment = await CommentSchema.create({user: req.user.id , body , blog: blogId})

    if (!comment) {
        req.flash("error" , "something went wrong try again")
        return res.redirect(req.headers.referer || `/blogs/${blogId}`)
    }

    req.flash("message" , "your comment posted")
    res.redirect(req.headers.referer || `/blogs/${blogId}`)
})

router.post("/blogs/:blogId/comment/:commentId/reply" , CheckIfUserLoggedIn , async (req , res) => {
    const { blogId , commentId } = req.params
    let { body } = req.body
    body = sanitizeHtml(body)
    console.log(blogId , commentId)
    if (body.trim() == "") {
        req.flash("error" , "reply can not be empty")
        return res.redirect(req.headers.referer || `/blogs/${blogId}`)
    }

    const reply = await CommentSchema.findOneAndUpdate({$and: [{blog: blogId} , {_id: commentId}]} , {$push: {replies: {user: req.user.id , body: body , blog: blogId}}})


    if (!reply) {
        req.flash("error" , "something went wrong try again")
        return res.redirect(req.headers.referer || `/blogs/${blogId}`)
    }

    req.flash("message" , "your reply posted")
    res.redirect(req.headers.referer || `/blogs/${blogId}`)


})

router.post("/blogs/comment/:id/delete" , CheckIfUserLoggedIn , async (req , res) => {
    const { id: commentId } = req.params
    let comment = await CommentSchema.findById(commentId)
    
    if (!comment) {
        comment = await CommentSchema.findOne({replies: {$elemMatch: {_id: commentId}}})
        console.log(commentId , comment)
        if (!comment) {
            req.flash("error" , "comment not found")
            return res.redirect(req.headers.referer || "/")
        }
    }

    if (comment.user._id != req.user.id) {
        req.flash("error" , "Permission Denied")
        return res.redirect(req.headers.referer || `/blogs/${comment.blog}`)
    }

    let deletedComment = await CommentSchema.findOneAndDelete({_id: commentId}) 
    if (!deletedComment) {
        deletedComment = await CommentSchema.findOneAndUpdate({replies: {$elemMatch: {_id: commentId}}} , {$pull: {replies:{_id: commentId}}})
        if (!deletedComment) {
            req.flash("error" , "something went wrong try again")
            return res.redirect(req.headers.referer || `/blogs/${comment.blog}`)
        }
    }
    req.flash("message" , "comment deleted successfully")
    res.redirect(req.headers.referer || `/blogs/${comment.blog}`)
})

module.exports = router