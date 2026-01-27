const express = require('express');
const router = express.Router();
const TorneoController = require('../controllers/torneoController');

router.post('/', TorneoController.create);
router.get('/', TorneoController.getAll);
router.get('/:id', TorneoController.getById);
router.post('/:id/inscripciones', TorneoController.inscribirJugador);
router.post('/:id/inscripciones/:inscripcionId/pagos', TorneoController.registrarPagoInscripcion);
router.put('/:id/inscripciones/:inscripcionId/baja', TorneoController.darDeBaja);

module.exports = router;
