const db = require("../config/db");

exports.loginProvider = (req, res) => {

  const { email, password } = req.body;

  db.query(
    "SELECT * FROM provider WHERE email = ?",
    [email],
    (err, rows) => {

      if (err) {
        console.error(err);
        return res.status(500).json({ message: "Database error" });
      }

      if (rows.length === 0) {
        return res.status(401).json({ message: "Invalid email" });
      }

      const provider = rows[0];

      if (provider.password_hash !== password) {
        return res.status(401).json({ message: "Invalid password" });
      }

      res.json({
        success: true,
        provider: {
          provider_id: provider.provider_id,
          id: provider.provider_id,
          business_name: provider.business_name,
          name: provider.business_name,
          email: provider.email,
          phone: provider.phone,
          verification_status: provider.verification_status,
          verified: provider.verification_status === "Approved",
        }
      });

    }
  );

};


exports.getProviderActivities = (req, res) => {

  const provider_id = req.params.provider_id

  const sql = `
SELECT 
activity_id,
title,
description,
price_per_person,
duration_minutes,
max_participants,
average_rating,
image_url,
category_id,
location_id,
status
FROM activity
WHERE provider_id=? AND status='Active'
`

  db.query(sql, [provider_id], (err, result) => {

    if (err) return res.status(500).json(err)

    res.json(result)

  })

}

exports.registerProvider = (req, res) => {
  const { business_name, owner_name, email, phone, password } = req.body

  if (!business_name || !email || !password) {
    return res.status(400).json({
      success: false,
      message: "Business name, email and password are required."
    })
  }

  // Check if email already exists
  db.query(
    "SELECT provider_id FROM provider WHERE email = ?",
    [email],
    (err, existing) => {
      if (err) return res.status(500).json({ success: false, message: "DB error" })

      if (existing.length > 0) {
        return res.status(409).json({
          success: false,
          message: "An account with this email already exists."
        })
      }

      // FIX: use owner_name not contact_person
      const sql = `
        INSERT INTO provider 
        (business_name, owner_name, email, phone, password_hash, verification_status)
        VALUES (?, ?, ?, ?, ?, 'Pending')
      `

      db.query(
        sql,
        [business_name, owner_name || business_name, email, phone || null, password],
        (err, result) => {
          if (err) {
            console.error("Register provider error:", err)
            return res.status(500).json({
              success: false,
              message: "Registration failed",
              error: err.sqlMessage
            })
          }

          res.status(201).json({
            success: true,
            message: "Registered successfully. Awaiting admin approval."
          })
        }
      )
    }
  )
}


// UPDATE provider Profille

exports.updateProviderProfile = (req, res) => {
  const provider_id = req.params.provider_id;
  const { business_name, phone, address, description } = req.body;
  db.query(
    `UPDATE provider SET business_name=?, phone=?, address=? WHERE provider_id=?`,
    [business_name, phone || null, address || null, provider_id],
    (err) => {
      if (err) return res.status(500).json({ success: false, message: err.message });
      if (description !== undefined) {
        db.query(`UPDATE provider SET description=? WHERE provider_id=?`, [description, provider_id], () => {});
      }
      res.json({ success: true, message: "Profile updated successfully" });
    }
  );
};