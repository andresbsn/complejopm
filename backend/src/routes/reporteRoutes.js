const express = require('express');
const router = express.Router();
const reporteController = require('../controllers/reporteController');
const { ensureAdmin } = require('../middleware/roleMiddleware');

router.get('/ventas', ensureAdmin, reporteController.getVentasReport);
router.get('/jugadores-categoria', ensureAdmin, reporteController.getJugadoresPorCategoria);
router.get('/deudores', reporteController.getDeudores);
router.get('/padel', reporteController.getPadelStats);

module.exports = router;
