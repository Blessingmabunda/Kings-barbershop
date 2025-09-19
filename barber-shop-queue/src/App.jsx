import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import QueueManagement from './pages/QueueManagement';
import CustomerManagement from './pages/CustomerManagement';
import Reports from './pages/Reports';
import Settings from './pages/Settings';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const handleLogin = () => {
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
  };

  if (!isAuthenticated) {
    return (
      <Router>
        <Routes>
          <Route path="*" element={<Login onLogin={handleLogin} />} />
        </Routes>
      </Router>
    );
  }

  return (
    <Router>
      <Layout onLogout={handleLogout}>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/queue" element={<QueueManagement />} />
          <Route path="/customers" element={<CustomerManagement />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;
