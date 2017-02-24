const mongoose = require('mongoose');

const Event = new mongoose.Schema({
  name: String,
  description: String,
  startTime: Date,
  fbEventId: {type: String, unique: true},
  rides: [{driver: mongoose.Schema.Types.ObjectId, seats: Number, passengers: [{userId: mongoose.Schema.Types.ObjectId}]}],
  unmatched: [{userId: mongoose.Schema.Types.ObjectId}],
  participants: [mongoose.Schema.Types.ObjectId]
});


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
          fbEventId: fbEvent.id
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