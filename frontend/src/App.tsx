import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { DataProvider } from './contexts/DataContext';
import Layout from './components/Layout';
import LoginForm from './components/LoginForm';
import BrowseSkills from './pages/BrowserSkills';
import Profile from './pages/Profile';
import SwapRequests from './pages/SwapRequests';

const AppRoutes: React.FC = () => {
  const { user, isLoading } = useAuth();
  const [isRegister, setIsRegister] = useState(false);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <LoginForm 
        onToggleMode={() => setIsRegister(!isRegister)} 
        isRegister={isRegister} 
      />
    );
  }

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Navigate to="/browse" replace />} />
        <Route path="/browse" element={<BrowseSkills />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/swaps" element={<SwapRequests />} />
        <Route path="*" element={<Navigate to="/browse" replace />} />
      </Routes>
    </Layout>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <DataProvider>
        <Router>
          <AppRoutes />
        </Router>
      </DataProvider>
    </AuthProvider>
  );
};

export default App;