const express = require("express")
const router = express.Router()
const notificationController = require("../controllers/notificationController")

router.post("/", notificationController.createNotification)

// MUST be before /:user_id
router.get("/provider/:provider_id", notificationController.getProviderNotifications)
router.patch("/read/:notification_id", notificationController.markAsRead)
router.put("/:notification_id", notificationController.markAsRead)

router.get("/:user_id", notificationController.getUserNotifications)

module.exports = router