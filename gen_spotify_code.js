const fs = require("fs");
const readline = require("readline");
const axios = require("axios");
const { exit } = require("process");
const pillars = ["ASD", "EPD", "ESD", "ISTD"];
const args = process.argv.slice(2);
const pillar = args[0];

if (!pillars.includes(pillar)) {
  console.log("Please enter a valid pillar.");
  exit();
}
const filename = "log_" + pillar + ".txt";
const BG_COLOR = "ffffff";
const CODE_COLOR = "black";
const RESOLUTION = "640";
const codeURL = `https://scannables.scdn.co/uri/plain/png/${BG_COLOR}/${CODE_COLOR}/${RESOLUTION}/`;
const outputDir = `./spotify codes/${pillar}/`;
const names = [];
const lines = [];

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

const delay = async (ms = 1000) =>
  new Promise((resolve) => setTimeout(resolve, ms));
function generateCode(URIs) {
  URIs.forEach(async (uri, index) => {
    await delay(index * 1000);
    console.log(names[index] + "\t" + uri);
    axios({
      method: "get",
      url: codeURL + uri,
      responseType: "stream",
    }).then(function (response) {
      let outputName = outputDir + names[index] + "_SPFC.png";
      response.data.pipe(fs.createWriteStream(outputName));
    });
  });
}
async function generateLine() {
  const fileStream = fs.createReadStream(filename);

  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity,
  });
  rl.on("line", (line) => {
    let lineArr = line.split("\t");
    let name = lineArr[0];
    let playlistURI = lineArr[1];
    names.push(name);
    lines.push(playlistURI);
  });
  rl.on("close", () => {
    generateCode(lines);
  });
}

generateLine();
