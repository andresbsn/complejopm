const express = require('express');
const router = express.Router();
const ventaController = require('../controllers/ventaController');

router.post('/', ventaController.createVenta);
router.get('/', ventaController.getVentas);
router.get('/:id/detalles', ventaController.getDetallesVenta);

module.exports = router;
