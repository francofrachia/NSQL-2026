const mongoose = require('mongoose');

const superheroSchema = new mongoose.Schema({
    nombre: { type: String, required: true },
    nombreReal: { type: String },
    aparicion: { type: Number, required: true },
    casa: {
        type: String,
        required: true,
        enum: ['Marvel', 'DC']
    },
    biografia: { type: String, required: true },
    equipamiento: [String],
    imagenes: {
        type: [String],
        required: true,
        validate: [v => v.length > 0, 'Debe tener al menos una imagen']
    }
}, { timestamps: true });

module.exports = mongoose.model('Superhero', superheroSchema);