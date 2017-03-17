const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const config = require('../config');
const mailComposer = require('mailcomposer');
const mailGun = require('mailgun-js')(config.mailGunConfig);
const FB = require('fb');
const Event = require('./Event');
const admin = require('firebase-admin');
const jade = require('jade');
const fs = require('fs');
let verEmailTemplate = null;
fs.readFile('./views/verificationEmail.jade', 'utf8', (err, data) => {
  if (err)
    throw err;
  verEmailTemplate = jade.compile(data);
});

const userSchema = new mongoose.Schema({
  firstName: String,
  lastName: String,
  email: String,
  facebookId: String,
  facebookToken: String,
  verified: {type: Boolean, default: false},
  events: [{eventId: {type: mongoose.Schema.Types.ObjectId, unique: true}, fbEventId: String, dismissed: Boolean}],
  fcmTokens: [String]
});


/**
 * Remove an fcm token from user
 * @param userId User id
 * @param token fcm token to remove
 * @param next callback (err, user)
 */
userSchema.statics.removeFcmToken = function (userId, token, next) {
  this.findById(userId, (err, user) => {
    if (err) {
      return next(err, null);
    }
    user.removeFcmToken(token, next);
  });
};


/**
 * Remove an fcm token from user
 * @param token fcm token to remove
 * @param next callback (err, user)
 */
userSchema.methods.removeFcmToken = function (token, next) {
  let user = this;
  let index = user.fcmTokens.indexOf(token);
  if (index !== -1) {
    user.fcmTokens.splice(index, 1);
  }

  user.save(err => {
    if (err) {
      return next(err, null);
    }
    return next(null, user);
  });
};


/**
 * Register an fcm token with the user
 * @param userId User id
 * @param token FCM token
 * @param next callback (err, user)
 */
userSchema.statics.registerFcmToken = function (userId, token, next) {
  this.findById(userId, (err, user) => {
    if (err) {
      return next(err, null);
    }
    user.registerFcmToken(token, next);
  });
};


/**
 * Register an fcm token with the user
 * @param token FCM token
 * @param next callback (err, user)
 */
userSchema.methods.registerFcmToken = function (token, next) {
  let user = this;
  if (!user.fcmTokens.includes(token)) {
    user.fcmTokens.push(token);
  }

  user.save(err => {
    if (err) {
      return next(err, null);
    }
    return next(null, user);
  });
};


/**
 * Send the verification email for the userRoute
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
 * @param next callback (err, userRoute)
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
 * Update userRoute's name from Facebook
 * @param next callback (err)
 */
userSchema.methods.updateNameFromFacebook = function (next) {
  let user = this;
  let fb = new FB.Facebook();
  fb.setAccessToken(user.facebookToken);
  fb.api('/me?fields=first_name,last_name', fbRes => {
    if (!fbRes || fbRes.error) {
      return next(new Error((fbRes) ? fbRes.error : 'Nothing received from facebook.'));
    }
    user.firstName = fbRes.first_name;
    user.lastName = fbRes.last_name;
    user.save(next);
  });
};

/**
 * Register the userRoute in the database
 * @param user User to register in the database
 * @param next callback (err, userRoute)
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


userSchema.methods.fetchFacebookEvents = function () {
  let user = this;
  let fb = new FB.Facebook();
  fb.setAccessToken(user.facebookToken);
  fb.api('/' + user.facebookId + '/events?fields=id,name,description,start_time,cover,place', function (fbRes) {
    if (!fbRes || fbRes.error || !fbRes.data) {
      return;
    }

    let now = (new Date()).getTime();
    let finalEvents = fbRes.data.filter(event => {
      // Only use events with location and in the future
      return event.place && ((new Date(event.start_time)).getTime() > now);
    });


    // New events added
    let newEvents = [];
    finalEvents.forEach(fbEvent => {
      let exists = false;
      for (let i = 0; i < user.events.length; i++) {
        if (user.events[i].fbEventId === fbEvent.id) {
          exists = true;
          break;
        }
      }
      if (!exists) {
        // New Event for the userRoute
        newEvents.push(fbEvent);
      }
    });

    user.events.forEach(userEvent => {
      let exists = false;
      for (let i = 0; i < fbRes.data.length; i++) {
        if (userEvent.fbEventId == fbRes.data[i].id) {
          exists = true;
          break;
        }
      }
      if (!exists) {
        // User selected 'Not Going' on facebook
        Event.removeParticipant(user, userEvent.eventId, (err) => {
          if (err) {
            return;
          }
          user.events.splice(user.events.indexOf(userEvent), 1);
          user.save();
        });
      }
    });

    user.save(() => {
      Event.registerParticipant(user, newEvents, () => {});
    });
  });
};

userSchema.methods.sendPushAsRider = function (event) {
  let user = this;
  if (user.fcmTokens.length === 0) {
    return;
  }
  event.rides.forEach(ride => {
    for (let i = 0; i < ride.offers.length; i++) {
      if (ride.offers[i].userId == user.id) {
        mongoose.model('User', userSchema).findById(ride.driver.toString(), (err, driver) => {
          if (err || !driver) {
            return;
          }
          let payload = {
            notification: {
              title: 'Ride Found',
              body: driver.firstName + ' can drive you to ' + event.name,
              icon: 'https://graph.facebook.com/' + driver.facebookId + '/picture?height=400&width=400',
              click_action: 'https://www.ucpool.com/rides/pending/'
            }
          };
          admin.messaging().sendToDevice(user.fcmTokens, payload);
        });
      }
    }
  });
};


userSchema.methods.sendPushAsDriver = function (event) {
  let user = this;
  if (user.fcmTokens.length === 0) {
    return;
  }
  let payload = {
    notification: {
      title: 'Passengers Found',
      body: 'We found some people that you can drive to ' + event.name,
      icon: 'https://www.ucpool.com/images/logo.png',
      click_action: 'https://www.ucpool.com/rides/pending/'
    }
  };
  admin.messaging().sendToDevice(user.fcmTokens, payload);
};

module.exports = mongoose.model('User', userSchema);