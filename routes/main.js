const { Router } = require("express")
const { CheckIfUserLoggedIn } = require("../helpers/authHelper")
const { BlogSchema } = require("../db/schema")

const router = Router()
const fs = require("fs")
const path = require('path')
const multer  = require('multer')



const storage = multer.diskStorage({
    destination: (req , file , next) => {
        next(null , 'uploads')
    },
    filename: (req , file , next) =>{
        next(null , file.fieldname + '-' + Date.now())
    },
})

var upload = multer({storage: storage})

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
        posts: blogs.slice(page * 10 - 10 , page * 10),
        user: req.user , 
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
    let { body , title , thumbnail , tags} = req.body
    tags = tags.split(",")
    if (req.file) {
        // read file and save it as binary data
        thumbnail = {
            data: fs.readFileSync(path.join("./uploads/" + req.file.filename)),
            contentType: "image/png"
        }
        // remove the actual file from upload folder after read it and save it thumbnail object
       fs.unlink(path.join("./uploads/" + req.file.filename) , (err) => {
        if(err) {
            return req.flash("error" , "something went wrong try again")
        }
       }) 
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
module.exports = router