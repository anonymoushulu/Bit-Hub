const express = require('express');
const router = express.Router();
import passport from 'passport';
import jwt from 'jsonwebtoken';

// API routes
import auth from './auth.route';
import secret from './secret.route';

//
router.use(function (req, res, next) {
  res.contentType('application/json');
  next();
});

//
router.use('/auth', auth);

// Example of protected api call (need to be authenticated) 
router.use('/secret', passport.authenticate('jwt', {session: false}), secret);

router.get('*', function(req, res) {
  res.redirect('/login');
});

module.exports = router;
