import React, { useState, useMemo } from 'react';
import { ChevronDown, ChevronLeft, ChevronRight, Wifi, WifiOff } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { User } from '../types';

const ITEMS_PER_PAGE = 3;

const BrowseSkills: React.FC = () => {
  const { user } = useAuth();
  const { users, createSwapRequest, swapRequests, isRealtimeConnected, isLoading } = useData();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [availability, setAvailability] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showSwapModal, setShowSwapModal] = useState(false);
  const [swapForm, setSwapForm] = useState({
    skillOffered: '',
    skillWanted: '',
    message: ''
  });

  const filteredUsers = useMemo(() => {
    return users.filter(u => {
      if (u.id === user?.id || !u.isPublic || u.isBanned) return false;
      
      const matchesSearch = !searchQuery || 
        u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.skillsOffered.some(s => s.toLowerCase().includes(searchQuery.toLowerCase())) ||
        u.skillsWanted.some(s => s.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesAvailability = availability === 'all' || u.availability === availability;

      return matchesSearch && matchesAvailability;
    });
  }, [users, user?.id, searchQuery, availability]);

  // Get user's swap requests
  const userSwapRequests = useMemo(() => {
    if (!user) return [];
    return swapRequests.filter(req => 
      req.fromUserId === user.id || req.toUserId === user.id
    ).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [swapRequests, user?.id]);

  const totalPages = Math.ceil(filteredUsers.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedUsers = filteredUsers.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const handleRequest = (targetUser: User) => {
    setSelectedUser(targetUser);
    setShowSwapModal(true);
  };

  const handleSubmitSwap = async () => {
    if (!user || !selectedUser || !swapForm.skillOffered || !swapForm.skillWanted) return;

    try {
      await createSwapRequest({
        fromUserId: user.id,
        toUserId: selectedUser.id,
        skillOffered: swapForm.skillOffered,
        skillWanted: swapForm.skillWanted,
        message: swapForm.message,
        status: 'pending'
      });

      setShowSwapModal(false);
      setSwapForm({ skillOffered: '', skillWanted: '', message: '' });
      setSelectedUser(null);
    } catch (error) {
      console.error('Error creating swap request:', error);
      alert('Failed to create swap request. Please try again.');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'text-yellow-400';
      case 'accepted': return 'text-green-400';
      case 'rejected': return 'text-red-400';
      case 'completed': return 'text-blue-400';
      case 'cancelled': return 'text-gray-400';
      default: return 'text-white';
    }
  };

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-6xl mx-auto">
        {/* Real-time Connection Status */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-4xl font-light">Browse Skills</h1>
          <div className="flex items-center space-x-2">
            {isRealtimeConnected ? (
              <Wifi className="w-5 h-5 text-green-400" />
            ) : (
              <WifiOff className="w-5 h-5 text-red-400" />
            )}
            <span className={`text-sm ${isRealtimeConnected ? 'text-green-400' : 'text-red-400'}`}>
              {isRealtimeConnected ? 'Real-time Connected' : 'Real-time Disconnected'}
            </span>
          </div>
        </div>

        {/* User's Swap Requests */}
        {userSwapRequests.length > 0 && (
          <div className="mb-12">
            <h2 className="text-2xl font-light mb-6">Your Swap Requests</h2>
            <div className="space-y-4">
              {userSwapRequests.slice(0, 3).map((request) => (
                <div key={request.id} className="border border-white rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className={`font-medium ${getStatusColor(request.status)}`}>
                        {request.status.toUpperCase()}
                      </span>
                      <p className="text-sm text-gray-300 mt-1">
                        {request.skillOffered} ↔ {request.skillWanted}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        {new Date(request.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm">
                        {request.fromUserId === user?.id ? 'Sent to' : 'Received from'}
                      </p>
                      <p className="text-xs text-gray-300">
                        {users.find(u => u.id === (request.fromUserId === user?.id ? request.toUserId : request.fromUserId))?.name}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Search and Filter */}
        <div className="flex justify-center items-center space-x-6 mb-12">
          <div className="relative">
            <select
              value={availability}
              onChange={(e) => setAvailability(e.target.value)}
              className="bg-transparent border-2 border-white rounded-lg px-6 py-3 pr-12 text-lg appearance-none focus:outline-none focus:border-blue-400"
            >
              <option value="all" className="bg-black">Availability</option>
              <option value="weekdays" className="bg-black">Weekdays</option>
              <option value="weekends" className="bg-black">Weekends</option>
              <option value="evenings" className="bg-black">Evenings</option>
              <option value="flexible" className="bg-black">Flexible</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 pointer-events-none" />
          </div>

          <div className="flex">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search skills or users..."
              className="bg-transparent border-2 border-white rounded-l-lg px-6 py-3 text-lg focus:outline-none focus:border-blue-400 w-80"
            />
            <button className="bg-white text-black px-6 py-3 rounded-r-lg border-2 border-white hover:bg-gray-200 transition-colors">
              Search
            </button>
          </div>
        </div>

        {/* User Cards */}
        <div className="space-y-8 mb-12">
          {paginatedUsers.map((targetUser) => (
            <div key={targetUser.id} className="border-2 border-white rounded-3xl p-8">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-8">
                  {/* Profile Photo */}
                  <div className="w-32 h-32 border-2 border-white rounded-full overflow-hidden flex-shrink-0">
                    {targetUser.photo ? (
                      <img src={targetUser.photo} alt={targetUser.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-gray-600 flex items-center justify-center text-2xl font-light">
                        Profile Photo
                      </div>
                    )}
                  </div>

                  {/* User Info */}
                  <div className="space-y-6">
                    <h3 className="text-3xl font-light">{targetUser.name}</h3>
                    
                    <div>
                      <div className="flex items-center space-x-4 mb-2">
                        <span className="text-green-400 text-lg">Skills Offered =&gt;</span>
                      </div>
                      <div className="flex flex-wrap gap-3">
                        {targetUser.skillsOffered.map((skill) => (
                          <span key={skill} className="border border-white rounded-full px-4 py-2 text-sm">
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center space-x-4 mb-2">
                        <span className="text-blue-400 text-lg">Skill wanted =&gt;</span>
                      </div>
                      <div className="flex flex-wrap gap-3">
                        {targetUser.skillsWanted.map((skill) => (
                          <span key={skill} className="border border-white rounded-full px-4 py-2 text-sm">
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Request Button and Rating */}
                <div className="text-right space-y-4">
                  <button
                    onClick={() => handleRequest(targetUser)}
                    className="bg-teal-600 text-white px-8 py-3 rounded-lg text-lg hover:bg-teal-700 transition-colors"
                  >
                    Request
                  </button>
                  <div className="text-lg">
                    <span>rating </span>
                    <span className="font-bold">{targetUser.rating}/5</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center space-x-4">
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="p-2 disabled:opacity-50"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`w-10 h-10 rounded-full border-2 ${
                  currentPage === page 
                    ? 'bg-white text-black border-white' 
                    : 'border-white hover:bg-white hover:text-black'
                } transition-colors`}
              >
                {page}
              </button>
            ))}
            
            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="p-2 disabled:opacity-50"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </div>
        )}

        {/* Swap Request Modal */}
        {showSwapModal && selectedUser && (
          <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50">
            <div className="bg-black border-2 border-white rounded-3xl p-8 max-w-2xl w-full">
              <h2 className="text-2xl font-light mb-8">Request Swap with {selectedUser.name}</h2>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-lg mb-3">Choose one of your offered skills</label>
                  <div className="relative">
                    <select
                      value={swapForm.skillOffered}
                      onChange={(e) => setSwapForm(prev => ({ ...prev, skillOffered: e.target.value }))}
                      className="w-full bg-transparent border-2 border-white rounded-lg px-6 py-3 text-lg appearance-none focus:outline-none focus:border-blue-400"
                    >
                      <option value="" className="bg-black">Select a skill...</option>
                      {user?.skillsOffered.map((skill) => (
                        <option key={skill} value={skill} className="bg-black">{skill}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 pointer-events-none" />
                  </div>
                </div>

                <div>
                  <label className="block text-lg mb-3">Choose one of their wanted skills</label>
                  <div className="relative">
                    <select
                      value={swapForm.skillWanted}
                      onChange={(e) => setSwapForm(prev => ({ ...prev, skillWanted: e.target.value }))}
                      className="w-full bg-transparent border-2 border-white rounded-lg px-6 py-3 text-lg appearance-none focus:outline-none focus:border-blue-400"
                    >
                      <option value="" className="bg-black">Select a skill...</option>
                      {selectedUser.skillsWanted.map((skill) => (
                        <option key={skill} value={skill} className="bg-black">{skill}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 pointer-events-none" />
                  </div>
                </div>

                <div>
                  <label className="block text-lg mb-3">Message</label>
                  <textarea
                    value={swapForm.message}
                    onChange={(e) => setSwapForm(prev => ({ ...prev, message: e.target.value }))}
                    rows={6}
                    className="w-full bg-transparent border-2 border-white rounded-lg px-6 py-3 text-lg resize-none focus:outline-none focus:border-blue-400"
                    placeholder="Write a message to introduce yourself..."
                  />
                </div>

                <div className="flex justify-center space-x-6 pt-4">
                  <button
                    onClick={() => setShowSwapModal(false)}
                    className="border-2 border-white rounded-lg px-8 py-3 text-lg hover:bg-white hover:text-black transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSubmitSwap}
                    disabled={!swapForm.skillOffered || !swapForm.skillWanted || isLoading}
                    className="bg-blue-600 text-white px-8 py-3 rounded-lg text-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                  >
                    {isLoading ? 'Submitting...' : 'Submit'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BrowseSkills;