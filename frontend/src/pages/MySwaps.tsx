import React, { useState, useMemo } from 'react';
import { Users, Clock, CheckCircle, XCircle, Star } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import SwapRequestCard from '../components/Swaps/SwapRequestCard';
import FeedbackModal from '../components/Modals/FeedbackModal';
import { SwapRequest } from '../types';

const MySwaps: React.FC = () => {
  const { user } = useAuth();
  const { swapRequests, users, updateSwapRequest, addFeedback } = useData();
  const [activeTab, setActiveTab] = useState<'pending' | 'active' | 'completed' | 'all'>('all');
  const [selectedSwapRequest, setSelectedSwapRequest] = useState<SwapRequest | null>(null);
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);

  const userSwapRequests = useMemo(() => {
    if (!user) return [];
    return swapRequests.filter(req => req.fromUserId === user.id || req.toUserId === user.id);
  }, [swapRequests, user]);

  const filteredSwaps = useMemo(() => {
    if (activeTab === 'all') return userSwapRequests;
    if (activeTab === 'pending') return userSwapRequests.filter(req => req.status === 'pending');
    if (activeTab === 'active') return userSwapRequests.filter(req => req.status === 'accepted');
    if (activeTab === 'completed') return userSwapRequests.filter(req => req.status === 'completed');
    return [];
  }, [userSwapRequests, activeTab]);

  const tabs = [
    { id: 'all', label: 'All Swaps', count: userSwapRequests.length, icon: Users },
    { 
      id: 'pending', 
      label: 'Pending', 
      count: userSwapRequests.filter(req => req.status === 'pending').length,
      icon: Clock 
    },
    { 
      id: 'active', 
      label: 'Active', 
      count: userSwapRequests.filter(req => req.status === 'accepted').length,
      icon: CheckCircle 
    },
    { 
      id: 'completed', 
      label: 'Completed', 
      count: userSwapRequests.filter(req => req.status === 'completed').length,
      icon: Star 
    },
  ];

  const handleAcceptSwap = (swapId: string) => {
    updateSwapRequest(swapId, { status: 'accepted' });
  };

  const handleRejectSwap = (swapId: string) => {
    updateSwapRequest(swapId, { status: 'rejected' });
  };

  const handleCompleteSwap = (swapId: string) => {
    updateSwapRequest(swapId, { status: 'completed' });
  };

  const handleOpenFeedback = (swapRequest: SwapRequest) => {
    setSelectedSwapRequest(swapRequest);
    setIsFeedbackModalOpen(true);
  };

  const handleSubmitFeedback = (rating: number, comment: string) => {
    if (!selectedSwapRequest || !user) return;

    const otherUserId = selectedSwapRequest.fromUserId === user.id 
      ? selectedSwapRequest.toUserId 
      : selectedSwapRequest.fromUserId;

    addFeedback({
      swapRequestId: selectedSwapRequest.id,
      fromUserId: user.id,
      toUserId: otherUserId,
      rating,
      comment,
    });
  };

  if (!user) return null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">My Swaps</h1>
        <p className="text-gray-600">
          Manage your skill exchange requests and track your learning progress
        </p>
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
                {tab.count > 0 && (
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    isActive ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Swap Requests */}
      {filteredSwaps.length > 0 ? (
        <div className="space-y-6">
          {filteredSwaps.map((swapRequest) => {
            const otherUserId = swapRequest.fromUserId === user.id 
              ? swapRequest.toUserId 
              : swapRequest.fromUserId;
            const otherUser = users.find(u => u.id === otherUserId);

            if (!otherUser) return null;

            return (
              <SwapRequestCard
                key={swapRequest.id}
                swapRequest={swapRequest}
                otherUser={otherUser}
                currentUserId={user.id}
                onAccept={() => handleAcceptSwap(swapRequest.id)}
                onReject={() => handleRejectSwap(swapRequest.id)}
                onComplete={() => handleCompleteSwap(swapRequest.id)}
                onFeedback={() => handleOpenFeedback(swapRequest)}
              />
            );
          })}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            {activeTab === 'pending' && <Clock className="w-8 h-8 text-gray-400" />}
            {activeTab === 'active' && <CheckCircle className="w-8 h-8 text-gray-400" />}
            {activeTab === 'completed' && <Star className="w-8 h-8 text-gray-400" />}
            {activeTab === 'all' && <Users className="w-8 h-8 text-gray-400" />}
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            No {activeTab === 'all' ? '' : activeTab} swaps found
          </h3>
          <p className="text-gray-600 mb-6">
            {activeTab === 'pending' && "You don't have any pending swap requests."}
            {activeTab === 'active' && "You don't have any active swaps."}
            {activeTab === 'completed' && "You haven't completed any swaps yet."}
            {activeTab === 'all' && "You haven't created or received any swap requests yet."}
          </p>
          <a
            href="/browse"
            className="inline-flex items-center space-x-2 bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            <Users className="w-5 h-5" />
            <span>Browse Skills</span>
          </a>
        </div>
      )}

      {/* Feedback Modal */}
      {selectedSwapRequest && (
        <FeedbackModal
          isOpen={isFeedbackModalOpen}
          onClose={() => setIsFeedbackModalOpen(false)}
          swapRequest={selectedSwapRequest}
          otherUser={users.find(u => 
            u.id === (selectedSwapRequest.fromUserId === user.id 
              ? selectedSwapRequest.toUserId 
              : selectedSwapRequest.fromUserId)
          )!}
          onSubmit={handleSubmitFeedback}
        />
      )}
    </div>
  );
};

export default MySwaps;