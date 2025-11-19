// src/components/ProfessorTable.js
import React, { useState, useEffect } from 'react';
import { db } from '../firebaseConfig';
import { collection, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { Table, Button, Spinner, Alert, Badge } from 'react-bootstrap';
import ProfessorForm from './ProfessorForm';

function ProfessorTable() {
    const [professors, setProfessors] = useState([]);
    const [projectsMap, setProjectsMap] = useState({}); // Mapa para buscar nombres por ID
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showEditModal, setShowEditModal] = useState(false);
    const [currentProfessor, setCurrentProfessor] = useState(null);

    const fetchData = async () => {
        try {
            setLoading(true);

            // 1. Obtener Proyectos y crear un mapa {id: nombre}
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
            const professorsList = professorSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

            setProfessors(professorsList);
        } catch (err) {
            console.error("Error fetching data:", err);
            setError("Error al cargar los datos.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleDelete = async (id) => {
        if (window.confirm("¿Estás seguro de que quieres eliminar este profesor?")) {
            try {
                await deleteDoc(doc(db, 'profesores', id));
                fetchData();
            } catch (err) {
                console.error("Error eliminando profesor:", err);
                setError("Error al eliminar el profesor.");
            }
        }
    };

    const handleEdit = (professor) => {
        setCurrentProfessor(professor);
        setShowEditModal(true);
    };

    const handleFormSubmit = () => {
        fetchData();
        setShowEditModal(false);
        setCurrentProfessor(null);
    };

    if (loading) return <Spinner animation="border" role="status"><span className="visually-hidden">Cargando...</span></Spinner>;
    if (error) return <Alert variant="danger">{error}</Alert>;

    return (
        <div className="mt-4">
            <h3>Gestionar Profesores</h3>
            <Table striped bordered hover responsive>
                <thead>
                    <tr>
                        <th>Nombre</th>
                        <th>Apellidos</th>
                        <th>Edad</th>
                        <th>Materia</th>
                        <th>Proyectos Asignados</th> {/* CAMBIO: Título de la columna */}
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
                            {/* CAMBIO: Renderiza múltiples badges para cada proyecto asignado */}
                            <td>
                                {professor.idProyectos && professor.idProyectos.length > 0 ? (
                                    professor.idProyectos.map(projectId => (
                                        <Badge key={projectId} bg="info" className="me-1 mb-1">
                                            {projectsMap[projectId] || projectId}
                                        </Badge>
                                    ))
                                ) : (
                                    <Badge bg="secondary">N/A</Badge>
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