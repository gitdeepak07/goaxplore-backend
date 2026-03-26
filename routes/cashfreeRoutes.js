const express = require("express");
const router = express.Router();
const cashfreeController = require("../controllers/cashfreeController");

router.post("/create-order", cashfreeController.createOrder);
router.post("/verify", cashfreeController.verifyPayment);

module.exports = router;