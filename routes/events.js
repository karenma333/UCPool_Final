const express = require('express');
const router = express.Router();
const events = require('../events.json');
const User = require('../models/User');
const Event = require('../models/Event');
const publicFields = 'name description startTime fbEventId cover';


/**
 * GET: /api/events/upcoming
 *
 * Get all the upcoming events for the currently logged in userRoute
 *
 * EXPECTS: Nothing
 * RESPONDS: [{name, description, startTime, fbEventId, cover}],
 *          Code 401 if no userRoute is logged in
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
        startTime: {$gt: now},
        participants: user.id
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
 * GET: /api/events/upcoming
 *
 * Get all the pending events for the currently logged in userRoute
 *
 * EXPECTS: Nothing
 * RESPONDS: [{name, description, startTime, fbEventId, cover, driver || riders: []}],
 *          Code 401 if no userRoute is logged in
 */
router.get('/pending', (req, res) => {
  if (!req.userId) {
    return res.sendStatus(401);
  }
  User.findById(req.userId, (err, user) => {
    if (err || !user) {
      return res.sendStatus(500);
    }
    let eventIds = user.events.map(event => event.eventId);
    Event.find({
      _id: {$in: eventIds},
      $or: [
        {
          'rides.driver': user.id,
          'rides.offers': {$elemMatch: {approved: false}}
        },
        {
          'rides.offers.userId': user.id,
          'rides.offers.approved': true
        }
      ]
    }, (err, events) => {
      if (err || !events) {
        return res.sendStatus(500);
      }
      let pending = [];
      let usersSet = new Set();
      events.forEach(event => {
        let pendingEvent = {
          name: event.name,
          description: event.description,
          startTime: event.startTime,
          fbEventId: event.fbEventId,
          cover: event.cover,
          _id: event.id
        };
        let driver = false;
        let ride = null;
        rideFor: for (let i = 0; i < event.rides.length; i++) {
          if (event.rides[i].driver == user.id) {
            ride = event.rides[i];
            driver = true;
            break;
          }
          let offers = event.rides[i].offers;
          for (let j = 0; j < offers.length; j++) {
            if (offers[j].userId == user.id) {
              ride = event.rides[i];
              break rideFor;
            }
          }
        }
        if (driver) {
          pendingEvent.riders = ride.offers.filter(offer => !(offer.approved)).map(offer => {
            usersSet.add(offer.userId);
            return {_id: offer.userId.toString()}
          });
        } else {
          usersSet.add(ride.driver);
          pendingEvent.driver = {_id: ride.driver.toString()};
        }
        pending.push(pendingEvent);
      });
      User.find({_id: {$in: Array.from(usersSet)}}, (err, users) => {
        if (err || !users) {
          return res.sendStatus(500);
        }
        let userMap = {};
        users.forEach(user => {
          userMap[user.id] = {facebookId: user.facebookId, firstName: user.firstName, lastName: user.lastName};
        });
        pending.forEach(pendingEvent => {
          if (pendingEvent.driver) {
            pendingEvent.driver = Object.assign(pendingEvent.driver, userMap[pendingEvent.driver._id]);
          } else {
            for (let i = 0; i < pendingEvent.riders.length; i++) {
              pendingEvent.riders[i] = Object.assign(pendingEvent.riders[i], userMap[pendingEvent.riders[i]._id]);
            }
          }
        });
        res.json(pending);
      });
    });
  });
});


router.get('/confirmed', (req, res) => {
  if (!req.userId) {
    return res.sendStatus(401);
  }
  User.findById(req.userId, (err, user) => {
    let eventIds = user.events.map(event => event.eventId);
    Event.find({
      _id: {$in: eventIds},
      $or: [
        {
          'rides.driver': user.id,
          'rides.passengers': {$ne: []}
        },
        {
          'rides.passengers.userId': user.id
        }
      ]
    }, (err, events) => {
      if (err || !events) {
        return res.sendStatus(500);
      }

      let usersSet = new Set();
      let confirmed = [];
      events.forEach(event => {
        let confirmedEvent = {
          name: event.name,
          description: event.description,
          startTime: event.startTime,
          fbEventId: event.fbEventId,
          cover: event.cover,
          _id: event.id
        };

        let driver = false;
        let ride = null;
        rideFor: for (let i = 0; i < event.rides.length; i++) {
          if (event.rides[i].driver == user.id) {
            ride = event.rides[i];
            driver = true;
            break;
          }
          let passengers = event.rides[i].passengers;
          for (let j = 0; j < passengers.length; j++) {
            if (passengers[j].userId == user.id) {
              ride = event.rides[i];
              break rideFor;
            }
          }
        }
        if (driver) {
          confirmedEvent.riders = ride.passengers.map(passenger => {
            usersSet.add(passenger.userId);
            return {_id: passenger.userId.toString()}
          });
        } else {
          usersSet.add(ride.driver);
          confirmedEvent.driver = {_id: ride.driver.toString()};
        }
        confirmed.push(confirmedEvent);
      });

      User.find({_id: {$in: Array.from(usersSet)}}, (err, users) => {
        if (err || !users) {
          return res.sendStatus(500);
        }
        let userMap = {};
        users.forEach(user => {
          userMap[user.id] = {facebookId: user.facebookId, firstName: user.firstName, lastName: user.lastName};
        });
        confirmed.forEach(confirmedEvent => {
          if (confirmedEvent.driver) {
            confirmedEvent.driver = Object.assign(confirmedEvent.driver, userMap[confirmedEvent.driver._id]);
          } else {
            for (let i = 0; i < confirmedEvent.riders.length; i++) {
              confirmedEvent.riders[i] = Object.assign(confirmedEvent.riders[i], userMap[confirmedEvent.riders[i]._id]);
            }
          }
        });
        res.json(confirmed);
      });
    });
  });
});


/**
 * POST: /api/events/:id/drive
 *
 * Label the current userRoute as a driver to the event
 *
 * EXPECTS: {seats}
 * RESPONDS: Code 200 if all OK,
 *          Code 401 if no userRoute is logged in,
 *          Code 400 with error json
 */
router.post('/:id/drive', (req, res) => {
  if (!req.userId) {
    return res.sendStatus(401);
  }
  if (!req.body.seats) {
    return res.status(400).json({error: 'seats not specified'});
  }

  User.findById(req.userId, (err, user) => {
    if (err || !user) {
      return res.sendStatus(500);
    }
    let eventId = null;
    user.events.forEach(event => {
      if ((event.eventId == req.params.id || event.fbEventId == req.params.id) && !event.dismissed) {
        eventId = event.eventId;
      }
    });
    if (!eventId) {
      return res.status(400).json({error: 'User not part of the event or event is dismissed'});
    }
    Event.findById(eventId, (err, event) => {
      if (err || !event) {
        return res.sendStatus(500);
      }
      let isParticipant = false;
      event.participants.forEach(participantId => {
        if (participantId == user.id) {
          isParticipant = true;
        }
      });
      if (!isParticipant) {
        return res.status(400).json({error: 'User is already either a rider or driver'});
      }
      event.removeParticipant(user, err => {
        if (err) {
          return res.sendStatus(500);
        }
        event.registerDriver(user, req.body.seats, err => {
          if (err) {
            return res.sendStatus(500);
          }
          event.hackyMatch(err => {
            if (err) {
              return res.sendStatus(500);
            }
            res.sendStatus(200);setTimeout(() => {
              user.sendPushAsDriver(event);
            }, 4000);
          });
        });
      });
    });
  });
});


/**
 * POST: /api/events/:id/ride
 *
 * Label the current userRoute as a driver to the event
 *
 * EXPECTS: Nothing
 * RESPONDS: Code 200 if all OK,
 *          Code 401 if no userRoute is logged in,
 *          Code 400 with error json
 */
router.post('/:id/ride', (req, res) => {
  if (!req.userId) {
    return res.sendStatus(400);
  }
  User.findById(req.userId, (err, user) => {
    if (err || !user) {
      return res.sendStatus(500);
    }
    let eventId = null;
    user.events.forEach(event => {
      if ((event.eventId == req.params.id || event.fbEventId == req.params.id) && !event.dismissed) {
        eventId = event.eventId;
      }
    });
    if (!eventId) {
      return res.status(400).json({error: 'User not part of the event or event is dismissed'});
    }
    Event.findById(eventId, (err, event) => {
      if (err || !event) {
        return res.sendStatus(500);
      }
      let isParticipant = false;
      event.participants.forEach(participantId => {
        if (participantId == user.id) {
          isParticipant = true;
        }
      });
      if (!isParticipant) {
        return res.status(400).json({error: 'User is already either a rider or driver'});
      }
      event.removeParticipant(user, err => {
        event.registerRider(user, err => {
          if (err) {
            return res.sendStatus(500);
          }
          event.hackyMatch(err => {
            if (err) {
              return res.sendStatus(500);
            }
            res.sendStatus(200);
            setTimeout(() => {
              user.sendPushAsRider(event);
            }, 4000);
          });
        });
      });
    });
  });
});


router.post('/:id/driver_confirmation', (req, res) => {
  if (!req.userId) {
    return res.sendStatus(401);
  }

  if (req.body.confirm === undefined) {
    return res.status(400).json({error: 'confirm not provided'});
  }

  User.findById(req.userId, (err, user) => {
    if (err || !user) {
      return res.sendStatus(500);
    }
    let eventId = null;
    user.events.forEach(event => {
      if ((event.eventId == req.params.id || event.fbEventId == req.params.id) && !event.dismissed) {
        eventId = event.eventId;
      }
    });
    if (!eventId) {
      return res.status(400).json({error: 'User not part of the event or event is dismissed'});
    }
    Event.findById(eventId, (err, event) => {
      if (err || !event) {
        return res.sendStatus(500);
      }

      let ride = event.rides.filter(ride => {
        for (let i = 0; i < ride.offers.length; i++) {
          if (ride.offers[i].userId == user.id) {
            ride.offers.splice(i, 1);
            return true;
          }
        }
        return false;
      })[0];
      if (req.body.confirm)
        ride.passengers.push({userId: user.id});
      else
        event.unmatched.push({userId: user.id});
      event.save(err => {
        if (err) {
          return res.sendStatus(500);
        }
        res.sendStatus(200);
      });
    });
  });
});


router.post('/:id/rider_confirmation', (req, res) => {
  if (!req.userId) {
    return res.sendStatus(401);
  }
  User.findById(req.userId, (err, user) => {
    if (err || !user) {
      return res.sendStatus(500);
    }

    if (!req.body.riders) {
      return res.status(400).json({error: 'Missing riders'});
    }
    let eventId = null;
    user.events.forEach(event => {
      if ((event.eventId == req.params.id || event.fbEventId == req.params.id) && !event.dismissed) {
        eventId = event.eventId;
      }
    });
    if (!eventId) {
      return res.status(400).json({error: 'User not part of the event or event is dismissed'});
    }
    Event.findById(eventId, (err, event) => {
      let ride = event.rides.filter(ride => (ride.driver == user.id))[0];
      if (!ride) {
        return res.status(400).json({error: 'User is not a driver for this event'});
      }
      let ids = req.body.riders;
      for (let i = 0; i < ride.offers.length; i++) {
        let userId = ride.offers[i].userId.toString();
        if (ids.includes(userId)) {
          ride.passengers.push({userId});
        } else {
          event.unmatched.push({userId});
        }
      }
      ride.offers = [];
      event.save(err => {
        if (err) {
          return res.sendStatus(500);
        }
        return res.sendStatus(200);
      });
    });
  });
});


/**
 * GET: /api/events/history
 *
 * Get the past rides the userRoute was a part of
 *
 * EXPECTS: Nothing
 *
 * RESPONDS: [{name description startTime fbEventId cover}]
 */
router.get('/history', (req, res) => {
  // TODO
  res.json([]);
});


/**
 * GET: /api/events/dismissed
 *
 * Get the users dismissed events
 *
 * EXPECTS: Nothing
 *
 * RESPONDS: [{name description startTime fbEventId cover}],
 *        Code 401 is no userRoute is logged in
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
 * Dismiss the event for the logged in userRoute
 *
 * EXPECTS: Nothing
 * RESPONDS: Code 200 if all OK,
 *          Code 401 if no userRoute is logged in,
 *          Code 404 userRoute is not associated to the event id
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
 * Restore a dismissed event for the logged in userRoute
 *
 * EXPECTS: Nothing
 * RESPONDS: Code 200 if all OK,
 *          Code 401 if no userRoute is logged in,
 *          Code 404 userRoute is not associated to the event id
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
