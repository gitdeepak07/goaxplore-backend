const db = require("../config/db");

/* =========================
ADMIN DASHBOARD
========================= */

exports.adminStats = async (req, res) => {
  try {
    const [[usersRow]] = await db.promise().query(`SELECT COUNT(*) AS total_users FROM User`);
    const [[providersRow]] = await db.promise().query(`SELECT COUNT(*) AS total_providers FROM Provider WHERE verification_status='Approved'`);
    const [[activitiesRow]] = await db.promise().query(`SELECT COUNT(*) AS total_activities FROM Activity WHERE status='Active'`);
    const [[bookingsRow]] = await db.promise().query(`SELECT COUNT(*) AS total_bookings FROM Booking`);

    res.json({
      users: usersRow.total_users,
      providers: providersRow.total_providers,
      activities: activitiesRow.total_activities,
      bookings: bookingsRow.total_bookings
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server Error" });
  }
};


/* =========================
PROVIDER DASHBOARD
========================= */

exports.providerStats = async (req, res) => {
  try {
    const providerId = req.params.id;
    const [[activities]] = await db.promise().query(`SELECT COUNT(*) AS total_activities FROM Activity WHERE provider_id = ?`, [providerId]);
    const [[bookings]] = await db.promise().query(`SELECT COUNT(*) AS total_bookings FROM Booking WHERE provider_id = ?`, [providerId]);
    const [[pending]] = await db.promise().query(`SELECT COUNT(*) AS pending_requests FROM Booking WHERE provider_id = ? AND booking_status='Pending'`, [providerId]);
    res.json({
      activities: activities.total_activities,
      bookings: bookings.total_bookings,
      pending_requests: pending.pending_requests
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server Error" });
  }
};


/* =========================
USER DASHBOARD
========================= */

exports.userStats = async (req, res) => {
  try {
    const userId = req.params.id;
    const [[bookings]] = await db.promise().query(`SELECT COUNT(*) AS total_bookings FROM Booking WHERE user_id = ?`, [userId]);
    const [[completed]] = await db.promise().query(`SELECT COUNT(*) AS completed_activities FROM Booking WHERE user_id = ? AND booking_status='Completed'`, [userId]);
    res.json({
      total_bookings: bookings.total_bookings,
      completed_activities: completed.completed_activities
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server Error" });
  }
};