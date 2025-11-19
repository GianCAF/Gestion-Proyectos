// src/components/ProfessorForm.js
import React, { useState, useEffect } from 'react';
import { db } from '../firebaseConfig';
import { collection, addDoc, updateDoc, doc, getDocs } from 'firebase/firestore';
import { Modal, Button, Form, Alert } from 'react-bootstrap';

function ProfessorForm({ show, handleClose, professorToEdit, onProfessorSubmit }) {
    const [nombre, setNombre] = useState('');
    const [apellidos, setApellidos] = useState('');
    const [edad, setEdad] = useState('');
    const [materia, setMateria] = useState('');
    const [matricula, setMatricula] = useState('');
    // *** CAMBIO: Usamos un arreglo para múltiples IDs de proyecto ***
    const [idProyectos, setIdProyectos] = useState([]);

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
            // *** CAMBIO: Inicializamos con el arreglo (si existe) o un array vacío ***
            setIdProyectos(professorToEdit.idProyectos || []);
        } else {
            setNombre('');
            setApellidos('');
            setEdad('');
            setMateria('');
            setMatricula('');
            setIdProyectos([]); // Limpiamos al registrar
        }
        setError(null);
        setSuccess(null);
    }, [professorToEdit, show]);

    // *** NUEVA FUNCIÓN: Maneja la selección/deselección del checkbox ***
    const handleProjectToggle = (projectId) => {
        setIdProyectos(prevIds => {
            if (prevIds.includes(projectId)) {
                // Deseleccionar: remueve el ID
                return prevIds.filter(id => id !== projectId);
            } else {
                // Seleccionar: añade el ID
                return [...prevIds, projectId];
            }
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setSuccess(null);

        const professorData = {
            nombre,
            apellidos,
            edad: parseInt(edad),
            materia,
            matricula,
            // *** CAMBIO: Enviamos el arreglo de IDs al guardar ***
            idProyectos: idProyectos,
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

    return (
        <Modal show={show} onHide={handleClose}>
            <Modal.Header closeButton>
                <Modal.Title>{professorToEdit ? 'Editar Profesor' : 'Registrar Nuevo Profesor'}</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                {error && <Alert variant="danger">{error}</Alert>}
                {success && <Alert variant="success">{success}</Alert>}
                <Form onSubmit={handleSubmit}>
                    {/* ... (Campos de nombre, apellidos, edad, materia, matrícula son los mismos) ... */}

                    <Form.Group className="mb-3">
                        <Form.Label>Asignar Proyecto(s)</Form.Label>
                        <div style={{ maxHeight: '200px', overflowY: 'auto', border: '1px solid #ccc', padding: '10px' }}>
                            {projects.length > 0 ? (
                                projects.map((project) => (
                                    <Form.Check
                                        key={project.id}
                                        type="checkbox"
                                        id={`project-${project.id}`}
                                        label={project.nombre}
                                        checked={idProyectos.includes(project.id)}
                                        onChange={() => handleProjectToggle(project.id)}
                                    />
                                ))
                            ) : (
                                <p>No hay proyectos disponibles.</p>
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