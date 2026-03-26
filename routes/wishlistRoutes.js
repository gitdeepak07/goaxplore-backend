const express = require("express")
const router = express.Router()

const wishlistController = require("../controllers/wishlistController")

router.post("/", wishlistController.addToWishlist)

router.get("/:user_id", wishlistController.getWishlist)

router.delete("/:wishlist_id", wishlistController.removeFromWishlist)

module.exports = router