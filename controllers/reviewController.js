const db = require("../config/db")

exports.createReview = (req, res) => {
  const { booking_id, rating, comment } = req.body

  db.query("SELECT review_id FROM review WHERE booking_id = ?", [booking_id], (err, existing) => {
    if (err) return res.status(500).json(err)
    if (existing.length > 0) return res.status(400).json({ message: "Already reviewed" })

    // Get user_id FROM booking so we can link review to user
    db.query("SELECT user_id FROM booking WHERE booking_id = ?", [booking_id], (err, bookingRows) => {
      if (err) return res.status(500).json(err)
      const user_id = bookingRows[0]?.user_id || null

      db.query(
        "INSERT INTO Review (booking_id, user_id, rating, comment) VALUES (?, ?, ?, ?)",
        [booking_id, user_id, rating, comment],
        (err, result) => {
          if (err) return res.status(500).json(err)

          const updateRating = `
UPDATE Activity a
JOIN booking b ON b.activity_id = a.activity_id
SET a.average_rating = (
  SELECT AVG(r2.rating) FROM review r2
  JOIN booking b2 ON b2.booking_id = r2.booking_id
  WHERE b2.activity_id = a.activity_id
)
WHERE b.booking_id = ?`
          db.query(updateRating, [booking_id])
          res.json({ message: "Review submitted", review_id: result.insertId })
        }
      )
    })
  })
}

exports.getActivityReviews = (req, res) => {
  const activity_id = req.params.activity_id
  const sql = `
SELECT r.review_id, r.rating, r.comment, r.created_at, u.full_name
FROM review r
JOIN booking b ON b.booking_id = r.booking_id
JOIN User u ON u.user_id = b.user_id
WHERE b.activity_id = ?
ORDER BY r.created_at DESC`
  db.query(sql, [activity_id], (err, result) => {
    if (err) return res.status(500).json(err)
    res.json(result)
  })
}

// Only reviews from registered users who actually booked this provider
exports.getProviderReviews = (req, res) => {
  const provider_id = req.params.provider_id
  const sql = `
SELECT 
  r.review_id,
  r.rating,
  r.comment,
  r.created_at,
  u.full_name,
  a.title AS activity_name
FROM review r
JOIN booking b ON b.booking_id = r.booking_id
JOIN User u ON u.user_id = b.user_id
JOIN activity a ON a.activity_id = b.activity_id
WHERE b.provider_id = ?
ORDER BY r.created_at DESC`
  db.query(sql, [provider_id], (err, result) => {
    if (err) return res.status(500).json(err)
    res.json(result)
  })
}

// Real average rating + review count for a provider
exports.getProviderRating = (req, res) => {
  const provider_id = req.params.provider_id
  const sql = `
SELECT 
  COUNT(r.review_id)    AS review_count,
  ROUND(AVG(r.rating), 1) AS average_rating
FROM review r
JOIN booking b ON b.booking_id = r.booking_id
WHERE b.provider_id = ?`
  db.query(sql, [provider_id], (err, result) => {
    if (err) return res.status(500).json(err)
    res.json(result[0])
  })
}

exports.getUserReviews = (req, res) => {
  const user_id = req.params.user_id

  const sql = `
SELECT 
  r.review_id,
  r.rating,
  r.comment,
  r.created_at,
  a.title AS activity_name,
  p.business_name AS provider_name
FROM review r
JOIN booking b ON b.booking_id = r.booking_id
JOIN activity a ON a.activity_id = b.activity_id
JOIN provider p ON p.provider_id = b.provider_id
WHERE b.user_id = ?
ORDER BY r.created_at DESC
`
  db.query(sql, [user_id], (err, result) => {
    if (err) return res.status(500).json(err)
    res.json(result)
  })
}

exports.getPublicReviews = (req, res) => {
  // Try site reviews first, fall back to booking reviews
  const sql = `
(
  SELECT r.review_id, u.full_name, r.rating, r.comment, r.created_at
  FROM review r
  JOIN User u ON u.user_id = r.user_id
  WHERE r.is_site_review = 1
)
UNION ALL
(
  SELECT r.review_id, u.full_name, r.rating, r.comment, r.created_at
  FROM review r
  JOIN booking b ON b.booking_id = r.booking_id
  JOIN User u ON u.user_id = b.user_id
  WHERE r.is_site_review IS NULL OR r.is_site_review = 0
)
ORDER BY created_at DESC
LIMIT 10
`
  db.query(sql, (err, result) => {
    if (err) return res.status(500).json([])
    res.json(result)
  })
}

exports.createSiteReview = (req, res) => {
  const { user_id, rating, comment } = req.body
  if (!user_id || !comment) return res.status(400).json({ message: 'Missing fields' })
  const sql = `INSERT INTO Review (user_id, rating, comment, is_site_review) VALUES (?, ?, ?, 1)`
  db.query(sql, [user_id, rating || 5, comment], (err, result) => {
    if (err) return res.status(500).json(err)
    res.json({ message: 'Review submitted', review_id: result.insertId })
  })
}