// INITIALIZATIONS

const authModel = require("../models/authModel");
const agentsModel = require("../models/agentsModel");
const customersModel = require("../models/customersModel");
const ordersModel = require("../models/ordersModel");

exports.initialization = (callback) => {
    authModel.createUsersTable((err) => {
        if (err) return callback(err);

        agentsModel.createAgentsTable((err) => {
            if (err) return callback(err);

            customersModel.createCustomersTable((err) => {
                if (err) return callback(err);

                ordersModel.createOrdersTable((err) => {
                    if (err) return callback(err);

                    ordersModel.createOrdersHistoryTable((err) => {
                        if (err) return callback(err);

                        ordersModel.indexingTables((err) => {
                            if (err) return callback(err);
                            return callback(null);
                        });
                    });
                });
            });
        });
    });
};