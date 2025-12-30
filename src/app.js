require('dotenv').config();

const express = require('express');
const app = express();

const PORT = process.env.PORT || 3000;

app.use(express.json());

const { initialization } = require("./init/initialization");
const authRoutes = require("./routes/authRoutes");
const orderRoutes = require("./routes/orderRoutes");

initialization((err) => {
    if (err) {
        console.error("FAILED TO INITIALIZE DATABASE:", err.message);
        process.exit(1);
    }
    console.log("DATABASE INITIALIZED SUCCESSFULLY");

    app.use("/auth", authRoutes);
    app.use("/orders", orderRoutes);

    app.listen(PORT, () => {
        console.log(`SERVER RUNNING ON PORT ${PORT}`);
    });
});
