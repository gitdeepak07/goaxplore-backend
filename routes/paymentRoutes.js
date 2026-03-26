const express = require("express")
const router = express.Router()

const paymentController = require("../controllers/paymentController")

router.post("/", paymentController.createPayment)
router.post("/refund/:booking_id", paymentController.refundPayment)
router.get("/booking/:booking_id", paymentController.getPaymentByBooking)
module.exports = router