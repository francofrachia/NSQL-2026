import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { Container, Row, Col, Carousel, Button, Image } from 'react-bootstrap';

const HeroDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [heroe, setHeroe] = useState(null);

    const logos = {
        Marvel: "https://upload.wikimedia.org/wikipedia/commons/b/b9/Marvel_Logo.svg",
        DC: "https://upload.wikimedia.org/wikipedia/commons/3/3d/DC_Comics_logo.svg"
    };

    useEffect(() => {
        const cargarHeroe = async () => {
            try {
                const res = await api.get(`/superheroes`);
                const encontrado = res.data.find(h => h._id === id);
                setHeroe(encontrado);
            } catch (error) {
                console.error("Error al cargar detalle", error);
            }
        };
        cargarHeroe();
    }, [id]);

    const eliminarHeroe = async () => {
        if (window.confirm("¿Estás seguro de eliminar a este héroe?")) {
            try {
                await api.delete(`/superheroes/${heroe._id}`);
                alert("Eliminado con éxito");
                navigate('/');
            } catch (error) {
                alert("Error al eliminar");
            }
        }
    };

    if (!heroe) return <h2 className="text-center mt-5">Cargando...</h2>;

    return (
        <Container className="mt-4">
            <Button variant="link" onClick={() => navigate(-1)} className="text-decoration-none mb-3 p-0">
                ← Volver al listado
            </Button>

            <Row>
                <Col md={6}>
                    <style>
                        {`
                                #detalle-heroe-carrusel .carousel-control-prev-icon,
                                #detalle-heroe-carrusel .carousel-control-next-icon {
                                filter: invert(1) grayscale(100%) brightness(0) !important;
                                opacity: 1 !important; /* Esto hace que no sean transparentes */
                                width: 3rem;
                                height: 3rem;
                                }

                                /* Esto es para que cuando pases el mouse no se vuelvan blancas de nuevo */
                                #detalle-heroe-carrusel .carousel-control-prev:hover,
                                #detalle-heroe-carrusel .carousel-control-next:hover {
                                opacity: 0.8 !important;
                                }
                            `}
                    </style>
                    <Carousel id="detalle-heroe-carrusel" className="shadow-lg rounded overflow-hidden">
                        {heroe.imagenes.map((img, index) => (
                            <Carousel.Item key={index}>
                                <img
                                    className="d-block w-100"
                                    src={img}
                                    alt={`Imagen ${index + 1}`}
                                    style={{ height: '500px', objectFit: 'cover' }}
                                />
                            </Carousel.Item>
                        ))}
                    </Carousel>

                    <div className="d-flex justify-content-center mt-3 gap-2">
                        <Button variant="warning" onClick={() => navigate(`/editar/${heroe._id}`)} className="px-4">
                            Editar Héroe
                        </Button>
                        <Button variant="danger" onClick={eliminarHeroe} className="px-4">
                            Eliminar
                        </Button>
                    </div>
                </Col>

                <Col md={6} className="ps-md-5">
                    <div className="d-flex align-items-center mb-3">
                        <h1 className="me-3 mb-0">{heroe.nombre}</h1>
                        <Image
                            src={heroe.casa === 'Marvel' ? logos.Marvel : logos.DC}
                            alt="Logo Casa"
                            style={{ width: '80px', height: 'auto' }}
                        />
                    </div>

                    <h4 className="text-muted fw-light">{heroe.nombreReal}</h4>
                    <hr />
                    <p className="mt-4"><strong>Biografía:</strong> {heroe.biografia}</p>
                    <p><strong>Primera Aparición:</strong> {heroe.aparicion}</p>

                    {heroe.equipamiento && heroe.equipamiento.length > 0 && (
                        <div className="mt-3">
                            <h5>Equipamiento:</h5>
                            <ul className="list-unstyled">
                                {heroe.equipamiento.map((item, i) => (
                                    <li key={i}>• {item}</li>
                                ))}
                            </ul>
                        </div>
                    )}
                </Col>
            </Row>
        </Container>
    );
};

export default HeroDetail;