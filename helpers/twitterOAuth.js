var passport = require('passport')
var { Strategy } = require('passport-twitter');
const { TwitterUser } = require('../db/schema');


passport.use(new Strategy({
    consumerKey: process.env.TWITTER_API_KEY,
    consumerSecret: process.env.TWITTER_API_SECRET,
    callbackURL: 'http://localhost:3000/auth/twitter/callback'
  },
  async function (token, tokenSecret, profile, done) {
    let user = await TwitterUser.findOne({twitterId: profile.id})

    if (!user){
      user = await TwitterUser.create({username: profile.username , twitterId: profile.id , name: profile.displayName , profile_picture: profile.photos[0].value})
    }
    console.log(user)
    done(null , user)

  }));


passport.serializeUser((user, done) => {
  done(null , {username: user.username , name: user.name , profilePicture: user.profile_picture})
})

passport.deserializeUser((user ,done) => {
  done(null , user)
})
