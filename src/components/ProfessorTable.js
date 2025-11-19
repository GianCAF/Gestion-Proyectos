// src/components/ProfessorTable.js

import React, { useState, useEffect } from 'react';
import { db } from '../firebaseConfig';
import { collection, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { Table, Button, Spinner, Alert, Badge } from 'react-bootstrap';
import ProfessorForm from './ProfessorForm';

function ProfessorTable() {
    const [professors, setProfessors] = useState([]);
    const [projectsMap, setProjectsMap] = useState({}); // Mapa para IDs a Nombres de Proyecto
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showEditModal, setShowEditModal] = useState(false);
    const [currentProfessor, setCurrentProfessor] = useState(null);

    const fetchProfessors = async () => {
        try {
            setLoading(true);
            // 1. Obtener Proyectos para el mapa de nombres
            const projectsCol = collection(db, 'proyectos');
            const projectSnapshot = await getDocs(projectsCol);
            const map = {};
            projectSnapshot.docs.forEach(doc => {
                map[doc.id] = doc.data().nombre;
            });
            setProjectsMap(map);

            // 2. Obtener Profesores
            const professorsCol = collection(db, 'profesores');
            const professorSnapshot = await getDocs(professorsCol);
            const professorsList = professorSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                // Asegurar que el campo exista y sea un arreglo por si hay datos antiguos
                proyectosAsignados: doc.data().proyectosAsignados || []
            }));
            setProfessors(professorsList);
        } catch (err) {
            console.error("Error fetching professors:", err);
            setError("Error al cargar los profesores.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProfessors();
    }, []);

    const handleDelete = async (id) => {
        if (window.confirm("¿Estás seguro de que quieres eliminar este profesor?")) {
            try {
                await deleteDoc(doc(db, 'profesores', id));
                fetchProfessors();
            } catch (err) {
                console.error("Error deleting professor:", err);
                setError("Error al eliminar el profesor.");
            }
        }
    };

    const handleEdit = (professor) => {
        setCurrentProfessor(professor);
        setShowEditModal(true);
    };

    const handleFormSubmit = () => {
        // Vuelve a cargar los datos después de registrar o editar
        fetchProfessors();
    };

    if (loading) return <Spinner animation="border" />;
    if (error) return <Alert variant="danger">{error}</Alert>;

    return (
        <div className="table-responsive">
            <h2>Gestión de Profesores</h2>
            <Table striped bordered hover responsive>
                <thead>
                    <tr>
                        <th>Nombre</th>
                        <th>Apellidos</th>
                        <th>Edad</th>
                        <th>Materia</th>
                        <th>Matrícula</th>
                        <th>Proyectos Asignados (Rol)</th> {/* <--- CAMBIO DE ENCABEZADO */}
                        <th>Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    {professors.map((professor) => (
                        <tr key={professor.id}>
                            <td>{professor.nombre}</td>
                            <td>{professor.apellidos}</td>
                            <td>{professor.edad}</td>
                            <td>{professor.materia}</td>
                            <td>{professor.matricula}</td>
                            <td>
                                {/* Mostrar la lista de proyectos y su rol */}
                                {professor.proyectosAsignados && professor.proyectosAsignados.length > 0 ? (
                                    professor.proyectosAsignados.map((assignment, index) => (
                                        <div key={index} className="mb-1">
                                            {projectsMap[assignment.id] || 'Proyecto Desconocido'}
                                            {' '}
                                            <Badge
                                                // Color distintivo para el Líder
                                                bg={assignment.rol === 'lider' ? 'warning' : 'secondary'}
                                                style={{ fontSize: '0.8em', textTransform: 'capitalize' }}
                                            >
                                                {assignment.rol}
                                            </Badge>
                                        </div>
                                    ))
                                ) : (
                                    'N/A'
                                )}
                            </td>
                            <td>
                                <Button variant="warning" size="sm" className="me-2" onClick={() => handleEdit(professor)}>
                                    Editar
                                </Button>
                                <Button variant="danger" size="sm" onClick={() => handleDelete(professor.id)}>
                                    Eliminar
                                </Button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </Table>

            <ProfessorForm
                show={showEditModal}
                handleClose={() => setShowEditModal(false)}
                professorToEdit={currentProfessor}
                onProfessorSubmit={handleFormSubmit}
            />
        </div>
    );
}

export default ProfessorTable;