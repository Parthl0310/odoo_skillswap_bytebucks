import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

interface LoginFormProps {
  onToggleMode: () => void;
  isRegister: boolean;
}

const LoginForm: React.FC<LoginFormProps> = ({ onToggleMode, isRegister }) => {
  const { login, register, isLoading } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (isRegister) {
      if (formData.password !== formData.confirmPassword) {
        setError('Passwords do not match');
        return;
      }
      if (formData.password.length < 6) {
        setError('Password must be at least 6 characters');
        return;
      }
      
      const success = await register({
        email: formData.email,
        password: formData.password,
        name: formData.name,
        skillsOffered: [],
        skillsWanted: [],
        availability: 'flexible',
        isPublic: true
      });
      
      if (!success) {
        setError('Registration failed. Please try again.');
      }
    } else {
      const success = await login(formData.email, formData.password);
      if (!success) {
        setError('Invalid email or password');
      }
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
      <div className="w-full max-w-2xl border-2 border-white rounded-3xl p-12">
        {/* Header */}
        <div className="flex justify-between items-center mb-16">
          <h1 className="text-2xl font-light">Skill Swap Platform</h1>
          <button 
            onClick={onToggleMode}
            className="border-2 border-white rounded-full px-8 py-3 text-lg font-light hover:bg-white hover:text-black transition-colors"
          >
            {isRegister ? 'Login' : 'Register'}
          </button>
        </div>

        {/* Demo Credentials */}
        {!isRegister && (
          <div className="mb-8 p-4 border border-gray-600 rounded-lg">
            <h3 className="text-blue-400 mb-2">Demo Accounts:</h3>
            <div className="text-sm space-y-1">
              <p><strong>User:</strong> demo@skillswap.com / demo123</p>
              <p><strong>Admin:</strong> admin@skillswap.com / admin123</p>
            </div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-12">
          {isRegister && (
            <div>
              <label className="block text-xl font-light mb-4">Name</label>
              <input
                name="name"
                type="text"
                required
                value={formData.name}
                onChange={handleChange}
                className="w-full bg-transparent border-2 border-white rounded-lg px-6 py-4 text-lg focus:outline-none focus:border-blue-400"
                placeholder="Enter your full name"
              />
            </div>
          )}

          <div>
            <label className="block text-xl font-light mb-4">Email</label>
            <input
              name="email"
              type="email"
              required
              value={formData.email}
              onChange={handleChange}
              className="w-full bg-transparent border-2 border-white rounded-lg px-6 py-4 text-lg focus:outline-none focus:border-blue-400"
              placeholder="Enter your email"
            />
          </div>

          <div>
            <label className="block text-xl font-light mb-4">Password</label>
            <input
              name="password"
              type="password"
              required
              value={formData.password}
              onChange={handleChange}
              className="w-full bg-transparent border-2 border-white rounded-lg px-6 py-4 text-lg focus:outline-none focus:border-blue-400"
              placeholder="Enter your password"
            />
          </div>

          {isRegister && (
            <div>
              <label className="block text-xl font-light mb-4">Confirm Password</label>
              <input
                name="confirmPassword"
                type="password"
                required
                value={formData.confirmPassword}
                onChange={handleChange}
                className="w-full bg-transparent border-2 border-white rounded-lg px-6 py-4 text-lg focus:outline-none focus:border-blue-400"
                placeholder="Confirm your password"
              />
            </div>
          )}

          {error && (
            <div className="text-red-400 text-center">{error}</div>
          )}

          <div className="text-center space-y-6">
            <button
              type="submit"
              disabled={isLoading}
              className="border-2 border-white rounded-full px-12 py-4 text-lg font-light hover:bg-white hover:text-black transition-colors disabled:opacity-50"
            >
              {isLoading ? 'Please wait...' : (isRegister ? 'Register' : 'Login')}
            </button>

            {!isRegister && (
              <div>
                <button type="button" className="text-blue-400 hover:underline">
                  Forgot username/password
                </button>
              </div>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default LoginForm;