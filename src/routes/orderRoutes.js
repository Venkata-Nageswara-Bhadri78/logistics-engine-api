const express = require("express");
const router = express.Router();

const authMiddleware = require("../middlewares/authMiddleware");
const orderController = require("../controllers/orderControllers");

router.post("/", authMiddleware.verifyToken, orderController.createNewOrder);
router.put("/:id/assign", authMiddleware.verifyToken, orderController.assignAgentForOrder);
router.put("/:id/status", authMiddleware.verifyToken, orderController.updateOrderStatus);
router.get("/:id/history", authMiddleware.verifyToken, orderController.getOrderHistory);

router.get("/", authMiddleware.verifyToken, orderController.getAllEligibleOrders);
router.get("/:id", authMiddleware.verifyToken, orderController.getDetailedOrderInfo);
router.get("/customer/:id", authMiddleware.verifyToken, orderController.fetchOrdersOfCustomer);
router.get("/agent/:id", authMiddleware.verifyToken, orderController.fetchOrdersAssignedToAgents);

module.exports = router;

/*
const express = require('express');
const router = express.Router();

const authController = require("../controllers/authControllers");
const authMiddleware = require("../middlewares/authMiddleware");

router.post("/register", authController.registerUser);
router.post("/login", authController.loginUser);
router.get("/me", authMiddleware.verifyToken, authController.getProfileDetails);
router.put("/change-password", authMiddleware.verifyToken, authController.changeUserPassword);
router.post("/logout", authMiddleware.verifyToken, authController.logoutUser);
module.exports = router;
*/