import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { Container, Form, Button, Alert } from 'react-bootstrap';

const HeroForm = () => {
    const { id } = useParams(); // Si hay ID, estamos editando
    const navigate = useNavigate();
    const [error, setError] = useState(null);

    const [formData, setFormData] = useState({
        nombre: '',
        nombreReal: '',
        aparicion: '',
        casa: 'Marvel',
        biografia: '',
        equipamiento: '', // Lo manejaremos como string separado por comas
        imagenes: ''      // Lo manejaremos como string separado por comas
    });

    useEffect(() => {
        if (id) {
            const cargarHeroe = async () => {
                const res = await api.get('/superheroes');
                const h = res.data.find(heroe => heroe._id === id);
                if (h) {
                    setFormData({
                        ...h,
                        equipamiento: h.equipamiento.join(', '),
                        imagenes: h.imagenes.join(', ')
                    });
                }
            };
            cargarHeroe();
        }
    }, [id]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            // Procesamos los strings para volver a convertirlos en arrays (Punto 7)
            const dataAEnviar = {
                ...formData,
                equipamiento: formData.equipamiento.split(',').map(i => i.trim()).filter(i => i !== ""),
                imagenes: formData.imagenes.split(',').map(i => i.trim()).filter(i => i !== "")
            };

            if (id) {
                await api.put(`/superheroes/${id}`, dataAEnviar);
            } else {
                await api.post('/superheroes', dataAEnviar);
            }

            // PUNTO 10: Feedback de éxito y navegación
            alert("¡Operación exitosa!");
            navigate('/');
        } catch (err) {
            setError("Hubo un error al guardar. Revisá los campos.");
        }
    };

    return (
        <Container className="mt-4 shadow p-4 rounded bg-light" style={{ maxWidth: '600px' }}>
            <h2>{id ? 'Editar' : 'Cargar Nuevo'} Superhéroe</h2>
            {error && <Alert variant="danger">{error}</Alert>}

            <Form onSubmit={handleSubmit}>
                <Form.Group className="mb-3">
                    <Form.Label>Nombre del Superhéroe</Form.Label>
                    <Form.Control
                        required
                        type="text"
                        value={formData.nombre}
                        onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                    />
                </Form.Group>

                <Form.Group className="mb-3">
                    <Form.Label>Nombre Real</Form.Label>
                    <Form.Control
                        type="text"
                        value={formData.nombreReal}
                        onChange={(e) => setFormData({ ...formData, nombreReal: e.target.value })}
                    />
                </Form.Group>

                <Form.Group className="mb-3">
                    <Form.Label>Año de Aparición</Form.Label>
                    <Form.Control
                        required
                        type="number"
                        value={formData.aparicion}
                        onChange={(e) => setFormData({ ...formData, aparicion: e.target.value })}
                    />
                </Form.Group>

                <Form.Group className="mb-3">
                    <Form.Label>Casa</Form.Label>
                    <Form.Select
                        value={formData.casa}
                        onChange={(e) => setFormData({ ...formData, casa: e.target.value })}
                    >
                        <option value="Marvel">Marvel</option>
                        <option value="DC">DC</option>
                    </Form.Select>
                </Form.Group>

                <Form.Group className="mb-3">
                    <Form.Label>Biografía</Form.Label>
                    <Form.Control
                        required
                        as="textarea"
                        rows={3}
                        value={formData.biografia}
                        onChange={(e) => setFormData({ ...formData, biografia: e.target.value })}
                    />
                </Form.Group>

                <Form.Group className="mb-3">
                    <Form.Label>Equipamiento (separado por comas)</Form.Label>
                    <Form.Control
                        type="text"
                        placeholder="Ej: Escudo, Traje, Lanza redes"
                        value={formData.equipamiento}
                        onChange={(e) => setFormData({ ...formData, equipamiento: e.target.value })}
                    />
                </Form.Group>

                <Form.Group className="mb-3">
                    <Form.Label>URLs de Imágenes (separadas por comas)</Form.Label>
                    <Form.Control
                        required
                        type="text"
                        placeholder="http://imagen1.jpg, http://imagen2.jpg"
                        value={formData.imagenes}
                        onChange={(e) => setFormData({ ...formData, imagenes: e.target.value })}
                    />
                </Form.Group>

                <Button variant="success" type="submit" className="w-100">
                    {id ? 'Actualizar' : 'Guardar'} Superhéroe
                </Button>
            </Form>
        </Container>
    );
};

export default HeroForm;