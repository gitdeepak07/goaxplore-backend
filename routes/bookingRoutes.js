const express = require("express")
const router = express.Router()
const bookingController = require("../controllers/bookingController")

router.post("/preview", bookingController.previewBooking)
router.post("/", bookingController.createBooking)

// IMPORTANT: specific named routes MUST come before /:param routes


router.get("/user/:user_id", bookingController.getUserBookings)
router.get("/provider/:provider_id", bookingController.getProviderBookings)
router.get("/:booking_id", bookingController.getBookingDetails)

router.patch("/:id/approve", bookingController.approveBooking)
router.patch("/:id/reject", bookingController.rejectBooking)
router.patch("/:id/cancel", bookingController.cancelBooking)       // ← NEW
router.patch("/:id/complete", bookingController.completeBooking)   // ← NEW

module.exports = router