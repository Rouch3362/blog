const {Router} = require("express")
const router = Router()
const { UserSchema } = require("../db/schema")


router.route("/register")
.get((req , res) => {
    // rendering register template so user can see register form
    res.render("register.ejs" , {error: req.flash("error") , message: req.flash("message")})
})
.post(async (req , res) => {
    const {name , username , email} = req.body
    const userExist = await UserSchema.findOne({$or: [{email} , {username}]})
    if (!name || !username || !email || !req.body.password) {
        req.flash("error" , "missing credentials")
        return res.status(400).redirect("/auth/register")
    }
    if (userExist) {
        req.flash("error" , "user already exists")
        return res.status(400).redirect("/auth/register")
    }
})




module.exports = router