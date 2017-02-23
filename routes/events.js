const express = require('express');
const router = express.Router();
const events = require('../events.json');
const User = require('../models/User');
const Event = require('../models/Event');


/**
 * GET: /api/events/all
 *
 * Get all the events for the currently logged in user
 *
 * EXPECTS: Nothing
 * RESPONDS: [{id, title, description, location, date, time}],
 *          Code 401 if no user is logged in
 */
router.get('/upcoming', (req, res) => {
  if (!req.userId) {
    return res.sendStatus(401);
  }

  setTimeout(()=> {
    res.json(events);
  }, 2000);
});


/**
 * PUT: /api/events/:id/dismiss
 *
 * Dismiss the event for the logged in user
 *
 * EXPECTS: Nothing
 * RESPONDS: Code 200 if all OK,
 *          Code 401 if no user is logged in,
 *          Code 404 user is not associated to the event id
 */
router.put('/:id/dismiss', (req, res) => {
  if (!req.userId) {
    return res.sendStatus(401);
  }

  User.findById(req.userId, (err, user) => {
    if (err || !user) {
      return res.sendStatus(500);
    }

    for (let i = 0; i < user.events.length; i++) {
      if (user.events[i].eventId == req.params.id) {
        user.events[i].dismissed = true;
        user.save((err) => {
          if (err)
            return res.sendStatus(500);
          Event.decoupleUser(user, req.params.id, err => {
            if (err) {
              return res.sendStatus(500);
            }
            res.sendStatus(200);
          });
        });
        return;
      }
    }
    res.sendStatus(404);
  });
});

module.exports = router;
