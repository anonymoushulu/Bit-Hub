import User from '../../models/user.model';
import config from '../../config';
import { Strategy as GitHubStrategy} from "passport-github";

const params = {
    clientID: config.githubAuth.clientID,
    clientSecret: config.githubAuth.clientSecret,
    callbackURL: config.githubAuth.callbackURL
};

module.exports = new GitHubStrategy(params, (accessToken, refreshToken, profile, done) => {
    //console.log('===== GITHUB PROFILE =======');
    //console.log(profile);
    //console.log('======== END ===========');
    User.findOne({ githubId: profile.id }, (err, currentUser) => {
        if(err){
            console.log('Error!! trying to find user with githubId');
            console.log(err);
            return done(null, false);
        }
        if(currentUser){
            return done(null, currentUser);
        }
        else{
            const newGitHubUser = new User({
                provider: profile.provider,
                githubId: profile.id,
                name: profile.displayName,
                email: profile.emails[0].value,
                photo: profile.photos[0].value
            });
            newGitHubUser.save((err, savedUser) => {
                if (err) {
                    console.log('Error!! saving the new github user');
                    console.log(err);
                    return done(null, false)
                } else {
                    return done(null, savedUser)
                }
            })
        }
    });
});