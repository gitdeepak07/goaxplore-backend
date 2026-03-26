const express = require("express")
const router = express.Router()
const db = require("../config/db")

// User creates ticket
router.post("/", (req, res) => {
  const { user_id, provider_id, subject, category, booking_id, description } = req.body
  if (!user_id || !subject || !description) return res.status(400).json({ message: "Missing fields" })
  db.query(
    `INSERT INTO supportticket (user_id, provider_id, booking_id, subject, category, description, status) VALUES (?,?,?,?,?,?,'open')`,
    [user_id, provider_id || null, booking_id || null, subject, category || 'general', description],
    (err, result) => {
      if (err) return res.status(500).json({ message: err.message })
      res.json({ success: true, ticket_id: result.insertId, message: "Ticket created" })
    }
  )
})

// Get tickets for user
router.get("/user/:user_id", (req, res) => {
  db.query(
    `SELECT t.*, p.business_name AS provider_name FROM supportticket t LEFT JOIN provider p ON p.provider_id=t.provider_id WHERE t.user_id=? ORDER BY t.created_at DESC`,
    [req.params.user_id],
    (err, result) => {
      if (err) return res.status(500).json({ message: err.message })
      res.json(result)
    }
  )
})

// Get tickets for provider
router.get("/provider/:provider_id", (req, res) => {
  db.query(
    `SELECT t.*, u.full_name AS user_name FROM supportticket t JOIN user u ON u.user_id=t.user_id WHERE t.provider_id=? ORDER BY t.created_at DESC`,
    [req.params.provider_id],
    (err, result) => {
      if (err) return res.status(500).json({ message: err.message })
      res.json(result)
    }
  )
})

// Get all tickets for admin
router.get("/admin/all", (req, res) => {
  db.query(
    `SELECT t.*, u.full_name AS user_name, u.email AS user_email, p.business_name AS provider_name FROM supportticket t JOIN user u ON u.user_id=t.user_id LEFT JOIN provider p ON p.provider_id=t.provider_id ORDER BY t.created_at DESC`,
    (err, result) => {
      if (err) return res.status(500).json({ message: err.message })
      res.json(result)
    }
  )
})

// Provider/Admin replies to ticket
router.post("/:ticket_id/reply", (req, res) => {
  const { ticket_id } = req.params
  const { reply, replied_by } = req.body
  db.query(
    `UPDATE supportticket SET reply=?, replied_by=?, replied_at=NOW(), status='replied' WHERE ticket_id=?`,
    [reply, replied_by || 'provider', ticket_id],
    (err) => {
      if (err) return res.status(500).json({ message: err.message })
      // Notify user
      db.query(`INSERT INTO notification (user_id, title, message) SELECT user_id, 'Support Reply', ? FROM supportticket WHERE ticket_id=?`, [reply, ticket_id])
      res.json({ success: true, message: "Reply sent" })
    }
  )
})

// User marks ticket resolved or reopens
router.patch("/:ticket_id/status", (req, res) => {
  const { status } = req.body // 'resolved' or 'open'
  db.query(`UPDATE supportticket SET status=? WHERE ticket_id=?`, [status, req.params.ticket_id], (err) => {
    if (err) return res.status(500).json({ message: err.message })
    res.json({ success: true })
  })
})

module.exports = router