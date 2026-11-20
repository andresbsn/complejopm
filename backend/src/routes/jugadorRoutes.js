const express = require('express');
const router = express.Router();
const JugadorController = require('../controllers/jugadorController');
const { ensureAdmin } = require('../middleware/roleMiddleware');

router.get('/', JugadorController.getAll);
router.post('/', JugadorController.create);
router.put('/:id', JugadorController.update);
router.delete('/:id', ensureAdmin, JugadorController.delete);

module.exports = router;
