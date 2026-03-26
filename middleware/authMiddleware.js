const authMiddleware = (req,res,next)=>{

  const token = req.headers.authorization

  if(!token){
    return res.status(401).json({
      message:"Access Denied. No Token Provided"
    })
  }

  /* Later verify JWT */

  next()

}

module.exports = authMiddleware