const { Router } = require("express")
const { CheckIfUserLoggedIn } = require("../helpers/authHelper")
const { BlogSchema } = require("../db/schema")
const { toBinary , upload} = require("../helpers/imageToBinary")


const router = Router()


router.get("/" , async (req , res) => {
    const blogs = await BlogSchema.find({}).populate("author")
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
    const { body , title } = req.body
    let { thumbnail , tags } = req.body
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
    const blog = await BlogSchema.create({author: req.user.id ,title,body,thumbnail , tags})
    
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
    const blog = await BlogSchema.findById(id).populate('author')
    res.render("singleBlog.ejs" , {
        blog: blog,
        message: req.flash("message") , 
        error: req.flash("error") , 
        isAuthenticated: req.isAuthenticated()
    })
})


module.exports = router