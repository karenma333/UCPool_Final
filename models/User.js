const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const config = require('../config');
const mailComposer = require('mailcomposer');
const mailGun = require('mailgun-js')(config.mailGunConfig);
const FB = require('fb');

const jade = require('jade');
const fs = require('fs');
let verEmailTemplate = null;
fs.readFile('./views/verificationEmail.jade', 'utf8', (err, data) => {
  if (err)
    throw err;
  verEmailTemplate = jade.compile(data);
});

const userSchema = new mongoose.Schema({
  email: String,
  facebookId: String,
  facebookToken: String,
  verified: {type: Boolean, default: false}
});


/**
 * Send the verification email for the user
 * @param next callback (err)
 */
userSchema.methods.sendVerificationEmail = function(next) {
  let user = this;
  let verToken = jwt.sign({}, config.secret, {issuer: user.id});
  let verificationLink = config.hostUrl + 'verify?token=' + verToken;
  let mail = mailComposer({
    from: 'info@ucpool.com',
    to: user.email,
    subject: 'Please verify you UCPool account',
    html: verEmailTemplate({verificationLink})
  });
  mail.build((err, message) => {
    let dataToSend = {
      to: user.email,
      message: message.toString('ascii')
    };
    mailGun.messages().sendMime(dataToSend, (err, body) => {
      next(err);
    });
  });
};


/**
 * Use the short lived token and make a call to Facebook to get a long lived token
 * and save it to the DB
 * @param token short lived FB access token from the client side
 * @param next callback (err, user)
 */
userSchema.methods.updateFacebookToken = function (token, next) {
  let user = this;
  let fb = new FB.Facebook();
  FB.api('/oauth/access_token', {
    client_id: config.facebookAppId,
    client_secret: config.facebookAppSecret,
    grant_type: 'fb_exchange_token',
    fb_exchange_token: token
  }, function (fbRes) {
    if (fbRes.error) {
      return next(new Error('Invalid token provided.'));
    }
    user.facebookToken = fbRes.access_token;
    user.save(next);
  });
};

/**
 * Register the user in the database
 * @param user User to register in the database
 * @param next callback (err, user)
 */
userSchema.statics.register = function (user, next) {
  this.findOne({$or: [{email: user.email}, {facebookId: user.facebookId}]}, (err, query) => {
    if (err) {
      return next(err, null);
    }
    if (query) { // User already exists
      return next(new Error(('This ' + ((query.email === user.email) ? 'email' : 'facebook account') +
        ' has already been registered.')), null);
    }
    user.save((err, usr) => next(err, usr));
  })
};

module.exports = mongoose.model('User', userSchema);