// src/components/ProjectTable.js
import React, { useState, useEffect } from 'react';
import { db } from '../firebaseConfig';
import { collection, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { Table, Button, Spinner, Alert } from 'react-bootstrap';
import ProjectForm from './ProjectForm'; // Para el formulario de edición

function ProjectTable() {
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showEditModal, setShowEditModal] = useState(false);
    const [currentProject, setCurrentProject] = useState(null);

    const fetchProjects = async () => {
        try {
            setLoading(true);
            const projectsCol = collection(db, 'proyectos');
            const projectSnapshot = await getDocs(projectsCol);
            const projectsList = projectSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setProjects(projectsList);
        } catch (err) {
            console.error("Error fetching projects:", err);
            setError("Error al cargar los proyectos.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProjects();
    }, []);

    const handleDelete = async (id) => {
        if (window.confirm("¿Estás seguro de que quieres eliminar este proyecto?")) {
            try {
                await deleteDoc(doc(db, 'proyectos', id));
                fetchProjects();
            } catch (err) {
                console.error("Error eliminando proyecto:", err);
                setError("Error al eliminar el proyecto.");
            }
        }
    };

    const handleEdit = (project) => {
        setCurrentProject(project);
        setShowEditModal(true);
    };

    const handleFormSubmit = () => {
        fetchProjects();
        setShowEditModal(false);
        setCurrentProject(null);
    };

    if (loading) return <Spinner animation="border" role="status"><span className="visually-hidden">Cargando...</span></Spinner>;
    if (error) return <Alert variant="danger">{error}</Alert>;

    return (
        <div className="mt-4">
            <h3>Gestionar Proyectos</h3>
            <Table striped bordered hover responsive>
                <thead>
                    <tr>
                        <th>Nombre</th>
                        <th>Área</th>
                        <th>Descripción</th>
                        <th>Estado</th> {/* Nueva columna para el estado */}
                        <th>Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    {projects.map((project) => (
                        <tr key={project.id}>
                            <td>{project.nombre}</td>
                            <td>{project.area}</td>
                            <td>{project.descripcion}</td>
                            <td>{project.estado ? project.estado.replace(/_/g, ' ') : 'N/A'}</td> {/* Muestra el estado del proyecto */}
                            <td>
                                <Button variant="warning" size="sm" className="me-2" onClick={() => handleEdit(project)}>
                                    Editar
                                </Button>
                                <Button variant="danger" size="sm" onClick={() => handleDelete(project.id)}>
                                    Eliminar
                                </Button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </Table>

            <ProjectForm
                show={showEditModal}
                handleClose={() => setShowEditModal(false)}
                projectToEdit={currentProject}
                onProjectSubmit={handleFormSubmit}
            />
        </div>
    );
}

export default ProjectTable;