let fs = require("fs");
let parserLib = require("csv-parse");
let spotifyLib = require("spotify-web-api-node");
let credentials = require("./credentials.json");
const { exit } = require("process");
const pillars = ["ASD", "EPD", "ESD", "ISTD"];
const args = process.argv.slice(2);
const pillar = args[0];
if (!pillars.includes(pillar)) {
  console.log("Please enter a valid pillar.");
  exit();
}
const filename = pillar + ".csv";
const logFilePath = "./log_" + pillar + ".txt";

//Yearbook 2022 CSV format
const NAME_COL = 2;
const QUOTE_COL = 10;
const TRACK_COL = 11;

let spotifyApi = new spotifyLib({
  clientId: credentials.clientId,
  clientSecret: credentials.clientSecret,
  accessToken: credentials.accessToken,
  refreshToken: credentials.refreshToken,
  redirectUri: "http://localhost:3000", //required by spotify api, just set to random whitelisted url
});
const delay = async (ms = 1000) =>
  new Promise((resolve) => setTimeout(resolve, ms));

function readingStream() {
  return fs.readFileSync(filename);
}
function validateTrack(trackLink) {
  let httpString = trackLink.substring(0, 5);
  return httpString === "https";
}
function stripSpotifyCode(spotifyCode) {
  let codeArr = spotifyCode.split(":");
  let codeId = codeArr[codeArr.length - 1];
  return codeId;
}
function generateTrackURI(trackLink) {
  let trackArr = trackLink.split("/");
  let trackId = trackArr[trackArr.length - 1];
  trackId = trackId.split("?")[0];
  return "spotify:track:" + trackId;
}
function capitalizeName(name) {
  let words = name.split(" ");
  for (let i = 0; i < words.length; i++) {
    words[i] = words[i][0].toUpperCase() + words[i].substr(1);
  }
  return words.join(" ");
}
let content = readingStream();
// Retrieving details from CSV
const parser = parserLib.parse(content, function (err, rows) {
  if (err != null) {
    console.log("Error in making playlist: " + err);
  }
  rows.forEach(async (row, index) => {
    await delay(index * 1000);
    let name = capitalizeName(row[NAME_COL]);
    let quote = row[QUOTE_COL];
    let trackLink = row[TRACK_COL];
    if (validateTrack(trackLink) === false) {
      return;
    }
    console.log("Creating Playlist: " + name);
    console.log("Description: " + quote);
    console.log("Track link: " + trackLink);
    // Creating a playlist
    spotifyApi.createPlaylist(name, { description: quote, public: true }).then(
      function (data) {
        console.log("Playlist " + name + " successfully created!");
        let playlistURI = data.body.uri;
        fs.appendFileSync(logFilePath, name + "\t" + playlistURI + "\n");
        let playlistId = stripSpotifyCode(playlistURI);
        // Stripping track ID
        let trackURI = generateTrackURI(trackLink);
        // Adding track to playlist
        spotifyApi.addTracksToPlaylist(playlistId, [trackURI]).then(
          function (_) {
            console.log("Added track to playlist");
          },
          function (err_track) {
            console.log("Error in adding track to playlist; " + err_track);
          }
        );
      },
      function (err_in) {
        console.log("Failed to create playlist " + name + ": " + err_in);
      }
    );
  });
});
