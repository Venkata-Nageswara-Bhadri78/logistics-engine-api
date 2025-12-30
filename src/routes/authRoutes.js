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