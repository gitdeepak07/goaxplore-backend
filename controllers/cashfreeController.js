const cashfree = require("cashfree-pg");
const db = require("../config/db");

const instance = new cashfree.Cashfree(
    process.env.CASHFREE_ENV === "TEST"
        ? cashfree.Cashfree.SANDBOX
        : cashfree.Cashfree.PRODUCTION,
    process.env.CASHFREE_APP_ID,
    process.env.CASHFREE_SECRET_KEY
);

// Create Order
exports.createOrder = async (req, res) => {
    const { amount, booking_id, customer_name, customer_email, customer_phone } = req.body;

    try {
        const orderData = {
            order_id: `ORDER_${booking_id}_${Date.now()}`,
            order_amount: amount,
            order_currency: "INR",
            customer_details: {
                customer_id: `CUST_${booking_id}`,
                customer_name: customer_name || "GoaXplore User",
                customer_email: customer_email || "user@goaxplore.com",
                customer_phone: customer_phone || "9999999999",
            },
        };

        const response = await instance.PGCreateOrder(orderData);

        res.json({
            success: true,
            order_id: response.data.order_id,
            payment_session_id: response.data.payment_session_id,
        });
    } catch (err) {
        console.error("Cashfree order error:", err?.response?.data || err);
        res.status(500).json({ success: false, message: "Could not create order" });
    }
};

// Verify Payment
exports.verifyPayment = async (req, res) => {
  const { order_id, booking_id, amount } = req.body;

  try {
    const response = await instance.PGFetchOrder(order_id);
    const order = response.data;

    if (order.order_status !== "PAID") {
      return res.status(400).json({ success: false, message: "Payment not completed" });
    }

    const sql = `
      INSERT INTO payment (booking_id, payment_mode, payment_status, amount_paid, cashfree_order_id, paid_at)
      VALUES (?, 'cashfree', 'Paid', ?, ?, NOW())
    `;

    db.query(sql, [booking_id, amount, order_id], (err, result) => {
      if (err) return res.status(500).json({ success: false, message: "DB error" });

      const payment_id = result.insertId;

      // Link payment to booking + auto confirm
      db.query(
        `UPDATE booking 
         SET payment_id = ?, payment_gateway = 'cashfree', booking_status = 'pending', updated_at = NOW()
         WHERE booking_id = ?`,
        [payment_id, booking_id],
        (err2) => {
          if (err2) return res.status(500).json({ success: false, message: "Booking update failed" });

          res.json({
            success: true,
            message: "Payment verified and saved",
            payment_id,
          });
        }
      );
    });

  } catch (err) {
    console.error("Cashfree verify error:", err?.response?.data || err);
    res.status(500).json({ success: false, message: "Verification failed" });
  }
};