// src/components/ProjectForm.js
import React, { useState, useEffect } from 'react';
import { db } from '../firebaseConfig';
import { collection, addDoc, updateDoc, doc } from 'firebase/firestore';
import { Modal, Button, Form, Alert } from 'react-bootstrap';

function ProjectForm({ show, handleClose, projectToEdit, onProjectSubmit }) {
    const [nombre, setNombre] = useState('');
    const [area, setArea] = useState('');
    const [descripcion, setDescripcion] = useState('');
    const [estado, setEstado] = useState('activo'); // Nuevo estado para el estado del proyecto
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);

    useEffect(() => {
        if (projectToEdit) {
            setNombre(projectToEdit.nombre || '');
            setArea(projectToEdit.area || '');
            setDescripcion(projectToEdit.descripcion || '');
            setEstado(projectToEdit.estado || 'activo'); // Inicializa el estado con el valor existente
        } else {
            setNombre('');
            setArea('');
            setDescripcion('');
            setEstado('activo'); // Valor por defecto
        }
        setError(null);
        setSuccess(null);
    }, [projectToEdit, show]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setSuccess(null);

        const projectData = {
            nombre,
            area,
            descripcion,
            estado, // Incluye el nuevo campo en el objeto a guardar
        };

        try {
            if (projectToEdit) {
                await updateDoc(doc(db, 'proyectos', projectToEdit.id), projectData);
                setSuccess('Proyecto actualizado exitosamente!');
            } else {
                await addDoc(collection(db, 'proyectos'), projectData);
                setSuccess('Proyecto registrado exitosamente!');
            }
            onProjectSubmit();
            handleClose();
        } catch (err) {
            console.error("Error al guardar el proyecto:", err);
            setError('Error al guardar el proyecto. Inténtalo de nuevo.');
        }
    };

    return (
        <Modal show={show} onHide={handleClose}>
            <Modal.Header closeButton>
                <Modal.Title>{projectToEdit ? 'Editar Proyecto' : 'Registrar Nuevo Proyecto'}</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                {error && <Alert variant="danger">{error}</Alert>}
                {success && <Alert variant="success">{success}</Alert>}
                <Form onSubmit={handleSubmit}>
                    {/* Los campos existentes */}
                    <Form.Group className="mb-3">
                        <Form.Label>Nombre del Proyecto</Form.Label>
                        <Form.Control type="text" value={nombre} onChange={(e) => setNombre(e.target.value)} required />
                    </Form.Group>
                    <Form.Group className="mb-3">
                        <Form.Label>Área</Form.Label>
                        <Form.Control type="text" value={area} onChange={(e) => setArea(e.target.value)} required />
                    </Form.Group>
                    <Form.Group className="mb-3">
                        <Form.Label>Descripción</Form.Label>
                        <Form.Control as="textarea" rows={3} value={descripcion} onChange={(e) => setDescripcion(e.target.value)} required />
                    </Form.Group>

                    {/* Nuevo campo de selección para el estado del proyecto */}
                    <Form.Group className="mb-3">
                        <Form.Label>Estado del Proyecto</Form.Label>
                        <Form.Select value={estado} onChange={(e) => setEstado(e.target.value)}>
                            <option value="activo">Activo</option>
                            <option value="con_adeudos">Con adeudos</option>
                            <option value="terminado">Terminado</option>
                        </Form.Select>
                    </Form.Group>

                    <Button variant="primary" type="submit">
                        {projectToEdit ? 'Actualizar' : 'Registrar'}
                    </Button>
                </Form>
            </Modal.Body>
        </Modal>
    );
}

export default ProjectForm;