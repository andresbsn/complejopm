const express = require('express');
const router = express.Router();
const GastoController = require('../controllers/gastoController');

router.post('/', GastoController.create);
router.get('/', GastoController.getAll);
router.delete('/:id', GastoController.delete);

module.exports = router;
