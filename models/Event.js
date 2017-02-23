const mongoose = require('mongoose');

const Event = new mongoose.Schema({
  name: String,
  description: String,
  startTime: Date,
  endTime: Date,
  fbEventId: {type: String, unique: true},
  rides: [{driver: mongoose.Schema.Types.ObjectId, seats: Number, passengers: [{userId: mongoose.Schema.Types.ObjectId}]}],
  unmatched: [{userId: mongoose.Schema.Types.ObjectId}],
  participants: [mongoose.Schema.Types.ObjectId]
});


/**
 * Add new participant for an event
 * @param user User object interested in the event
 * @param fbEvent event obj from facebook
 * @param next callback (err)
 */
Event.statics.registerParticipant = function (user, fbEvent, next) {
  this.findOne({fbEventId: fbEvent.id}, (err, event) => {
    if (err) {
      return next(err);
    }
    if (!event) {
      event = new this({
        name: fbEvent.name,
        description: fbEvent.description,
        startTime: new Date(fbEvent.start_time),
        endTime: new Date(fbEvent.end_time),
        fbEventId: fbEvent.id
      });
    }
    user.events.push({
      eventId: event._id,
      fbEventId: event.fbEventId,
      dismissed: false
    });
    event.participants.push(user._id);
    event.save((err) => {
      if (err) {
        next(err);
      }
      user.save(next);
    });
  });
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
    let eventIndex = -1;
    for (let i = 0; i < user.events.length; i++) {
      if (user.events[i].fbEventId == event.fbEventId) {
        eventIndex = i;
        break;
      }
    }
    if (eventIndex === -1) {
      return next(new Error('user.events doesn\'t contain the event'));
    }
    user.events.splice(eventIndex, 1);
    user.save(err => {
      if (err) {
        return next(err);
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
  });
};

module.exports = mongoose.model('Event', Event);