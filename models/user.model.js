const mongoose = require('mongoose');

const userSchema = mongoose.Schema({
  googleId: String,
  email: String,
  name: String,
  refresh_token: String,
  meetings: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Meeting'
  }]
});

const User = mongoose.model('User', userSchema);

module.exports = User;
