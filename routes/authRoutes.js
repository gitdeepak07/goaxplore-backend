const express = require("express")
const router = express.Router()
const db = require("../config/db")
const authController = require("../controllers/authController")

router.post("/register", authController.registerUser)
router.post("/login", authController.loginUser)
router.put("/change-password/:user_id", authController.changeUserPassword)

router.patch("/update-profile", (req, res) => {
  const { user_id, full_name, email, phone, address } = req.body
  if (!user_id) return res.status(400).json({ message: "user_id required" })
  // Update basic fields — skip address/phone if column missing, handled gracefully
  const sql = `UPDATE user SET full_name=?, email=? WHERE user_id=?`
  db.query(sql, [full_name, email, user_id], (err) => {
    if (err) return res.status(500).json({ message: err.message })
    // Try phone and address separately — ignore if column missing
    db.query(`UPDATE user SET phone=? WHERE user_id=?`, [phone, user_id], () => {})
    db.query(`UPDATE user SET address=? WHERE user_id=?`, [address, user_id], () => {})
    res.json({ success: true, message: "Profile updated" })
  })
})

module.exports = router