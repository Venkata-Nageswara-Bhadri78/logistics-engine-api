const sqlite3 = require("sqlite3").verbose();

const path = require("path");
const dbPath = path.join(__dirname, "../databases/logistics.db");

const db = new sqlite3.Database(dbPath, (err) => {
    if(err) {
        console.error("FAILED TO CONNECT TO DATABASE", err);
    } 
    else {
        console.log("DATABASE CONNECTED SUCESSFULLY");
    }
});

module.exports = db;