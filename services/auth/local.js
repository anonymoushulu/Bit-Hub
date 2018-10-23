import User from '../../models/user.model';
import { Strategy as LocalStrategy } from 'passport-local';

module.exports = new LocalStrategy({
      usernameField: 'email',
      passwordField: 'password'
    },
    User.authenticate()
);
