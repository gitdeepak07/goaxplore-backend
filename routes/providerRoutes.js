const express = require("express");
const router = express.Router();
const db = require("../config/db");
const providerController = require("../controllers/providerController");


// POST /api/providers/login
router.post("/login", providerController.loginProvider);

// POST /api/providers/register
router.post("/register", providerController.registerProvider);

// GET /api/providers/by-activity/:title  ← MUST be before /:provider_id
router.get("/by-activity/:title", (req, res) => {
  const title = req.params.title;
  const sql = `
    SELECT DISTINCT p.provider_id, p.business_name, p.email, p.phone,
      p.address, p.verification_status, p.is_suspended,
      COUNT(a.activity_id) AS total_activities
    FROM provider p
    INNER JOIN activity a ON a.provider_id = p.provider_id
    WHERE a.title = ? AND a.status = 'Active'
    AND p.verification_status = 'Approved' AND p.is_suspended = 0
    GROUP BY p.provider_id
  `;
  db.query(sql, [title], (err, result) => {
    if (err) return res.status(500).json(err);
    res.json({ data: result });
  });
});

// GET /api/providers  ← all approved providers
router.get("/", (req, res) => {
  const sql = `
    SELECT p.provider_id, p.business_name, p.email, p.phone,
      p.address, p.verification_status, p.is_suspended,
      COUNT(a.activity_id) AS total_activities
    FROM provider p
    LEFT JOIN activity a ON a.provider_id = p.provider_id AND a.status = 'Active'
    WHERE p.verification_status = 'Approved' AND p.is_suspended = 0
    GROUP BY p.provider_id
  `;
  db.query(sql, (err, result) => {
    if (err) return res.status(500).json(err);
    res.json({ data: result });
  });
});

// GET /api/providers/:provider_id/activities ← MUST be before /:provider_id
router.get("/:provider_id/activities", providerController.getProviderActivities);

// GET /api/providers/:provider_id/profile — full profile with verification_status
router.get("/:provider_id/profile", (req, res) => {
  const provider_id = req.params.provider_id;
  const sql = `SELECT * FROM provider WHERE provider_id = ?`;
  db.query(sql, [provider_id], (err, result) => {
    if (err) return res.status(500).json({ message: err.message });
    if (result.length === 0) return res.status(404).json({ message: "Provider not found" });
    res.json(result[0]);
  });
});

// GET /api/providers/:provider_id — single provider with activities
router.get("/:provider_id", (req, res) => {
  const provider_id = req.params.provider_id;

  const providerSql = `
    SELECT provider_id, business_name, email, phone, address,
           verification_status, owner_name
    FROM provider
    WHERE provider_id = ?
  `;
  const activitiesSql = `
    SELECT activity_id, title, price_per_person, duration_minutes, average_rating
    FROM activity
    WHERE provider_id = ? AND status = 'Active'
  `;

  db.query(providerSql, [provider_id], (err, providerResult) => {
    if (err) return res.status(500).json(err);
    if (providerResult.length === 0) return res.status(404).json({ message: "Provider not found" });

    db.query(activitiesSql, [provider_id], (err, activitiesResult) => {
      if (err) return res.status(500).json(err);
      res.json({ ...providerResult[0], activities: activitiesResult });
    });
  });
});

// Update Provider Info

router.put("/:provider_id/profile", providerController.updateProviderProfile);

router.patch("/:provider_id", (req, res) => {
  const { provider_id } = req.params
  const { business_name, phone, address, description } = req.body

  db.query(
    `UPDATE Provider SET business_name=?, phone=?, address=? WHERE provider_id=?`,
    [business_name, phone, address, provider_id],
    (err) => {
      if (err) return res.status(500).json({ message: err.message })
      if (description !== undefined) {
        db.query(`UPDATE Provider SET description=? WHERE provider_id=?`, [description, provider_id], () => {})
      }
      res.json({ success: true, message: "Profile updated" })
    }
  )
})
module.exports = router;