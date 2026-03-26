const db = require("../config/db")

exports.createOffer = (req, res) => {
  const { provider_id, activity_id, offer_name, discount_type, discount_value, valid_from, valid_to, max_usage, description } = req.body

  // Coerce empty string / falsy to null for FK columns
  const activityIdVal = (activity_id && String(activity_id).trim() !== '') ? activity_id : null
  const maxUsageVal   = (max_usage  && String(max_usage).trim()  !== '') ? parseInt(max_usage) : null

  const sql = `INSERT INTO Offer (provider_id, activity_id, offer_name, discount_type, discount_value, valid_from, valid_to, max_usage, description, status)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'Active')`

  db.query(sql, [provider_id, activityIdVal, offer_name, discount_type || 'percentage', parseFloat(discount_value), valid_from, valid_to, maxUsageVal, description || null], (err, result) => {
    if (err) {
      console.error('createOffer error:', err.message)
      return res.status(500).json({ message: err.message })
    }
    res.json({ message: "Offer created", offer_id: result.insertId })
  })
}

exports.getProviderOffers = (req, res) => {
  db.query("SELECT * FROM Offer WHERE provider_id=?", [req.params.provider_id], (err, result) => {
    if (err) return res.status(500).json(err)
    res.json(result)
  })
}

exports.getPublicOffers = (req, res) => {
  const sql = `
    SELECT o.offer_id, o.offer_name, o.discount_type, o.discount_value,
           o.valid_from, o.valid_to, o.description,
           p.business_name AS provider_name,
           a.title AS activity_title
    FROM Offer o
    JOIN Provider p ON p.provider_id = o.provider_id
    LEFT JOIN Activity a ON a.activity_id = o.activity_id
    WHERE o.status = 'Active'
      AND p.verification_status = 'Approved'
      AND p.is_suspended = 0
      AND (o.valid_to IS NULL OR o.valid_to >= CURDATE())
    ORDER BY o.created_at DESC LIMIT 10
  `;
  db.query(sql, (err, result) => {
    if (err) {
      console.error('getPublicOffers error:', err.message)
      return res.status(500).json({ message: err.message })
    }
    res.json({ offers: result });
  });
};