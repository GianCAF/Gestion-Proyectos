// src/components/ProjectCard.js
import React from 'react';
import { Card, Badge } from 'react-bootstrap';

// Función auxiliar para determinar el color del badge según el estado (mantener el diseño)
const getStatusVariant = (status) => {
    switch (status) {
        case 'activo':
            return 'success';
        case 'con_adeudos':
            return 'warning';
        case 'terminado':
            return 'danger';
        default:
            return 'light';
    }
};

function ProjectCard({ project }) {
    const displayStatus = project.estado ? project.estado.replace('con_adeudos', 'Con adeudos').replace(/_/g, ' ') : 'Desconocido';

    return (
        <Card className="mb-3">
            <Card.Body>
                <div className="d-flex justify-content-between align-items-start">
                    <Card.Title>{project.nombre}</Card.Title>
                    <Badge bg={getStatusVariant(project.estado)}>{displayStatus}</Badge>
                </div>
                <Card.Subtitle className="area">{project.area}</Card.Subtitle>
                <Card.Text>{project.descripcion}</Card.Text>

                {/* Lógica para mostrar Participantes con su Rol */}
                {project.participantes && project.participantes.length > 0 && (
                    <div>
                        <h6>Participantes:</h6>
                        {project.participantes.map((participante, index) => (
                            <div key={index} className="d-inline-flex align-items-center me-3 mb-1">
                                <Badge
                                    // Muestra el nombre
                                    bg="secondary"
                                    className="me-1"
                                    style={{ backgroundColor: '#1A543A', color: '#F0F0F0' }}
                                >
                                    {participante.nombre}
                                </Badge>
                                {/* Badge de Rol */}
                                {participante.rol === 'lider' && (
                                    <Badge
                                        bg="warning"
                                        style={{ fontSize: '0.65em', padding: '0.3em 0.5em', backgroundColor: '#FFC107', color: '#0D4126' }}
                                    >
                                        LÍDER
                                    </Badge>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </Card.Body>
        </Card>
    );
}

export default ProjectCard;