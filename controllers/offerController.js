const db = require("../config/db")

exports.createOffer = (req, res) => {
  const { provider_id, activity_id, offer_name, discount_type, discount_value, valid_from, valid_to, max_usage, description } = req.body

  // Coerce empty string / falsy to null for FK columns
  const activityIdVal = (activity_id && String(activity_id).trim() !== '') ? activity_id : null
  const maxUsageVal   = (max_usage  && String(max_usage).trim()  !== '') ? parseInt(max_usage) : null

  const sql = `INSERT INTO offer (provider_id, activity_id, offer_name, discount_type, discount_value, valid_from, valid_to, max_usage, description, status)
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
  db.query("SELECT * FROM offer WHERE provider_id=?", [req.params.provider_id], (err, result) => {
    if (err) return res.status(500).json(err)
    res.json(result)
  })
}

exports.getPublicOffers = (req, res) => {
  db.query("DESCRIBE Offer", (descErr, cols) => {
    if (descErr) return res.status(500).json({ message: descErr.message });
    const colNames = cols.map(c => c.Field);
    let where = `p.verification_status = 'Approved' AND p.is_suspended = 0`;
    if (colNames.includes('status'))   where += ` AND o.status = 'Active'`;
    if (colNames.includes('valid_to')) where += ` AND (o.valid_to IS NULL OR o.valid_to >= CURDATE())`;
    const sql = `
      SELECT o.*, p.business_name AS provider_name, a.title AS activity_title
      FROM Offer o
      JOIN provider p ON p.provider_id = o.provider_id
      LEFT JOIN activity a ON a.activity_id = o.activity_id
      WHERE ${where}
      ORDER BY o.created_at DESC LIMIT 10
    `;
    db.query(sql, (err, result) => {
      if (err) { console.error('getPublicOffers error:', err.message); return res.status(500).json({ message: err.message }); }
      res.json({ offers: result });
    });
  });
};