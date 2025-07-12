import React, { useState } from 'react';
import { 
  Users, 
  MessageSquare, 
  Ban, 
  CheckCircle, 
  Download,
  Send,
  Shield,
  BarChart3,
  AlertTriangle
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';

const AdminPanel: React.FC = () => {
  const { user } = useAuth();
  const { users, swapRequests, adminMessages, createAdminMessage, banUser, unbanUser } = useData();
  const [activeTab, setActiveTab] = useState<'users' | 'swaps' | 'messages' | 'stats'>('users');
  const [messageForm, setMessageForm] = useState({
    title: '',
    message: '',
    type: 'info' as 'info' | 'warning' | 'announcement',
  });

  // Redirect if not admin
  if (!user?.isAdmin) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <Shield className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
          <p className="text-gray-600">You don't have permission to access this page.</p>
        </div>
      </div>
    );
  }

  const handleSendMessage = () => {
    if (messageForm.title && messageForm.message) {
      createAdminMessage({
        ...messageForm,
        isActive: true,
      });
      setMessageForm({ title: '', message: '', type: 'info' });
    }
  };

  const downloadUserData = () => {
    const data = {
      users: users.map(u => ({
        id: u.id,
        name: u.name,
        email: u.email,
        location: u.location,
        skillsOffered: u.skillsOffered,
        skillsWanted: u.skillsWanted,
        rating: u.rating,
        reviewCount: u.reviewCount,
        joinedAt: u.joinedAt,
        isBanned: u.isBanned,
      })),
      swapRequests: swapRequests,
      timestamp: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `skillswap-data-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const tabs = [
    { id: 'users', label: 'Users', icon: Users },
    { id: 'swaps', label: 'Swaps', icon: MessageSquare },
    { id: 'messages', label: 'Messages', icon: Send },
    { id: 'stats', label: 'Statistics', icon: BarChart3 },
  ];

  const stats = {
    totalUsers: users.length,
    activeUsers: users.filter(u => u.availability === 'available').length,
    bannedUsers: users.filter(u => u.isBanned).length,
    totalSwaps: swapRequests.length,
    pendingSwaps: swapRequests.filter(s => s.status === 'pending').length,
    completedSwaps: swapRequests.filter(s => s.status === 'completed').length,
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center space-x-3 mb-4">
          <Shield className="w-8 h-8 text-blue-600" />
          <h1 className="text-3xl font-bold text-gray-900">Admin Panel</h1>
        </div>
        <p className="text-gray-600">
          Manage users, monitor activities, and broadcast messages to the community
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4 mb-8">
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <div className="text-2xl font-bold text-gray-900">{stats.totalUsers}</div>
          <div className="text-sm text-gray-600">Total Users</div>
        </div>
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <div className="text-2xl font-bold text-green-600">{stats.activeUsers}</div>
          <div className="text-sm text-gray-600">Active Users</div>
        </div>
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <div className="text-2xl font-bold text-red-600">{stats.bannedUsers}</div>
          <div className="text-sm text-gray-600">Banned Users</div>
        </div>
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <div className="text-2xl font-bold text-gray-900">{stats.totalSwaps}</div>
          <div className="text-sm text-gray-600">Total Swaps</div>
        </div>
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <div className="text-2xl font-bold text-yellow-600">{stats.pendingSwaps}</div>
          <div className="text-sm text-gray-600">Pending</div>
        </div>
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <div className="text-2xl font-bold text-blue-600">{stats.completedSwaps}</div>
          <div className="text-sm text-gray-600">Completed</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-8">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  isActive
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        {/* Users Tab */}
        {activeTab === 'users' && (
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">User Management</h2>
              <button
                onClick={downloadUserData}
                className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                <Download className="w-4 h-4" />
                <span>Export Data</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-medium text-gray-900">User</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Email</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Location</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Status</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Rating</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.filter(u => !u.isAdmin).map((u) => (
                    <tr key={u.id} className="border-b border-gray-100">
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-3">
                          {u.photo ? (
                            <img src={u.photo} alt={u.name} className="w-8 h-8 rounded-full object-cover" />
                          ) : (
                            <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                              <span className="text-xs font-medium">{u.name.charAt(0)}</span>
                            </div>
                          )}
                          <span className="font-medium text-gray-900">{u.name}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-gray-600">{u.email}</td>
                      <td className="py-3 px-4 text-gray-600">{u.location || 'Not specified'}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          u.isBanned ? 'text-red-600 bg-red-100' :
                          u.availability === 'available' ? 'text-green-600 bg-green-100' :
                          u.availability === 'busy' ? 'text-yellow-600 bg-yellow-100' :
                          'text-red-600 bg-red-100'
                        }`}>
                          {u.isBanned ? 'Banned' : u.availability}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-1">
                          <span className="text-gray-900">{u.rating}</span>
                          <span className="text-gray-500">({u.reviewCount})</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        {u.isBanned ? (
                          <button
                            onClick={() => unbanUser(u.id)}
                            className="flex items-center space-x-1 text-green-600 hover:text-green-700 font-medium"
                          >
                            <CheckCircle className="w-4 h-4" />
                            <span>Unban</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => banUser(u.id)}
                            className="flex items-center space-x-1 text-red-600 hover:text-red-700 font-medium"
                          >
                            <Ban className="w-4 h-4" />
                            <span>Ban</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Swaps Tab */}
        {activeTab === 'swaps' && (
          <div className="p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Swap Requests</h2>

            <div className="space-y-4">
              {swapRequests.map((swap) => {
                const fromUser = users.find(u => u.id === swap.fromUserId);
                const toUser = users.find(u => u.id === swap.toUserId);

                return (
                  <div key={swap.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <span className="font-medium">{fromUser?.name}</span>
                        <span className="text-gray-500">→</span>
                        <span className="font-medium">{toUser?.name}</span>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        swap.status === 'pending' ? 'text-yellow-600 bg-yellow-100' :
                        swap.status === 'accepted' ? 'text-green-600 bg-green-100' :
                        swap.status === 'completed' ? 'text-blue-600 bg-blue-100' :
                        'text-red-600 bg-red-100'
                      }`}>
                        {swap.status}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600">
                      <span className="font-medium">{swap.skillOffered}</span> ↔ <span className="font-medium">{swap.skillWanted}</span>
                    </div>
                    <div className="text-xs text-gray-500 mt-2">
                      Created: {swap.createdAt.toLocaleDateString()}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Messages Tab */}
        {activeTab === 'messages' && (
          <div className="p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Broadcast Messages</h2>

            {/* Send Message Form */}
            <div className="bg-gray-50 rounded-lg p-6 mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Send New Message</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
                  <input
                    type="text"
                    value={messageForm.title}
                    onChange={(e) => setMessageForm(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Message title"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
                  <select
                    value={messageForm.type}
                    onChange={(e) => setMessageForm(prev => ({ ...prev, type: e.target.value as any }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="info">Info</option>
                    <option value="warning">Warning</option>
                    <option value="announcement">Announcement</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Message</label>
                  <textarea
                    value={messageForm.message}
                    onChange={(e) => setMessageForm(prev => ({ ...prev, message: e.target.value }))}
                    rows={4}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                    placeholder="Your message to all users"
                  />
                </div>
                <button
                  onClick={handleSendMessage}
                  disabled={!messageForm.title || !messageForm.message}
                  className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send className="w-4 h-4" />
                  <span>Send Message</span>
                </button>
              </div>
            </div>

            {/* Recent Messages */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Recent Messages</h3>
              {adminMessages.map((msg) => (
                <div key={msg.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold text-gray-900">{msg.title}</h4>
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        msg.type === 'info' ? 'text-blue-600 bg-blue-100' :
                        msg.type === 'warning' ? 'text-yellow-600 bg-yellow-100' :
                        'text-green-600 bg-green-100'
                      }`}>
                        {msg.type}
                      </span>
                      <span className="text-xs text-gray-500">
                        {msg.createdAt.toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <p className="text-gray-600">{msg.message}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Statistics Tab */}
        {activeTab === 'stats' && (
          <div className="p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Platform Statistics</h2>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="bg-blue-50 rounded-lg p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <Users className="w-8 h-8 text-blue-600" />
                  <h3 className="text-lg font-semibold text-gray-900">User Stats</h3>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Users:</span>
                    <span className="font-semibold">{stats.totalUsers}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Active Users:</span>
                    <span className="font-semibold text-green-600">{stats.activeUsers}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Banned Users:</span>
                    <span className="font-semibold text-red-600">{stats.bannedUsers}</span>
                  </div>
                </div>
              </div>

              <div className="bg-green-50 rounded-lg p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <MessageSquare className="w-8 h-8 text-green-600" />
                  <h3 className="text-lg font-semibold text-gray-900">Swap Stats</h3>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Swaps:</span>
                    <span className="font-semibold">{stats.totalSwaps}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Pending:</span>
                    <span className="font-semibold text-yellow-600">{stats.pendingSwaps}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Completed:</span>
                    <span className="font-semibold text-blue-600">{stats.completedSwaps}</span>
                  </div>
                </div>
              </div>

              <div className="bg-purple-50 rounded-lg p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <BarChart3 className="w-8 h-8 text-purple-600" />
                  <h3 className="text-lg font-semibold text-gray-900">Engagement</h3>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Success Rate:</span>
                    <span className="font-semibold text-green-600">
                      {stats.totalSwaps > 0 ? Math.round((stats.completedSwaps / stats.totalSwaps) * 100) : 0}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Avg. Rating:</span>
                    <span className="font-semibold">4.7</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Active Messages:</span>
                    <span className="font-semibold">{adminMessages.filter(m => m.isActive).length}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPanel;