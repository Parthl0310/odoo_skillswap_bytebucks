import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Search, 
  Users, 
  MessageSquare, 
  TrendingUp,
  Calendar,
  Star,
  ArrowRight,
  Bell,
  Clock
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const { swapRequests, users, notifications } = useData();

  if (!user) return null;

  const userSwapRequests = swapRequests.filter(
    req => req.fromUserId === user.id || req.toUserId === user.id
  );
  
  const pendingRequests = userSwapRequests.filter(req => req.status === 'pending');
  const activeSwaps = userSwapRequests.filter(req => req.status === 'accepted');
  const completedSwaps = userSwapRequests.filter(req => req.status === 'completed');
  const unreadNotifications = notifications.filter(n => n.userId === user.id && !n.isRead);

  const stats = [
    {
      label: 'Pending Requests',
      value: pendingRequests.length,
      icon: Clock,
      color: 'text-yellow-600 bg-yellow-100',
      href: '/swaps?tab=pending',
    },
    {
      label: 'Active Swaps',
      value: activeSwaps.length,
      icon: Users,
      color: 'text-green-600 bg-green-100',
      href: '/swaps?tab=active',
    },
    {
      label: 'Completed Swaps',
      value: completedSwaps.length,
      icon: Star,
      color: 'text-blue-600 bg-blue-100',
      href: '/swaps?tab=completed',
    },
    {
      label: 'Notifications',
      value: unreadNotifications.length,
      icon: Bell,
      color: 'text-purple-600 bg-purple-100',
      href: '/notifications',
    },
  ];

  const quickActions = [
    {
      title: 'Browse Skills',
      description: 'Discover new skills and find people to learn from',
      icon: Search,
      href: '/browse',
      color: 'bg-blue-600 hover:bg-blue-700',
    },
    {
      title: 'Update Profile',
      description: 'Add new skills or update your availability',
      icon: Users,
      href: '/profile',
      color: 'bg-green-600 hover:bg-green-700',
    },
    {
      title: 'View Messages',
      description: 'Check your latest conversations and updates',
      icon: MessageSquare,
      href: '/messages',
      color: 'bg-purple-600 hover:bg-purple-700',
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Welcome Section */}
      <div className="mb-8">
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 text-white">
          <div className="flex items-center space-x-4">
            {user.photo ? (
              <img
                src={user.photo}
                alt={user.name}
                className="w-16 h-16 rounded-full object-cover border-4 border-white/20"
              />
            ) : (
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
                <span className="text-2xl font-bold">{user.name.charAt(0)}</span>
              </div>
            )}
            <div>
              <h1 className="text-2xl font-bold mb-1">Welcome back, {user.name}!</h1>
              <p className="text-blue-100">
                Ready to learn something new or share your expertise?
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Link
              key={stat.label}
              to={stat.href}
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center space-x-3">
                <div className={`p-2 rounded-lg ${stat.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
                  <div className="text-sm text-gray-600">{stat.label}</div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Quick Actions */}
        <div className="lg:col-span-2">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Quick Actions</h2>
          <div className="grid md:grid-cols-3 gap-4">
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <Link
                  key={action.title}
                  to={action.href}
                  className={`${action.color} text-white p-6 rounded-xl transition-colors group`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <Icon className="w-6 h-6" />
                    <ArrowRight className="w-5 h-5 opacity-50 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                  </div>
                  <h3 className="font-semibold mb-2">{action.title}</h3>
                  <p className="text-sm opacity-90">{action.description}</p>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Recent Activity */}
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-6">Recent Activity</h2>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            {userSwapRequests.length === 0 ? (
              <div className="text-center py-8">
                <TrendingUp className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 mb-4">No activity yet</p>
                <Link
                  to="/browse"
                  className="inline-flex items-center space-x-2 text-blue-600 hover:text-blue-700 font-medium"
                >
                  <Search className="w-4 h-4" />
                  <span>Browse Skills</span>
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {userSwapRequests.slice(0, 5).map((request) => {
                  const otherUser = users.find(u => 
                    u.id === (request.fromUserId === user.id ? request.toUserId : request.fromUserId)
                  );
                  const isIncoming = request.toUserId === user.id;

                  return (
                    <div key={request.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                      {otherUser?.photo ? (
                        <img
                          src={otherUser.photo}
                          alt={otherUser.name}
                          className="w-8 h-8 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                          <span className="text-xs font-medium">
                            {otherUser?.name.charAt(0)}
                          </span>
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {isIncoming ? `${otherUser?.name} wants to swap` : `You requested swap with ${otherUser?.name}`}
                        </p>
                        <p className="text-xs text-gray-600">
                          {request.skillOffered} ↔ {request.skillWanted}
                        </p>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        request.status === 'pending' ? 'text-yellow-600 bg-yellow-100' :
                        request.status === 'accepted' ? 'text-green-600 bg-green-100' :
                        request.status === 'completed' ? 'text-blue-600 bg-blue-100' :
                        'text-red-600 bg-red-100'
                      }`}>
                        {request.status}
                      </span>
                    </div>
                  );
                })}
                
                {userSwapRequests.length > 5 && (
                  <Link
                    to="/swaps"
                    className="block text-center text-blue-600 hover:text-blue-700 font-medium text-sm mt-4"
                  >
                    View all activity
                  </Link>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;