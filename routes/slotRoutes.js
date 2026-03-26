const express = require("express")
const router = express.Router()
const db = require("../config/db")
const slotController = require("../controllers/slotController")

router.get("/:activity_id", slotController.getActivitySlots)
router.post("/", slotController.createSlot)

// Edit slot
router.patch("/:slot_id", (req, res) => {
  const { slot_id } = req.params
  const { slot_date, start_time, end_time, capacity_total } = req.body
  db.query(
    `UPDATE Activity_Slot SET slot_date=?, start_time=?, end_time=?, capacity_total=?, capacity_available=? WHERE slot_id=?`,
    [slot_date, start_time, end_time, capacity_total, capacity_total, slot_id],
    (err) => {
      if (err) return res.status(500).json({ message: err.message })
      res.json({ success: true, message: "Slot updated" })
    }
  )
})

// Delete slot
router.delete("/:slot_id", (req, res) => {
  const { slot_id } = req.params
  db.query(`DELETE FROM activity_Slot WHERE slot_id=?`, [slot_id], (err) => {
    if (err) return res.status(500).json({ message: err.message })
    res.json({ success: true, message: "Slot deleted" })
  })
})

module.exports = router