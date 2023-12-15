const bcrypt = require("bcrypt")

const PreventLoggingInAgain = (req , res , next) => {
    if(req.isAuthenticated()){
        req.flash("error" , "you're already logged in")
        return res.redirect("/")
    }
    next()
}

const CheckIfUserLoggedIn = (req ,res , next) => {
    if (!req.isAuthenticated()){
        req.flash("error" , "you need to login to your account to access to route")
        return res.redirect("/auth/login")
    }
    next()
}

const HashPassword = (plain) => {
    const salt = bcrypt.genSaltSync()
    const hash = bcrypt.hashSync(plain , salt)
    return hash
}


const ValidatePassword = (plainPassword , hashedPassword) => {
    return bcrypt.compareSync(plainPassword , hashedPassword)
}

const ValidateEmail = (email) => {
    const regex = /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/
    return regex.test(String(email))
}


module.exports = {
    HashPassword,
    ValidateEmail,
    ValidatePassword,
    PreventLoggingInAgain,
    CheckIfUserLoggedIn
}