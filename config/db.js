const mysql = require("mysql2")

const db = mysql.createPool({
  host: "localhost",
  user: "root",
  password: "12345",
  database: "goaxplore",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
})

db.getConnection((err, connection) => {
  if (err) {
    console.log("Database connection failed:", err.message)
  } else {
    console.log("MySQL Pool Connected")
    connection.release()
  }
})

module.exports = db