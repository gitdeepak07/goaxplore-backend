const db = require("../config/db")

exports.createPayment = (req,res)=>{

const {booking_id,payment_mode,amount_paid} = req.body

const sql = `
INSERT INTO Payment
(booking_id,payment_mode,payment_status,amount_paid)
VALUES(?,?, 'Paid',?)
`

db.query(sql,[booking_id,payment_mode,amount_paid],(err,result)=>{

if(err){
return res.status(500).json(err)
}

res.json({
message:"Payment successful"
})

})

}

exports.refundPayment = (req, res) => {
  const { booking_id } = req.params;
  db.query("SELECT * FROM Payment WHERE booking_id=? AND payment_status='Paid' LIMIT 1", [booking_id], (err, payments) => {
    if (err || payments.length === 0) return res.status(404).json({ success: false, message: "No paid payment found" });
    db.query("UPDATE Payment SET payment_status='Refunded' WHERE payment_id=?", [payments[0].payment_id], (err2) => {
      if (err2) return res.status(500).json({ success: false, message: "Refund failed" });
      res.json({ success: true, message: "Refund processed", refunded_amount: payments[0].amount_paid });
    });
  });
};

exports.getPaymentByBooking = (req, res) => {
  db.query("SELECT * FROM Payment WHERE booking_id=? ORDER BY created_at DESC LIMIT 1", [req.params.booking_id], (err, result) => {
    if (err) return res.status(500).json(err);
    if (!result.length) return res.status(404).json({ message: "No payment found" });
    res.json(result[0]);
  });
};