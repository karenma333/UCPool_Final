const express = require('express');
const router = express.Router();
const events = require('../events.json');
const User = require('../models/User');
const Event = require('../models/Event');
const publicFields = 'name description startTime fbEventId cover';


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
  let now = new Date();

  User.findById(req.userId, 'events.eventId events.dismissed', (err, user) => {
    if (err || !user) {
      return res.sendStatus(500);
    }
    let eventIds = user.events.filter(event => {
      return !event.dismissed;
    }).map(event => {
      return event.eventId;
    });
    Event.find({
        _id: {$in: eventIds},
        startTime: {$gt: now}
      }, publicFields,
      {sort: {startTime: 1}},
      (err, events) => {
        if (err) {
          return res.sendStatus(500);
        }
        res.json(events);
      });
  });
});


/**
 * GET: /api/events/dismissed
 *
 * Get the users dismissed events
 *
 * EXPECTS: Nothing
 *
 * RESPONDS: [{name description startTime fbEventId cover}],
 *        Code 401 is no user is logged in
 */
router.get('/dismissed', (req, res) => {
  if (!req.userId) {
    return res.sendStatus(401);
  }

  User.findById(req.userId, (err, user) => {
    if (err || !user) {
      return res.sendStatus(500);
    }
    let eventIds = user.events.filter(event => {
      return event.dismissed;
    }).map(event => {
      return event.eventId;
    });
    Event.find({
        _id: {$in: eventIds}
      }, publicFields,
      {sort: {startTime: 1}},
      (err, events) => {
        if (err) {
          return res.sendStatus(500);
        }
        res.json(events);
      });
  });
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


/**
 * PUT: /api/events/:id/dismiss
 *
 * Restore a dismissed event for the logged in user
 *
 * EXPECTS: Nothing
 * RESPONDS: Code 200 if all OK,
 *          Code 401 if no user is logged in,
 *          Code 404 user is not associated to the event id
 */
router.put('/:id/restore', (req, res) => {
  if (!req.userId) {
    return res.sendStatus(401);
  }

  User.findById(req.userId, (err, user) => {
    if (err || !user) {
      return res.sendStatus(500);
    }

    for (let i = 0; i < user.events.length; i++) {
      if (user.events[i].eventId == req.params.id) {
        user.events[i].dismissed = false;
        user.save((err) => {
          if (err)
            return res.sendStatus(500);
          Event.findOne({$or: [{fbEventId: req.params.id}, {_id: req.params.id}]}, (err, event) => {
            if (err || !event) {
              return res.sendStatus(500);
            }
            let contains = false;
            for (let i = 0; i < event.participants.length; i++) {
              if (event.participants[i] == user.id) {
                contains = true;
                break;
              }
            }
            if (contains) {
              return res.sendStatus(200);
            }
            event.participants.push(user.id);
            event.save((err) => {
              if (err) {
                return res.sendStatus(500);
              }
              res.sendStatus(200);
            });
          });
        });
        return;
      }
    }
    res.sendStatus(404);
  });
});

module.exports = router;
