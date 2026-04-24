import axios from 'axios';

const api = axios.create({
    baseURL: 'http://localhost:3000/api' // La URL de tu backend
});

export const getSuperheroes = () => api.get('/superheroes');
export const getSuperheroesByCasa = (casa) => api.get(`/superheroes/casa/${casa}`);

export default api;