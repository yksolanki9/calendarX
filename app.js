const express = require('express');
const { getGoogleAuthURL, getGoogleUser} = require('./google-auth');

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
  //Get all calender Ids
  // const calenderListRes = await axios.get('https://www.googleapis.com/calendar/v3/users/me/calendarList', {
  //   minAccessRole: 'freeBusyReader'
  // });
  // console.log('RESPONSE IS -> ', calenderListRes);

  // //Query FREEBUSY with all calender ids and todays date
  // // await axios.post('https://www.googleapis.com/calendar/v3/freeBusy', {
  // // })
  // res.send(calenderListRes);
});

app.get('/auth/google', (req, res) => {
  res.redirect(getGoogleAuthURL());
});

app.get('/auth/google/callback', async (req, res) => {
  const userData = await getGoogleUser(req.query);
  res.send(userData);
})

app.listen(PORT, () => console.log('SERVER RUNNING AT PORT 3000'));

