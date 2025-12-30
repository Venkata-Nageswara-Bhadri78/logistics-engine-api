const db = require("../config/db");

exports.createAgentsTable = (callback) => {
    const query = `CREATE TABLE IF NOT EXISTS agents (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        userId INTEGER NOT NULL,
        vehicleNumber TEXT,
        isActive BOOLEAN DEFAULT 1,
        FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
    );`;

    db.run(query, [], (err) => {
        if(err){
            return callback(err);
        }
        return callback(null);
    })
}
exports.updateAgentsTable = (userId, vehicleNumber, callback) => {
    const isActive = 1;
    if (!userId) {
        return callback(new Error("userId is required"));
    }

    const query = "INSERT INTO agents (userId, vehicleNumber, isActive) VALUES (?, ?, ?);";

    db.run(query, [userId, vehicleNumber || null, isActive], function(err) {
        if (err) {
            return callback(err);
        }
        // Return the inserted agent id
        return callback(null, this.lastID);
    });
};
