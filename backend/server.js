const express = require("express");
const mysql = require("mysql2");
const app = express();

const PORT = process.env.PORT || 8080;
const DB_HOST = process.env.DB_HOST || "mysql";
const DB_USER = process.env.DB_USER || "myuser";
const DB_PASS = process.env.DB_PASS || "mypassword";
const DB_NAME = process.env.DB_NAME || "mydb";

const db = mysql.createConnection({
  host: DB_HOST,
  user: DB_USER,
  password: DB_PASS,
  database: DB_NAME,
});

app.get("/api/message", (req, res) => {
  db.query("SELECT message FROM greetings LIMIT 1", (err, results) => {
    if (err) {
      console.error(err);
      return res.json({ message: "DB Error!" });
    }
    res.json({ message: results[0]?.message || "Hello from DB!" });
  });
});

app.listen(PORT, () => console.log(`Backend running on port ${PORT}`));
