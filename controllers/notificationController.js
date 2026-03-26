const db = require("../config/db")

exports.createNotification = (req,res)=>{

const {user_id,booking_id,title,message} = req.body

const sql = `
INSERT INTO Notification
(user_id,booking_id,title,message)
VALUES(?,?,?,?)
`

db.query(sql,[user_id,booking_id,title,message],(err,result)=>{

if(err){
return res.status(500).json(err)
}

res.json({
message:"Notification created"
})

})

}

exports.getUserNotifications = (req,res)=>{

const user_id = req.params.user_id

const sql = `
SELECT *
FROM notification
WHERE user_id=?
ORDER BY created_at DESC
`

db.query(sql,[user_id],(err,result)=>{

if(err){
return res.status(500).json(err)
}

res.json(result)

})

}

exports.markAsRead = (req,res)=>{

const notification_id = req.params.notification_id

const sql = `
UPDATE Notification
SET is_read=TRUE
WHERE notification_id=?
`

db.query(sql,[notification_id],(err,result)=>{

if(err){
return res.status(500).json(err)
}

res.json({
message:"Notification marked as read"
})

})

}

exports.getProviderNotifications = (req, res) => {
  const provider_id = req.params.provider_id

  const sql = `
SELECT *
FROM notification
WHERE provider_id = ?
ORDER BY created_at DESC
`
  db.query(sql, [provider_id], (err, result) => {
    if (err) return res.status(500).json(err)
    res.json(result)
  })
}