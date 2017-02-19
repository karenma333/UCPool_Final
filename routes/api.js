const express = require('express');
const router = express.Router();
const events = require('./events');
const config = require('../config');
const User = require('../models/User');
const RefreshToken = require('../models/RefreshToken');
const jwt = require('jsonwebtoken');
const FB = require('fb');
const emailRegex = /^(([^<>()\[\]\.,;:\s@\"]+(\.[^<>()\[\]\.,;:\s@\"]+)*)|(\".+\"))@(([^<>()[\]\.,;:\s@\"]+\.)+[^<>()[\]\.,;:\s@\"]{2,})$/i;
const two_weeks_millis = 14 * 24 * 3600000;
const webHook = require('./webHook');

router.use('/webhook', webHook);
router.use('/events', events);

/**
 * GET: /api/me
 * Get basic user info
 *
 * EXPECTS: None
 * RESPONDS: {name, id} : id refers to the facebook id
 *          Code 401 if not logged in
 */
router.get('/me', (req, res) => {
  if (!req.userId) {
    return res.sendStatus(401);
  }
  User.findById(req.userId, (err, user) => {
    if (err || !user) {
      return res.sendStatus(500);
    }
    let fb = new FB.Facebook();
    fb.setAccessToken(user.facebookToken);
    fb.api('/me', (fbRes) => {
      if (fbRes.error) {
        if (fbRes.error.code === 190) { // User unauthenticated us from facebook
          user.facebookToken = null;
          return user.save((err) => {
            res.clearCookie('Authorization', null);
            res.sendStatus(401);
          });
        } else {
          res.sendStatus(500);
        }
      }
      res.json(fbRes);
    });
  });
});

/**
 * POST: /api/login
 * Login a user
 *
 * EXPECTS: {token}
 * RESPONDS: code 200 if all OK,
 *          401 if user not registered,
 *          403 if user is not verified,
 *          400 with error JSON
 */
router.post('/login', (req, res) => {
  if (!req.body.token) {
    return res.status(400).json({error: 'Missing token.'});
  }
  let fb = new FB.Facebook();
  fb.setAccessToken(req.body.token);
  fb.api('me', (fbRes) => {
    if (!fbRes || fbRes.error) {
      res.status(400).json({error: 'Invalid Facebook access token'});
    }
    User.findOne({'facebookId': fbRes.id}, (err, user) => {
      if (err) {
        return res.sendStatus(500);
      }
      if (!user) {
        return res.sendStatus(401);
      }
      if (!user.verified) {
        return res.sendStatus(403);
      }
      user.updateFacebookToken(req.body.token, (err, user) => {
        if (err) {
          return res.sendStatus(500);
        }

        // Generate the refresh token
        let refreshToken = new RefreshToken({user: user._id});
        refreshToken.save((err, refToken) => {
          if (err)
            return res.sendStatus(500);

          const token = jwt.sign({refreshToken: refToken._id, refLastUpdated: refToken.lastUpdated},
            config.secret, {expiresIn: '5m', issuer: user.id});

          res.cookie('Authorization', token, {maxAge: two_weeks_millis, signed: true, httpOnly: false});
          res.sendStatus(200);
        });
      });
    });
  });
});

/**
 * POST: /api/register
 * Register a user
 *
 * EXPECTS: {token, email}
 * RESPONDS: code 200 if all OK,
 *          400 with error json
 */
router.post('/register', (req, res) => {
  if (!(req.body.email && req.body.token)) {
    return res.status(400).json({error: 'Missing fields.'});
  }
  if (!emailRegex.test(req.body.email) || !req.body.email.endsWith('@ucsd.edu')) {
    return res.status(400).json({error: 'Not a valid UCSD email.'});
  }
  let fb = new FB.Facebook();
  fb.setAccessToken(req.body.token);
  fb.api('me', (fbRes) => {
    if (!fbRes || fbRes.error) {
      res.status(400).json({error: 'Invalid Facebook access token'});
    }
    let user = new User({email: req.body.email, facebookId: fbRes.id, facebookToken: req.body.token, verified: false});
    User.register(user, (err, user) => {
      if (err) {
        return res.status(400).json({error: err.message});
      }
      res.sendStatus(200);
      user.sendVerificationEmail((err) => {});
      user.updateFacebookToken(user.facebookToken, () => {});
    });
  });
});


/**
 * POST: /api/resend_confirmation
 * Resend a confirmation email to the user
 *
 * EXPECTS: {token}
 * RESPONDS: Code 200 if all OK,
 *          400 with error json
 */
router.post('/resend_verification', (req, res) => {
  if (!req.body.token) {
    return res.status(400).json({error: 'Missing fields.'});
  }
  let fb = new FB.Facebook();
  fb.setAccessToken(req.body.token);
  fb.api('me', (fbRes) => {
    if (!fbRes || fbRes.error) {
      res.status(400).json({error: 'Invalid Facebook access token'});
    }
    User.findOne({'facebookId': fbRes.id}, (err, user) => {
      if (err) {
        return res.sendStatus(500);
      }
      if (!user) {
        return res.status(400).json({error: 'This Facebook account was never registered with us.'});
      }
      if (user.verified) {
        return res.status(400).json({error: 'This email has already been verified.'});
      }
      user.sendVerificationEmail(err => {
        if (err) {
          return res.sendStatus(500);
        }
        res.sendStatus(200);
        user.updateFacebookToken(req.body.token, ()=>{});
      });
    });
  });
});

/**
 * POST: /api/logout
 * Log the current user out
 */
router.post('/logout', (req, res) => {
  res.clearCookie('Authorization', null);
  if (!req.userId)
    return res.sendStatus(401);

  RefreshToken.findByIdAndRemove(req.refreshToken, (err, token) => {
    if (err)
      return res.sendStatus(500);

    if (!token)
      return res.status(400).json({error: 'Invalid token in header.'});

    res.sendStatus(200);
  });
});

module.exports = router;
