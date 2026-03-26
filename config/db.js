const mysql = require("mysql2");

const db = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: Number(process.env.DB_PORT), // VERY IMPORTANT
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  connectTimeout: 10000
});

// TEST CONNECTION
db.getConnection((err, connection) => {
  if (err) {
    console.error("❌ DB ERROR FULL:", err); // IMPORTANT
  } else {
    console.log("✅ MySQL Pool Connected 🚀");
    connection.release();
  }
});

module.exports = db;