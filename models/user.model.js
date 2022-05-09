const mongoose = require('mongoose');

const userSchema = mongoose.Schema({
  googleId: String,
  email: String,
  name: String,
  refresh_token: String
});

const User = mongoose.model('User', userSchema);

module.exports = User;
