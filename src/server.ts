import express, { NextFunction, Request, Response } from "express";
import path from "path";

const fs = require("fs");

// Database connection
const Database = require("better-sqlite3");

////////////////////////////// Setup ///////////////////////////////////////////

const HOST_NAME = "localhost";
const FRONTEND_FOLDER = path.join(__dirname, "../", "public");

const app = express();
const LOG_FILE = path.join(__dirname, "visits.log");

// Redirect every request to our application
// https://raspberrypi.stackexchange.com/a/100118
// [You need a self-signed certificate if you really want
// an https connection. In my experience, this is just a pain to do
// and probably overkill for a project where you have your own WiFi network
// without Internet access anyway.]
app.use((req: Request, res: Response, next: NextFunction) => {
  if (req.hostname != HOST_NAME) {
    return res.redirect(`http://${HOST_NAME}`);
  }
  next();
});

// Call this AFTER app.use where we do the redirects
app.use(express.static(FRONTEND_FOLDER));

/////////////////////////////// Endpoints //////////////////////////////////////

// Serve frontend
app.get("/", (req, res, next) => {
  res.sendFile(path.join(FRONTEND_FOLDER, "index.html"));
});

///////////////////////////// File log ///////////////////////////////

// Accept raw body so beacon JSON can be parsed robustly
app.use("/log-visit", express.raw({ type: "application/json" }));

app.post("/log-visit", (req, res) => {
  try {
    const text = req.body && req.body.length ? req.body.toString("utf8") : "";
    // Basic validation: parse JSON
    const obj = text ? JSON.parse(text) : null;
    if (!obj || !obj.deviceId || typeof obj.durationMs !== "number") {
      // Bad payload; respond quickly
      return res.status(400).end();
    }

    // Add server-received timestamp to be safe
    obj.receivedTs = new Date().toLocaleString("de-DE", {
      timeZone: "Europe/Berlin",
    });

    // Append one JSON object per line
    const line = JSON.stringify(obj) + "\n";
    fs.appendFile(LOG_FILE, line, (err: string) => {
      if (err) {
        console.error("Failed to append visit:", err);
        // Don't block the client; just respond 500
        return res.status(500).end();
      }
      // sendBeacon doesn't wait for response but respond anyway
      res.status(204).end(); // no content
    });
  } catch (e) {
    console.error("Error in /log-visit:", e);
    res.status(500).end();
  }
});

// Open Database connection
const db = new Database("inventory.db", { verbose: console.log });

// Database connection
db.pragma("journal_mode = WAL");

// Create Table
db.exec(`CREATE TABLE IF NOT EXISTS answers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    answer TEXT NOT NULL,
    time TEXT
  )`);

const insert = db.prepare("INSERT INTO answers (answer, time) VALUES (?, ?)");
let user_answer = "";

// Form handling
app.use(express.json()); // for JSON requests
app.use(express.urlencoded({ extended: true })); // for future form‑data

export async function handle_database(req: Request, res: Response) {
  const current_time = new Date().toLocaleString("de-DE", {
    timeZone: "Europe/Berlin",
  });

  user_answer = req.body.data;

  insert.run(user_answer, current_time);
}

export async function respond(req: Request, res: Response) {
  const data = "this is your answer";

    let get_response,
        current_response;

  do {
    get_response = db.prepare(
      "SELECT  * FROM answers ORDER BY RANDOM() LIMIT 1;",
    );

    current_response = get_response.all()[0];
  } while (current_response.answer === user_answer);

    let response = {
      answer: current_response.answer,
      time: current_response.time,
    };

  res.send(JSON.stringify({ response }));
}

// Get Form answer
app.post("/api/answer", handle_database);

// Send Answer back
app.get("/api/response", respond);

///////////////////////////// Server listening /////////////////////////////////

// Listen for requests
// If you change the port here, you have to adjust the ip tables as well
// see file: access-point/setup-access-point.sh
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Node version: ${process.version}`);
  console.log(`⚡ Raspberry Pi Server listening on port ${PORT}`);
});
