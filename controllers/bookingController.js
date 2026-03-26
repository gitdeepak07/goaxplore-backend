const db = require("../config/db")
const {
    notifyBookingCreated,
    notifyBookingConfirmed,
    notifyBookingRejected
} = require("../services/smsService")


// =============================
// BOOKING PREVIEW
// =============================
exports.previewBooking = (req, res) => {

    const { activity_id, participants } = req.body

    const sql = `
SELECT price_per_person
FROM activity
WHERE activity_id=?
`

    db.query(sql, [activity_id], (err, result) => {

        if (err) {
            return res.status(500).json(err)
        }

        if (result.length === 0) {
            return res.status(404).json({
                message: "Activity not found"
            })
        }

        const price = result[0].price_per_person
        const total = price * participants

        res.json({
            price_per_person: price,
            participants,
            total_amount: total
        })

    })

}



// =============================
// CREATE BOOKING
// =============================

exports.createBooking = (req, res) => {

    console.log("📥 BOOKING REQUEST RECEIVED")
    console.log(req.body)

    const {
        user_id,
        activity_id,
        slot_id,
        provider_id,
        participants
    } = req.body

    // generate booking code
    const booking_code = "GX" + Date.now()


    // =============================
    // CHECK SLOT CAPACITY
    // =============================
    const checkSlot = `
SELECT capacity_available
FROM activity_slot
WHERE slot_id=?
`

    db.query(checkSlot, [slot_id], (err, result) => {

        if (err) {
            return res.status(500).json(err)
        }

        if (result.length === 0) {
            return res.status(404).json({
                message: "Slot not found"
            })
        }

        const available = result[0].capacity_available

        if (available < participants) {
            return res.status(400).json({
                message: "Slot Full — no capacity available. Please choose another slot."
            })
        }


        // =============================
        // GET PRICE
        // =============================
        const priceQuery = `
SELECT price_per_person
FROM activity
WHERE activity_id=?
`

        db.query(priceQuery, [activity_id], (err, result) => {

            if (err) {
                return res.status(500).json(err)
            }

            const price = result[0].price_per_person
            const total = price * participants


            // =============================
            // INSERT BOOKING
            // =============================
            const bookingSQL = `
INSERT INTO booking
(booking_code,user_id,activity_id,slot_id,provider_id,participants_count,total_amount,booking_status)
VALUES(?,?,?,?,?,?,?,?)
`

            db.query(
                bookingSQL,
                [
                    booking_code,
                    user_id,
                    activity_id,
                    slot_id,
                    provider_id,
                    participants,
                    total,
                    "Pending"
                ],
                (err, result) => {

                    if (err) {
                        return res.status(500).json(err)
                    }


                    // =============================
                    // UPDATE SLOT CAPACITY
                    // =============================
                    const updateSlot = `
UPDATE activity_slot
SET capacity_available = capacity_available - ?
WHERE slot_id=?
`

                    db.query(updateSlot, [participants, slot_id])


                    // =============================
                    // CLOSE SLOT IF FULL
                    // =============================
                    const closeSlot = `
UPDATE activity_slot
SET slot_status='Closed'
WHERE slot_id=? AND capacity_available <= 0
`

                    db.query(closeSlot, [slot_id])

                    // GET USER PHONE THEN NOTIFY USER
                    const getUserPhone = `
SELECT u.phone, u.full_name, a.title
FROM user u
JOIN activity a ON a.activity_id = ?
WHERE u.user_id = ?
`
                    db.query(getUserPhone, [activity_id, user_id], (err, userResult) => {
                        console.log("USER PHONE DATA:", userResult);
                        if (!err && userResult[0]?.phone) {
                            notifyBookingCreated(
                                userResult[0].phone,
                                userResult[0].full_name,
                                booking_code,
                                userResult[0].title,
                                total
                            )
                        }
                    })

                    // NOTIFY PROVIDER about new booking
                    const getProviderPhone = `
SELECT p.phone, p.business_name, u.full_name AS customer_name, a.title, s.slot_date
FROM provider p
JOIN activity a ON a.provider_id = p.provider_id
JOIN user u ON u.user_id = ?
JOIN activity_slot s ON s.slot_id = ?
WHERE p.provider_id = ?
`
                    db.query(getProviderPhone, [user_id, slot_id, provider_id], (err, pResult) => {
                        if (!err && pResult[0]?.phone) {
                            const { notifyProviderBookingReceived } = require("../services/smsService")
                            notifyProviderBookingReceived(
                                pResult[0].phone,
                                pResult[0].business_name,
                                booking_code,
                                pResult[0].title,
                                pResult[0].customer_name,
                                pResult[0].slot_date
                            )
                        }
                    })
                    // Also insert notification for provider
                    db.query(`INSERT INTO notification (provider_id, booking_id, title, message) VALUES (?, ?, 'New Booking Request', 'You have a new booking request. Please approve or reject.')`,
                        [provider_id, result.insertId])

                    res.json({
                        message: "Booking created successfully",
                        booking_id: result.insertId,
                        booking_code
                    })

                })

        })

    })

}



// =============================
// BOOKING RECEIPT
// =============================
exports.getBookingDetails = (req, res) => {

    const booking = req.params.booking_id

    const sql = `
SELECT 
b.booking_code,
u.full_name,
a.title,
s.slot_date,
s.start_time,
b.participants_count,
b.total_amount
FROM booking b
JOIN user u ON u.user_id=b.user_id
JOIN activity a ON a.activity_id=b.activity_id
JOIN activity_slot s ON s.slot_id=b.slot_id
WHERE b.booking_id=?
`

    db.query(sql, [booking], (err, result) => {

        if (err) {
            return res.status(500).json(err)
        }

        if (result.length === 0) {
            return res.status(404).json({
                message: "Booking not found"
            })
        }

        res.json(result[0])

    })

}



// =============================
// PROVIDER BOOKINGS
// =============================
exports.getProviderBookings = (req, res) => {

    const provider_id = req.params.provider_id

    const sql = `
SELECT 
b.booking_id,
b.booking_code,
u.full_name,
a.title,
s.slot_date,
s.start_time,
b.participants_count,
b.total_amount,
b.booking_status,
b.created_at,
COALESCE(pay.payment_status, 'Paid') AS payment_status
FROM booking b
JOIN user u ON u.user_id=b.user_id
JOIN activity a ON a.activity_id=b.activity_id
LEFT JOIN activity_slot s ON s.slot_id=b.slot_id
LEFT JOIN payment pay ON pay.booking_id=b.booking_id
WHERE b.provider_id=?
ORDER BY b.created_at DESC
`

    db.query(sql, [provider_id], (err, result) => {

        if (err) {
            return res.status(500).json(err)
        }

        res.json(result)

    })

}





//Approve Booking

exports.approveBooking = (req, res) => {

    const bookingId = req.params.id

    const sql = `UPDATE booking SET booking_status='Confirmed' WHERE booking_id=?`

    db.query(sql, [bookingId], (err) => {

        if (err) return res.status(500).json(err)

        // Insert Notification to user
        const notifySQL = `
INSERT INTO notification
(user_id, booking_id, title, message)
SELECT user_id, booking_id,
'Booking Confirmed',
'Your booking has been approved by the provider'
FROM booking
WHERE booking_id=?
`
        db.query(notifySQL, [bookingId])

        // NOTIFY USER via SMS
        const getUserSQL = `
SELECT u.phone, u.full_name, a.title, s.slot_date, s.start_time, b.booking_code
FROM booking b
JOIN user u ON u.user_id = b.user_id
JOIN activity a ON a.activity_id = b.activity_id
JOIN activity_slot s ON s.slot_id = b.slot_id
WHERE b.booking_id = ?
`
        db.query(getUserSQL, [bookingId], (err, result) => {
            if (!err && result[0]?.phone) {
                notifyBookingConfirmed(
                    result[0].phone,
                    result[0].full_name,
                    result[0].booking_code,
                    result[0].title,
                    result[0].slot_date,
                    result[0].start_time
                )
            }
        })

        res.json({ message: "Booking Approved" })

    })

}
//Reject Booking

exports.rejectBooking = (req, res) => {

    const bookingId = req.params.id
    const { reason } = req.body

    // First get the booking details to restore slot capacity
    const getBooking = `
SELECT slot_id, participants_count
FROM booking
WHERE booking_id = ?
`

    db.query(getBooking, [bookingId], (err, result) => {

        if (err) return res.status(500).json(err)
        if (result.length === 0) return res.status(404).json({ message: "Booking not found" })

        const { slot_id, participants_count } = result[0]

        // Reject the booking
        const rejectSQL = `UPDATE booking SET booking_status='Rejected' WHERE booking_id=?`

        db.query(rejectSQL, [bookingId], (err) => {

            if (err) return res.status(500).json(err)
            // Try to store reason — ignore if column missing
            db.query(`UPDATE booking SET provider_decision_note=? WHERE booking_id=?`, [reason, bookingId], () => {})

            // Restore slot capacity
            const restoreSlot = `
UPDATE activity_slot
SET capacity_available = capacity_available + ?,
    slot_status = 'Open'
WHERE slot_id = ?
`
            db.query(restoreSlot, [participants_count, slot_id])

            // Notification
            const notifySQL = `
INSERT INTO notification
(user_id, booking_id, title, message)
SELECT user_id, booking_id,
'Booking Rejected',
'Unfortunately your booking request was rejected'
FROM booking
WHERE booking_id=?
`
            db.query(notifySQL, [bookingId])

            // NOTIFY USER
            const getUserSQL = `
SELECT u.phone, u.full_name, a.title, b.total_amount, b.booking_code
FROM booking b
JOIN user u ON u.user_id = b.user_id
JOIN activity a ON a.activity_id = b.activity_id
WHERE b.booking_id = ?
`
db.query(getUserSQL, [bookingId], (err, result) => {
    if (!err && result[0]?.phone) {
        notifyBookingRejected(
            result[0].phone,
            result[0].full_name,
            result[0].booking_code,
            result[0].title,
            result[0].total_amount
        )
    }
})
            res.json({ message: "Booking Rejected" })
        })
    })
}

//User Booking History

exports.getUserBookings = (req, res) => {

    const user_id = req.params.user_id

    const sql = `
SELECT 
b.booking_id,
b.booking_code                          AS bookingId,
a.title                                 AS activityName,
p.business_name                         AS provider,
l.location_name                         AS location,
s.slot_date                             AS date,
s.start_time                            AS time,
b.participants_count                    AS participants,
a.price_per_person                      AS pricePerPerson,
b.total_amount                          AS totalAmount,
b.booking_status                        AS status,
b.created_at                            AS createdAt,
COALESCE(pay.payment_status, 'Paid')   AS paymentStatus,
COALESCE(pay.payment_mode, 'online')   AS paymentMethod,
CASE WHEN r.review_id IS NOT NULL THEN 1 ELSE 0 END AS reviewed,
b.activity_id,
b.provider_id,
b.slot_id
FROM booking b
JOIN activity a ON a.activity_id = b.activity_id
JOIN activity_slot s ON s.slot_id = b.slot_id
JOIN provider p ON p.provider_id = b.provider_id
LEFT JOIN location l ON l.location_id = a.location_id
LEFT JOIN review r ON r.booking_id = b.booking_id
LEFT JOIN payment pay ON pay.booking_id = b.booking_id
WHERE b.user_id = ?
ORDER BY b.created_at DESC
`

    db.query(sql, [user_id], (err, result) => {
        if (err) return res.status(500).json(err)
        res.json({ bookings: result })
    })
}




//Cancel Booking
// Cancel Booking (by user)
exports.cancelBooking = (req, res) => {
  const bookingId = req.params.id

  const getBooking = `SELECT slot_id, participants_count, booking_status FROM booking WHERE booking_id = ?`
  db.query(getBooking, [bookingId], (err, result) => {
    if (err) return res.status(500).json(err)
    if (result.length === 0) return res.status(404).json({ message: "Booking not found" })

    const { slot_id, participants_count, booking_status } = result[0]
    if (booking_status === 'Completed' || booking_status === 'Cancelled') {
      return res.status(400).json({ message: "Cannot cancel this booking" })
    }

    const cancelSQL = `UPDATE booking SET booking_status='Cancelled' WHERE booking_id=?`
    db.query(cancelSQL, [bookingId], (err) => {
      if (err) return res.status(500).json(err)

      // Restore slot capacity
      db.query(`UPDATE activity_slot SET capacity_available = capacity_available + ?, slot_status='Open' WHERE slot_id=?`, [participants_count, slot_id])

      // Notify provider via DB notification
      const notifySQL = `INSERT INTO notification (provider_id, booking_id, title, message) SELECT provider_id, booking_id, 'Booking Cancelled', 'A user has cancelled their booking' FROM booking WHERE booking_id=?`
      db.query(notifySQL, [bookingId])

      // SMS to provider
      const getProviderSQL = `
        SELECT p.phone, p.business_name, b.booking_code, a.title
        FROM booking b JOIN provider p ON p.provider_id=b.provider_id JOIN activity a ON a.activity_id=b.activity_id
        WHERE b.booking_id=?`
      db.query(getProviderSQL, [bookingId], (e, rows) => {
        if (!e && rows[0]?.phone) {
          const { notifyProviderBookingCancelled } = require("../services/smsService")
          notifyProviderBookingCancelled(rows[0].phone, rows[0].business_name, rows[0].booking_code, rows[0].title)
        }
      })

      res.json({ message: "Booking cancelled" })
    })
  })
}

// Complete Booking (by provider manually)
exports.completeBooking = (req, res) => {
  const bookingId = req.params.id

  const getBooking = `SELECT slot_id, participants_count FROM booking WHERE booking_id = ?`
  db.query(getBooking, [bookingId], (err, result) => {
    if (err) return res.status(500).json(err)
    if (result.length === 0) return res.status(404).json({ message: "Booking not found" })

    const { slot_id, participants_count } = result[0]

    const sql = `UPDATE booking SET booking_status='Completed' WHERE booking_id=?`
    db.query(sql, [bookingId], (err) => {
      if (err) return res.status(500).json(err)

      // Restore slot capacity so others can book
      db.query(
        `UPDATE activity_slot SET capacity_available = capacity_available + ?, slot_status='Open' WHERE slot_id=?`,
        [participants_count, slot_id]
      )

      // Notify user
      const notifySQL = `
        INSERT INTO notification (user_id, booking_id, title, message)
        SELECT user_id, booking_id, 'Activity Completed', 'Your activity has been marked as completed. Please leave a review!'
        FROM booking WHERE booking_id=?`
      db.query(notifySQL, [bookingId])

      res.json({ message: "Booking completed" })
    })
  })
}