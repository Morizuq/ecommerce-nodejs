const express = require('express');

const authController = require('../controllers/authController');
const bookingController = require('../controllers/bookingController');

const router = express.Router();

// router.use(authController.protect);

router.get('/pay/:productId', bookingController.initPayment);
router.get('/pay/callback', bookingController.checkout);

module.exports = router;
