const express = require('express');
const router = express.Router();
const config = require('../config');

router.get('/facebook', (req, res) => {
  res.status(200);
  if (req.query['hub.verify_token'] === config.facebookVerifyToken) {
    res.send(req.query['hub.challenge']);
  } else {
    res.send();
  }
});

router.post('/facebook', (req, res) => {
  res.sendStatus(200);
});

module.exports = router;