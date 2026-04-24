import { Card, Button, Badge } from 'react-bootstrap';
import { Link } from 'react-router-dom';

const HeroCard = ({ heroe }) => {
    const truncarTexto = (texto, limite) => {
        if (texto && texto.length > limite) {
            return texto.substring(0, limite) + "...";
        }
        return texto;
    };

    return (
        <Card className="shadow-sm h-100 border-0" style={{ minWidth: '0' }}>
            {/* 1. Contenedor de imagen con altura fija */}
            <div style={{ height: '220px', overflow: 'hidden', backgroundColor: '#f8f9fa' }}>
                <Card.Img
                    variant="top"
                    src={heroe.imagenes[0]}
                    alt={heroe.nombre}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
            </div>

            {/* 2. Cuerpo con Flexbox y altura mínima */}
            <Card.Body className="d-flex flex-column" style={{ minHeight: '230px', padding: '1.25rem' }}>
                <div className="d-flex justify-content-between align-items-center mb-2">
                    <Card.Title className="text-truncate mb-0 fw-bold" style={{ fontSize: '1.1rem', maxWidth: '70%' }}>
                        {heroe.nombre}
                    </Card.Title>
                    <Badge bg={heroe.casa === 'Marvel' ? 'danger' : 'primary'} style={{ fontSize: '0.75rem' }}>
                        {heroe.casa.toUpperCase()}
                    </Badge>
                </div>

                <Card.Subtitle className="mb-2 text-muted small italic">
                    {heroe.nombreReal || "Identidad Secreta"}
                </Card.Subtitle>

                {/* 3. El texto ocupa el espacio sobrante */}
                <Card.Text className="small text-secondary flex-grow-1" style={{ overflow: 'hidden' }}>
                    {truncarTexto(heroe.biografia, 75)}
                </Card.Text>

                {/* 4. El botón siempre al final */}
                <Button
                    as={Link}
                    to={`/heroe/${heroe._id}`}
                    variant="primary"
                    className="mt-3 w-100 fw-bold"
                >
                    Ver Detalle
                </Button>
            </Card.Body>
        </Card>
    );
};

export default HeroCard;