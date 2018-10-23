import mongoose from 'mongoose';
import passportLocalMongoose from 'passport-local-mongoose';

const user = new mongoose.Schema({
  email: {
    type: String,
  },
  password: {
    type: String
  },
  name: {
    type: String,
  },
  photo: {
    type: String,
  },
  provider: {
    type: String,
  },
  googleId: {
    type: String
  },
  githubId: {
    type: String
  },
  resetPasswordToken: {
    type: String
  },
  resetPasswordExpires: {
    type: Date
  },
}, {
  timestamps: true
});

user.plugin(passportLocalMongoose, { usernameField: 'email', errorMessages : { UserExistsError : 'A user with the given email address is already registered.' } });

module.exports = mongoose.model('user', user);

