const { resolve } = require("path");
const db = require("../config/db");
const { rejects } = require("assert");
const { param } = require("../routes/authRoutes");
const { callbackify } = require("util");

exports.createOrdersTable = (callback) => {
    const query = `CREATE TABLE IF NOT EXISTS orders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        customerId INTEGER NOT NULL,
        agentId INTEGER,
        pickupAddress TEXT NOT NULL,
        deliveryAddress TEXT NOT NULL,
        packageWeight REAL CHECK(packageWeight > 0),
        status TEXT CHECK(
            status IN (
            'CREATED',
            'ASSIGNED',
            'IN_TRANSIT',
            'DELIVERED',
            'FAILED',
            'RETURNED',
            'COMPLETED'
            )
        ) NOT NULL DEFAULT 'CREATED',
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,

        FOREIGN KEY (customerId) REFERENCES customers(id),
        FOREIGN KEY (agentId) REFERENCES agents(id)
    );`;
    
    db.run(query, [], (err) => {
        if(err){
            return callback(err);
        }
        return callback(null);
    })
}

exports.createOrdersHistoryTable = (callback) => {
    const query = `CREATE TABLE IF NOT EXISTS order_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        orderId INTEGER NOT NULL,
        status TEXT NOT NULL,
        changedBy INTEGER NOT NULL,
        changedAt DATETIME DEFAULT CURRENT_TIMESTAMP,

        FOREIGN KEY (orderId) REFERENCES orders(id),
        FOREIGN KEY (changedBy) REFERENCES users(id)
    );`;
    
    db.run(query, [], (err) => {
        if(err){
            return callback(err);
        }
        return callback(null);
    })
}
exports.updateOrderHistory = (orderId, status, changedBy, callback) => {
    const orderHistoryInsertion = "INSERT INTO ORDER_HISTORY (orderId, status, changedBy) values (?, ?, ?);";
    db.run(orderHistoryInsertion, [orderId, status, changedBy], (err) => {
        if(err){
            return callback(err, "ERROR IN ORDER HISTORY UPDATION")
        }
        return callback(null, "AGENT ASSIGNED AND HISTORY UPDATED FOR ORDER SUCESSFULLY");
    });
}

exports.indexingTables = (callback) => {
    let completed = 0;
    const queriesArray = [
        "CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);",
        "CREATE INDEX IF NOT EXISTS idx_orders_customer ON orders(customerId);",
        "CREATE INDEX IF NOT EXISTS idx_orders_agent ON orders(agentId);",
        "CREATE INDEX IF NOT EXISTS idx_history_order ON order_history(orderId);"
    ];

    queriesArray.forEach((eachQuery) => {
        db.run(eachQuery, [], (err) => {
            if(err){
                return callback(err);
            }
            completed++;
            if(completed==queriesArray.length){
                return callback(null);
            }
        })
    })
}

exports.createNewOrder = (orderData, callback) => {
    const query = `INSERT INTO ORDERS (customerId, pickupAddress, deliveryAddress, packageWeight) VALUES (?, ?, ?, ?);`;
    db.run(query, [orderData.customer_id, orderData.pickupAddress, orderData.deliveryAddress, orderData.packageWeight], function (err) {
        if(err){
            return callback(err, null);
        }
        return callback(null, this.lastID);
    })
}

exports.assignAgent = (orderId, agentId, userId, callback) => {
    const query = 'SELECT * FROM ORDERS WHERE ID = ?;';
    db.get(query, [orderId], (err, order) => {
        if(err){
            return callback(err, "ERROR IN CHECKING THE ORDER DETAILS");
        }
        if(!order){
            return callback(null, "NO ORDER FOUND WITH GIVEN ORDER ID TO ASSIGN AGENT");
        }
        if (order.status !== "CREATED") {
            return callback(null, "Order cannot be assigned in current state");
        }
        db.get("SELECT * FROM agents WHERE id = ?", [agentId], (err, agent) => {
            if(err || !agent){
                return callback(err, "AGENT NOT FOUND");
            }
            if(!agent.isActive){
                return callback(null, "AGENT IS NOT ACTIVE CURRENTLY");
            }

            const updateQuery = "UPDATE ORDERS SET agentId = ?, status = 'ASSIGNED' where id = ?;";

            db.run(updateQuery, [agentId, orderId], (err) => {
                if(err){
                    return callback(err, "FAILED TO ASSIGN AGENT");
                }
                return exports.updateOrderHistory(orderId, "ASSIGNED", userId, callback)
            })
        })
    })
}

exports.getOrderById = (orderId) => {
    return new Promise((resolve, reject) => {
        const query = "SELECT * FROM Orders WHERE id = ?";
        db.get(query, [orderId], (err, row) => {
            if(err){
                return reject(err);
            }
            return resolve(row);
        })
    })
}

exports.updateOrderStatus = (status, orderId) => {
    return new Promise((resolve, reject) => {
        const query = "UPDATE ORDERS SET status = ? WHERE id = ?;";
        db.run(query, [status, orderId], function (err) {
            if(err){
                return reject(err);
            }
            resolve(this.changes);
        });
    })
}

exports.getOrderHistoryById = (orderId) => {
    return new Promise((resolve, reject) => {
        const query = "SELECT * FROM order_history WHERE orderId = ? ORDER BY changedAt desc;";
        db.all(query, [orderId], (err, rows) => {
            if(err){
                return reject(err);
            }
            resolve(rows);
        })
    })
}

exports.getAllEligibleOrders = (id, role, page, limit, status) => {
    return new Promise((resolve, reject) => {
        let baseQuery = "SELECT * FROM orders WHERE 1=1";
        let addedQueries = "";
        const offset = (page - 1)*limit;
        const params = [];
        if(role==="ADMIN"){
            // No NEED CHANGES;
        }
        else if(role==="AGENT"){
            addedQueries += " AND agentId = ?";
            params.push(id);
        }
        else{
            addedQueries += " AND customerId = ?";
            params.push(id);
        }

        if(status){
            addedQueries += " AND status = ?";
            params.push(status);
        }
        baseQuery += addedQueries;
        baseQuery += " ORDER BY createdAt DESC LIMIT ? OFFSET ?";
        params.push(limit, offset);

        db.all(baseQuery, params, (err, rows) => {
            if(err){
                return reject(err);
            }
            // We have rows here
            let baseCountQuery = "Select count(*) as total from orders where 1=1";
            baseCountQuery += addedQueries;
            const countParams = params.slice(0, params.length - 2);
            db.get(baseCountQuery, countParams, (err, count) => {
                if(err){
                    return reject(err);
                }
                const finalData = {
                    page: page,
                    limit: limit,
                    totalRecords: count.total,
                    totalPages: Math.ceil(count.total / limit),
                    data: rows
                }
                return resolve(finalData);
            })
        });
    });
}