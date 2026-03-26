const express = require("express")
const router = express.Router()
const locationController = require("../controllers/locationController")

router.get("/", locationController.getLocations)
router.get("/:location_id", locationController.getLocationById)  // ← NEW
router.patch("/:location_id", locationController.updateLocationCoords)

module.exports = router