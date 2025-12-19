const express = require('express');
const router = express.Router();
const cuentaController = require('../controllers/cuentaController');

router.get('/:jugadorId', cuentaController.getMovimientos);
router.post('/', cuentaController.addMovimiento);

module.exports = router;
