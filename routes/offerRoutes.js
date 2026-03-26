const express = require("express")
const router = express.Router()
const offerController = require("../controllers/offerController")
const db = require("../config/db")

router.get("/describe", (req, res) => {
  db.query("DESCRIBE Offer", (err, result) => {
    if (err) return res.status(500).json({ message: err.message })
    res.json(result)
  })
})

router.get("/public", offerController.getPublicOffers);
router.post("/", offerController.createOffer)
router.get("/provider/:provider_id", offerController.getProviderOffers)

router.patch("/:offer_id", (req, res) => {
  const { offer_id } = req.params
  const { offer_name, discount_type, discount_value, valid_from, valid_to, description, activity_id, max_usage } = req.body
  const activityIdVal = (activity_id && String(activity_id).trim() !== '') ? activity_id : null
  const maxUsageVal   = (max_usage  && String(max_usage).trim()  !== '') ? parseInt(max_usage) : null
  db.query(
    `UPDATE offer SET offer_name=?, discount_type=?, discount_value=?, valid_from=?, valid_to=?, description=?, activity_id=?, max_usage=? WHERE offer_id=?`,
    [offer_name, discount_type, parseFloat(discount_value), valid_from, valid_to, description, activityIdVal, maxUsageVal, offer_id],
    (err) => {
      if (err) { console.error('PATCH offer error:', err.message); return res.status(500).json({ message: err.message }) }
      res.json({ success: true })
    }
  )
})

router.delete("/:offer_id", (req, res) => {
  db.query(`DELETE FROM offer WHERE offer_id=?`, [req.params.offer_id], (err) => {
    if (err) return res.status(500).json({ message: err.message })
    res.json({ success: true })
  })
})

module.exports = router