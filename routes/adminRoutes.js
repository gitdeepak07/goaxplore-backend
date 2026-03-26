const express = require("express");
const router = express.Router();
const adminController = require("../controllers/adminController");

// Auth
router.post("/login", adminController.loginAdmin);

// Provider Management
router.get("/providers", adminController.getAllProviders);
router.put("/providers/:id/approve", adminController.approveProvider);
router.put("/providers/:id/reject", adminController.rejectProvider);
router.put("/providers/:id/suspend", adminController.suspendProvider);
router.put("/providers/:id/unsuspend", adminController.unsuspendProvider);
router.delete("/providers/:id", adminController.deleteProvider);

module.exports = router;