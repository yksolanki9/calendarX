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

app.get('/calendar-test', async (req, res) => {
  const googleOAuth2Client = new google.auth.OAuth2(
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
    'http://localhost:3000/auth/google/callback'
  );
  googleOAuth2Client.setCredentials({
    refresh_token: process.env.REFRESH_TOKEN
  });

  //TODO: Get this form DB
  const calendarId = 'yashsolanki1709@gmail.com';

  //GETTING THE BUSY SLOTS FOR THE USER
  const data = await calendar.freebusy.query({
    auth: googleOAuth2Client,
    requestBody: {
      timeMin: moment().utcOffset("+05:30").startOf('day').format(),
      timeMax: moment().utcOffset("+05:30").endOf('day').format(),
      items: [{
        id: calendarId
      }],
      timeZone: 'IST'
    }
  });
  // console.log(data);
  res.send(data.calendars.calendarId);

  //Getting all the available slots for the day -> 9 to 5 PST

  //CREATING A NEW EVENT
  // const data = await calendar.events.insert({
  //   auth: googleOAuth2Client,
  //   calendarId: 'yashsolanki1709@gmail.com',
  //   requestBody: {
  //     start: {
  //       dateTime: '2022-05-05T14:48:00.000Z'
  //     },
  //     end: {
  //       dateTime: '2022-05-05T16:48:00.000Z'
  //     }
  //   }
  // });
  // res.send(data);
})

// function getFreeIntervals(allIntervals, busyIntervals) {
//   const freeIntervals = [];
//   let busyIntervalIdx = 0;
//   allIntervals.forEach((currentIntervalStart) => {
//     const currentIntervalEnd = currentIntervalStart().clone().add({'m': 29, 's': '59'});
//     const busyInterval = busyIntervals[busyIntervalIdx];
//     if(currentIntervalStart.isBetween(busyInterval.start, busyInterval.end) || currentIntervalEnd.isBetween(busyInterval.start, busyInterval.end)) {
//       freeIntervals.push(currentIntervalStart);
//     }
//     if (currentIntervalEnd >= busyInterval.end) {
//       busyIntervalIdx++;
//     }
//   })
//   return freeIntervals;
// }

// function getAllIntervals(date) {
//   let intervals = [];
//   let intervalStartTime;
//   const selectedDate = moment(date);

//   if (selectedDate.startOf('day').isSame(moment().startOf('day')) && (moment().hour() > 9) && (moment().hour() < 17)) {
//     intervalStartTime = moment().add(15 - moment().minute() % 15, 'm').subtract(moment().seconds(), 's');
//   } else {
//     intervalStartTime = selectedDate.clone().set({'h': 9, 'm': 0, 's': 0});
//   }
//   const intervalEndTime = selectedDate.clone().set({'h': 17, 'm': 0, 's': 0});
  
//   while(intervalStartTime < intervalEndTime){
//       intervals.push(new moment(intervalStartTime).format('LT'));
//       intervalStartTime.add(15, 'm');
//   }

//   return intervals;
// }
//https://onecompiler.com/nodejs/3y3esnnr5

app.listen(PORT, () => console.log('SERVER RUNNING AT PORT 3000'));

