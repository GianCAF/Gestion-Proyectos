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
    // Nuevo estado para los proyectos sin líder
    const [projectsWithoutLeader, setProjectsWithoutLeader] = useState([]);

    const fetchProjects = async () => {
        try {
            setLoading(true);

            // 1. Obtener Proyectos
            const projectsCol = collection(db, 'proyectos');
            const projectSnapshot = await getDocs(projectsCol);
            const projectsList = projectSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

            // 2. Obtener Profesores (para la validación de líder)
            const professorsCol = collection(db, 'profesores');
            const professorSnapshot = await getDocs(professorsCol);
            const professorsList = professorSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

            // 3. VALIDACIÓN DE LÍDER
            const projectsWithLeaderStatus = projectsList.map(project => {
                // Buscamos si algún profesor tiene este proyecto asignado como 'lider'
                const hasLeader = professorsList.some(professor =>
                    professor.proyectosAsignados?.some(assignment =>
                        assignment.id === project.id && assignment.rol === 'lider'
                    )
                );
                return { ...project, hasLeader };
            });

            // 4. Filtrar y actualizar el estado
            const projectsMissingLeader = projectsWithLeaderStatus
                .filter(p => !p.hasLeader)
                .map(p => p.nombre);

            setProjects(projectsList); // Mantenemos la lista original de proyectos para la tabla
            setProjectsWithoutLeader(projectsMissingLeader); // Guardamos solo los nombres sin líder

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
                // Nota: También se deberían eliminar las referencias en la colección 'profesores'
                // pero por ahora solo recargamos la tabla para simplicidad.
                fetchProjects();
            } catch (err) {
                console.error("Error deleting project:", err);
                setError("Error al eliminar el proyecto.");
            }
        }
    };

    // Cierra el modal y recarga la tabla después de editar/crear
    const handleFormSubmit = () => {
        fetchProjects();
        setShowEditModal(false);
        setCurrentProject(null);
    };

    const handleEdit = (project) => {
        setCurrentProject(project);
        setShowEditModal(true);
    };

    if (loading) return <Spinner animation="border" role="status" className="d-block mx-auto my-5"><span className="visually-hidden">Cargando...</span></Spinner>;
    if (error) return <Alert variant="danger">{error}</Alert>;

    return (
        <div className="mt-4">
            <h2>Gestión de Proyectos</h2>

            {/* ALERTA DE PROYECTOS SIN LÍDER */}
            {projectsWithoutLeader.length > 0 && (
                <Alert variant="warning" className="mb-3">
                    ⚠️ **Advertencia:** Los siguientes proyectos **no tienen un líder asignado** y requieren atención:
                    <ul>
                        {projectsWithoutLeader.map((name, index) => (
                            <li key={index}>**{name}**</li>
                        ))}
                    </ul>
                    Asigna un profesor con el rol de **Líder** en el formulario de registro/edición de profesores.
                </Alert>
            )}

            <Table striped bordered hover responsive>
                <thead>
                    <tr>
                        <th>Nombre</th>
                        <th>Área</th>
                        <th>Descripción</th>
                        <th>Estado</th>
                        <th>Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    {projects.map((project) => (
                        <tr key={project.id}>
                            <td>{project.nombre}</td>
                            <td>{project.area}</td>
                            <td>{project.descripcion}</td>
                            <td>{project.estado ? project.estado.replace(/_/g, ' ') : 'N/A'}</td>
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