const passport=require("passport");
const GoogleStrategy = require( 'passport-google-oauth2' ).Strategy;
// passport.use(
//     new GoogleStrategy(
//         {
//             clientID:process.env.CLIENT_ID,
//             clientSecret:process.env.CLIENT_SECRET,
//             callbackURL:"/auth/google/callback",
//             scope:["profile","email"],
//         },
//         function(accessToken, refreshToken,profile,callback){
//             callback(null,profile);
//         }
//     )
// );

// passport.serializeUser((user,done)=>{
//     done(null,user)
// })
 
// ----------------------------------------------
// var GoogleStrategy = require( 'passport-google-oauth2' ).Strategy;



//             clientID:process.env.CLIENT_ID,
//             clientSecret:process.env.CLIENT_SECRET,
passport.use(new GoogleStrategy({
    clientID:     '\fsdf',
    clientSecret: 'ffdsfd',
    callbackURL:"http://localhost:8070/auth/google/callback",
    passReqToCallback   : true
  },
  function(request, accessToken, refreshToken, profile, done) {
    done(null,profile)

    //create user in mongo here

    // User.findOrCreate({ googleId: profile.id }, function (err, user) {
    //   return done(err, user);
    // });
  }

));

passport.serializeUser((user,done)=>{
    done(null,user);
})

passport.deserializeUser((user,done)=>{
    done(null,user)
})