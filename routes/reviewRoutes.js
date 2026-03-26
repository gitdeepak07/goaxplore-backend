const express = require("express")
const router = express.Router()
const reviewController = require("../controllers/reviewController")

router.post("/", reviewController.createReview)
router.get("/public", reviewController.getPublicReviews)
router.post("/site", reviewController.createSiteReview)
router.get("/activity/:activity_id", reviewController.getActivityReviews)

// IMPORTANT: /rating must come BEFORE /:provider_id
router.get("/provider/:provider_id/rating", reviewController.getProviderRating)
router.get("/provider/:provider_id", reviewController.getProviderReviews)
router.get("/user/:user_id", reviewController.getUserReviews)
module.exports = router