const express = require('express');
const router = express.Router();
const User = require('../models/User');


/**
 * POST: /api/user/register_fcm_token
 *
 * Registers user's app instance by the provided fcm token to send push
 * notifications in the future
 *
 * EXPECTS: {token}
 *
 * RESPONDS: Code 200 if all OK,
 *          400 with error json,
 *          401 if user not logged in
 */
router.post('/register_fcm_token', (req, res) => {
  if (!req.userId) {
    return res.sendStatus(401);
  }

  if (!req.body.token) {
    return res.status(400).json({ error: 'Token not provided' });
  }

  // TODO check token validity with Firebase

  User.registerFcmToken(req.userId, req.body.token, (err, user) => {
    if (err) {
      return res.sendStatus(500);
    }
    res.cookie('fcmToken', req.body.token, {signed: true, httpOnly: false, expires: new Date(253402300000000)});
    res.sendStatus(200);
  });
});


/**
 * POST: /api/user/refresh_fcm_token
 *
 * Refresh the current instance's fcm token
 *
 * EXPECTS: {token}
 *
 * RESPONDS: Code 200 if all OK,
 *          400 with error json,
 *          401 if user not logged in
 */
router.post('/refresh_fcm_token', (req, res) => {
  if (!req.userId) {
    return res.sendStatus(401);
  }

  if (!req.body.token) {
    return res.status(400).json({ error: 'Token not provided' });
  }

  if (!req.signedCookies.fcmToken) {
    res.status(400).json({error: 'Current instance was never registered with any token'});
  }

  // TODO check token validity with Firebase

  User.removeFcmToken(req.userId, req.signedCookies.fcmToken, (err, user) => {
    if (err || !user) {
      res.sendStatus(500);
    }
    res.clearCookie('fcmToken', null);
    user.registerFcmToken(req.body.token, (err, user) => {
      if (err) {
        return res.sendStatus(500);
      }
      res.cookie('fcmToken', req.body.token, {signed: true, httpOnly: false, expires: new Date(253402300000000)});
      res.sendStatus(200);
    });
  });
});

module.exports = router;