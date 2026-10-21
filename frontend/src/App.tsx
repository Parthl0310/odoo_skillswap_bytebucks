import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { DataProvider } from './contexts/DataContext';
import ErrorBoundary from './components/ErrorBoundary';
import Layout from './components/Layout';
import LoginForm from './components/LoginForm';
import BrowseSkills from './pages/BrowserSkills';
import Profile from './pages/Profile';
import SwapRequests from './pages/SwapRequests';
import AdminPanel from './pages/AdminPanel';

const AppRoutes: React.FC = () => {
  const { user, isLoading } = useAuth();
  const [isRegister, setIsRegister] = useState(false);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] text-slate-800 flex items-center justify-center">
        <div className="text-center">
          <div className="relative w-10 h-10 mx-auto mb-3">
            <div className="w-10 h-10 rounded-full border-2 border-slate-300 border-t-indigo-600 animate-spin" />
          </div>
          <p className="text-slate-500 text-xs font-medium tracking-wide">Loading SkillSwap...</p>
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
        <Route path="/swap-requests" element={<SwapRequests />} />
        <Route path="/request-swap" element={<SwapRequests />} />
        <Route path="/requests" element={<SwapRequests />} />
        <Route path="/my-swaps" element={<SwapRequests />} />
        <Route path="/admin" element={<AdminPanel />} />
        <Route path="*" element={<Navigate to="/browse" replace />} />
      </Routes>
    </Layout>
  );
};

const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <DataProvider>
          <Router>
            <AppRoutes />
          </Router>
        </DataProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
};

export default App;