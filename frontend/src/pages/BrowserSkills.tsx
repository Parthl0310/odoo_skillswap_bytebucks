import React, { useState, useMemo } from 'react';
import { 
  Search, 
  MapPin, 
  Clock, 
  Sparkles, 
  ArrowRightLeft, 
  Eye, 
  Star, 
  ChevronLeft, 
  ChevronRight,
  ChevronDown,
  X 
} from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import { User } from '../types';
import UserProfileModal from '../components/UserProfileModal';

const ITEMS_PER_PAGE = 8;

const BrowseSkills: React.FC = () => {
  const { user: currentUser } = useAuth();
  const { users, createSwapRequest } = useData();

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [availability, setAvailability] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);

  // Modal State
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [inspectUser, setInspectUser] = useState<User | null>(null);
  const [showSwapModal, setShowSwapModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [swapForm, setSwapForm] = useState({
    skillOffered: '',
    skillWanted: '',
    message: ''
  });

  const getPhotoUrl = (photoPath?: string | null) => {
    if (!photoPath) return null;
    if (photoPath.startsWith('http')) return photoPath;
    const baseUrl = (import.meta.env.VITE_API_URL || 'http://localhost:5000').replace(/\/api\/?$/, '');
    return `${baseUrl}${photoPath.startsWith('/') ? '' : '/'}${photoPath}`;
  };

  // Filter out the logged-in user and any banned users
  const availableUsers = useMemo(() => {
    return users.filter(u => u.id !== currentUser?.id && !u.isBanned);
  }, [users, currentUser]);

  // Reciprocal Matches (Smart Synergy)
  const recommendedMatches = useMemo(() => {
    if (!currentUser) return [];
    return availableUsers.filter(targetUser => {
      const targetOffersWhatIWant = targetUser.skillsOffered.some(skill =>
        currentUser.skillsWanted.some(w => w.toLowerCase() === skill.toLowerCase())
      );
      const targetWantsWhatIOffer = targetUser.skillsWanted.some(skill =>
        currentUser.skillsOffered.some(o => o.toLowerCase() === skill.toLowerCase())
      );
      return targetOffersWhatIWant || targetWantsWhatIOffer;
    });
  }, [availableUsers, currentUser]);

  // Apply Search & Availability Filters
  const filteredUsers = useMemo(() => {
    return availableUsers.filter(targetUser => {
      const matchesSearch = 
        targetUser.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (targetUser.location && targetUser.location.toLowerCase().includes(searchQuery.toLowerCase())) ||
        targetUser.skillsOffered.some(s => s.toLowerCase().includes(searchQuery.toLowerCase())) ||
        targetUser.skillsWanted.some(s => s.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesAvailability = availability === 'all' || targetUser.availability === availability;

      return matchesSearch && matchesAvailability;
    });
  }, [availableUsers, searchQuery, availability]);

  // Pagination Calculations
  const totalPages = Math.ceil(filteredUsers.length / ITEMS_PER_PAGE);
  const paginatedUsers = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredUsers.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredUsers, currentPage]);

  const handleRequest = (targetUser: User) => {
    setSelectedUser(targetUser);
    setSwapForm({
      skillOffered: currentUser?.skillsOffered[0] || '',
      skillWanted: targetUser.skillsOffered[0] || '',
      message: `Hi ${targetUser.name}, I would love to connect and exchange skills with you on SkillSwap!`
    });
    setShowSwapModal(true);
  };

  const handleSubmitSwap = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;

    try {
      setIsSubmitting(true);
      await createSwapRequest({
        toUserId: selectedUser.id,
        skillOffered: swapForm.skillOffered,
        skillWanted: swapForm.skillWanted,
        message: swapForm.message
      });
      setShowSwapModal(false);
      alert(`Swap proposal sent to ${selectedUser.name}!`);
    } catch (err) {
      console.error(err);
      alert('Failed to send swap proposal. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Top Hero Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-slate-200">
          <div>
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-semibold mb-3">
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              <span>Skill Exchange Directory</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900">
              Trade your skills. <br />
              <span className="text-indigo-600">
                Expand your knowledge.
              </span>
            </h1>
            <p className="text-slate-600 text-sm sm:text-base mt-2 max-w-xl leading-relaxed">
              Connect directly with verified community peers to teach what you know and learn what you need — completely free.
            </p>
          </div>
        </div>

        {/* Smart Reciprocal Matching Banner */}
        {recommendedMatches.length > 0 && (
          <div className="border border-indigo-100 bg-white rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center space-x-2 text-indigo-600">
                <Sparkles className="w-4 h-4 text-indigo-600" />
                <h2 className="text-base font-bold text-slate-900 tracking-tight">Reciprocal Skill Synergy</h2>
              </div>
              <span className="text-[11px] font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2.5 py-0.5 rounded-full w-fit">
                Mutual Match
              </span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed max-w-2xl">
              We identified community members whose offered skills align with what you want to learn, and who are interested in what you can teach.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {recommendedMatches.slice(0, 2).map(matchUser => (
                <div key={matchUser.id} className="border border-slate-200 bg-slate-50/60 hover:bg-slate-100/60 rounded-xl p-3.5 flex items-center justify-between transition-colors">
                  <div className="flex items-center space-x-3 min-w-0">
                    <div className="w-10 h-10 rounded-full overflow-hidden ring-1 ring-slate-300 border border-white flex-shrink-0">
                      {getPhotoUrl(matchUser.photo) ? (
                        <img src={getPhotoUrl(matchUser.photo)!} alt={matchUser.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-slate-200 text-slate-700 flex items-center justify-center font-semibold text-xs">
                          {matchUser.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-bold text-sm text-slate-900 truncate">{matchUser.name}</h4>
                      <div className="text-xs text-emerald-700 mt-0.5 truncate font-medium">Teaches: {matchUser.skillsOffered.slice(0, 2).join(', ')}</div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 flex-shrink-0 ml-3">
                    <button
                      onClick={() => setInspectUser(matchUser)}
                      className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-white border border-slate-200 transition-colors"
                      title="View Details"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleRequest(matchUser)}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white px-3.5 py-1.5 rounded-lg text-xs font-semibold shadow-xs transition-colors"
                    >
                      Propose
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Search and Filters Toolbar */}
        <div className="bg-white border border-slate-200 rounded-2xl p-2.5 shadow-xs flex flex-col sm:flex-row items-center gap-2.5">
          {/* Search Input */}
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search by skill, member name, or location..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
            />
          </div>

          {/* Availability Filter Dropdown */}
          <div className="relative w-full sm:w-52">
            <select
              value={availability}
              onChange={(e) => {
                setAvailability(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 pr-9 text-sm text-slate-700 appearance-none focus:bg-white focus:outline-none focus:border-indigo-500 cursor-pointer transition-all font-medium"
            >
              <option value="all">All Availabilities</option>
              <option value="weekdays">Weekdays</option>
              <option value="weekends">Weekends</option>
              <option value="evenings">Evenings</option>
              <option value="flexible">Flexible Schedule</option>
            </select>
            <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none text-slate-400" />
          </div>
        </div>

        {/* Members Cards Directory */}
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-slate-500 px-1">
            <span>Showing <strong className="text-slate-800">{filteredUsers.length}</strong> active members</span>
            <span>Page {currentPage} of {totalPages || 1}</span>
          </div>

          {filteredUsers.length === 0 ? (
            <div className="border border-slate-200 bg-white rounded-2xl p-16 text-center text-slate-500 space-y-3 shadow-xs">
              <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
                <Search className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-800">No members match your criteria</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Try searching for broader skills like "React", "Python", "UI/UX", or clearing filters.
              </p>
            </div>
          ) : (
            paginatedUsers.map((targetUser) => (
              <div 
                key={targetUser.id} 
                className="bg-white hover:bg-slate-50/70 border border-slate-200 hover:border-slate-300 rounded-2xl p-5 sm:p-6 transition-all duration-150 shadow-xs hover:shadow-sm"
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
                  
                  {/* Left Column: Avatar + Profile Details */}
                  <div className="flex items-start sm:items-center space-x-4">
                    {/* Member Avatar */}
                    <div 
                      onClick={() => setInspectUser(targetUser)}
                      className="w-16 h-16 sm:w-20 sm:h-20 rounded-full overflow-hidden ring-2 ring-slate-100 border border-slate-200 flex-shrink-0 cursor-pointer hover:ring-indigo-200 transition-all duration-150"
                    >
                      {getPhotoUrl(targetUser.photo) ? (
                        <img src={getPhotoUrl(targetUser.photo)!} alt={targetUser.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-slate-200 text-slate-700 flex items-center justify-center text-xl font-bold">
                          {targetUser.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>

                    {/* Member Skills & Info */}
                    <div className="space-y-2.5 min-w-0">
                      <div>
                        <div className="flex items-center space-x-2">
                          <h3 
                            onClick={() => setInspectUser(targetUser)}
                            className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight hover:text-indigo-600 cursor-pointer transition-colors"
                          >
                            {targetUser.name}
                          </h3>
                          <span className="text-[10px] font-medium text-slate-600 border border-slate-200 bg-slate-100 px-2 py-0.5 rounded-full capitalize">
                            {targetUser.availability}
                          </span>
                        </div>
                        {targetUser.location && (
                          <div className="flex items-center space-x-1 text-xs text-slate-500 mt-1">
                            <MapPin className="w-3.5 h-3.5 text-slate-400" />
                            <span>{targetUser.location}</span>
                          </div>
                        )}
                      </div>
                      
                      {/* Skills Offered */}
                      <div>
                        <span className="text-emerald-700 text-[11px] font-bold uppercase tracking-wider block mb-1">
                          Can Teach
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {targetUser.skillsOffered.map((skill) => (
                            <span 
                              key={skill} 
                              className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-0.5 rounded-lg text-xs font-medium"
                            >
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Skills Wanted */}
                      <div>
                        <span className="text-indigo-700 text-[11px] font-bold uppercase tracking-wider block mb-1">
                          Wants to Learn
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {targetUser.skillsWanted.map((skill) => (
                            <span 
                              key={skill} 
                              className="bg-indigo-50 text-indigo-700 border border-indigo-200 px-2.5 py-0.5 rounded-lg text-xs font-medium"
                            >
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Rating & Actions */}
                  <div className="flex flex-col sm:flex-row lg:flex-col items-start sm:items-center lg:items-end justify-center gap-2.5 min-w-[180px]">
                    {/* Star Rating Badge */}
                    <div className="flex items-center space-x-1.5 text-amber-500 text-xs mb-1 bg-amber-50/70 border border-amber-200/80 px-2.5 py-1 rounded-full">
                      <Star className="w-3.5 h-3.5 fill-amber-400" />
                      <span className="font-bold text-slate-800">{targetUser.rating ? targetUser.rating.toFixed(1) : '5.0'}</span>
                      <span className="text-slate-500 text-[11px]">({targetUser.reviewCount || 0})</span>
                    </div>

                    {/* Propose Swap Action */}
                    <button
                      onClick={() => handleRequest(targetUser)}
                      className="w-full bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-xs font-semibold shadow-xs transition-colors flex items-center justify-center space-x-1.5"
                    >
                      <ArrowRightLeft className="w-3.5 h-3.5" />
                      <span>Request Swap</span>
                    </button>

                    {/* View Profile Action */}
                    <button
                      onClick={() => setInspectUser(targetUser)}
                      className="w-full border border-slate-300 text-slate-700 hover:text-slate-900 hover:bg-slate-50 px-4 py-1.5 rounded-xl text-xs font-semibold transition-colors flex items-center justify-center space-x-1.5 shadow-2xs"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>View Profile</span>
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Pagination Bar */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center space-x-2 pt-4">
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="p-2 border border-slate-200 bg-white rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed shadow-xs"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            
            <span className="text-xs font-medium text-slate-600 px-2">
              Page <strong className="text-slate-900">{currentPage}</strong> of <strong className="text-slate-900">{totalPages}</strong>
            </span>

            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="p-2 border border-slate-200 bg-white rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed shadow-xs"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Propose Swap Modal */}
        {showSwapModal && selectedUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150">
            <div className="relative w-full max-w-lg bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 text-slate-800 shadow-2xl space-y-5">
              
              <button
                onClick={() => setShowSwapModal(false)}
                className="absolute top-6 right-6 p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <div>
                <div className="flex items-center space-x-2 text-indigo-600 text-xs font-bold uppercase tracking-wider mb-1">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>New Proposal</span>
                </div>
                <h3 className="text-xl font-bold text-slate-900">Propose Swap with {selectedUser.name}</h3>
              </div>

              <form onSubmit={handleSubmitSwap} className="space-y-4">
                <div>
                  <label className="block text-xs uppercase tracking-wider text-slate-600 mb-2 font-bold">Skill You Offer</label>
                  <input
                    type="text"
                    required
                    value={swapForm.skillOffered}
                    onChange={(e) => setSwapForm(prev => ({ ...prev, skillOffered: e.target.value }))}
                    placeholder="e.g. React, Photoshop, Piano"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-slate-900 placeholder-slate-400 text-sm focus:bg-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs uppercase tracking-wider text-slate-600 mb-2 font-bold">Skill You Want in Return</label>
                  <input
                    type="text"
                    required
                    value={swapForm.skillWanted}
                    onChange={(e) => setSwapForm(prev => ({ ...prev, skillWanted: e.target.value }))}
                    placeholder="e.g. Python, Video Editing"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-slate-900 placeholder-slate-400 text-sm focus:bg-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs uppercase tracking-wider text-slate-600 mb-2 font-bold">Introductory Message</label>
                  <textarea
                    required
                    rows={3}
                    value={swapForm.message}
                    onChange={(e) => setSwapForm(prev => ({ ...prev, message: e.target.value }))}
                    placeholder="Introduce yourself and explain your mutual exchange goals..."
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-slate-900 placeholder-slate-400 text-sm focus:bg-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all resize-none"
                  />
                </div>

                <div className="flex justify-end space-x-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowSwapModal(false)}
                    className="px-4 py-2 border border-slate-300 text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-100 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl text-xs shadow-xs transition-colors disabled:opacity-50"
                  >
                    {isSubmitting ? 'Sending Request...' : 'Send Swap Request'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Member Profile Modal */}
        {inspectUser && (
          <UserProfileModal
            isOpen={!!inspectUser}
            onClose={() => setInspectUser(null)}
            user={inspectUser}
            onProposeSwap={(u) => handleRequest(u)}
          />
        )}
      </div>
    </div>
  );
};

export default BrowseSkills;