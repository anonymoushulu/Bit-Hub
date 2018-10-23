const config = {};

config.admin={};
config.admin.name="comp5703cp225";
config.admin.email="";

// App

config.app={};
config.app.name="comp5703cp225";
config.app.url="";
config.app.port="3000";
config.app.dbURI="mongodb://comp5703cp225:69g7pixaFDxbbxVuYaHQpf7@ds137642-a0.mlab.com:37642,ds137642-a1.mlab.com:37642/comp5703cp225?replicaSet=rs-ds137642";

// Auth

config.auth={};

config.auth.jwtSecret="YYHUferqeP3msU74eN+;4#CvvtiY^p";
config.auth.jwtSession="false";
config.auth.jwtExpiry="1d";

//GitHub Auth

config.githubAuth={};

config.githubAuth.clientID="c5869a3de38307ecccbd";
config.githubAuth.clientSecret="5c122c29ee7ebd34e485e3fdaede0867b9b80fe3";
config.githubAuth.callbackURL="http://localhost:3000/api/auth/github/callback";


//Google Auth

config.googleAuth={};

config.googleAuth.clientID="433173328169-3tj3lbvqqb0gkchliu85onee1kpkvmlo.apps.googleusercontent.com";
config.googleAuth.clientSecret="pDtL7Vr4-_2h3lv-JZWLhnTR";
config.googleAuth.callbackURL="http://localhost:3000/api/auth/google/callback";


//Forget password email sender

config.emailSender={};

config.emailSender.host="smtp.ethereal.email";
config.emailSender.port="587";
config.emailSender.user="iccn4mplac4m77pn@ethereal.email";
config.emailSender.pass="cT3nrh1RXGWZE8XyY9";

module.exports=config;