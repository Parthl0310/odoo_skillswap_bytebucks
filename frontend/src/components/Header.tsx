import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Header: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  if (!user) return null;

  return (
    <header className="bg-black text-white border-b-2 border-white">
      <div className="max-w-7xl mx-auto px-8 py-4">
        <div className="flex justify-between items-center">
          {/* Logo */}
          <Link to="/browse" className="text-2xl font-light">
            Skill Swap Platform
          </Link>

          {/* Navigation */}
          <div className="flex items-center space-x-8">
            {location.pathname !== '/browse' && (
              <Link
                to="/browse"
                className="border-2 border-white rounded-full px-6 py-2 hover:bg-white hover:text-black transition-colors"
              >
                Home
              </Link>
            )}
            
            {location.pathname !== '/profile' && (
              <Link
                to="/profile"
                className="border-2 border-white rounded-full px-6 py-2 hover:bg-white hover:text-black transition-colors"
              >
                Profile
              </Link>
            )}

            {location.pathname !== '/swaps' && (
              <Link
                to="/swaps"
                className="border-2 border-white rounded-full px-6 py-2 hover:bg-white hover:text-black transition-colors"
              >
                Swap request
              </Link>
            )}

            {/* Profile Photo */}
            <div className="w-12 h-12 border-2 border-white rounded-lg overflow-hidden">
              {user.photo ? (
                <img src={user.photo} alt={user.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-gray-600 flex items-center justify-center text-xs">
                  {user.name.charAt(0)}
                </div>
              )}
            </div>

            <button
              onClick={handleLogout}
              className="text-red-400 hover:text-red-300"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;