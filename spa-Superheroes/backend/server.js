require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const heroeRoutes = require('./routes/superheroes');

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use('/api/superheroes', heroeRoutes);

// Conexión a MongoDB
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('Conectado a MongoDB en Docker'))
    .catch(err => console.error('Error de conexión:', err));

// Ruta de prueba
app.get('/', (req, res) => {
    res.send('Servidor de Superhéroes funcionando');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});