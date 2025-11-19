// src/components/ParticipantManager.js (NUEVO ARCHIVO)
import React, { useState, useEffect } from 'react';
import { db } from '../firebaseConfig';
import { collection, getDocs, updateDoc, doc } from 'firebase/firestore';
import { Modal, Button, Form, Alert, Badge } from 'react-bootstrap';

const ROLES = ['Líder', 'Colaborador'];
const MAX_PARTICIPANTS = 4; // Límite de 4

function ParticipantManager({ show, handleClose, project, onUpdate }) {
    const [allProfessors, setAllProfessors] = useState([]);
    const [currentParticipants, setCurrentParticipants] = useState([]);
    const [selectedProfessorId, setSelectedProfessorId] = useState('');
    const [selectedRole, setSelectedRole] = useState('Colaborador');
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(true);

    // Cargar datos (profesores y participantes actuales del proyecto)
    useEffect(() => {
        if (!show || !project) return;

        const fetchData = async () => {
            setLoading(true);
            setError(null);
            try {
                // Obtener todos los profesores para el dropdown
                const profSnapshot = await getDocs(collection(db, 'profesores'));
                const profList = profSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setAllProfessors(profList);

                // Obtener participantes actuales (los que tienen este proyecto en idProyectos)
                const participants = profList.filter(p => p.idProyectos && p.idProyectos.includes(project.id));

                // Simulación de roles: esto es complejo sin cambiar el modelo. 
                // Para simplificar, aquí se muestra el listado de participantes.
                setCurrentParticipants(participants);
            } catch (err) {
                setError("Error al cargar profesores.");
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [show, project]);

    const handleAddParticipant = async () => {
        if (!selectedProfessorId || currentParticipants.length >= MAX_PARTICIPANTS) {
            setError(`Límite de ${MAX_PARTICIPANTS} participantes alcanzado.`);
            return;
        }

        // Aquí iría la lógica para asignar el proyecto al profesor en Firestore
        // Nota: Esta lógica es inversa a la que ya tienes, lo cual causa complejidad.

        // PENDIENTE: Para usar este componente, tu modelo de datos debe cambiar.
        // Retornamos la solución en el componente ProjectTable que es más simple.

    };

    if (loading) return <Modal show={show} onHide={handleClose}><Modal.Body><Spinner animation="border" /></Modal.Body></Modal>;

    return (
        <Modal show={show} onHide={handleClose}>
            <Modal.Header closeButton><Modal.Title>Gestionar Participantes ({project?.nombre})</Modal.Title></Modal.Header>
            <Modal.Body>
                <Alert variant="warning">Máximo: 1 Líder, 3 Colaboradores (Total 4).</Alert>
                {error && <Alert variant="danger">{error}</Alert>}

                {/* ... Formulario para agregar participantes ... */}
            </Modal.Body>
        </Modal>
    );
}

export default ParticipantManager;