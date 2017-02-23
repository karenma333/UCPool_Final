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
      if (err || !user) {
        return;
      }
      let fb = new FB.Facebook();
      fb.setAccessToken(user.facebookToken);
      fb.api('/' + entry.uid + '/events', function (fbRes) {
        let now = (new Date()).getTime();
        let finalEvents = [];
        fbRes.data.forEach(event => {
          if ((new Date(event.start_time)).getTime() <= now || !event.place) // Past events or event without location
            return;
          finalEvents.push(event);
        });

        // New events added
        finalEvents.forEach(fbEvent => {
          let exists = false;
          for (let i = 0; i < user.events.length; i++) {
            if (user.events[i].fbEventId === fbEvent.id) {
              exists = true;
              break;
            }
          }
          if (!exists) {
            // New Event for the user
            Event.registerParticipant(user, fbEvent, () => {});
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
            Event.decoupleUser(user, userEvent.eventId, (err) => {});
          }
        });
      });
    });
  }
  res.sendStatus(200);
});

module.exports = router;