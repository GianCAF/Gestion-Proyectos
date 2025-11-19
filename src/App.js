// src/App.js
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Header from './components/Header';
import ProjectList from './components/ProjectList';
import ProjectTable from './components/ProjectTable';
import ProfessorTable from './components/ProfessorTable';
import ProjectForm from './components/ProjectForm';
import ProfessorForm from './components/ProfessorForm';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db } from './firebaseConfig';
import { collection, addDoc } from 'firebase/firestore'; // Importa para crear usuarios de prueba
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { Container, Alert, Button } from 'react-bootstrap';


// Función para crear un usuario de prueba (SOLO PARA DESARROLLO)
const createTestUser = async () => {
  const testEmail = "admin@crud.com";
  const testPassword = "password123";

  try {
    const userCredential = await createUserWithEmailAndPassword(auth, testEmail, testPassword);
    await addDoc(collection(db, 'usuarios'), {
      id: userCredential.user.uid,
      nombre: "Admin User",
      correo: testEmail,
      rol: "admin" // Puedes añadir roles si lo necesitas
    });
    console.log("Usuario de prueba creado:", testEmail);
  } catch (error) {
    if (error.code === 'auth/email-already-in-use') {
      console.log("El usuario de prueba ya existe:", testEmail);
    } else {
      console.error("Error al crear usuario de prueba:", error.message);
    }
  }
};


function App() {
  const [user, setUser] = useState(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [showAddProjectModal, setShowAddProjectModal] = useState(false);
  const [showAddProfessorModal, setShowAddProfessorModal] = useState(false);


  useEffect(() => {
    // Intenta crear un usuario de prueba la primera vez que la app se carga (solo en desarrollo)
    createTestUser();

    // Listener para el estado de autenticación
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoadingAuth(false);
    });

    return () => unsubscribe(); // Limpia el listener al desmontar
  }, []);

  const handleLoginSuccess = () => {
    // Vuelve a verificar el estado del usuario después de un login/logout
    onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
  };

  // Componente de ruta protegida
  const ProtectedRoute = ({ children }) => {
    if (loadingAuth) {
      return <Container className="text-center mt-5"><Alert variant="info">Cargando autenticación...</Alert></Container>;
    }
    if (!user) {
      return <Navigate to="/" replace />;
    }
    return children;
  };

  return (
    <Router>
      <Header user={user} onLoginSuccess={handleLoginSuccess} />
      <Container className="my-4">
        <Routes>
          <Route path="/" element={
            <>
              <h1>Bienvenido a Gestión Empresarial</h1>
              <p>Esta es tu plataforma para la gestión de proyectos y profesores. Utiliza los enlaces superiores para navegar.</p>
              <ProjectList />
            </>
          } />
          <Route path="/crud" element={
            <ProtectedRoute>
              <div className="d-flex justify-content-end mb-3">
                <Button variant="primary" className="me-2" onClick={() => setShowAddProjectModal(true)}>
                  Registrar Proyecto
                </Button>
                <Button variant="info" onClick={() => setShowAddProfessorModal(true)}>
                  Registrar Profesor
                </Button>
              </div>
              <ProjectTable />
              <hr className="my-5" />
              <ProfessorTable />

              {/* Modales para registrar nuevos */}
              <ProjectForm
                show={showAddProjectModal}
                handleClose={() => setShowAddProjectModal(false)}
                onProjectSubmit={() => {
                  setShowAddProjectModal(false);
                  // Opcional: recargar tablas si es necesario
                }}
              />
              <ProfessorForm
                show={showAddProfessorModal}
                handleClose={() => setShowAddProfessorModal(false)}
                onProfessorSubmit={() => {
                  setShowAddProfessorModal(false);
                  // Opcional: recargar tablas si es necesario
                }}
              />

            </ProtectedRoute>
          } />
          {/* Puedes añadir más rutas si es necesario */}
          <Route path="*" element={<Alert variant="warning">Página no encontrada</Alert>} />
        </Routes>
      </Container>
    </Router>
  );
}

export default App;