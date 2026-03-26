const db = require("../config/db")

// GET all locations (for dropdowns)
exports.getLocations = (req, res) => {
  db.query(
    `SELECT location_id, location_name AS name, latitude, longitude, address
     FROM location WHERE is_active = 1`,
    (err, result) => {
      if (err) return res.status(500).json(err)
      res.json(result)
    }
  )
}

// GET single location by ID (for map embed in activity details)
exports.getLocationById = (req, res) => {
  const { location_id } = req.params
  db.query(
    `SELECT location_id, location_name AS name, latitude, longitude, address
     FROM location WHERE location_id = ?`,
    [location_id],
    (err, result) => {
      if (err) return res.status(500).json(err)
      if (!result[0]) return res.status(404).json({ message: "Location not found" })
      res.json(result[0])
    }
  )
}

exports.updateLocationCoords = (req, res) => {
  const { location_id } = req.params
  const { latitude, longitude } = req.body

  db.query(
    `UPDATE Location SET latitude = ?, longitude = ? WHERE location_id = ?`,
    [latitude, longitude, location_id],
    (err) => {
      if (err) return res.status(500).json(err)
      res.json({ message: "Location coords updated" })
    }
  )
}