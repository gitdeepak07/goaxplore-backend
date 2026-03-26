const db = require("../config/db")

exports.addToWishlist = (req,res)=>{

const {user_id,activity_id} = req.body

const sql = `
INSERT INTO wishlist
(user_id,activity_id)
VALUES(?,?)
`

db.query(sql,[user_id,activity_id],(err,result)=>{

if(err){
return res.status(500).json(err)
}

res.json({
message:"Activity added to wishlist"
})

})

}

exports.getWishlist = (req,res)=>{

const user_id = req.params.user_id

const sql = `
SELECT 
w.wishlist_id,
a.activity_id,
a.title,
a.price_per_person,
a.image_url,
a.average_rating,
l.location_name,
l.address
FROM wishlist w
JOIN activity a ON a.activity_id=w.activity_id
LEFT JOIN location l ON l.location_id=a.location_id
WHERE w.user_id=?
`

db.query(sql,[user_id],(err,result)=>{

if(err){
return res.status(500).json(err)
}

res.json(result)

})

}

exports.removeFromWishlist = (req,res)=>{

const wishlist_id = req.params.wishlist_id

const sql = `
DELETE FROM wishlist
WHERE wishlist_id=?
`

db.query(sql,[wishlist_id],(err,result)=>{

if(err){
return res.status(500).json(err)
}

res.json({
message:"Removed FROM wishlist"
})

})

}