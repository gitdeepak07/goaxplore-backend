const db = require("../config/db")

exports.getProviderActivities = (req, res) => {

  const provider = req.params.provider_id
  const { notifyActivityCancelled } = require("../services/smsService")

  const sql = `
SELECT activity_id,title,description,price_per_person
FROM activity
WHERE provider_id=? AND status='Active'
`

  db.query(sql, [provider], (err, result) => {

    if (err) return res.status(500).json(err)

    res.json(result)

  })

}


exports.getActivityDetails = (req, res) => {

  const activity = req.params.activity_id

  const sql = `
SELECT *
FROM activity
WHERE activity_id=?
`

  db.query(sql, [activity], (err, result) => {

    if (err) return res.status(500).json(err)

    res.json(result[0])

  })

}

exports.createActivity = (req, res) => {
  const {
    provider_id,
    category_id,
    location_id,
    title,
    description,
    duration_minutes,
    price_per_person,
    max_participants,
    image_url,
    custom_latitude,
    custom_longitude
  } = req.body

  const sql = `
    INSERT INTO activity
    (provider_id, category_id, location_id, title, description,
     duration_minutes, price_per_person, max_participants, image_url,
     custom_latitude, custom_longitude, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Active')
  `

  db.query(sql,
    [provider_id, category_id, location_id, title, description,
      duration_minutes, price_per_person, max_participants, image_url || null,
      custom_latitude ?? null, custom_longitude ?? null],
    (err, result) => {
      if (err) return res.status(500).json(err)
      res.json({ message: "Activity created", activity_id: result.insertId })
    }
  )
}

exports.updateActivity = (req, res) => {
  const activity_id = req.params.activity_id
  const { title, description, price_per_person, max_participants, duration_minutes, image_url, category_id, location_id } = req.body

  const sql = `
    UPDATE activity
    SET title=?, description=?, price_per_person=?, max_participants=?,
        duration_minutes=?, image_url=COALESCE(NULLIF(?, ''), image_url),
        category_id=COALESCE(?, category_id), location_id=COALESCE(?, location_id)
    WHERE activity_id=?
  `
  db.query(sql, [title, description, price_per_person, max_participants, duration_minutes, image_url || '', category_id || null, location_id || null, activity_id], (err) => {
    if (err) return res.status(500).json({ message: err.message })
    res.json({ success: true, message: "Activity updated" })
  })
}

exports.deleteActivity = (req, res) => {

  const activity_id = req.params.activity_id

  // Auto-cancel any pending/confirmed bookings for this activity
  const cancelBookings = `
UPDATE booking 
SET booking_status = 'Cancelled'
WHERE activity_id = ? AND booking_status IN ('Pending', 'Confirmed')
`

  db.query(cancelBookings, [activity_id], (err) => {
    if (err) return res.status(500).json(err)

    // Now soft-delete the activity
    db.query(
      "UPDATE activity SET status = 'Removed' WHERE activity_id = ?",
      [activity_id],
      (err) => {
        if (err) return res.status(500).json(err)
        // NOTIFY ALL USERS WHO HAD ACTIVE BOOKINGS
        const getAffectedUsers = `
SELECT u.phone, u.full_name, b.booking_code, a.title, b.total_amount
FROM booking b
JOIN user u ON u.user_id = b.user_id
JOIN activity a ON a.activity_id = b.activity_id
WHERE b.activity_id = ? AND b.booking_status IN ('Pending', 'Confirmed')
`
        db.query(getAffectedUsers, [parseInt(activity_id)], (err, users) => {
          if (!err && users.length > 0) {
            users.forEach(u => {
              if (u.phone) {
                notifyActivityCancelled(u.phone, u.full_name, u.booking_code, u.title, u.total_amount)
              }
            })
          }
        })
        res.json({ message: "Activity deleted successfully" })
      }
    )
  })
}