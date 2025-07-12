import React, { useState } from 'react';
import { Wifi, WifiOff } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';

const SwapRequests: React.FC = () => {
  const { user } = useAuth();
  const { swapRequests, users, acceptSwapRequest, rejectSwapRequest, isRealtimeConnected, isLoading } = useData();
  const [processingRequest, setProcessingRequest] = useState<string | null>(null);

  if (!user) return null;

  const userSwapRequests = swapRequests.filter(
    req => req.fromUserId === user.id || req.toUserId === user.id
  ).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const handleAccept = async (requestId: string) => {
    try {
      setProcessingRequest(requestId);
      await acceptSwapRequest(requestId);
    } catch (error) {
      console.error('Error accepting swap request:', error);
      alert('Failed to accept swap request. Please try again.');
    } finally {
      setProcessingRequest(null);
    }
  };

  const handleReject = async (requestId: string) => {
    try {
      setProcessingRequest(requestId);
      await rejectSwapRequest(requestId);
    } catch (error) {
      console.error('Error rejecting swap request:', error);
      alert('Failed to reject swap request. Please try again.');
    } finally {
      setProcessingRequest(null);
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
      <div className="max-w-4xl mx-auto">
        {/* Real-time Connection Status */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-4xl font-light">Swap Requests</h1>
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

        {userSwapRequests.length === 0 ? (
          <div className="text-center text-gray-400 text-xl">
            No swap requests found
          </div>
        ) : (
          <div className="space-y-8">
            {userSwapRequests.map((request) => {
              const otherUser = users.find(u => 
                u.id === (request.fromUserId === user.id ? request.toUserId : request.fromUserId)
              );
              const isIncoming = request.toUserId === user.id;
              const isProcessing = processingRequest === request.id;

              if (!otherUser) return null;

              return (
                <div key={request.id} className="border-2 border-white rounded-3xl p-8">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-8">
                      {/* Profile Photo */}
                      <div className="w-24 h-24 border-2 border-white rounded-full overflow-hidden">
                        {otherUser.photo ? (
                          <img src={otherUser.photo} alt={otherUser.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full bg-gray-600 flex items-center justify-center text-sm">
                            Profile Photo
                          </div>
                        )}
                      </div>

                      {/* Request Info */}
                      <div className="space-y-4">
                        <div className="flex items-center space-x-4">
                          <h3 className="text-2xl font-light">{otherUser.name}</h3>
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(request.status)}`}>
                            {request.status.toUpperCase()}
                          </span>
                        </div>
                        
                        <div className="space-y-2">
                          <div className="text-lg">
                            <span className="text-green-400">Skills Offered:</span> {request.skillOffered}
                          </div>
                          <div className="text-lg">
                            <span className="text-blue-400">Skills wanted:</span> {request.skillWanted}
                          </div>
                        </div>

                        {request.message && (
                          <div className="text-gray-300 max-w-md">
                            <span className="text-white">Message:</span> {request.message}
                          </div>
                        )}

                        <div className="text-sm text-gray-400">
                          {isIncoming ? 'Incoming request' : 'Outgoing request'} • {new Date(request.createdAt).toLocaleDateString()}
                          {request.updatedAt && request.updatedAt !== request.createdAt && (
                            <span> • Updated {new Date(request.updatedAt).toLocaleDateString()}</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="text-right space-y-4">
                      {isIncoming && request.status === 'pending' && (
                        <div className="space-y-2">
                          <button
                            onClick={() => handleAccept(request.id)}
                            disabled={isProcessing || isLoading}
                            className="block w-full bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {isProcessing ? 'Accepting...' : 'Accept'}
                          </button>
                          <button
                            onClick={() => handleReject(request.id)}
                            disabled={isProcessing || isLoading}
                            className="block w-full bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {isProcessing ? 'Rejecting...' : 'Reject'}
                          </button>
                        </div>
                      )}

                      {request.status === 'accepted' && (
                        <div className="text-center">
                          <div className="text-2xl font-light mb-4">Rating and Feedback</div>
                          <button className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                            Leave Feedback
                          </button>
                        </div>
                      )}

                      {request.status === 'completed' && (
                        <div className="text-center">
                          <div className="text-2xl font-light mb-4 text-green-400">Completed</div>
                          {request.completedAt && (
                            <div className="text-sm text-gray-400">
                              {new Date(request.completedAt).toLocaleDateString()}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default SwapRequests;