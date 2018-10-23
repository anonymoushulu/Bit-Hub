import config from '../config';

const nodemailer = require('nodemailer');
const crypto = require('crypto');

const defaultEmailData = {from: 'no-reply@bitcoinhub.com'};

const sendEmail = (emailData) => {
    const fullEmailData = Object.assign(defaultEmailData, emailData);
    const Transporter = nodemailer.createTransport({
        host: config.emailSender.host,
        port: config.emailSender.port,
        secure: false,
        auth: {
            user: config.emailSender.user,
            pass: config.emailSender.pass
        },
    });
    return Transporter
        .sendMail(fullEmailData)
        .then(info => console.log(`Message sent: ${info.response}`))
        .catch(err => console.log(`Problem sending email: ${err}`))
};

const randomString = (length) => {
    const buf = crypto.randomBytes(length);
    return buf.toString('hex');
};

module.exports = {sendEmail, randomString};

