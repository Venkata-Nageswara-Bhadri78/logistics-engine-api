const db = require("../config/db");

exports.createUsersTable = (callback) => {
    const query = `CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role TEXT CHECK(role IN ('ADMIN', 'AGENT', 'CUSTOMER')) NOT NULL,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
    );`;

    db.run(query, [], (err) => {
        if(err){
            return callback(err);
        }
        return callback(null);
    })
}

exports.registerUser = (userData, callback) => {
    const query = `INSERT INTO users (name, email, password, role, createdAt) VALUES (?, ?, ?, ?, ?);`;

    db.run(query, [
        userData.name, 
        userData.email, 
        userData.password, 
        userData.role,
        userData.createdAt
    ], (err) => {
        if(err){
            return callback(err);
        }
        return callback(null);
    })
}

exports.loginUser = (userData, callback) => {
    const query = 'SELECT * FROM users WHERE EMAIL = ?';
    db.get(query, [userData.email], (err, row) => {
        if(err){
            return callback(err, null, "ERROR IN CHECKING USER LOGIN");
        }
        if(!row){
            return callback(null, null, "NO USER FOUND");
        }
        return callback(null, row, "USER DETAILS FOUND");
    });
}

exports.getUserById = (userId, callback) => {
    const query = `SELECT * FROM users WHERE ID = ?;`;
    db.get(query, [userId], (err, row) => {
        if(err){
            return callback(err, null);
        }
        return callback(null, row);
    });
}

exports.changeUserPasswordById = (newPassword, userId, callback) => {
    const query = `UPDATE USERS SET PASSWORD = ? WHERE ID = ?;`;
    db.run(query, [newPassword, userId], (err, row) => {
        if(err){
            return callback(err, null);
        }
        return callback(null, row);
    });
}