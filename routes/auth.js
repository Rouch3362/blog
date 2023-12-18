const {Router} = require("express")
const router = Router()
const { UserSchema } = require("../db/schema")
const { HashPassword , ValidateEmail, CheckIfUserLoggedIn , PreventLoggingInAgain } = require("../helpers/authHelper")
const passport = require("passport")
const { toBinary , upload } = require("../helpers/imageToBinary")



router.route("/register")
.get((req , res) => {
    // rendering register template so user can see register form
    res.render("register.ejs" , {error: req.flash("error") , 
    message: req.flash("message"),
    isAuthenticated: req.isAuthenticated()
})
})
.post(upload.single("profile") , async (req , res) => {
    const {name , username , email} = req.body
    let {profile} = req.body
    const userExist = await UserSchema.findOne({$or: [{email} , {username}]})
    if (!name || !username || !email || !req.body.password) {
        console.log("error");
        req.flash("error" , "missing credentials")
        return res.status(400).redirect("/auth/register")
    }
    if (userExist) {
        req.flash("error" , "user already exists")
        return res.status(400).redirect("/auth/register")
    }
    const password = HashPassword(req.body.password)
    if (!ValidateEmail(email)){
        req.flash("error" , "email is not valid")
        return res.status(400).redirect("/auth/register")
    }

    if(req.file){
        profile = toBinary(req)
    }

    const user = await UserSchema.create({name , username , email , password , profile_picture: profile})
    req.login(user , (err) => {
        if (err){
            req.flash("error" , "can not login automaticly")
            return res.redirect("/auth/login")
        }
        req.flash("message" , "created account and logged in successfully")
        return res.redirect("/")
    })
    
})


router.route("/login")
.get(PreventLoggingInAgain , (req , res) => {
    res.render("login.ejs" , {
        message: req.flash('message') , 
        error: req.flash("error"),
        isAuthenticated: req.isAuthenticated()
})
})
.post(passport.authenticate("local" , {failureFlash: true , failureRedirect: "/auth/login"}) , (req , res) => {
    req.flash("message" , `welcom back ${req.user.name}`)
    res.redirect("/")
})


router.get("/twitter" , passport.authenticate("twitter"))
router.get("/twitter/callback" , passport.authenticate("twitter" , {failureRedirect: "/"}) , (req , res) => {
    res.redirect('/')
})


router.post("/logout" , (req , res) => {
    req.logout((err) => {
        if (err) { 
            req.flash("error" , "couldn't logout try again")
            return res.redirect("/")
        }
        req.flash("message" , "logged out successfully")
        res.redirect("/auth/login")
    })
})

module.exports = router