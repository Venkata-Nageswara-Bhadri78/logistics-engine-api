const db = require("../config/db");

exports.createCustomersTable = (callback) => {
    const query = `CREATE TABLE IF NOT EXISTS customers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        userId INTEGER NOT NULL,
        phone TEXT,
        address TEXT,
        FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
    );`;

    db.run(query, [], (err) => {
        if(err){
            return callback(err);
        }
        return callback(null);
    })
}
