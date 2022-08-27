let fs = require("fs");
let spotifyLib = require("spotify-web-api-node");
let credentials = require("./credentials.json");
const credsFilename = "./credentials.json";
const scopes = ["playlist-modify-public"];

let spotifyApi = new spotifyLib({
  clientId: credentials.clientId,
  clientSecret: credentials.clientSecret,
  redirectUri: "http://localhost:3000", //required by spotify api, just set to random whitelisted url
});
function generateAuthURL() {
  let authURL = spotifyApi.createAuthorizeURL(scopes);
  console.log(
    `Use the following URL to login to Spotify and generate your "Code":`
  );
  console.log(authURL);
}

function generateAccessToken() {
  spotifyApi.authorizationCodeGrant(credentials.code).then(
    function (data) {
      let accessToken = data.body["access_token"];
      let refreshToken = data.body["refresh_token"];
      credentials.accessToken = accessToken;
      credentials.refreshToken = refreshToken;
      fs.writeFileSync(
        credsFilename,
        JSON.stringify(credentials, null, 4),
        (err) => {
          if (err) return console.log(err);
          console.log("Access Token and Refresh Token updated!");
        }
      );
    },
    function (err) {
      console.log("Something went wrong!", err);
    }
  );
}
const args = process.argv.slice(2);
switch (args[0]) {
  case "url":
    generateAuthURL();
    break;
  case "token":
    generateAccessToken();
    break;
  default:
    console.log(
      "Command invalid.\nTo generate Auth URL, type `npm run auth url`\nTo generate Access Token, type `npm run auth token`"
    );
}
