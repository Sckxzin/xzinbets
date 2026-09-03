const express = require('express');

const router = express.Router();

router.use('/auth', require('./auth'));
router.use('/settings', require('./settings'));
router.use('/tipsters', require('./tipsters'));
router.use('/bets', require('./bets'));
router.use('/admin', require('./admin'));

module.exports = router;
