const {Router} = require("express")
const router = Router()
const { UserSchema, TokenSchema } = require("../db/schema")
const { HashPassword , ValidateEmail, CheckIfUserLoggedIn , PreventLoggingInAgain , checkFieldsLength } = require("../helpers/authHelper")
const passport = require("passport")
const sanitizeHtml = require("sanitize-html")
const { sendEmail } = require("../helpers/emailSender")
const crypto = require("crypto")



router.route("/register")
.get((req , res) => {
    // rendering register template so user can see register form
    res.render("register.ejs" , {error: req.flash("error") , 
    message: req.flash("message"),
    isAuthenticated: req.isAuthenticated()
})
})
.post(async (req , res) => {
    let {name , username , email } = req.body
    name = sanitizeHtml(name)
    username = sanitizeHtml(username)
    email = sanitizeHtml(email)

    // check length of fields
    if (name.length > 128) {
        req.flash("error" , "name field must be maximum 128 characters")
        return res.redirect("/auth/register")
    }

    if (username.length > 32) {
        req.flash("error" , "username field must be maximum 32 characters")
        return res.redirect("/auth/register")
    }

    const usernameReg = /^[a-z0-9_\.]+$/

    if (!username.match(usernameReg)) {
        req.flash("error" , "invalid username")
        return res.redirect("/auth/register")
    }
    
    const userExist = await UserSchema.findOne({$or: [{email} , {username}]})

    if (!name || !username || !email || !req.body.password) {
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


    const user = await UserSchema.create({name , username , email , password})

    req.login(user , (err) => {
        if (err){
            req.flash("error" , "can not login automaticly")
            return res.redirect("/auth/login")
        }
        req.flash("message" , "created account and logged in successfully")
        return res.redirect("/profile")
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
    req.flash("message" , `welcome back ${req.user.name}`)
    res.redirect(req.headers.referer || "/")
})


router.get("/twitter" , passport.authenticate("twitter"))
router.get("/twitter/callback" , passport.authenticate("twitter" , {failureRedirect: "/"}) , (req , res) => {
    res.redirect(req.headers.referer || "/")
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


router.route("/reset-password" , CheckIfUserLoggedIn)
.get((req , res) => {
    res.render("passwordReset.ejs" , {
        error: req.flash("error"),
        message: req.flash("message"),
        isAuthenticated: req.isAuthenticated()
    })
})
.post( async (req , res) => {
    let { email } = req.body
    const user = await UserSchema.findOne({email: email})

    email = sanitizeHtml(email)

    if (!email) {
        req.flash("error" , "the email field is required")
        return res.redirect(req.headers.referer || "/reset-password")
    }

    if (!ValidateEmail(email)) {
        req.flash("error" , "email address is not valid please enter a valid one")
        return res.redirect(req.headers.referer || "/reset-password")
    }
    
    if (!user) {
        req.flash("error" , "there is no user with this email address")
        return res.redirect(req.headers.referer || "/reset-password")
    }

    let token = await TokenSchema.findOne({user: user.id})

    if (!token) {
        token = await TokenSchema.create({user: user.id , token: crypto.randomBytes(32).toString("hex")})
    }

    const link = `${process.env.BASE_URL}/auth/reset-password/${token.user}/${token.token}`

    const emailMessage = sendEmail(email , "reset your password" , `<h1 style="text-align: center">Hello dear ${user.name}</h1> \ <p style="text-align:center;font-size:20px;"> this email message is request to reset the password of your account in blog website if you requested this action click on the link below <u>if you not just ignore it.</u></p> \ <div style="text-align:center;"><a href=${link} style="padding-left: 20px; padding-right:20px; padding-top: 10px; padding-bottom:10px; font-size: 20px;background-color: red; color: white; text-decoration: none; border-radius: 8px;">Reset My Password</a></div>`)
    
    if (!emailMessage) {
        req.flash("error" , "an error occured please try again")
        return res.redirect(req.headers.referer || "/reset-password")
    }

    req.flash("message" , "password reset link sent to your email")
    res.redirect(req.headers.referer || "/reset-password")
})

router.route("/reset-password/:userId/:token" , CheckIfUserLoggedIn)
.get(async(req , res) => {
    const { userId , token } = req.params

    const isValidToken = await TokenSchema.findOne({user:userId , token})

    if (!isValidToken) {
        req.flash("error" , "reset token is inavalid")
        return res.redirect(req.headers.referer || "/reset-password")
    }
    res.render("newPassword.ejs" , {
        error: req.flash("error") , 
        message: req.flash("message") , 
        isAuthenticated: req.isAuthenticated()
    })
})

.post(async(req , res) => {
    const { userId , token } = req.params


    if (!req.body.newPassword) {
        req.flash("error" , "new password is required")
        return res.redirect(req.headers.referer || `/reset-password/${userId}/${token}`)
    }


    const password = HashPassword(req.body.newPassword)

    const user = await UserSchema.findByIdAndUpdate(userId , {password: password})

    await TokenSchema.deleteOne({user:userId, token})

    req.flash("message" , "your password changed successfully. now login to your account")
    res.redirect("/auth/login")
})

module.exports = router