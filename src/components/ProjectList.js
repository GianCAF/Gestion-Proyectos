// src/components/ProjectList.js
import React, { useState, useEffect } from 'react';
import { db } from '../firebaseConfig';
import { collection, getDocs } from 'firebase/firestore';
import ProjectCard from './ProjectCard';
import { Row, Col, Dropdown, Spinner, Alert } from 'react-bootstrap';

function ProjectList() {
    const [allProjects, setAllProjects] = useState([]);
    const [allProfessors, setAllProfessors] = useState([]);
    const [professorNameMap, setProfessorNameMap] = useState({}); // Mapa {id: nombre}
    const [projectsToShow, setProjectsToShow] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Mantenemos los estados de filtro
    const [filterStatus, setFilterStatus] = useState('all');
    const [filterProfessor, setFilterProfessor] = useState('all');
    const [activeFilter, setActiveFilter] = useState('none');

    useEffect(() => {
        const fetchProjectsAndProfessors = async () => {
            try {
                setLoading(true);

                // 1. Obtener Proyectos
                const projectsCol = collection(db, 'proyectos');
                const projectSnapshot = await getDocs(projectsCol);
                const projectsList = projectSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

                // 2. Obtener Profesores y crear el mapa de nombres
                const professorsCol = collection(db, 'profesores');
                const professorSnapshot = await getDocs(professorsCol);
                const professorsList = professorSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

                const nameMap = {};
                professorsList.forEach(p => {
                    nameMap[p.id] = p.nombre;
                });
                setProfessorNameMap(nameMap);
                setAllProfessors(professorsList);


                // 3. ASOCIACIÓN CLAVE: Para cada proyecto, busca profesores con su ID
                const projectsWithParticipants = projectsList.map(project => {
                    // Busca profesores donde el proyecto.id esté en su arreglo proyectosAsignados
                    const participantes = professorsList.flatMap(prof => {
                        const assignment = prof.proyectosAsignados?.find(p => p.id === project.id);
                        if (assignment) {
                            return [{ id: prof.id, nombre: prof.nombre, apellidos: prof.apellidos, rol: assignment.rol }];
                        }
                        return [];
                    });
                    return { ...project, participantes };
                });

                setAllProjects(projectsWithParticipants);
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

        if (activeFilter === 'status' && filterStatus !== 'all') {
            filteredList = allProjects.filter(p => p.estado === filterStatus);
        }

        else if (activeFilter === 'professor' && filterProfessor !== 'all') {
            const selectedProfId = filterProfessor;
            // Filtra por los proyectos donde el ID del profesor es un participante
            filteredList = allProjects.filter(project =>
                project.participantes.some(prof => prof.id === selectedProfId)
            );
        }

        // Si no hay filtro activo, mostrar todos.
        if (activeFilter === 'none' || (filterStatus === 'all' && filterProfessor === 'all')) {
            filteredList = allProjects;
        }

        setProjectsToShow(filteredList);
    }, [filterStatus, filterProfessor, activeFilter, allProjects]);


    if (loading) return <Spinner animation="border" role="status"><span className="visually-hidden">Cargando...</span></Spinner>;
    if (error) return <Alert variant="danger">{error}</Alert>;

    const getProfessorFilterName = () => {
        if (filterProfessor === 'all') return 'Todos';
        const prof = allProfessors.find(p => p.id === filterProfessor);
        return prof ? `${prof.nombre} ${prof.apellidos}` : 'Seleccionar...';
    };

    return (
        <div className="mt-4">
            <div className="d-flex justify-content-between align-items-center mb-3">
                <h2>Nuestros Proyectos</h2>
                {/* Controles de Filtro */}
                <div className="d-flex">
                    <Dropdown className="me-2">
                        {/* ... (Botón y lógica de filtro por estado) ... */}
                        <Dropdown.Toggle
                            variant="secondary"
                            id="dropdown-status-filter"
                            disabled={activeFilter === 'professor' && filterProfessor !== 'all'}
                        >
                            Filtrar por estado: {filterStatus.replace('con_adeudos', 'Con adeudos').replace(/_/g, ' ')}
                        </Dropdown.Toggle>
                        <Dropdown.Menu>
                            {/* Opciones de filtro de estado (activo, con_adeudos, terminado, todos) */}
                            <Dropdown.Item onClick={() => { setFilterStatus('all'); setFilterProfessor('all'); setActiveFilter('none'); }}>Todos</Dropdown.Item>
                            <Dropdown.Item onClick={() => { setFilterStatus('activo'); setFilterProfessor('all'); setActiveFilter('status'); }}>Activo</Dropdown.Item>
                            <Dropdown.Item onClick={() => { setFilterStatus('con_adeudos'); setFilterProfessor('all'); setActiveFilter('status'); }}>Con adeudos</Dropdown.Item>
                            <Dropdown.Item onClick={() => { setFilterStatus('terminado'); setFilterProfessor('all'); setActiveFilter('status'); }}>Terminados</Dropdown.Item>
                        </Dropdown.Menu>
                    </Dropdown>

                    <Dropdown>
                        {/* ... (Botón y lógica de filtro por profesor) ... */}
                        <Dropdown.Toggle
                            variant="secondary"
                            id="dropdown-professor-filter"
                            disabled={activeFilter === 'status' && filterStatus !== 'all'}
                        >
                            Filtrar por profesor: {getProfessorFilterName()}
                        </Dropdown.Toggle>
                        <Dropdown.Menu>
                            <Dropdown.Item onClick={() => { setFilterProfessor('all'); setFilterStatus('all'); setActiveFilter('none'); }}>Todos los profesores</Dropdown.Item>
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