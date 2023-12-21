const {Router} = require("express")
const { UserSchema, BlogSchema } = require("../db/schema")
const { isValidObjectId } = require("mongoose")
const router = Router()


router.get("/writers/:id" , async (req , res) => {
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

    const pageCount = Math.ceil(userBlogs.length / 10);
    let page = parseInt(req.query.page);
    if (!page) { page = 1;}
    if (page > pageCount) {
        page = pageCount
    }
    console.log(userBlogs[5])
    res.render("singleUser.ejs" , {
        pageCount: pageCount,
        page: page,
        isAuthenticated: req.isAuthenticated(),
        user: user,
        blogs: userBlogs.slice(page * 10 - 10 , page * 10),
        message: req.flash("message"),
        error: req.flash("error")
    })
})



module.exports = router