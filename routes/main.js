const { Router } = require("express")
const { CheckIfUserLoggedIn } = require("../helpers/authHelper")
const { BlogSchema, LikeSchema, FollowSchema, CommentSchema } = require("../db/schema")
const { upload } = require("../helpers/imageUploader")
const  { isValidObjectId } = require("mongoose")
const sanitizeHtml = require("sanitize-html")
const router = Router()
const fs = require("fs")

router.get("/" , async (req , res) => {
    const pageCount = Math.ceil(await BlogSchema.countDocuments() / 10);
    
    let page = parseInt(req.query.page);

    if (!page) { page = 1;}

    const blogsPerPage = 10

    // only collect the desired data on a single page not all documents for one page it speeds up the app.
    const blogs = await BlogSchema.find({}).sort({createdAt: -1}).populate("author").skip(page*blogsPerPage - 10).limit(blogsPerPage)

    if (page > pageCount) {
        page = pageCount
    }
    
    
    
    res.render("home" , {
        page: page,
        pageCount: pageCount,
        blogs: blogs,
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
    title = sanitizeHtml(title)
    preview = sanitizeHtml(preview)
    tags = tags.split(",")
    if (req.file) {
        thumbnail = "../"+req.file.path
    }

    // if body or title is empty user can not save the blog
    if(!title || !body) {
        req.flash("error" , "title or body of blog can not be empty")
        return res.redirect("/post")
    }

    if (!preview) {
        req.flash("error" , "if you want to write code write it in a code block")
        return res.redirect("/post")
    }

    // save the blog to database
    const blog = await BlogSchema.create({author: req.user.id , title , body , preview , thumbnail , tags})
    
    if (blog){
        req.flash("message" , "congrats!! your blog posted successfully")
    
        res.redirect(`/blogs/${blog.id}`)
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
    
    const deletedBlog = await BlogSchema.findOneAndDelete({_id: blogId})

    if (!deletedBlog) {
        req.flash("error" , "something went wrong try again")
        return res.redirect(req.headers.referer || `/blogs/${blogId}`)
    }

    if (deletedBlog.thumbnail) {
        fs.unlinkSync(deletedBlog.thumbnail.replace("../" , ""))
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


const findComment = async (commentId) => {
    
    let comment = await CommentSchema.findById(commentId)
    
    if (!comment) {
        comment = await CommentSchema.findOne({replies: {$elemMatch: {_id: commentId}}})
        comment = comment.replies.filter(reply => {return reply._id == commentId })[0]
    }

    return comment
}

router.post("/blogs/comment/:id/delete" , CheckIfUserLoggedIn , async (req , res) => {
    const { id: commentId } = req.params
    
    const comment = await findComment(commentId) 


    if (!comment) {
        req.flash("error" , "comment not found")
        return res.redirect(req.headers.referer || `/blogs/${comment.blog}`)
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


router.post("/blogs/comment/:id/edit" , CheckIfUserLoggedIn , async (req , res) => {
    const {id: commentId} = req.params
    let {body} = req.body

    body = sanitizeHtml(body)

    const comment = await findComment(commentId)

    if (!comment) {
        req.flash("error" , "comment not found")
        return res.redirect(req.headers.referer || `/blogs/${comment.blog}`)
    }

    let updatingComment = await CommentSchema.findOneAndUpdate({_id: commentId} , {body: body} , {new: true}) 
    if (!updatingComment) {
        updatingComment = await CommentSchema.findOneAndUpdate({replies: {$elemMatch: {_id: commentId}}} ,{$set: {'replies.$.body': body}} , {new: true})
        if (!updatingComment) {
            req.flash("error" , "something went wrong try again")
            return res.redirect(req.headers.referer || `/blogs/${comment.blog}`)
        }
    }
    req.flash("message" , "comment edited successfully")
    res.redirect(req.headers.referer || `/blogs/${comment.blog}`)
})

module.exports = router