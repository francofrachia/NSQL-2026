import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getSuperheroes, getSuperheroesByCasa } from '../services/api';
import { Container, Row, Col, Form } from 'react-bootstrap';
import HeroCard from '../components/HeroCard';

const HeroGrid = ({ casa: casaProp }) => {
    const { casa: casaParam } = useParams();
    const [heroes, setHeroes] = useState([]);
    const [busqueda, setBusqueda] = useState("");


    const casaEfectiva = casaProp || casaParam;

    useEffect(() => {
        const cargarData = async () => {
            try {
                const res = casaEfectiva
                    ? await getSuperheroesByCasa(casaEfectiva)
                    : await getSuperheroes();
                setHeroes(res.data);
            } catch (error) {
                console.error("Error al cargar héroes:", error);
            }
        };
        cargarData();
    }, [casaEfectiva]);

    const heroesFiltrados = heroes.filter(h =>
        h.nombre.toLowerCase().includes(busqueda.toLowerCase())
    );

    return (
        <Container>
            <Form.Control
                type="text"
                placeholder="Buscar superhéroe por nombre..."
                className="mb-4 shadow-sm"
                onChange={(e) => setBusqueda(e.target.value)}
            />

            <Row className="g-4">
                {heroesFiltrados.map(h => (
                    <Col key={h._id} sm={12} md={6} lg={4} xl={3} className="d-flex align-items-stretch">
                        <HeroCard heroe={h} />
                    </Col>
                ))}
            </Row>

            {heroesFiltrados.length === 0 && (
                <h3 className="text-center mt-5 text-muted">No se encontraron superhéroes.</h3>
            )}
        </Container>
    );
};

export default HeroGrid;