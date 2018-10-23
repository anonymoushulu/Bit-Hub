import passport from "passport/lib/index";

const express = require('express');
const router = express.Router();
const AuthController = require('../../controllers/auth.controller');

router.post('/register', (req, res) => {
  AuthController.register(req, res);
});

router.post('/localAuth', (req, res, next) => {
  AuthController.localAuth(req, res, next);
});

router.post('/changeUserPassword', (req, res, next) => {
    AuthController.changeUserPassword(req, res, next);
});

router.post('/changeName', (req, res, next) => {
    AuthController.changeName(req, res, next);
});

router.post('/forgotPassword', (req, res, next) => {
    AuthController.forgotPassword(req, res, next);
});

router.post('/resetPassword', (req, res, next) => {
    AuthController.resetPassword(req, res, next);
});

// Social Login Routes
router.get('/google',
  passport.authenticate('google', { scope: ['profile', 'email'], session : false }));

router.get('/google/callback', (req, res, next) => {
  AuthController.googleAuth(req, res, next);
});

router.get('/github',
  passport.authenticate('github', { scope: ['user'], session : false }));

router.get('/github/callback', (req, res, next) => {
  AuthController.githubAuth(req, res, next);
});

module.exports = router;
