import User from '../../models/user.model';
import config from '../../config';
import {OAuth2Strategy as GoogleStrategy} from 'passport-google-oauth';

const params = {
  clientID: config.googleAuth.clientID,
  clientSecret: config.googleAuth.clientSecret,
  callbackURL: config.googleAuth.callbackURL
};

module.exports = new GoogleStrategy(params, (accessToken, refreshToken, profile, done) => {
  //console.log('===== GOOGLE PROFILE =======');
  //console.log(profile);
  //console.log('======== END ===========');
  User.findOne({googleId: profile.id}, (err, currentUser) => {
    if (err) {
      console.log('Error!! trying to find user with googleId');
      console.log(err);
      return done(null, false);
    }
    if (currentUser) {
      return done(null, currentUser);
    }
    else {
      const originalPhoto = profile.photos[0].value;
      const largePhoto = originalPhoto.substring(0, originalPhoto.length-6);
      const newGoogleUser = new User({
        provider: profile.provider,
        googleId: profile.id,
        name: profile.displayName,
        email: profile.emails[0].value,
        photo: largePhoto
      });
      newGoogleUser.save((err, savedUser) => {
        if (err) {
          console.log('Error!! saving the new google user');
          console.log(err);
          return done(null, false)
        } else {
          return done(null, savedUser)
        }
      })
    }
  });
});

