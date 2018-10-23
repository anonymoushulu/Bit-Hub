import passport from 'passport';

import local from './auth/local';
import google from './auth/google';
import github from './auth/github';
import jwt from './auth/jwt';

module.exports = function() {

  // strategies to use
  passport.use(local);
  passport.use(jwt);
  passport.use(google);
  passport.use(github);

  return {
    initialize: function() {
      return passport.initialize();
    },
  };
};