const express = require("express")
const router = express.Router()
const db = require("../config/db")
const activityController = require("../controllers/activityController")

// GET ALL ACTIVITIES
router.get("/", (req, res) => {
  const sql = `
    SELECT
      a.activity_id,
      a.title,
      a.description,
      a.price_per_person,
      a.duration_minutes,
      a.max_participants,
      a.average_rating,
      a.status,
      a.provider_id,
      a.category_id,
      a.location_id,
      a.image_url,
      a.custom_latitude,
      a.custom_longitude,
      c.category_name,
      l.location_name,
      l.latitude,
      l.longitude,
      l.address
    FROM acitivty a
    LEFT JOIN category c ON a.category_id = c.category_id
    LEFT JOIN Location l ON a.location_id = l.location_id
    WHERE a.status = 'Active'
  `
  db.query(sql, (err, result) => {
    if (err) return res.status(500).json(err)
    res.json({ data: result })
  })
})

// CREATE ACTIVITY
router.post("/", activityController.createActivity)

// UPDATE ACTIVITY
router.patch("/:activity_id", activityController.updateActivity)

// DELETE ACTIVITY — must be before /:activity_id
router.delete("/:activity_id", activityController.deleteActivity)

// GET SINGLE ACTIVITY
router.get("/:activity_id", activityController.getActivityDetails)

module.exports = router