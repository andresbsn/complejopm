const express = require('express');
const router = express.Router();
const proveedorController = require('../controllers/proveedorController');

router.get('/', proveedorController.getAll);
router.post('/', proveedorController.create);
router.put('/:id', proveedorController.update);
router.delete('/:id', proveedorController.delete);
router.get('/:id/cuenta', proveedorController.getCuenta);
router.post('/movimiento', proveedorController.addMovimiento);

module.exports = router;
