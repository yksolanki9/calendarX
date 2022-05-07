const express = require('express');
const { google } = require('googleapis');
const { oauth2Client, getGoogleAuthURL, getGoogleUser } = require('./google-auth');
require('dotenv').config();

const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET } = process.env;
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
  const googleUser = await getGoogleUser(req.query);

  // GET LIST OF CALENDERS OF A USER
  // const data = await calendar.calendarList.list({
  //   auth: oauth2Client
  // });
  // res.send(data);

  // GET CALENDER BY ID
  // const data = await calendar.calendars.get({
  //   auth: oauth2Client,
  //   calendarId: googleUser.email
  // });
  // res.send({ googleUser, data });

  // GET FREEBUSY
  const data = await calendar.freebusy.query({
    auth: oauth2Client,
    requestBody: {
      timeMin: new Date(2022, 05, 06).toISOString(),
      timeMax: new Date(2022, 05, 07),
      items: [{
        id: googleUser.email
      }],
      timeZone: 'PST'
    }
  });

  res.send(data);
})

app.get('/calendar', async (req, res) => {
  const googleOAuth2Client = new google.auth.OAuth2(
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
    'http://localhost:3000/auth/google/callback'
  );
  googleOAuth2Client.setCredentials({
    refresh_token: process.env.REFRESH_TOKEN
  });

  //GETTING THE BUSY SLOTS FOR THE USER
  // const data = await calendar.freebusy.query({
  //   auth: googleOAuth2Client,
  //   requestBody: {
  //     timeMin: new Date(2022, 05, 06).toISOString(),
  //     timeMax: new Date(2022, 05, 07),
  //     items: [{
  //       id: 'yashsolanki1709@gmail.com'
  //     }],
  //     timeZone: 'PST'
  //   }
  // });
  // res.send(data);

  //CREATING A NEW EVENT
  const data = await calendar.events.insert({
    auth: googleOAuth2Client,
    calendarId: 'yashsolanki1709@gmail.com',
    requestBody: {
      start: {
        dateTime: '2022-05-05T14:48:00.000Z'
      },
      end: {
        dateTime: '2022-05-05T16:48:00.000Z'
      }
    }
  });

  res.send(data);
})

app.listen(PORT, () => console.log('SERVER RUNNING AT PORT 3000'));

