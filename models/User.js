const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  email: String,
  facebookId: String,
  facebookToken: String,
  verified: {type: Boolean, default: false}
});


/**
 * Register the user in the database
 * @param user User to register in the database
 * @param next callback (err, user)
 */
userSchema.statics.register = function (user, next) {
  this.findOne({$or: [{email: user.email}, {facebookId: user.facebookId}]}, (err, query) => {
    if (err) {
      return next(err, null);
    }
    if (query) { // User already exists
      return next(new Error(('This ' + ((query.email === user.email) ? 'email' : 'facebook account') +
        ' has already been registered.')), null);
    }
    user.save((err, usr) => next(err, usr));
  })
};

module.exports = mongoose.model('User', userSchema);