// src/components/ProjectList.js
import React, { useState, useEffect } from 'react';
import { db } from '../firebaseConfig';
import { collection, getDocs } from 'firebase/firestore';
import ProjectCard from './ProjectCard';
import { Row, Col, Dropdown, Spinner, Alert } from 'react-bootstrap';

function ProjectList() {
    const [allProjects, setAllProjects] = useState([]);
    const [allProfessors, setAllProfessors] = useState([]);
    const [projectsToShow, setProjectsToShow] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filterStatus, setFilterStatus] = useState('all');
    const [filterProfessor, setFilterProfessor] = useState('all');
    const [activeFilter, setActiveFilter] = useState('none');

    useEffect(() => {
        const fetchProjectsAndProfessors = async () => {
            try {
                setLoading(true);

                const projectsCol = collection(db, 'proyectos');
                const projectSnapshot = await getDocs(projectsCol);
                const projectsList = projectSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

                const professorsCol = collection(db, 'profesores');
                const professorSnapshot = await getDocs(professorsCol);
                const professorsList = professorSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

                // *** CAMBIO CLAVE: ASOCIACIÓN DE PROFESORES A PROYECTOS ***
                // Para cada proyecto, busca todos los profesores que tienen el ID de ese proyecto en su arreglo idProyectos
                const projectsWithParticipants = projectsList.map(project => {
                    const participantes = professorsList.filter(prof =>
                        // Verifica si el arreglo idProyectos del profesor incluye el ID de este proyecto
                        prof.idProyectos && prof.idProyectos.includes(project.id)
                    );
                    return { ...project, participantes };
                });

                setAllProjects(projectsWithParticipants);
                setAllProfessors(professorsList);
                // Inicialmente muestra todos los proyectos
                setProjectsToShow(projectsWithParticipants);

            } catch (err) {
                console.error("Error fetching data:", err);
                setError("Error al cargar los datos.");
            } finally {
                setLoading(false);
            }
        };

        fetchProjectsAndProfessors();
    }, []);

    // Lógica de filtrado
    useEffect(() => {
        let filteredList = allProjects;

        // Lógica para el filtro por ESTADO
        if (activeFilter === 'status' && filterStatus !== 'all') {
            filteredList = allProjects.filter(p => p.estado === filterStatus);
        }

        // Lógica para el filtro por PROFESOR
        else if (activeFilter === 'professor' && filterProfessor !== 'all') {
            // Filtra por los proyectos donde el profesor con el ID seleccionado es participante
            filteredList = allProjects.filter(project =>
                project.participantes.some(prof => prof.id === filterProfessor)
            );
        }

        // Si no hay filtro activo o se seleccionó 'Todos' en ambos, muestra todos.
        if (activeFilter === 'none' || (filterStatus === 'all' && filterProfessor === 'all')) {
            filteredList = allProjects;
        }

        setProjectsToShow(filteredList);
    }, [filterStatus, filterProfessor, activeFilter, allProjects]);


    if (loading) return <Spinner animation="border" role="status"><span className="visually-hidden">Cargando...</span></Spinner>;
    if (error) return <Alert variant="danger">{error}</Alert>;

    // Función auxiliar para obtener el nombre del filtro de profesor
    const getProfessorFilterName = () => {
        if (filterProfessor === 'all') return 'Todos';
        const prof = allProfessors.find(p => p.id === filterProfessor);
        return prof ? `${prof.nombre} ${prof.apellidos}` : 'Seleccionar...';
    };

    return (
        <div className="mt-4">
            <div className="d-flex justify-content-between align-items-center mb-3">
                <h2>Nuestros Proyectos</h2>
                <div className="d-flex">

                    {/* Filtro por estado */}
                    <Dropdown className="me-2">
                        <Dropdown.Toggle
                            variant="secondary"
                            id="dropdown-status-filter"
                            // Deshabilita si el filtro de profesor está activo y no está en 'all'
                            disabled={activeFilter === 'professor' && filterProfessor !== 'all'}
                        >
                            Filtrar por estado: {filterStatus.replace(/_/g, ' ')}
                        </Dropdown.Toggle>
                        <Dropdown.Menu>
                            <Dropdown.Item onClick={() => {
                                setFilterStatus('all');
                                setFilterProfessor('all');
                                setActiveFilter('none'); // Ningún filtro por defecto
                            }}>Todos</Dropdown.Item>
                            <Dropdown.Item onClick={() => {
                                setFilterStatus('activo');
                                setFilterProfessor('all');
                                setActiveFilter('status');
                            }}>Activos</Dropdown.Item>
                            <Dropdown.Item onClick={() => {
                                setFilterStatus('por_comenzar');
                                setFilterProfessor('all');
                                setActiveFilter('status');
                            }}>Por comenzar</Dropdown.Item>
                            <Dropdown.Item onClick={() => {
                                setFilterStatus('terminado');
                                setFilterProfessor('all');
                                setActiveFilter('status');
                            }}>Terminados</Dropdown.Item>
                        </Dropdown.Menu>
                    </Dropdown>

                    {/* Filtro por profesor */}
                    <Dropdown>
                        <Dropdown.Toggle
                            variant="secondary"
                            id="dropdown-professor-filter"
                            // Deshabilita si el filtro de estado está activo y no está en 'all'
                            disabled={activeFilter === 'status' && filterStatus !== 'all'}
                        >
                            Filtrar por profesor: {getProfessorFilterName()}
                        </Dropdown.Toggle>
                        <Dropdown.Menu>
                            <Dropdown.Item onClick={() => {
                                setFilterProfessor('all');
                                setFilterStatus('all');
                                setActiveFilter('none'); // Ningún filtro por defecto
                            }}>Todos los profesores</Dropdown.Item>
                            {allProfessors.map(prof => (
                                <Dropdown.Item key={prof.id} onClick={() => {
                                    setFilterProfessor(prof.id);
                                    setFilterStatus('all');
                                    setActiveFilter('professor');
                                }}>
                                    {prof.nombre} {prof.apellidos}
                                </Dropdown.Item>
                            ))}
                        </Dropdown.Menu>
                    </Dropdown>
                </div>
            </div>

            <Row>
                {projectsToShow.length > 0 ? (
                    projectsToShow.map(project => (
                        <Col md={4} key={project.id}>
                            <ProjectCard project={project} />
                        </Col>
                    ))
                ) : (
                    <Alert variant="info">No hay proyectos que coincidan con el filtro seleccionado.</Alert>
                )}
            </Row>
        </div>
    );
}

export default ProjectList;