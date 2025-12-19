const express = require('express');
const router = express.Router();
const reporteController = require('../controllers/reporteController');

router.get('/ventas', reporteController.getVentasReport);

module.exports = router;
