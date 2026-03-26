const db = require("../config/db")

exports.getActivitySlots = (req, res) => {
  const activity = req.params.activity_id
  const date = req.query.date  // optional date filter

  let sql = `
SELECT 
  slot_id,
  activity_id,
  slot_date,
  start_time,
  end_time,
  capacity_total,
  capacity_available,
  CASE 
    WHEN capacity_available <= 0 THEN 'Closed'
    ELSE slot_status
  END AS slot_status
FROM activity_Slot
WHERE activity_id = ?
AND slot_date >= CURDATE()
`
  const params = [activity]

  if (date) {
    sql += ` AND slot_date = ?`
    params.push(date)
  }

  sql += ` ORDER BY slot_date ASC, start_time ASC`

  db.query(sql, params, (err, result) => {
    if (err) return res.status(500).json(err)
    res.json(result)
  })
}

exports.createSlot = (req,res)=>{

const {
activity_id,
slot_date,
start_time,
end_time,
capacity_total
} = req.body

const sql = `
INSERT INTO activity_Slot
(activity_id,slot_date,start_time,end_time,capacity_total,capacity_available,slot_status)
VALUES(?,?,?,?,?,?, 'Open')
`

db.query(
sql,
[
activity_id,
slot_date,
start_time,
end_time,
capacity_total,
capacity_total
],
(err,result)=>{

if(err){
return res.status(500).json(err)
}

res.json({
message:"Slot created successfully",
slot_id:result.insertId
})

})

}