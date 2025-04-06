import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login/Login';
import Dashboard from './components/Dashboard/Dashboard';
import DeviceControl from './components/DeviceControl/DeviceControl';
import Header from './components/common/Header';
import Sidebar from './components/common/Sidebar';
import Footer from './components/common/Footer';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  useEffect(() => {
    // Check if token exists in localStorage
    const token = localStorage.getItem('token');
    if (token) {
      setIsAuthenticated(true);
    }
  }, []);
  
  const handleLogin = (token) => {
    localStorage.setItem('token', token);
    setIsAuthenticated(true);
  };
  
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    setIsAuthenticated(false);
  };
  
  return (
    <Router>
      <div className="app">
        <Routes>
          <Route path="/login" element={
            isAuthenticated ? <Navigate to="/dashboard" /> : <Login onLogin={handleLogin} />
          } />
          
          <Route path="/*" element={
            isAuthenticated ? (
              <div className="app-container">
                <Header onLogout={handleLogout} />
                <div className="main-container">
                  <Sidebar />
                  <main className="content">
                    <Routes>
                      <Route path="/" element={<Navigate to="/dashboard" />} />
                      <Route path="/dashboard" element={<Dashboard />} />
                      <Route path="/devices" element={<DeviceControl />} />
                    </Routes>
                  </main>
                </div>
                <Footer />
              </div>
            ) : <Navigate to="/login" />
          } />
        </Routes>
      </div>
    </Router>
  );
}

export default App;