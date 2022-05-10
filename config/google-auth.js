const { google } = require('googleapis');
const axios = require('axios');
require('dotenv').config();

const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, CALLBACK_URL } = process.env;

const oauth2Client = new google.auth.OAuth2(
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  CALLBACK_URL
);

function getGoogleAuthURL() {
  const scopes = [
    'profile',
    'email',
    'https://www.googleapis.com/auth/calendar'
  ];

  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: scopes,
  });
}

async function getGoogleUser({ code }) {
  const { tokens } = await oauth2Client.getToken(code);
  oauth2Client.setCredentials({
    refresh_token: tokens.refresh_token
  });

  // Fetch the user's profile with the access token and bearer
  const googleUser = await axios
    .get(
      `https://www.googleapis.com/oauth2/v1/userinfo?alt=json&access_token=${tokens.access_token}`,
      {
        headers: {
          Authorization: `Bearer ${tokens.id_token}`,
        },
      },
    )
    .then(res => {
      return { data: res.data, refresh_token: tokens.refresh_token };
    })
    .catch(error => {
      throw new Error(error.message);
    });
    return googleUser;
}

function getOAuth2Client(refresh_token) {
  const oAuth2Client = new google.auth.OAuth2(
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
    CALLBACK_URL
  );
  oAuth2Client.setCredentials({
    refresh_token
  });
  return oAuth2Client;
}

module.exports = { getOAuth2Client, getGoogleAuthURL, getGoogleUser};