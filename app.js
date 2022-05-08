const express = require('express');
const { google } = require('googleapis');
const moment = require('moment');
const { oauth2Client, getGoogleAuthURL, getGoogleUser } = require('./google-auth');
const { getFreeIntervals } = require('./utils/intervals');
require('dotenv').config();

const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET } = process.env;
const calendar = google.calendar('v3');
const app = express();

app.set('view engine', 'ejs');
app.use(express.static(__dirname + '/public'));

app.use(express.json());

const PORT = process.env.PORT || 5000;

app.get("/", (req, res) => {
  res.render('index');
});

app.get('/auth/google', (req, res) => {
  res.redirect(getGoogleAuthURL());
});

app.get('/calendar', async (req, res) => {
  const googleOAuth2Client = new google.auth.OAuth2(
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
    'http://localhost:3000/auth/google/callback'
  );
  googleOAuth2Client.setCredentials({
    refresh_token: process.env.REFRESH_TOKEN
  });

  //TODO: GET THIS FROM DB AS WELL
  const calendarId = 'yashsolanki1709@gmail.com';

  let selectedDate = req.query.selectedDate;
  if (!selectedDate || selectedDate === 'null') {
    selectedDate = new Date();
  } else {
    selectedDate = new Date(selectedDate);
  }

  const data = await calendar.freebusy.query({
    auth: googleOAuth2Client,
    requestBody: {
      timeMin: moment(selectedDate).startOf('day').format(),
      timeMax: moment(selectedDate).endOf('day').format(),
      items: [{
        id: calendarId
      }],
      timeZone: 'IST'
    }
  });

  const busyIntervals = data.data.calendars[calendarId].busy;
  const freeIntervals = getFreeIntervals(selectedDate, busyIntervals);
  res.render('calendar', {freeIntervals: freeIntervals, busyIntervals: busyIntervals, selectedDate: selectedDate});
})

app.get('/auth/google/callback', async (req, res) => {
  const googleUser = await getGoogleUser(req.query);

  // GET FREEBUSY
  const data = await calendar.freebusy.query({
    auth: oauth2Client,
    requestBody: {
      timeMin: new Date(2022, 05, 06).toISOString(),
      timeMax: new Date(2022, 05, 07),
      items: [{
        id: googleUser.email
      }],
      timeZone: 'IST'
    }
  });

  res.send(data);
})

app.get('/meeting', async(req, res) => {
  const googleOAuth2Client = new google.auth.OAuth2(
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
    'http://localhost:3000/auth/google/callback'
  );
  googleOAuth2Client.setCredentials({
    refresh_token: process.env.REFRESH_TOKEN
  });

  const startTime = new Date(req.query.selectedInterval.slice(0, -5).concat('+0530'));
  const endTime = moment(startTime).clone().add(30, 'm');

  const data = await calendar.events.insert({
    auth: googleOAuth2Client,
    calendarId: 'yashsolanki1709@gmail.com',
    requestBody: {
      start: {
        dateTime: startTime
      },
      end: {
        dateTime: endTime
      }
    }
  });
  res.send(data);
});

app.listen(PORT, () => console.log('SERVER RUNNING AT PORT 3000'));

