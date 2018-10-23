import User from '../../models/user.model';
import config from '../../config';

import { ExtractJwt, Strategy as JwtStrategy } from 'passport-jwt';

const params = {
  secretOrKey: config.auth.jwtSecret,
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken()
};

module.exports = new JwtStrategy(params, (jwtPayload, done) => {
  User.findById(jwtPayload.id, (err, user) => {
    if (err) {
      return done(err, false);
    }
    if (user) {
      return done(null, user);
    } else {
      return done(null, false);
    }
  });
});