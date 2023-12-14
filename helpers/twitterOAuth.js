var passport = require('passport')
var { Strategy } = require('passport-twitter');

passport.use(new Strategy({
    consumerKey: process.env.TWITTER_API_KEY,
    consumerSecret: process.env.TWITTER_API_SECRET,
    callbackURL: 'http://localhost:3000/auth/twitter/callback'
  },
  function(token, tokenSecret, profile, done) {
    console.log(profile)
  }));
