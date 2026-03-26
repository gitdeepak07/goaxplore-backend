const express = require("express")
const router = express.Router()
const db = require("../config/db")

// User sends contact message
router.post("/", (req, res) => {
  const { name, email, subject, message } = req.body
  if (!name || !email || !message) return res.status(400).json({ message: "Missing fields" })
  db.query(
    `INSERT INTO ContactMessage (name, email, subject, message) VALUES (?,?,?,?)`,
    [name, email, subject || '', message],
    (err, result) => {
      if (err) return res.status(500).json({ message: err.message })
      res.json({ success: true, message_id: result.insertId, message: "Message sent successfully" })
    }
  )
})

// Admin gets all contact messages
router.get("/admin/all", (req, res) => {
  db.query(`SELECT * FROM ContactMessage ORDER BY created_at DESC`, (err, result) => {
    if (err) return res.status(500).json({ message: err.message })
    res.json(result)
  })
})

// Admin replies to contact message
router.post("/:message_id/reply", (req, res) => {
  const { reply } = req.body
  db.query(
    `UPDATE ContactMessage SET admin_reply=?, replied_at=NOW(), status='replied' WHERE message_id=?`,
    [reply, req.params.message_id],
    (err) => {
      if (err) return res.status(500).json({ message: err.message })
      res.json({ success: true, message: "Reply sent" })
    }
  )
})

module.exports = router