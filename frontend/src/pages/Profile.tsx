import React, { useState } from 'react';
import { X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const Profile: React.FC = () => {
  const { user, updateProfile } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    location: user?.location || '',
    skillsOffered: user?.skillsOffered || [],
    skillsWanted: user?.skillsWanted || [],
    availability: user?.availability || 'flexible',
    isPublic: user?.isPublic ?? true,
  });
  const [newOfferedSkill, setNewOfferedSkill] = useState('');
  const [newWantedSkill, setNewWantedSkill] = useState('');

  if (!user) return null;

  const handleSave = () => {
    updateProfile(formData);
    setIsEditing(false);
  };

  const handleDiscard = () => {
    setFormData({
      name: user.name,
      location: user.location || '',
      skillsOffered: user.skillsOffered,
      skillsWanted: user.skillsWanted,
      availability: user.availability,
      isPublic: user.isPublic,
    });
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
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-12">
          <div className="flex space-x-6">
            {isEditing ? (
              <>
                <button
                  onClick={handleSave}
                  className="text-green-400 text-xl hover:text-green-300"
                >
                  Save
                </button>
                <button
                  onClick={handleDiscard}
                  className="text-red-400 text-xl hover:text-red-300"
                >
                  Discard
                </button>
              </>
            ) : (
              <button
                onClick={() => setIsEditing(true)}
                className="text-blue-400 text-xl hover:text-blue-300"
              >
                Edit Profile
              </button>
            )}
          </div>
        </div>

        <div className="border-2 border-white rounded-3xl p-12">
          <div className="flex justify-between items-start">
            {/* Left Side - Form */}
            <div className="flex-1 space-y-12 pr-12">
              {/* Name */}
              <div>
                <label className="block text-2xl font-light mb-4">Name</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="bg-transparent border-b-2 border-white text-2xl pb-2 focus:outline-none focus:border-blue-400 w-full"
                  />
                ) : (
                  <div className="border-b-2 border-white text-2xl pb-2">{user.name}</div>
                )}
              </div>

              {/* Location */}
              <div>
                <label className="block text-2xl font-light mb-4">Location</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                    className="bg-transparent border-b-2 border-white text-2xl pb-2 focus:outline-none focus:border-blue-400 w-full"
                    placeholder="City, State"
                  />
                ) : (
                  <div className="border-b-2 border-white text-2xl pb-2">{user.location || 'Not specified'}</div>
                )}
              </div>

              {/* Skills Offered */}
              <div>
                <label className="block text-2xl font-light mb-6">Skills Offered</label>
                <div className="flex flex-wrap gap-4 mb-4">
                  {(isEditing ? formData.skillsOffered : user.skillsOffered).map((skill) => (
                    <span
                      key={skill}
                      className="border border-white rounded-full px-6 py-2 text-lg flex items-center space-x-2"
                    >
                      <span>{skill}</span>
                      {isEditing && (
                        <button
                          onClick={() => removeOfferedSkill(skill)}
                          className="text-red-400 hover:text-red-300"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </span>
                  ))}
                </div>
                {isEditing && (
                  <div className="flex space-x-4">
                    <input
                      type="text"
                      value={newOfferedSkill}
                      onChange={(e) => setNewOfferedSkill(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && addOfferedSkill()}
                      className="bg-transparent border-b-2 border-white text-lg pb-2 focus:outline-none focus:border-blue-400 flex-1"
                      placeholder="Add a skill..."
                    />
                    <button
                      onClick={addOfferedSkill}
                      className="text-green-400 hover:text-green-300"
                    >
                      Add
                    </button>
                  </div>
                )}
              </div>

              {/* Availability */}
              <div>
                <label className="block text-2xl font-light mb-4">Availability</label>
                {isEditing ? (
                  <select
                    value={formData.availability}
                    onChange={(e) => setFormData(prev => ({ ...prev, availability: e.target.value as any }))}
                    className="bg-transparent border-b-2 border-white text-2xl pb-2 focus:outline-none focus:border-blue-400"
                  >
                    <option value="weekdays" className="bg-black">weekdays</option>
                    <option value="weekends" className="bg-black">weekends</option>
                    <option value="evenings" className="bg-black">evenings</option>
                    <option value="flexible" className="bg-black">flexible</option>
                  </select>
                ) : (
                  <div className="border-b-2 border-white text-2xl pb-2">{user.availability}</div>
                )}
              </div>

              {/* Profile Visibility */}
              <div>
                <label className="block text-2xl font-light mb-4">Profile</label>
                {isEditing ? (
                  <select
                    value={formData.isPublic ? 'Public' : 'Private'}
                    onChange={(e) => setFormData(prev => ({ ...prev, isPublic: e.target.value === 'Public' }))}
                    className="bg-transparent border-b-2 border-white text-2xl pb-2 focus:outline-none focus:border-blue-400"
                  >
                    <option value="Public" className="bg-black">Public</option>
                    <option value="Private" className="bg-black">Private</option>
                  </select>
                ) : (
                  <div className="border-b-2 border-white text-2xl pb-2">{user.isPublic ? 'Public' : 'Private'}</div>
                )}
              </div>
            </div>

            {/* Right Side - Profile Photo and Skills Wanted */}
            <div className="space-y-12">
              {/* Profile Photo */}
              <div className="text-center">
                <div className="w-48 h-48 border-2 border-white rounded-full overflow-hidden mx-auto mb-4">
                  {user.photo ? (
                    <img src={user.photo} alt={user.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-gray-600 flex items-center justify-center text-lg">
                      Profile Photo
                    </div>
                  )}
                </div>
                {isEditing && (
                  <div className="text-sm space-x-4">
                    <button className="text-blue-400 hover:text-blue-300">Add/Edit</button>
                    <button className="text-red-400 hover:text-red-300">Remove</button>
                  </div>
                )}
              </div>

              {/* Skills Wanted */}
              <div>
                <label className="block text-2xl font-light mb-6">Skills wanted</label>
                <div className="flex flex-wrap gap-4 mb-4">
                  {(isEditing ? formData.skillsWanted : user.skillsWanted).map((skill) => (
                    <span
                      key={skill}
                      className="border border-white rounded-full px-6 py-2 text-lg flex items-center space-x-2"
                    >
                      <span>{skill}</span>
                      {isEditing && (
                        <button
                          onClick={() => removeWantedSkill(skill)}
                          className="text-red-400 hover:text-red-300"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </span>
                  ))}
                </div>
                {isEditing && (
                  <div className="flex space-x-4">
                    <input
                      type="text"
                      value={newWantedSkill}
                      onChange={(e) => setNewWantedSkill(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && addWantedSkill()}
                      className="bg-transparent border-b-2 border-white text-lg pb-2 focus:outline-none focus:border-blue-400 flex-1"
                      placeholder="Add a skill..."
                    />
                    <button
                      onClick={addWantedSkill}
                      className="text-green-400 hover:text-green-300"
                    >
                      Add
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;