// src/components/ProjectCard.js
import React from 'react';
import { Card, Badge } from 'react-bootstrap';

// Función auxiliar para determinar el color del badge según el estado
const getStatusVariant = (status) => {
    switch (status) {
        case 'activo':
            return 'success';
        case 'por_comenzar':
            return 'secondary';
        case 'terminado':
            return 'danger';
        default:
            return 'light';
    }
};

function ProjectCard({ project }) {
    const displayStatus = project.estado ? project.estado.replace(/_/g, ' ') : 'Desconocido';

    return (
        <Card className="mb-3">
            <Card.Body>
                <div className="d-flex justify-content-between align-items-start">
                    <Card.Title>{project.nombre}</Card.Title>
                    <Badge bg={getStatusVariant(project.estado)}>{displayStatus}</Badge>
                </div>
                <Card.Subtitle className="mb-2 text-muted">{project.area}</Card.Subtitle>
                <Card.Text>{project.descripcion}</Card.Text>
                {project.participantes && project.participantes.length > 0 && (
                    <div>
                        <h6>Participantes:</h6>
                        {project.participantes.map((participante, index) => (
                            <Badge key={index} bg="secondary" className="me-1">{participante.nombre}</Badge>
                        ))}
                    </div>
                )}
            </Card.Body>
        </Card>
    );
}

export default ProjectCard;