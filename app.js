const express = require('express');
const { google } = require('googleapis');
const { oauth2Client, getGoogleAuthURL } = require('./google-auth');

const calendar = google.calendar('v3');
const app = express();

app.set('view engine', 'ejs');
app.use(express.static(__dirname + '/public'));

const isLoggedIn = (req, res, next) => {
  if (req.user) {
      next();
  } else {
      res.sendStatus(401);
  }
}

app.use(express.json());

const PORT = process.env.PORT || 5000;

app.get("/", (req, res) => {
  res.render('index');
});

app.get("/failed", (req, res) => {
  res.send("Failed")
});

app.get("/success", isLoggedIn, async (req, res) => {
  res.send([req.user,req.headers] );
});

app.get('/auth/google', (req, res) => {
  res.redirect(getGoogleAuthURL());
});

app.get('/auth/google/callback', async (req, res) => {
  const { tokens } = await oauth2Client.getToken(req.query);
  oauth2Client.setCredentials({
    refresh_token: tokens.refresh_token
  });

  const data = await calendar.calendarList.list({
    auth: oauth2Client,
    maxResults: 20
  });
  res.send(data);
})

app.get('/calender', (req, res) => {

})

app.listen(PORT, () => console.log('SERVER RUNNING AT PORT 3000'));

