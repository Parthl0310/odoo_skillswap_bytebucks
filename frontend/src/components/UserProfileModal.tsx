import React, { useState, useEffect } from 'react';
import { 
  X, 
  MapPin, 
  Clock, 
  Calendar, 
  Star, 
  ShieldCheck, 
  ArrowRightLeft,
  CheckCircle,
  MessageSquare
} from 'lucide-react';
import { User, SwapRequest } from '../types';
import { apiService } from '../services/api';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  onProposeSwap: (user: User) => void;
}

interface UserReview {
  id: string;
  reviewerName: string;
  reviewerPhoto?: string;
  rating: number;
  comment?: string;
  skillOffered?: string;
  skillWanted?: string;
  createdAt: string;
}

const UserProfileModal: React.FC<UserProfileModalProps> = ({
  isOpen,
  onClose,
  user,
  onProposeSwap,
}) => {
  const [reviews, setReviews] = useState<UserReview[]>([]);
  const [isLoadingReviews, setIsLoadingReviews] = useState(false);

  useEffect(() => {
    if (!isOpen || !user) return;

    const fetchUserReviews = async () => {
      try {
        setIsLoadingReviews(true);
        const data = await apiService.getFeedbackForUser(user.id);
        setReviews(data || []);
      } catch (err) {
        console.error('Failed to load user reviews:', err);
        setReviews([]);
      } finally {
        setIsLoadingReviews(false);
      }
    };

    fetchUserReviews();
  }, [isOpen, user]);

  if (!isOpen || !user) return null;

  const getPhotoUrl = (photoPath?: string | null) => {
    if (!photoPath) return null;
    if (photoPath.startsWith('http')) return photoPath;
    const baseUrl = (import.meta.env.VITE_API_URL || 'http://localhost:5000').replace(/\/api\/?$/, '');
    return `${baseUrl}${photoPath.startsWith('/') ? '' : '/'}${photoPath}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-2xl max-h-[90vh] bg-white border border-slate-200 rounded-2xl p-6 sm:p-7 text-slate-800 shadow-2xl flex flex-col overflow-hidden">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-6 right-6 p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Scrollable Content */}
        <div className="overflow-y-auto space-y-5 pr-1">
          {/* Header Profile Info */}
          <div className="flex flex-col sm:flex-row items-center sm:items-start space-y-4 sm:space-y-0 sm:space-x-5 pb-5 border-b border-slate-200">
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden ring-1 ring-slate-200 border border-slate-100 flex-shrink-0">
              {getPhotoUrl(user.photo) ? (
                <img src={getPhotoUrl(user.photo)!} alt={user.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-slate-100 flex items-center justify-center text-2xl font-bold text-slate-700">
                  {user.name.charAt(0)}
                </div>
              )}
            </div>

            <div className="text-center sm:text-left space-y-1.5 flex-1">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <h2 className="text-2xl font-bold text-slate-900 tracking-tight">{user.name}</h2>
                {user.isAdmin && (
                  <span className="flex items-center space-x-1 text-xs text-purple-700 border border-purple-200 bg-purple-50 px-2 py-0.5 rounded-full font-medium">
                    <ShieldCheck className="w-3 h-3" />
                    <span>Admin</span>
                  </span>
                )}
              </div>

              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 text-xs text-slate-500">
                {user.location && (
                  <span className="flex items-center space-x-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    <span>{user.location}</span>
                  </span>
                )}
                <span className="flex items-center space-x-1">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span className="capitalize">{user.availability} availability</span>
                </span>
                <span className="flex items-center space-x-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span>Joined {new Date(user.joinedAt).toLocaleDateString()}</span>
                </span>
              </div>

              {/* Rating summary */}
              <div className="flex items-center justify-center sm:justify-start space-x-2 pt-0.5">
                <div className="flex items-center text-amber-500">
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
                  <span className="font-semibold text-xs ml-1 text-slate-800">{user.rating ? user.rating.toFixed(1) : '5.0'}</span>
                </div>
                <span className="text-xs text-slate-400">({user.reviewCount || 0} reviews)</span>
              </div>
            </div>
          </div>

          {/* Skills Breakdown */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/60">
              <h4 className="text-xs font-semibold text-emerald-700 mb-2.5 uppercase tracking-wider">Skills Offered</h4>
              <div className="flex flex-wrap gap-1.5">
                {user.skillsOffered.length === 0 ? (
                  <span className="text-xs text-slate-400 italic">None listed</span>
                ) : (
                  user.skillsOffered.map(s => (
                    <span key={s} className="bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-md px-2.5 py-0.5 text-xs font-medium">
                      {s}
                    </span>
                  ))
                )}
              </div>
            </div>

            <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/60">
              <h4 className="text-xs font-semibold text-indigo-700 mb-2.5 uppercase tracking-wider">Skills Wanted</h4>
              <div className="flex flex-wrap gap-1.5">
                {user.skillsWanted.length === 0 ? (
                  <span className="text-xs text-slate-400 italic">None listed</span>
                ) : (
                  user.skillsWanted.map(s => (
                    <span key={s} className="bg-indigo-50 border border-indigo-200 text-indigo-700 rounded-md px-2.5 py-0.5 text-xs font-medium">
                      {s}
                    </span>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Past Reviews & Feedback */}
          <div>
            <h4 className="text-sm font-bold text-slate-900 mb-2.5">Community Reviews & Ratings</h4>
            {isLoadingReviews ? (
              <div className="py-6 text-center text-slate-400 text-xs">Loading reviews...</div>
            ) : reviews.length === 0 ? (
              <div className="border border-slate-200 bg-slate-50/60 rounded-xl p-6 text-center text-xs text-slate-500">
                No reviews recorded for completed swaps yet.
              </div>
            ) : (
              <div className="space-y-2.5">
                {reviews.map(r => (
                  <div key={r.id} className="border border-slate-200 rounded-xl p-3 bg-white text-xs space-y-1 shadow-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-900">{r.reviewerName}</span>
                      <div className="flex items-center text-amber-500">
                        {Array.from({ length: r.rating }).map((_, i) => (
                          <Star key={i} className="w-3 h-3 fill-amber-400 text-amber-500" />
                        ))}
                      </div>
                    </div>
                    {r.comment && <p className="text-slate-600 italic">"{r.comment}"</p>}
                    <div className="text-[10px] text-slate-400">
                      Exchanged: {r.skillOffered} for {r.skillWanted}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer Action */}
        <div className="pt-4 border-t border-slate-200 flex justify-end space-x-2.5">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-slate-300 text-slate-700 rounded-xl text-xs font-medium hover:bg-slate-100 hover:text-slate-900 transition-colors"
          >
            Close
          </button>
          <button
            onClick={() => {
              onClose();
              onProposeSwap(user);
            }}
            className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl text-xs transition-colors flex items-center space-x-1.5 shadow-xs"
          >
            <ArrowRightLeft className="w-3.5 h-3.5" />
            <span>Propose Skill Swap</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserProfileModal;
