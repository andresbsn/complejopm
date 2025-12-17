const express = require('express');
const router = express.Router();
const JugadorController = require('../controllers/jugadorController');

router.get('/', JugadorController.getAll);
router.post('/', JugadorController.create);

module.exports = router;
