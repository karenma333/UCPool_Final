const User = require('../models/User');
const jwt = require('jsonwebtoken');
const config = require('../config');
const RefreshToken = require('../models/RefreshToken');
const two_weeks_millis = 14 * 24 * 3600000;

module.exports = (req, res, next) => {
  if (!req.query.token) {
    return next();
  }
  jwt.verify(req.query.token, config.secret, { algorithms: ['HS256'], ignoreExpiration: true }, (err, payload) => {
    if (err || !payload)
      return next();
    User.findById(payload.iss, (err, user) => {
      if (err || !user)
        return next();
      if (user.verified)
        return next();
      user.verified = true;
      user.save((err) => {
        if (err)
          return next();

        // Generate the refresh token
        let refreshToken = new RefreshToken({user: user._id});
        refreshToken.save((err, refToken) => {
          if (err)
            return next();

          const token = jwt.sign({refreshToken: refToken._id, refLastUpdated: refToken.lastUpdated},
            config.secret, {expiresIn: '5m', issuer: user.id});

          res.cookie('Authorization', token, {maxAge: two_weeks_millis, signed: true, httpOnly: false});
          res.render('emailVerified');
        });
      });
    });
  });
};