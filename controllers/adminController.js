const db = require("../config/db");
const { notifyProviderApproved, notifyProviderRejected, notifyProviderSuspended } = require("../services/smsService");

/* ================= ADMIN LOGIN ================= */
exports.loginAdmin = (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ success: false, message: "Email and password required" });
  db.query("SELECT * FROM admin WHERE email = ?", [email], (err, rows) => {
    if (err) return res.status(500).json({ success: false, message: "Database error" });
    if (!rows.length) return res.status(401).json({ success: false, message: "Admin not found" });
    const admin = rows[0];
    if (admin.password_hash !== password) return res.status(401).json({ success: false, message: "Invalid password" });
    res.json({ success: true, admin: { admin_id: admin.admin_id, full_name: admin.full_name, email: admin.email, role: admin.role } });
  });
};

/* ================= GET ALL PROVIDERS ================= */
exports.getAllProviders = (req, res) => {
  db.query(`SELECT provider_id, business_name, owner_name, email, phone, address, verification_status, is_suspended, created_at FROM provider ORDER BY created_at DESC`, (err, result) => {
    if (err) return res.status(500).json({ success: false, message: "DB error" });
    res.json({ success: true, data: result });
  });
};

/* ================= APPROVE PROVIDER ================= */
exports.approveProvider = (req, res) => {
  const { id } = req.params;
  db.query(`UPDATE provider SET verification_status = 'Approved' WHERE provider_id = ?`, [id], (err) => {
    if (err) return res.status(500).json({ success: false, message: "DB error" });
    res.json({ success: true, message: "Provider approved successfully" });
    db.query(`INSERT INTO notification (provider_id, title, message) VALUES (?, 'Account Approved', 'Congratulations! Your GoaXplore provider account has been approved. You can now list activities.')`, [id]);
    db.query(`SELECT phone, business_name FROM provider WHERE provider_id = ?`, [id], (e, rows) => {
      if (!e && rows[0]?.phone) notifyProviderApproved(rows[0].phone, rows[0].business_name);
    });
  });
};

/* ================= REJECT PROVIDER ================= */
exports.rejectProvider = (req, res) => {
  const { id } = req.params;
  const { reason } = req.body;
  db.query(`UPDATE provider SET verification_status = 'Rejected' WHERE provider_id = ?`, [id], (err) => {
    if (err) return res.status(500).json({ success: false, message: "DB error" });
    res.json({ success: true, message: "Provider rejected successfully" });
    const msg = reason || 'Your account application was not approved.';
    db.query(`INSERT INTO notification (provider_id, title, message) VALUES (?, 'Account Rejected', ?)`, [id, msg]);
    db.query(`SELECT phone, business_name FROM provider WHERE provider_id = ?`, [id], (e, rows) => {
      if (!e && rows[0]?.phone) notifyProviderRejected(rows[0].phone, rows[0].business_name, reason);
    });
  });
};

/* ================= SUSPEND PROVIDER ================= */
exports.suspendProvider = (req, res) => {
  const { id } = req.params;
  db.query("UPDATE provider SET is_suspended = 1 WHERE provider_id = ?", [id], (err) => {
    if (err) return res.status(500).json({ success: false, message: "DB error" });
    res.json({ success: true, message: "Provider suspended successfully" });
    db.query(`INSERT INTO notification (provider_id, title, message) VALUES (?, 'Account Suspended', 'Your GoaXplore provider account has been suspended. Please contact support@goaxplore.com.')`, [id]);
    db.query(`SELECT phone, business_name FROM provider WHERE provider_id = ?`, [id], (e, rows) => {
      if (!e && rows[0]?.phone) notifyProviderSuspended(rows[0].phone, rows[0].business_name);
    });
  });
};

/* ================= UNSUSPEND PROVIDER ================= */
exports.unsuspendProvider = (req, res) => {
  const { id } = req.params;
  db.query("UPDATE provider SET is_suspended = 0 WHERE provider_id = ?", [id], (err) => {
    if (err) return res.status(500).json({ success: false, message: "DB error" });
    res.json({ success: true, message: "Provider unsuspended successfully" });
    db.query(`INSERT INTO notification (provider_id, title, message) VALUES (?, 'Account Reactivated', 'Your GoaXplore provider account has been reactivated.')`, [id]);
  });
};

/* ================= DELETE PROVIDER ================= */
exports.deleteProvider = async (req, res) => {
  const { id } = req.params;
  try {
    await db.promise().query(`DELETE FROM notification WHERE provider_id = ?`, [id]);
    await db.promise().query(`DELETE n FROM notification n JOIN booking b ON b.booking_id = n.booking_id WHERE b.provider_id = ?`, [id]);
    await db.promise().query(`DELETE r FROM review r JOIN booking b ON b.booking_id = r.booking_id WHERE b.provider_id = ?`, [id]);
    await db.promise().query(`DELETE p FROM payment p JOIN booking b ON b.booking_id = p.booking_id WHERE b.provider_id = ?`, [id]);
    await db.promise().query(`DELETE FROM booking WHERE provider_id = ?`, [id]);
    await db.promise().query(`DELETE s FROM activity_Slot s JOIN activity a ON a.activity_id = s.activity_id WHERE a.provider_id = ?`, [id]);
    await db.promise().query(`DELETE w FROM wishlist w JOIN activity a ON a.activity_id = w.activity_id WHERE a.provider_id = ?`, [id]);
    await db.promise().query(`DELETE FROM activity WHERE provider_id = ?`, [id]);
    await db.promise().query(`DELETE FROM offer WHERE provider_id = ?`, [id]);
    await db.promise().query(`DELETE FROM provider WHERE provider_id = ?`, [id]);
    res.json({ success: true, message: "Provider deleted successfully" });
  } catch (err) {
    console.error("Delete provider error:", err.message);
    res.status(500).json({ success: false, message: err.message || "DB error" });
  }
};