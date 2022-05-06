const express = require('express');
const passport = require('passport');
const cookieSession = require('cookie-session');
require('./google-auth');

const app = express();

app.set('view engine', 'ejs');
app.use(express.static(__dirname + '/public'));

app.use(cookieSession({
  name: 'google-auth-session',
  keys: ['key1', 'key2']
}));

const isLoggedIn = (req, res, next) => {
  if (req.user) {
      next();
  } else {
      res.sendStatus(401);
  }
}

app.use(passport.initialize());
app.use(passport.session());
app.use(express.json());

const PORT = process.env.PORT || 5000;

app.get("/", (req, res) => {
  res.render('index');
  // res.json({message: "You are not logged in"})
});

app.get("/failed", (req, res) => {
  res.send("Failed")
});

app.get("/success", isLoggedIn, (req, res) => {
  res.send(`Welcome`);
});

app.get('/auth/google',
  passport.authenticate('google', { scope: ['email', 'profile', 'https://www.googleapis.com/auth/calendar'] }));

app.get('/auth/google/callback',
  passport.authenticate('google', { failureRedirect: '/failed' }),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect('/success');
  }
);

app.get("/logout", (req, res) => {
  req.session = null;
  req.logout();
  res.redirect('/');
});

app.listen(PORT, () => console.log('SERVER RUNNING AT PORT 3000'));

