import Users from '../models/user.model';
import config from '../config';
import jwt from 'jsonwebtoken';
import passport from 'passport';

import {sendEmail, randomString} from '../services/emailer.services';


/**
 * Registers new users in the database (email and password mandatory)
 *
 * @param req
 * @param res
 * @returns {Promise<*>}
 */
let register = async (req, res) => {
    try {

    const name = req.body.name;
    const email = req.body.email;
    const password = req.body.password;

    if (name && email && password) {
      Users.register(new Users({
        email: email,
        name: name,
        provider: 'local',
      }), password, (err, account) => {
        if (err) {
          return res.status(500).json({message: err.message});
        } else {
          passport.authenticate(
            'local', {
              session: false
            })(req, res, () => {
            res.status(200).json({message: 'Account for ' + account.email + ' has been successfully created!'});
          });
        }
      });
    } else {
      res.status(400).json({message: 'Name, email and password required.'});
    }
  } catch (err) {
        return res.status(500).json({message: 'Something wrong happened!'});
    }
};

/**
 * Authenticates users using local strategy (lookup of email and password in the database).
 * If successful, issues a new Json token.
 *
 * @param req
 * @param res
 * @param next
 * @returns {Promise<*>}
 */
let localAuth = async (req, res, next) => {
    try {

    const email = req.body.email;
    const password = req.body.password;

    if (email && password) {
      passport.authenticate('local', {session: false}, (err, user) => {
        if (user) {
          req.login(user, {session: false}, (err) => {
            if (err) {
              res.send(err);
            }
            const token = jwt.sign({
              id: user.id,
              email: user.email,
              name: user.name,
              provider: user.provider,
              createdAt: user.createdAt.toDateString()
            }, config.auth.jwtSecret, {expiresIn: config.auth.jwtExpiry});
            return res.json({email: user.email, token});
          });
        } else {
          return res.status(400).json({message: 'Incorrect email or password.'});
        }
      })(req, res);
    } else {
      res.status(400).json({message: 'Email and password required.'});
    }
  } catch (err) {
        return res.status(500).json({message: err.message});
    }
};

/**
* Change local users password.
*
*/
let changeUserPassword = async (req, res, next) => {
    try {

        const OldPassword = req.body.OldPassword;
        const password = req.body.password;
        const email = req.body.email;

        if (OldPassword && password && email) {

            Users.findByUsername(email).then((sanitizedUser) =>{
                if(sanitizedUser){
                    sanitizedUser.changePassword(OldPassword, password, (err) => {
                        if(err){
                            return res.status(400).json({message: 'Incorrect current password.'});
                        }
                        else{
                            return res.status(200).json({message: 'Password has been successfully changed.'});
                        }
                    });
                }
                else{
                    return res.status(500).json({message: 'This user does not exist.'});
                }
            }).catch((err) => {
                console.log(err);
                return null;
            });
        } else {
            return res.status(400).json({message: 'Both current and new password are required.'});
        }
    } catch (err) {
        return res.status(500).json({message: err.message});
    }
};

/**
 * Change local users name.
 *
 */
let changeName = async (req, res, next) => {
    try {

        const NewName = req.body.NewName;
        const email = req.body.email;

        if (NewName && email) {

            Users.findByUsername(email).then((sanitizedUser) =>{
                if(sanitizedUser){
                    sanitizedUser.name = NewName;
                    sanitizedUser.save((err) => {
                        if(err){
                            console.log(err);
                        }
                        else{
                            return res.status(200).json({message: 'Name has been successfully changed. Changes will take effect after log out.'});
                        }
                    })
                }
                else{
                    return res.status(500).json({message: 'This user does not exist.'});
                }
            }).catch((err) => {
                console.log(err);
                return null;
            });
        } else {
            return res.status(400).json({message: 'Name required.'});
        }
    } catch (err) {
        return res.status(500).json({message: err.message});
    }
};


/**
 * Request reset password.
 * An email with a reset url will be sent to user's registered email.
 * A randomly generated token will be used to verify the identity within 1 hour.
 */
let forgotPassword = async (req, res, next) => {
    try {

        const randomToken = randomString(20);
        const email = req.body.email;
        const emailData = {
            to: email,
            subject: '[Bitcoin Hub] Please Reset Your Password',
            text: `Please kindly use the following link (valid within 1 hour) to reset your password:<br /> http://localhost:3000/resetPassword/${randomToken}`,
            html: `<p>Please kindly use the following link (valid within 1 hour) to reset your password:<br /> http://localhost:3000/resetPassword/${randomToken}</p>`
        };

        if (email) {

            Users.findByUsername(email).then((sanitizedUser) =>{
                if(sanitizedUser){
                    sanitizedUser.resetPasswordToken = randomToken;
                    sanitizedUser.resetPasswordExpires = Date.now() + 3600000; //expired in 1 hour
                    sanitizedUser.save((err) => {
                        if(err){
                            console.log(err);
                        }
                        else{
                            sendEmail(emailData);
                            return res.status(200).json({message: 'Reset Password Email has been sent.'});
                        }
                    })
                } else {
                    return res.status(500).json({message: 'This user does not exist.'});
                }
            }).catch((err) => {
                console.log(err);
                return null;
            });
        } else {
            return res.status(400).json({message: 'Registered email required.'});
        }
    } catch (err) {
        return res.status(500).json({message: err.message});
    }
};


/**
 * Redirect to password reset page.
 * Update with the new password after comparing with the valid token and time.
 * Token will be destroyed in DB after sucessfully update the password.
 */

let resetPassword = async (req, res, next) => {
    try {

        const password = req.body.password;
        const checkToken = req.body.checkToken;
        if (password) {

            Users.findOne({ resetPasswordToken: checkToken, resetPasswordExpires: { $gt: Date.now() } }, (err, sanitizedUser) => {
                if(sanitizedUser){
                    sanitizedUser.setPassword(password, (err) => {
                        if(err){
                            console.log(err);
                        }
                        else{
                            sanitizedUser.resetPasswordToken =''; //destroy the Token
                            sanitizedUser.save((err) => {
                                if(err){
                                    console.log(err);
                                }
                                else{
                                    const emailData = {
                                        to: sanitizedUser.email,
                                        subject: '[Bitcoin Hub] Password Reset Successfully',
                                        text: `This is a confirmation that the password for your account ${sanitizedUser.email} has just been changed.`,
                                        html: `<p>This is a confirmation that the password for your account ${sanitizedUser.email} has just been changed.</p>`
                                    };
                                    sendEmail(emailData);
                                    return res.status(200).json({message: 'Password has been successfully reset. A confirmation email can be checked via your registered email.'});
                                }
                            });
                        }
                    });
                } else {
                    console.log(err);
                    return res.status(500).json({message: 'Password reset token is invalid or has expired.'});
                }
            });
        } else {
            return res.status(400).json({message: 'New password required.'});
        }
    } catch (err) {
        return res.status(500).json({message: err.message});
    }
};


/**
 * Authenticates users using github strategy.
 * If successful, issues a new Json token.
 */

let githubAuth = async (req, res, next) => {

    try {
        passport.authenticate('github', {
            session: false,
            scope: ['user']
        }, (err, user) => {
            if (user) {
                req.login(user, {session: false}, (err) => {
                    if (err) {
                        res.send(err);
                    }
                    const token = jwt.sign({
                        id: user.id,
                        email: user.email,
                        name: user.name,
                        photo: user.photo,
                        provider: user.provider,
                        createdAt: user.createdAt.toDateString()
                    }, config.auth.jwtSecret, {expiresIn: config.auth.jwtExpiry});

                    const encodedToken = encodeURIComponent(token);

                    res.status(200);
                    res.redirect('/social-login?token=' + encodedToken);

                });
            } else {
                return res.status(400).json({
                    message: 'The user is not authenticated.'
                });
            }
        })(req, res);
    } catch (err) {
        return res.status(500).send('An error occurred: ' + err);
    }
};

/**
 * Authenticates users using google strategy.
 * If successful, issues a new Json token.
 */
let googleAuth = async (req, res, next) => {
    try {
      passport.authenticate('google', {
      session: false,
      scope: ['profile', 'email']
    }, (err, user) => {
          if (user) {
              req.login(user, {session: false}, (err) => {
                  if (err) {
                      res.send(err);
                  }
                  const token = jwt.sign({
                      id: user.id,
                      email: user.email,
                      name: user.name,
                      photo: user.photo,
                      provider: user.provider,
                      createdAt: user.createdAt.toDateString()
                  }, config.auth.jwtSecret, {expiresIn: config.auth.jwtExpiry});

                  const encodedToken = encodeURIComponent(token);

                  res.status(200);
                  res.redirect('/social-login?token=' + encodedToken);

              });
          } else {
              return res.status(400).json({
                  message: 'The user is not authenticated.'
              });
          }
      })(req, res);
  } catch (err) {
        return res.status(500).send('An error occurred: ' + err);
    }
};

module.exports = { register, localAuth, changeUserPassword, changeName, forgotPassword, resetPassword, githubAuth, googleAuth };
