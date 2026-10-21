import React, { useState } from 'react';
import { 
  ArrowRightLeft, 
  CheckCircle2, 
  XCircle, 
  Trash2, 
  MessageSquare, 
  Clock, 
  Star, 
  Sparkles,
  ChevronRight,
  Filter
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { SwapRequest, User } from '../types';
import FeedbackModal from '../components/FeedbackModal';
import ChatModal from '../components/ChatModal';

const SwapRequests: React.FC = () => {
  const { user } = useAuth();
  const { 
    swapRequests, 
    users, 
    acceptSwapRequest, 
    rejectSwapRequest, 
    deleteSwapRequest, 
    completeSwapRequest, 
    submitFeedback, 
    isLoading 
  } = useData();

  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'accepted' | 'completed'>('all');
  const [processingRequest, setProcessingRequest] = useState<string | null>(null);
  const [feedbackSwap, setFeedbackSwap] = useState<SwapRequest | null>(null);
  const [chatSwap, setChatSwap] = useState<SwapRequest | null>(null);

  if (!user) return null;

  const getPhotoUrl = (photoPath?: string | null) => {
    if (!photoPath) return null;
    if (photoPath.startsWith('http')) return photoPath;
    const baseUrl = (import.meta.env.VITE_API_URL || 'http://localhost:5000').replace(/\/api\/?$/, '');
    return `${baseUrl}${photoPath.startsWith('/') ? '' : '/'}${photoPath}`;
  };

  const currentUserId = user.id;

  // Filter requests involving current user
  const userSwapRequests = swapRequests.filter(request => {
    const fromId = typeof request.fromUserId === 'object' && request.fromUserId ? ((request.fromUserId as any)._id || (request.fromUserId as any).id) : request.fromUserId;
    const toId = typeof request.toUserId === 'object' && request.toUserId ? ((request.toUserId as any)._id || (request.toUserId as any).id) : request.toUserId;
    return String(fromId) === String(currentUserId) || String(toId) === String(currentUserId);
  });

  // Filter based on active tab
  const filteredRequests = userSwapRequests.filter(request => {
    switch (activeTab) {
      case 'pending':
        return request.status === 'pending';
      case 'accepted':
        return request.status === 'accepted';
      case 'completed':
        return request.status === 'completed' || request.status === 'cancelled' || request.status === 'rejected';
      case 'all':
      default:
        return true;
    }
  });

  const getPartnerUser = (request: SwapRequest): Partial<User> => {
    const fromId = typeof request.fromUserId === 'object' && request.fromUserId ? ((request.fromUserId as any)._id || (request.fromUserId as any).id) : request.fromUserId;
    const toId = typeof request.toUserId === 'object' && request.toUserId ? ((request.toUserId as any)._id || (request.toUserId as any).id) : request.toUserId;
    const isIncoming = String(toId) === String(currentUserId);
    const partnerId = isIncoming ? fromId : toId;

    if (typeof (isIncoming ? request.fromUserId : request.toUserId) === 'object') {
      const obj = (isIncoming ? request.fromUserId : request.toUserId) as any;
      if (obj && obj.name) return obj;
    }

    const found = users.find(u => String(u.id) === String(partnerId));
    return found || { name: 'Exchange Partner', email: '', skillsOffered: [], skillsWanted: [] };
  };

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

  const handleComplete = async (requestId: string) => {
    try {
      setProcessingRequest(requestId);
      await completeSwapRequest(requestId);
    } catch (error) {
      console.error('Error completing swap:', error);
      alert('Failed to mark swap as complete.');
    } finally {
      setProcessingRequest(null);
    }
  };

  const handleDelete = async (requestId: string) => {
    if (!window.confirm('Are you sure you want to cancel this pending swap request?')) return;
    try {
      setProcessingRequest(requestId);
      await deleteSwapRequest(requestId);
    } catch (error) {
      console.error('Error deleting swap request:', error);
      alert('Failed to cancel swap request. Please try again.');
    } finally {
      setProcessingRequest(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <span className="bg-amber-50 text-amber-700 border border-amber-200 px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wide uppercase">Pending</span>;
      case 'accepted':
        return <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wide uppercase">Active</span>;
      case 'completed':
        return <span className="bg-blue-50 text-blue-700 border border-blue-200 px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wide uppercase">Completed</span>;
      case 'rejected':
        return <span className="bg-rose-50 text-rose-700 border border-rose-200 px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wide uppercase">Rejected</span>;
      case 'cancelled':
        return <span className="bg-slate-100 text-slate-600 border border-slate-200 px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wide uppercase">Cancelled</span>;
      default:
        return <span className="text-slate-800 text-xs font-semibold">{status}</span>;
    }
  };

  const tabs = [
    { id: 'all', label: 'All Swaps', count: userSwapRequests.length },
    { id: 'pending', label: 'Pending Response', count: userSwapRequests.filter(r => r.status === 'pending').length },
    { id: 'accepted', label: 'Active Sessions', count: userSwapRequests.filter(r => r.status === 'accepted').length },
    { id: 'completed', label: 'Completed / Past', count: userSwapRequests.filter(r => r.status === 'completed' || r.status === 'cancelled' || r.status === 'rejected').length },
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
          <div>
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-semibold mb-2">
              <ArrowRightLeft className="w-3.5 h-3.5 text-indigo-600" />
              <span>Exchange Management</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">Swap Requests</h1>
            <p className="text-slate-600 text-xs sm:text-sm mt-1">Manage incoming proposals, active collaborations, and feedback history</p>
          </div>
        </div>

        {/* Tab Filters Pill Bar */}
        <div className="flex bg-white border border-slate-200 p-1.5 rounded-2xl overflow-x-auto gap-1.5 shadow-xs">
          {tabs.map(tab => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-2 px-3.5 rounded-xl text-xs font-medium transition-all flex items-center space-x-2 whitespace-nowrap ${
                  isActive
                    ? 'bg-indigo-50 text-indigo-700 border border-indigo-200 shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <span>{tab.label}</span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                  isActive ? 'bg-indigo-100 text-indigo-800' : 'bg-slate-100 text-slate-500'
                }`}>
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Requests List */}
        {filteredRequests.length === 0 ? (
          <div className="border border-slate-200 bg-white rounded-2xl p-16 text-center text-slate-500 space-y-3 shadow-xs">
            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
              <ArrowRightLeft className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-800">No swap requests in this view</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Browse the skills directory to discover members offering skills you want and send them an exchange proposal!
            </p>
          </div>
        ) : (
          <div className="space-y-3.5">
            {filteredRequests.map((request) => {
              const toId = typeof request.toUserId === 'object' && request.toUserId ? ((request.toUserId as any)._id || (request.toUserId as any).id) : request.toUserId;
              const isIncoming = String(toId) === String(currentUserId);
              const otherUser = getPartnerUser(request);
              const isProcessing = processingRequest === request.id;
              const hasGivenFeedback = isIncoming
                ? request.feedback?.toUserRating !== undefined && request.feedback?.toUserRating !== null
                : request.feedback?.fromUserRating !== undefined && request.feedback?.fromUserRating !== null;

              return (
                <div 
                  key={request.id} 
                  className="bg-white hover:bg-slate-50/70 border border-slate-200 hover:border-slate-300 rounded-2xl p-5 sm:p-6 transition-all duration-150 shadow-xs hover:shadow-sm"
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
                    
                    {/* Member & Swap Info */}
                    <div className="flex items-start sm:items-center space-x-4 min-w-0">
                      {/* Avatar */}
                      <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full overflow-hidden ring-2 ring-slate-100 border border-slate-200 flex-shrink-0">
                        {getPhotoUrl(otherUser.photo) ? (
                          <img src={getPhotoUrl(otherUser.photo)!} alt={otherUser.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full bg-slate-200 text-slate-700 flex items-center justify-center text-xl font-bold">
                            {otherUser.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>

                      {/* Swap Details */}
                      <div className="space-y-2 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-lg font-bold text-slate-900 tracking-tight">{otherUser.name}</h3>
                          {getStatusBadge(request.status)}
                          <span className="text-[11px] text-slate-500 font-medium">
                            {isIncoming ? 'Incoming' : 'Sent by you'} • {new Date(request.createdAt).toLocaleDateString()}
                          </span>
                        </div>

                        {/* Skills Chips */}
                        <div className="flex flex-wrap items-center gap-2 text-xs">
                          <div className="flex items-center space-x-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-0.5 rounded-lg font-semibold">
                            <span className="text-[10px] uppercase font-bold text-emerald-800">Offer:</span>
                            <span>{request.skillOffered}</span>
                          </div>
                          <span className="text-slate-400">↔</span>
                          <div className="flex items-center space-x-1.5 bg-indigo-50 text-indigo-700 border border-indigo-200 px-2.5 py-0.5 rounded-lg font-semibold">
                            <span className="text-[10px] uppercase font-bold text-indigo-800">Want:</span>
                            <span>{request.skillWanted}</span>
                          </div>
                        </div>

                        {request.message && (
                          <p className="text-xs text-slate-600 italic max-w-lg bg-slate-50 p-2.5 rounded-xl border border-slate-200 leading-relaxed">
                            "{request.message}"
                          </p>
                        )}

                        {/* Existing Feedback Display */}
                        {request.feedback && (request.feedback.fromUserRating || request.feedback.toUserRating) && (
                          <div className="flex items-center space-x-1.5 text-xs text-amber-800 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-lg w-fit font-medium">
                            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
                            <span>
                              Partner Rating: {isIncoming ? request.feedback.fromUserRating : request.feedback.toUserRating || 'Pending'}
                            </span>
                            {hasGivenFeedback && <span className="text-slate-400">• Feedback submitted</span>}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Action Controls */}
                    <div className="flex flex-col sm:flex-row lg:flex-col gap-2 min-w-[180px] justify-center flex-shrink-0">
                      
                      {/* Incoming Pending Request Actions */}
                      {isIncoming && request.status === 'pending' && (
                        <>
                          <button
                            onClick={() => handleAccept(request.id)}
                            disabled={isProcessing || isLoading}
                            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-4 py-2 rounded-xl transition-colors text-xs disabled:opacity-50 shadow-xs"
                          >
                            {isProcessing ? 'Accepting...' : 'Accept Swap'}
                          </button>
                          <button
                            onClick={() => handleReject(request.id)}
                            disabled={isProcessing || isLoading}
                            className="w-full border border-rose-300 text-rose-600 hover:bg-rose-50 px-4 py-2 rounded-xl transition-colors disabled:opacity-50 text-xs font-semibold"
                          >
                            {isProcessing ? 'Rejecting...' : 'Reject'}
                          </button>
                        </>
                      )}

                      {/* Outgoing Pending Request - Cancel/Delete */}
                      {!isIncoming && request.status === 'pending' && (
                        <button
                          onClick={() => handleDelete(request.id)}
                          disabled={isProcessing || isLoading}
                          className="w-full border border-rose-300 text-rose-600 hover:bg-rose-50 px-4 py-2 rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center space-x-1.5 text-xs font-semibold"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>{isProcessing ? 'Cancelling...' : 'Cancel Request'}</span>
                        </button>
                      )}

                      {/* Accepted Swaps (Ongoing) - Only Here Live Chat Is Shown */}
                      {request.status === 'accepted' && (
                        <>
                          <button
                            onClick={() => handleComplete(request.id)}
                            disabled={isProcessing || isLoading}
                            className="w-full bg-slate-900 hover:bg-slate-800 text-white font-semibold px-4 py-2 rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center space-x-1.5 text-xs shadow-xs"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Mark Completed</span>
                          </button>

                          {/* Live Real-time Chat Trigger - ONLY active for accepted swaps */}
                          <button
                            onClick={() => setChatSwap(request)}
                            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-4 py-2 rounded-xl transition-colors flex items-center justify-center space-x-1.5 text-xs shadow-xs"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                            <span>Live Chat</span>
                          </button>

                          {!hasGivenFeedback && (
                            <button
                              onClick={() => setFeedbackSwap(request)}
                              className="w-full border border-slate-300 text-slate-700 hover:bg-slate-50 px-4 py-1.5 rounded-xl transition-colors text-xs font-semibold shadow-2xs"
                            >
                              Leave Feedback
                            </button>
                          )}
                        </>
                      )}

                      {/* Completed Swaps - Live Chat is NOT shown here */}
                      {request.status === 'completed' && !hasGivenFeedback && (
                        <button
                          onClick={() => setFeedbackSwap(request)}
                          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-4 py-2 rounded-xl transition-colors text-xs shadow-xs"
                        >
                          Leave Feedback
                        </button>
                      )}

                      {request.status === 'completed' && hasGivenFeedback && (
                        <div className="text-center text-xs text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-xl py-2 px-3 font-semibold">
                          ✓ Swap Completed & Rated
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Feedback Modal */}
        {feedbackSwap && (
          <FeedbackModal
            isOpen={!!feedbackSwap}
            onClose={() => setFeedbackSwap(null)}
            swapRequest={feedbackSwap}
            otherUser={getPartnerUser(feedbackSwap)}
            onSubmit={async (rating, comment) => {
              await submitFeedback(feedbackSwap.id, rating, comment);
            }}
          />
        )}

        {/* Real-time Socket.IO Chat Modal */}
        {chatSwap && (
          <ChatModal
            isOpen={!!chatSwap}
            onClose={() => setChatSwap(null)}
            swapRequest={chatSwap}
            currentUser={user}
            partnerUser={getPartnerUser(chatSwap)}
          />
        )}
      </div>
    </div>
  );
};

export default SwapRequests;