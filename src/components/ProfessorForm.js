// src/components/ProfessorForm.js
import React, { useState, useEffect } from 'react';
import { db } from '../firebaseConfig';
import { collection, addDoc, updateDoc, doc, getDocs, query, where } from 'firebase/firestore';
import { Modal, Button, Form, Alert } from 'react-bootstrap';

const MAX_PROJECTS = 2;

function ProfessorForm({ show, handleClose, professorToEdit, onProfessorSubmit }) {
    const [nombre, setNombre] = useState('');
    const [apellidos, setApellidos] = useState('');
    const [edad, setEdad] = useState('');
    const [materia, setMateria] = useState('');
    const [matricula, setMatricula] = useState('');
    // El estado para los proyectos asignados (ya no se llama idProyectos)
    const [proyectosAsignados, setProyectosAsignados] = useState([]);

    const [projects, setProjects] = useState([]);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);

    useEffect(() => {
        const fetchProjects = async () => {
            const projectsCol = collection(db, 'proyectos');
            const projectSnapshot = await getDocs(projectsCol);
            const projectsList = projectSnapshot.docs.map(doc => ({ id: doc.id, nombre: doc.data().nombre }));
            setProjects(projectsList);
        };
        fetchProjects();

        if (professorToEdit) {
            setNombre(professorToEdit.nombre || '');
            setApellidos(professorToEdit.apellidos || '');
            setEdad(professorToEdit.edad || '');
            setMateria(professorToEdit.materia || '');
            setMatricula(professorToEdit.matricula || '');
            // 🚨 CORRECCIÓN: Usar setProyectosAsignados para inicializar el estado
            setProyectosAsignados(professorToEdit.proyectosAsignados || []);
        } else {
            setNombre('');
            setApellidos('');
            setEdad('');
            setMateria('');
            setMatricula('');
            setProyectosAsignados([]);
        }
        setError(null);
        setSuccess(null);
    }, [professorToEdit, show]);

    const getProjectIds = (assignments) => assignments.map(p => p.id);

    // Lógica de restricción de cantidad (se mantiene)
    const handleProjectToggle = (projectId) => {
        setError(null);

        setProyectosAsignados(prevAssignments => {
            const isAssigned = getProjectIds(prevAssignments).includes(projectId);

            if (isAssigned) {
                // Desasignar
                return prevAssignments.filter(p => p.id !== projectId);
            } else {
                // Asignar
                if (prevAssignments.length >= MAX_PROJECTS) {
                    setError(`Error: Un profesor solo puede participar en un máximo de ${MAX_PROJECTS} proyectos.`);
                    return prevAssignments;
                }

                // Asignación por defecto: 'participante'
                const assignment = { id: projectId, rol: 'participante' };

                return [...prevAssignments, assignment];
            }
        });
    };

    // Función para cambiar el rol de un proyecto ya asignado
    const handleRolChange = (projectId, newRol) => {
        setProyectosAsignados(prevAssignments =>
            prevAssignments.map(p =>
                p.id === projectId ? { ...p, rol: newRol } : p
            )
        );
    };

    // *** MODIFICACIÓN CLAVE: Verificación de Líder en el Submit ***
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setSuccess(null);

        if (proyectosAsignados.length > MAX_PROJECTS) {
            setError(`Error: El profesor excede el límite de ${MAX_PROJECTS} proyectos.`);
            return;
        }

        // 1. VERIFICACIÓN DE LÍDER
        const leaderAssignments = proyectosAsignados.filter(a => a.rol === 'lider');

        for (const assignment of leaderAssignments) {
            const leader = await checkExistingLeader(assignment.id);

            if (leader) {
                const projectName = projects.find(p => p.id === assignment.id)?.nombre || assignment.id;
                setError(`El proyecto "${projectName}" ya tiene un líder asignado: ${leader.nombre} ${leader.apellidos}.`);
                return;
            }
        }

        // Si la verificación pasa, guardamos los datos
        const professorData = {
            nombre,
            apellidos,
            edad: parseInt(edad),
            materia,
            matricula,
            proyectosAsignados: proyectosAsignados,
        };

        try {
            if (professorToEdit) {
                await updateDoc(doc(db, 'profesores', professorToEdit.id), professorData);
                setSuccess('Profesor actualizado exitosamente!');
            } else {
                await addDoc(collection(db, 'profesores'), professorData);
                setSuccess('Profesor registrado exitosamente!');
            }
            onProfessorSubmit();
            handleClose();
        } catch (err) {
            console.error("Error al guardar el profesor:", err);
            setError('Error al guardar el profesor. Inténtalo de nuevo.');
        }
    };

    // *** FUNCIÓN DE VERIFICACIÓN DE LÍDER EXISTENTE (mover fuera si es posible, pero aquí funciona) ***
    const checkExistingLeader = async (projectId) => {
        const professorsRef = collection(db, 'profesores');
        const snapshot = await getDocs(professorsRef);

        let existingLeader = null;

        snapshot.forEach(doc => {
            const professor = doc.data();
            const currentProfId = doc.id;

            // Si estamos editando a este mismo profesor, lo ignoramos en la búsqueda.
            if (professorToEdit && currentProfId === professorToEdit.id) {
                return;
            }

            const assignment = professor.proyectosAsignados?.find(a => a.id === projectId && a.rol === 'lider');

            if (assignment) {
                existingLeader = professor;
            }
        });

        return existingLeader;
    };

    const assignedIds = getProjectIds(proyectosAsignados);

    return (
        <Modal show={show} onHide={handleClose}>
            <Modal.Header closeButton>
                <Modal.Title>{professorToEdit ? 'Editar Profesor' : 'Registrar Nuevo Profesor'}</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <Alert variant="info">Máximo de proyectos por profesor: **{MAX_PROJECTS}**.</Alert>
                {error && <Alert variant="danger">{error}</Alert>}
                {success && <Alert variant="success">{success}</Alert>}
                <Form onSubmit={handleSubmit}>
                    <Form.Group className="mb-3">
                        <Form.Label>Nombre</Form.Label>
                        <Form.Control type="text" value={nombre} onChange={(e) => setNombre(e.target.value)} required />
                    </Form.Group>
                    <Form.Group className="mb-3">
                        <Form.Label>Apellidos</Form.Label>
                        <Form.Control type="text" value={apellidos} onChange={(e) => setApellidos(e.target.value)} required />
                    </Form.Group>
                    <Form.Group className="mb-3">
                        <Form.Label>Edad</Form.Label>
                        <Form.Control type="number" value={edad} onChange={(e) => setEdad(e.target.value)} required />
                    </Form.Group>
                    <Form.Group className="mb-3">
                        <Form.Label>Área del Docente</Form.Label>
                        <Form.Control type="text" value={materia} onChange={(e) => setMateria(e.target.value)} required />
                    </Form.Group>
                    <Form.Group className="mb-3">
                        <Form.Label>Matrícula</Form.Label>
                        <Form.Control type="text" value={matricula} onChange={(e) => setMatricula(e.target.value)} required />
                    </Form.Group>

                    <Form.Group className="mb-3">
                        <Form.Label>Asignar Proyecto(s) (Seleccionados: {proyectosAsignados.length} / {MAX_PROJECTS})</Form.Label>
                        <div style={{ maxHeight: '250px', overflowY: 'auto', border: '1px solid #A9F3C6', padding: '10px', backgroundColor: '#1A543A' }}>
                            {projects.length > 0 ? (
                                projects.map((project) => {
                                    const assignment = proyectosAsignados.find(p => p.id === project.id);

                                    return (
                                        <div key={project.id} className="d-flex align-items-center mb-2">
                                            <Form.Check
                                                type="checkbox"
                                                id={`project-${project.id}`}
                                                label={project.nombre}
                                                checked={assignedIds.includes(project.id)}
                                                onChange={() => handleProjectToggle(project.id)}
                                                style={{ color: '#F0F0F0', flexGrow: 1 }}
                                            />
                                            {assignment && (
                                                <Form.Select
                                                    size="sm"
                                                    value={assignment.rol}
                                                    onChange={(e) => handleRolChange(project.id, e.target.value)}
                                                    style={{ width: '120px', marginLeft: '10px' }}
                                                >
                                                    <option value="participante">Participante</option>
                                                    <option value="lider">Líder</option>
                                                </Form.Select>
                                            )}
                                        </div>
                                    )
                                })
                            ) : (
                                <p style={{ color: '#F0F0F0' }}>No hay proyectos disponibles.</p>
                            )}
                        </div>
                    </Form.Group>

                    <Button variant="primary" type="submit">
                        {professorToEdit ? 'Actualizar' : 'Registrar'}
                    </Button>
                </Form>
            </Modal.Body>
        </Modal>
    );
}

export default ProfessorForm;