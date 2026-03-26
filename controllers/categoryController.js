const db = require("../config/db")

exports.getCategories = (req, res) => {
  db.query(
    "SELECT category_id, category_name AS name FROM category WHERE is_active = 1",
    (err, result) => {
      if (err) return res.status(500).json(err)
      res.json(result)
    }
  )
}