import React, { useState, useRef, useEffect } from 'react';
import { 
  Camera, 
  MapPin, 
  Clock, 
  X, 
  User as UserIcon,
  ShieldCheck,
  Check,
  Sparkles
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';

const Profile: React.FC = () => {
  const { user, updateProfile } = useAuth();
  const { refreshData } = useData();

  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    location: user?.location || '',
    availability: user?.availability || 'flexible',
    isPublic: user?.isPublic ?? true,
    skillsOffered: user?.skillsOffered || [],
    skillsWanted: user?.skillsWanted || [],
  });

  // Keep form data in sync with updated user
  useEffect(() => {
    if (user && !isEditing) {
      setFormData({
        name: user.name || '',
        location: user.location || '',
        availability: user.availability || 'flexible',
        isPublic: user.isPublic ?? true,
        skillsOffered: user.skillsOffered || [],
        skillsWanted: user.skillsWanted || [],
      });
    }
  }, [user, isEditing]);

  const [newOfferedSkill, setNewOfferedSkill] = useState('');
  const [newWantedSkill, setNewWantedSkill] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!user) return null;

  const getPhotoUrl = (photoPath?: string | null) => {
    if (!photoPath) return null;
    if (photoPath.startsWith('http')) return photoPath;
    const baseUrl = (import.meta.env.VITE_API_URL || 'http://localhost:5000').replace(/\/api\/?$/, '');
    return `${baseUrl}${photoPath.startsWith('/') ? '' : '/'}${photoPath}`;
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      alert('Please enter a display name.');
      return;
    }

    try {
      setIsSaving(true);

      // Auto-include any skill currently typed in the input fields
      let currentOffered = [...formData.skillsOffered];
      if (newOfferedSkill.trim() && !currentOffered.includes(newOfferedSkill.trim())) {
        currentOffered.push(newOfferedSkill.trim());
      }

      let currentWanted = [...formData.skillsWanted];
      if (newWantedSkill.trim() && !currentWanted.includes(newWantedSkill.trim())) {
        currentWanted.push(newWantedSkill.trim());
      }

      const data = new FormData();
      data.append('name', formData.name.trim());
      data.append('location', formData.location.trim());
      data.append('availability', formData.availability);
      data.append('isPublic', String(formData.isPublic));
      data.append('skillsOffered', JSON.stringify(currentOffered));
      data.append('skillsWanted', JSON.stringify(currentWanted));

      if (selectedFile) {
        data.append('photo', selectedFile);
      }

      const res = await updateProfile(data);
      if (res.success) {
        await refreshData();
        setNewOfferedSkill('');
        setNewWantedSkill('');
        setIsEditing(false);
        setSelectedFile(null);
        setPreviewUrl(null);
        alert('Profile updated successfully!');
      } else {
        alert(res.error || 'Failed to update profile. Please try again.');
      }
    } catch (error: any) {
      console.error('Failed to update profile:', error);
      alert(error.message || 'Failed to update profile. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDiscard = () => {
    if (user) {
      setFormData({
        name: user.name || '',
        location: user.location || '',
        availability: user.availability || 'flexible',
        isPublic: user.isPublic ?? true,
        skillsOffered: user.skillsOffered || [],
        skillsWanted: user.skillsWanted || [],
      });
    }
    setNewOfferedSkill('');
    setNewWantedSkill('');
    setPreviewUrl(null);
    setSelectedFile(null);
    setIsEditing(false);
  };

  const addOfferedSkill = () => {
    if (newOfferedSkill.trim() && !formData.skillsOffered.includes(newOfferedSkill.trim())) {
      setFormData(prev => ({
        ...prev,
        skillsOffered: [...prev.skillsOffered, newOfferedSkill.trim()]
      }));
      setNewOfferedSkill('');
    }
  };

  const removeOfferedSkill = (skill: string) => {
    setFormData(prev => ({
      ...prev,
      skillsOffered: prev.skillsOffered.filter(s => s !== skill)
    }));
  };

  const addWantedSkill = () => {
    if (newWantedSkill.trim() && !formData.skillsWanted.includes(newWantedSkill.trim())) {
      setFormData(prev => ({
        ...prev,
        skillsWanted: [...prev.skillsWanted, newWantedSkill.trim()]
      }));
      setNewWantedSkill('');
    }
  };

  const removeWantedSkill = (skill: string) => {
    setFormData(prev => ({
      ...prev,
      skillsWanted: prev.skillsWanted.filter(s => s !== skill)
    }));
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
          <div>
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-semibold mb-2">
              <UserIcon className="w-3.5 h-3.5 text-indigo-600" />
              <span>Personal Profile</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">Your Profile</h1>
            <p className="text-slate-600 text-xs sm:text-sm mt-1">Manage your public information, teaching skills, and learning goals</p>
          </div>

          <div className="flex items-center space-x-2.5">
            {isEditing ? (
              <>
                <button
                  onClick={handleDiscard}
                  disabled={isSaving}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-100 transition-colors disabled:opacity-50"
                >
                  Discard
                </button>
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors disabled:opacity-50"
                >
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </button>
              </>
            ) : (
              <button
                onClick={() => setIsEditing(true)}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors"
              >
                Edit Profile
              </button>
            )}
          </div>
        </div>

        {/* Profile Card Container */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-xs space-y-6">
          
          {/* Top Banner with Avatar & Basic Info */}
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 pb-6 border-b border-slate-200">
            <div className="relative group">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden ring-4 ring-slate-100 border border-slate-200 shadow-xs flex-shrink-0">
                {previewUrl ? (
                  <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                ) : getPhotoUrl(user.photo) ? (
                  <img src={getPhotoUrl(user.photo)!} alt={user.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-slate-200 text-slate-700 flex items-center justify-center text-2xl font-bold">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>

              {isEditing && (
                <>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setSelectedFile(file);
                        setPreviewUrl(URL.createObjectURL(file));
                      }
                    }}
                    accept="image/*"
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute bottom-0 right-0 p-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full shadow-md border-2 border-white transition-colors"
                    title="Upload photo"
                  >
                    <Camera className="w-3.5 h-3.5" />
                  </button>
                </>
              )}
            </div>

            <div className="flex-1 text-center sm:text-left space-y-1.5">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <h2 className="text-xl font-bold text-slate-900 tracking-tight">{user.name}</h2>
                {user.isAdmin && (
                  <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Admin</span>
                  </span>
                )}
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200 capitalize font-medium">
                  {user.availability} availability
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">{user.email}</p>
              {user.location && (
                <div className="flex items-center justify-center sm:justify-start space-x-1 text-xs text-slate-500 font-medium">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  <span>{user.location}</span>
                </div>
              )}
            </div>
          </div>

          {/* Form Fields Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            
            {/* Name Input */}
            <div>
              <label className="block text-xs uppercase tracking-wider text-slate-600 mb-2 font-bold">Display Name</label>
              {isEditing ? (
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-slate-900 text-sm focus:bg-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                />
              ) : (
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 font-medium">
                  {user.name}
                </div>
              )}
            </div>

            {/* Location Input */}
            <div>
              <label className="block text-xs uppercase tracking-wider text-slate-600 mb-2 font-bold">Location</label>
              {isEditing ? (
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                  placeholder="e.g. San Francisco, CA"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-slate-900 text-sm focus:bg-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                />
              ) : (
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 font-medium">
                  {user.location || 'Not specified'}
                </div>
              )}
            </div>

            {/* Availability */}
            <div>
              <label className="block text-xs uppercase tracking-wider text-slate-600 mb-2 font-bold">Availability</label>
              {isEditing ? (
                <select
                  value={formData.availability}
                  onChange={(e) => setFormData(prev => ({ ...prev, availability: e.target.value as any }))}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-slate-900 text-sm focus:bg-white focus:outline-none focus:border-indigo-500 cursor-pointer font-medium"
                >
                  <option value="weekdays">Weekdays</option>
                  <option value="weekends">Weekends</option>
                  <option value="evenings">Evenings</option>
                  <option value="flexible">Flexible Schedule</option>
                </select>
              ) : (
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 capitalize font-medium">
                  {user.availability}
                </div>
              )}
            </div>

            {/* Profile Visibility */}
            <div>
              <label className="block text-xs uppercase tracking-wider text-slate-600 mb-2 font-bold">Directory Visibility</label>
              {isEditing ? (
                <select
                  value={formData.isPublic ? 'Public' : 'Private'}
                  onChange={(e) => setFormData(prev => ({ ...prev, isPublic: e.target.value === 'Public' }))}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-slate-900 text-sm focus:bg-white focus:outline-none focus:border-indigo-500 cursor-pointer font-medium"
                >
                  <option value="Public">Public (Discoverable in Browse)</option>
                  <option value="Private">Private (Hidden from Directory)</option>
                </select>
              ) : (
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 font-medium">
                  {user.isPublic ? 'Public (Visible in Browse)' : 'Private (Hidden)'}
                </div>
              )}
            </div>
          </div>

          {/* Skills Offered Section */}
          <div className="space-y-3 pt-4 border-t border-slate-200">
            <div className="flex items-center justify-between">
              <label className="block text-xs uppercase tracking-wider text-emerald-700 font-bold">
                Skills You Teach & Offer
              </label>
              <span className="text-[11px] text-slate-500 font-medium">Other members can request these from you</span>
            </div>

            <div className="flex flex-wrap gap-2">
              {(isEditing ? formData.skillsOffered : user.skillsOffered).map((skill) => (
                <span
                  key={skill}
                  className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-1 rounded-xl text-xs font-semibold flex items-center space-x-1.5"
                >
                  <span>{skill}</span>
                  {isEditing && (
                    <button
                      type="button"
                      onClick={() => removeOfferedSkill(skill)}
                      className="text-slate-400 hover:text-rose-600 transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </span>
              ))}
            </div>

            {isEditing && (
              <div className="flex items-center space-x-2 pt-1">
                <input
                  type="text"
                  value={newOfferedSkill}
                  onChange={(e) => setNewOfferedSkill(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addOfferedSkill();
                    }
                  }}
                  placeholder="Type a skill you teach (e.g. React, Docker, Piano)..."
                  className="flex-1 bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-indigo-500"
                />
                <button
                  type="button"
                  onClick={addOfferedSkill}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold transition-colors shadow-2xs"
                >
                  Add
                </button>
              </div>
            )}
          </div>

          {/* Skills Wanted Section */}
          <div className="space-y-3 pt-4 border-t border-slate-200">
            <div className="flex items-center justify-between">
              <label className="block text-xs uppercase tracking-wider text-indigo-700 font-bold">
                Skills You Want to Learn
              </label>
              <span className="text-[11px] text-slate-500 font-medium">Used for smart reciprocal partner matching</span>
            </div>

            <div className="flex flex-wrap gap-2">
              {(isEditing ? formData.skillsWanted : user.skillsWanted).map((skill) => (
                <span
                  key={skill}
                  className="bg-indigo-50 text-indigo-700 border border-indigo-200 px-3 py-1 rounded-xl text-xs font-semibold flex items-center space-x-1.5"
                >
                  <span>{skill}</span>
                  {isEditing && (
                    <button
                      type="button"
                      onClick={() => removeWantedSkill(skill)}
                      className="text-slate-400 hover:text-rose-600 transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </span>
              ))}
            </div>

            {isEditing && (
              <div className="flex items-center space-x-2 pt-1">
                <input
                  type="text"
                  value={newWantedSkill}
                  onChange={(e) => setNewWantedSkill(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addWantedSkill();
                    }
                  }}
                  placeholder="Type a skill you want to learn (e.g. Python, UI/UX)..."
                  className="flex-1 bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-indigo-500"
                />
                <button
                  type="button"
                  onClick={addWantedSkill}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold transition-colors shadow-2xs"
                >
                  Add
                </button>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};

export default Profile;