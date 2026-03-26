const express = require("express")
const router = express.Router()

const dashboardController = require("../controllers/dashboardController")

/* Admin Dashboard */

router.get("/admin", dashboardController.adminStats)

/* Provider Dashboard */

router.get("/provider/:id", dashboardController.providerStats)

/* User Dashboard */

router.get("/user/:id", dashboardController.userStats)

module.exports = router