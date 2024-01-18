const passport = require("passport")
const { Strategy } = require("passport-local")
const { UserSchema } = require("../db/schema")
const { ValidatePassword } = require("./authHelper")


// username in this block of code can be email or actual username
passport.use(new Strategy({passReqToCallback: true} , async (req, username,  password , done) => {
    // if user forgot to enter the credentials
    if (!username || !password){
        return done(null , false , req.flash("error", "missing credentials"))
    }
    // find user with email or username 
    const user = await UserSchema.findOne({$or: [{username}, {email: username}]}).select("+password")
    // if user not found we can show a message that user can not be found
    if (!user){
        return done(null , false , req.flash("error", "user can not be found"))
    }


    // compare the password stored in database and password which user entered
    const comparePassword = ValidatePassword(password , user.password)

    if (!comparePassword) {
        return done(null , false , req.flash("error", "username or password is not correct"))
    }

    done(null , user)

}))


passport.serializeUser((user, done) => {
    done(null , {id: user._id ,username: user.username , name: user.name , profilePicture: user.profile_picture})
})

passport.deserializeUser((user ,done) => {
    done(null , user)
})