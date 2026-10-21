import React, { useState } from 'react';
import { Star, X, Sparkles } from 'lucide-react';
import { SwapRequest, User } from '../types';

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  swapRequest: SwapRequest;
  otherUser: User;
  onSubmit: (rating: number, comment?: string) => Promise<void> | void;
}

const FeedbackModal: React.FC<FeedbackModalProps> = ({
  isOpen,
  onClose,
  swapRequest,
  otherUser,
  onSubmit,
}) => {
  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating < 1 || rating > 5) return;

    try {
      setIsSubmitting(true);
      await onSubmit(rating, comment.trim() || undefined);
      onClose();
    } catch (error) {
      console.error('Failed to submit feedback:', error);
      alert('Failed to submit feedback. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-lg bg-white border border-slate-200 rounded-2xl p-6 sm:p-7 text-slate-800 shadow-2xl overflow-hidden">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-6 right-6 p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
          disabled={isSubmitting}
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center space-x-2 text-indigo-600 text-xs font-semibold uppercase tracking-wider mb-1">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Exchange Review</span>
        </div>

        <h2 className="text-xl font-bold tracking-tight text-slate-900 mb-1">Leave Feedback</h2>
        <p className="text-xs text-slate-500 mb-5">
          How was your skill swap experience with <span className="text-slate-900 font-semibold">{otherUser?.name || 'Swap Partner'}</span>?
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Skill Swap Info Badge */}
          <div className="flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs">
            <div>
              <span className="text-slate-500">Taught: </span>
              <span className="text-emerald-700 font-medium">{swapRequest.skillOffered}</span>
            </div>
            <span className="text-slate-400">↔</span>
            <div>
              <span className="text-slate-500">Learned: </span>
              <span className="text-indigo-700 font-medium">{swapRequest.skillWanted}</span>
            </div>
          </div>

          {/* Star Rating */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
            <label className="block text-xs uppercase tracking-wider text-slate-600 mb-2 font-semibold">Rating Score</label>
            <div className="flex items-center space-x-2.5">
              {[1, 2, 3, 4, 5].map((star) => {
                const isFilled = (hoverRating !== null ? hoverRating : rating) >= star;
                return (
                  <button
                    key={star}
                    type="button"
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(null)}
                    onClick={() => setRating(star)}
                    className="p-1 focus:outline-none transition-transform hover:scale-110 active:scale-95"
                  >
                    <Star
                      className={`w-7 h-7 ${
                        isFilled ? 'text-amber-400 fill-amber-400' : 'text-slate-300'
                      } transition-colors`}
                    />
                  </button>
                );
              })}
              <span className="text-sm font-semibold text-amber-500 ml-2">
                {hoverRating || rating} / 5
              </span>
            </div>
          </div>

          {/* Comment Field */}
          <div>
            <label className="block text-xs uppercase tracking-wider text-slate-600 mb-2 font-semibold">Your Review (Optional)</label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              maxLength={200}
              rows={3}
              placeholder="Highlight their teaching style, punctuality, and what you accomplished..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-100 text-xs transition-all resize-none"
            />
            <div className="text-right text-[11px] text-slate-400 mt-1">
              {comment.length}/200
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-2.5 pt-1">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 border border-slate-300 text-slate-700 rounded-xl text-xs font-medium hover:bg-slate-100 hover:text-slate-900 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl text-xs shadow-xs transition-colors disabled:opacity-50"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default FeedbackModal;
