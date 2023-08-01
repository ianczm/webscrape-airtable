import Airtable from "airtable";
import dotenv from "dotenv";
import { readFileSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename).match(/(.*)dist(?:.*)/)[1];
const __envpath = path.join(__dirname, "../.env");
dotenv.config({ path: __envpath });

// load data

let data = readFileSync(
  path.join(path.join(__dirname, "../", process.env.DATA_PATH)),
  "utf-8"
);
let dataObj = JSON.parse(data);

// console.log(dataObj);

let payload = dataObj.map((item) => {
  return { fields: item };
});

console.log(payload);

// call api

const airbase = new Airtable({
  apiKey: process.env.AIRTABLE_API_KEY,
}).base(process.env.AIRTABLE_BASE_ID);

airbase("Organizations").create(payload, function (err, records) {
  if (err) {
    console.error(err);
    return;
  }
  records.forEach(function (record) {
    console.log(record.getId());
  });
});
