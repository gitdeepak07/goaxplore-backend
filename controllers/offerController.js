const db = require("../config/db")

exports.createOffer = (req, res) => {
  const { provider_id, activity_id, offer_name, discount_type, discount_value, valid_from, valid_to, description } = req.body

  const activityIdVal = (activity_id && String(activity_id).trim() !== '') ? activity_id : null

  const sql = `INSERT INTO offer (provider_id, activity_id, offer_name, offer_title, discount_type, discount_value, start_date, end_date, valid_from, valid_to, description, is_active)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`

  db.query(sql, [
    provider_id,
    activityIdVal,
    offer_name,
    offer_name,
    discount_type === 'percentage' ? 'Percent' : 'Flat',
    parseFloat(discount_value),
    valid_from || null,
    valid_to || null,
    valid_from || null,
    valid_to || null,
    description || null
  ], (err, result) => {
    if (err) {
      console.error('createOffer error:', err.message)
      return res.status(500).json({ message: err.message })
    }
    res.json({ message: "Offer created", offer_id: result.insertId })
  })
}

exports.getProviderOffers = (req, res) => {
  db.query("SELECT * FROM offer WHERE provider_id=?", [req.params.provider_id], (err, result) => {
    if (err) return res.status(500).json(err)
    res.json(result)
  })
}

exports.getPublicOffers = (req, res) => {
  const sql = `
    SELECT o.*, p.business_name AS provider_name, a.title AS activity_title
    FROM offer o
    JOIN provider p ON p.provider_id = o.provider_id
    LEFT JOIN activity a ON a.activity_id = o.activity_id
    WHERE p.verification_status = 'Approved'
      AND p.is_suspended = 0
      AND o.is_active = 1
      AND (o.end_date IS NULL OR o.end_date >= CURDATE())
    ORDER BY o.created_at DESC LIMIT 10
  `
  db.query(sql, (err, result) => {
    if (err) { console.error('getPublicOffers error:', err.message); return res.status(500).json({ message: err.message }) }
    res.json({ offers: result })
  })
}

exports.updateOffer = (req, res) => {
  const { offer_name, discount_type, discount_value, valid_from, valid_to, description } = req.body
  const sql = `UPDATE offer SET
    offer_name=?, offer_title=?, discount_type=?, discount_value=?,
    start_date=?, end_date=?, valid_from=?, valid_to=?, description=?
    WHERE offer_id=?`
  db.query(sql, [
    offer_name,
    offer_name,
    discount_type === 'percentage' ? 'Percent' : 'Flat',
    parseFloat(discount_value),
    valid_from || null,
    valid_to || null,
    valid_from || null,
    valid_to || null,
    description || null,
    req.params.offer_id
  ], (err) => {
    if (err) { console.error('updateOffer error:', err.message); return res.status(500).json({ message: err.message }) }
    res.json({ message: "Offer updated" })
  })
}

exports.deleteOffer = (req, res) => {
  db.query("DELETE FROM offer WHERE offer_id=?", [req.params.offer_id], (err) => {
    if (err) return res.status(500).json(err)
    res.json({ message: "Offer deleted" })
  })
}