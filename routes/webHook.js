const express = require('express');
const router = express.Router();
const config = require('../config');
const User = require('../models/User');
const FB = require('fb');
const Event = require('../models/Event');

router.get('/facebook', (req, res) => {
  res.status(200);
  if (req.query['hub.verify_token'] === config.facebookVerifyToken) {
    res.send(req.query['hub.challenge']);
  } else {
    res.send();
  }
});

router.post('/facebook', (req, res) => {
  let entry = req.body.entry[0];
  if (entry.changed_fields.includes('events')) {
    // Event changes
    User.findOne({facebookId: entry.uid}, (err, user) => {
      if (err || !user || !user.verified) {
        return;
      }
      user.fetchFacebookEvents();
    });
  }
  res.sendStatus(200);
});

module.exports = router;