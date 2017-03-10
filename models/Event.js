const mongoose = require('mongoose');

const Event = new mongoose.Schema({
  name: String,
  cover: String,
  description: String,
  startTime: Date,
  fbEventId: {type: String, unique: true},
  rides: [{
    driver: mongoose.Schema.Types.ObjectId,
    seats: Number,
    passengers: [{
      userId: mongoose.Schema.Types.ObjectId
    }],
    offers: [{
      userId: mongoose.Schema.Types.ObjectId,
      approved: {type: Boolean, default: false}
    }]
  }],
  unmatched: [{userId: mongoose.Schema.Types.ObjectId}],
  participants: [mongoose.Schema.Types.ObjectId]
});

const testUsers = ['58c2051cf36d281631b34a15', '58c2055bf36d281631b34a8c', '58c2040df36d281631b349b2', '58c09258f36d2837b812cfec'];

const getShuffledTestUsers = function shuffle() {
  let a = testUsers.map(testUser => testUser);
  for (let i = a.length; i; i--) {
    let j = Math.floor(Math.random() * i);
    [a[i - 1], a[j]] = [a[j], a[i - 1]];
  }
  return a;
};

/**
 * Add new participant for an event
 * @param user User object interested in the event
 * @param fbEvents event obj/array of obj from facebook
 * @param next callback (err)
 */
Event.statics.registerParticipant = function (user, fbEvents, next) {
  let Event = this;
  let isArray = Object.prototype.toString.call(fbEvents) === '[object Array]';
  if (!isArray) {
    fbEvents = [fbEvents];
  }
  let fbIds = fbEvents.map(fbEvent => {
    return fbEvent.id;
  });
  this.find({fbEventId: {$in: fbIds}}, (err, events) => {
    if (err) {
      return next(err);
    }

    if (events.length !== fbIds.length) {
      // Some events are not in the db yet.
      let newEvents = fbEvents.filter(fbEvent => {
        for (let i = 0; i < events.length; i++) {
          if (events[i].fbEventId === fbEvent.id) {
            // This fb event was indeed in the db
            return false;
          }
        }
        return true;
      }).map(fbEvent => {
        return new Event({
          name: fbEvent.name,
          description: fbEvent.description,
          startTime: new Date(fbEvent.start_time),
          fbEventId: fbEvent.id,
          cover: fbEvent.cover.source
        });
      });
      events = events.concat(newEvents);
    }
    events.forEach(event => {
      event.participants.push(user.id);
      event.save();
      user.events.push({
        eventId: event.id,
        fbEventId: event.fbEventId,
        dismissed: false
      });
    });

    user.save(next);
  });
};


/**
 * Register a new driver for the event
 * @param user User object
 * @param seats number of people he/she can pick up
 * @param next callback (err)
 */
Event.methods.registerDriver = function (user, seats, next) {
  let event = this;
  event.rides.push({
    driver: user.id,
    seats: seats,
    passengers: [],
    offers: []
  });
  event.save(next);
};


/**
 * Register user as an unmatched rider
 * @param user User object
 * @param next callback (err)
 */
Event.methods.registerRider = function (user, next) {
  let event = this;
  event.unmatched.push({userId: user.id});
  event.save(next);
};

/**
 * Hacky match people LOOLLLLL!!!
 * @param next callback (err)
 */
Event.methods.hackyMatch = function (next) {
  let event = this;
  // Add all riders to as many rides as possible
  for (let i = 0; i < event.unmatched.length; i++) {
    let rider = event.unmatched[i].userId;
    for (let j = 0; j < event.rides.length; j++) {
      let ride = event.rides[j];
      let availableMatches = ride.seats - ride.passengers.length - ride.offers.length;
      if (availableMatches <= 0) {
        continue;
      }
      ride.offers.push({
        userId: rider,
        approved: true
      });
      event.unmatched.splice(i, 1);
      i--;
      break;
    }
  }

  let carsNeeded = Math.floor(event.unmatched.length / 4) + ((event.unmatched.length % 4 == 0) ? 0 : 1);
  if (!carsNeeded) {
    // Get passenger for drivers
    for (let i = 0; i < event.rides.length; i++) {
      let ride = event.rides[i];
      let numSeats = ride.seats - ride.passengers.length - ride.offers.length;
      if (numSeats <= 0) {
        continue;
      }
      let dummyRiders = getShuffledTestUsers();
      for (let j = 0; j < dummyRiders.length && j < numSeats; j++) {
        ride.offers.push({
          userId: dummyRiders[j],
          approved: false
        });
      }
    }
  } else {
    // Get drivers for passengers
    for (let i = 0; i < carsNeeded; i++) {
      let ride = {
        driver: testUsers[Math.floor(Math.random() * testUsers.length)],
        passengers: [],
        offers: []
      };
      for (let j = 0; j < 4 && j < event.unmatched.length; j++) {
        ride.offers.push({
          userId: event.unmatched[0].userId,
          approved: true
        });
        event.unmatched.splice(0, 1);
      }
      event.rides.push(ride);
    }
  }
  event.save(next);
};


/**
 * Remove participant from the event
 * @param user User obj
 * @param id event id or fbEventId
 * @param next callback (err)
 */
Event.statics.removeParticipant = function (user, id, next) {
  this.findOne({$or: [{fbEventId: id}, {_id: id}]}, (err, event) => {
    if (err) {
      return next(err);
    }
    if (!event) {
      return next(new Error('Invalid event id'));
    }
    event.removeParticipant(user, next);
  });
};


/**
 * Remove participant from the event
 * @param user User obj
 * @param next callback (err)
 */
Event.methods.removeParticipant = function (user, next) {
  let index = this.participants.indexOf(user.id);
  if (index === -1) {
    return next(new Error('User not a participant of the event'));
  }
  this.participants.splice(index, 1);
  this.save(next);
};


/**
 * Remove user from event and make appropriate changes
 * @param user User object
 * @param id Facebook event id or event id
 * @param next callback (err)
 */
Event.statics.decoupleUser = function (user, id, next) {
  this.findOne({$or: [{fbEventId: id}, {_id: id}]}, (err, event) => {
    if (err) {
      return next(err);
    }
    if (!event) {
      return next(new Error('Invalid id'));
    }

    let isParticipant = false;
    for (let i = 0; i < event.participants.length; i++) {
      if (event.participants[i] == user.id) {
        isParticipant = true;
        event.participants.splice(i, 1);
        break;
      }
    }
    if (!isParticipant) {
      let wasUnmatched = false;
      for (let i = 0; i < event.unmatched.length; i++) {
        if (event.unmatched[i].userId == user.id) {
          event.unmatched.splice(i, 1);
          wasUnmatched = true;
          break;
        }
      }
      if (!wasUnmatched) {
        rideFor: for (let i = 0; i < event.rides.length; i++) {
          let ride = event.rides[i];
          if (ride.driver == user.id) {
            // User was driver. Move all passengers in his car to unmatched.
            event.unmatched = event.unmatched.concat(ride.passengers);
            event.rides.splice(i, 1);
            break;
          }
          for (let j = 0; j < ride.passengers.length; j++) {
            if (ride.passengers[j].userId == user.id) {
              ride.passengers.splice(j, 1);
              break rideFor;
            }
          }
        }
      }
    }
    event.save(next);
  });
};

module.exports = mongoose.model('Event', Event);