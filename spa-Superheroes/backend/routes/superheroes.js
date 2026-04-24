const express = require('express');
const router = express.Router();
const Superhero = require('../models/Superhero'); // Importamos el modelo que hicimos antes

// @route   POST /api/superheroes
// @desc    Crear un nuevo superhéroe (Punto 9)
router.post('/', async (req, res) => {
    try {
        const nuevoHeroe = new Superhero(req.body);
        const heroeGuardado = await nuevoHeroe.save();
        res.status(201).json(heroeGuardado);
    } catch (error) {
        res.status(400).json({ mensaje: "Error al crear", error: error.message });
    }
});

// @route   GET /api/superheroes
// @desc    Obtener todos los superhéroes (Punto 11)
router.get('/', async (req, res) => {
    try {
        const heroes = await Superhero.find();
        res.json(heroes);
    } catch (error) {
        res.status(500).json({ mensaje: "Error al obtener datos", error });
    }
});

//   GET /api/superheroes/casa/:casaNombre
//   Filtrar por casa (Marvel o DC)
router.get('/casa/:casaNombre', async (req, res) => {
    try {
        const casa = req.params.casaNombre; // Captura lo que viene en la URL

        // Buscamos en la DB usando un filtro
        const heroes = await Superhero.find({
            casa: { $regex: new RegExp(casa, "i") }
        });

        res.json(heroes);
    } catch (error) {
        res.status(500).json({ mensaje: "Error al filtrar", error });
    }
});

// @route   DELETE /api/superheroes/:id
// @desc    Eliminar un superhéroe (Punto 9)
router.delete('/:id', async (req, res) => {
    try {
        const heroeBorrado = await Superhero.findByIdAndDelete(req.params.id);

        if (!heroeBorrado) {
            return res.status(404).json({ mensaje: "No se encontró el superhéroe" });
        }

        res.json({ mensaje: "Superhéroe eliminado con éxito" });
    } catch (error) {
        res.status(500).json({ mensaje: "Error al eliminar", error });
    }
});

// @route   PUT /api/superheroes/:id
// @desc    Actualizar un superhéroe (Punto 9)
router.put('/:id', async (req, res) => {
    try {
        // { new: true } hace que nos devuelva el objeto ya modificado
        const heroeActualizado = await Superhero.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );

        if (!heroeActualizado) {
            return res.status(404).json({ mensaje: "No se encontró el superhéroe" });
        }

        res.json(heroeActualizado);
    } catch (error) {
        res.status(400).json({ mensaje: "Error al actualizar", error: error.message });
    }
});

module.exports = router;