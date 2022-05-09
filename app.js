const express = require('express');
const { google } = require('googleapis');
const moment = require('moment');
const mongoose = require('mongoose');
const { getOAuth2Client, getGoogleAuthURL, getGoogleUser } = require('./google-auth');
const { getFreeIntervals } = require('./utils/intervals');
const User = require('./models/user.model');
require('dotenv').config();
require('./config/mongoose');

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

app.get('/calendar/:userId', async (req, res) => {
  // TEST URL -> http://localhost:3000/calendar/627889aa98d7575751ad794d

  try {
    const user = await User.findById(req.params.userId);
  
    const calendarId = user.email;
  
    let selectedDate = req.query.selectedDate;
    if (!selectedDate || selectedDate === 'null') {
      selectedDate = new Date();
    } else {
      selectedDate = new Date(selectedDate);
    }
  
    const data = await calendar.freebusy.query({
      auth: getOAuth2Client(user.refresh_token),
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
  } catch(err) {
    res.status(500).json({ error: err.message });
  }
})

app.get('/auth/google/callback', async (req, res) => {
  try {
    const googleUser = await getGoogleUser(req.query);
  
    const { id, email, name } = googleUser.data;
    const user = new User({
      _id: new mongoose.Types.ObjectId(),
      googleId: id,
      name,
      email,
      refresh_token: googleUser.refresh_token
    });
    
    await user.save();

    res.status(200).json({ uniqueUrl: `http://localhost:3000/calendar/${user._id}`});
  } catch(err) {
    res.status(500).json({ error: err.message });
  }
})

app.get('/meeting/:userId', async(req, res) => {
  try {
    const user = await User.findById(req.params.userId);
  
    const startTime = new Date(req.query.selectedInterval.slice(0, -5).concat('+0530'));
    const endTime = moment(startTime).clone().add(30, 'm');
  
    const data = await calendar.events.insert({
      auth: getOAuth2Client(user.refresh_token),
      calendarId: user.email,
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
  } catch(err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => console.log('SERVER RUNNING AT PORT 3000'));
