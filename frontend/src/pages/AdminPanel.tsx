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
  AlertTriangle,
  X,
  Edit2,
  Trash2,
  FileSpreadsheet,
  CheckCircle2,
  Clock,
  Sparkles,
  ArrowRightLeft
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { User } from '../types';

const AdminPanel: React.FC = () => {
  const { user } = useAuth();
  const { 
    users, 
    swapRequests, 
    adminMessages, 
    createAdminMessage, 
    banUser, 
    unbanUser,
    moderateUserSkills,
    exportReport,
    exportReportCSV,
    isLoading 
  } = useData();

  const [activeTab, setActiveTab] = useState<'users' | 'swaps' | 'messages' | 'stats'>('users');
  const [selectedUserForModeration, setSelectedUserForModeration] = useState<User | null>(null);
  const [moderationReason, setModerationReason] = useState('');
  const [editingSkillsOffered, setEditingSkillsOffered] = useState<string[]>([]);
  const [editingSkillsWanted, setEditingSkillsWanted] = useState<string[]>([]);

  const [messageForm, setMessageForm] = useState({
    title: '',
    message: '',
    type: 'info' as 'info' | 'warning' | 'announcement',
  });
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // Redirect / guard if not admin
  if (!user?.isAdmin) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] text-slate-800 flex items-center justify-center p-8">
        <div className="bg-white border border-rose-200 rounded-2xl p-8 text-center max-w-md shadow-lg">
          <div className="w-14 h-14 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 mx-auto mb-4">
            <Shield className="w-7 h-7" />
          </div>
          <h1 className="text-xl font-bold mb-2 text-slate-900">Access Denied</h1>
          <p className="text-slate-600 text-sm leading-relaxed">
            Administrator privileges are required to access this panel.
          </p>
        </div>
      </div>
    );
  }

  const handleOpenModeration = (targetUser: User) => {
    setSelectedUserForModeration(targetUser);
    setEditingSkillsOffered([...targetUser.skillsOffered]);
    setEditingSkillsWanted([...targetUser.skillsWanted]);
    setModerationReason('');
  };

  const handleRemoveOfferedSkill = (index: number) => {
    setEditingSkillsOffered(prev => prev.filter((_, i) => i !== index));
  };

  const handleRemoveWantedSkill = (index: number) => {
    setEditingSkillsWanted(prev => prev.filter((_, i) => i !== index));
  };

  const handleSaveModeratedSkills = async () => {
    if (!selectedUserForModeration) return;
    try {
      await moderateUserSkills(selectedUserForModeration.id, {
        skillsOffered: editingSkillsOffered,
        skillsWanted: editingSkillsWanted,
        reason: moderationReason || 'Admin skill description moderation'
      });
      alert('User skills updated successfully.');
      setSelectedUserForModeration(null);
    } catch (err) {
      console.error(err);
      alert('Failed to moderate skills.');
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageForm.title.trim() || !messageForm.message.trim()) return;

    try {
      setIsSendingMessage(true);
      await createAdminMessage({
        title: messageForm.title,
        message: messageForm.message,
        type: messageForm.type,
        isActive: true,
      });
      setMessageForm({ title: '', message: '', type: 'info' });
      alert('Platform-wide announcement sent successfully!');
    } catch (err) {
      console.error(err);
      alert('Failed to send announcement.');
    } finally {
      setIsSendingMessage(false);
    }
  };

  const handleDownloadReport = async () => {
    try {
      setIsExporting(true);
      const data = await exportReport();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `skillswap-full-report-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Download report error:', err);
      alert('Failed to download report.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleDownloadCSV = async (type: 'users' | 'swaps' | 'feedback') => {
    try {
      setIsExporting(true);
      const csvData = await exportReportCSV(type);
      const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `skillswap-${type}-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error(`Download ${type} CSV error:`, err);
      alert(`Failed to download ${type} CSV report.`);
    } finally {
      setIsExporting(false);
    }
  };

  const tabs = [
    { id: 'users', label: 'User Moderation', icon: Users, count: users.length },
    { id: 'swaps', label: 'Monitor Swaps', icon: MessageSquare, count: swapRequests.length },
    { id: 'messages', label: 'Platform Broadcasts', icon: Send, count: adminMessages.length },
    { id: 'stats', label: 'Stats & Reports', icon: BarChart3 },
  ];

  const stats = {
    totalUsers: users.length,
    activeUsers: users.filter(u => !u.isBanned).length,
    bannedUsers: users.filter(u => u.isBanned).length,
    totalSwaps: swapRequests.length,
    pendingSwaps: swapRequests.filter(s => s.status === 'pending').length,
    activeSwaps: swapRequests.filter(s => s.status === 'accepted').length,
    completedSwaps: swapRequests.filter(s => s.status === 'completed').length,
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Top Header Card */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-7 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div>
              <div className="flex items-center space-x-3 mb-2">
                <div className="w-9 h-9 rounded-xl bg-purple-50 border border-purple-200 flex items-center justify-center text-purple-700">
                  <Shield className="w-5 h-5" />
                </div>
                <div>
                  <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">Admin Oversight Panel</h1>
                  <span className="text-[10px] font-bold text-purple-700 uppercase tracking-wider">Superuser Console</span>
                </div>
              </div>
              <p className="text-slate-600 text-xs sm:text-sm max-w-xl leading-relaxed">
                Moderate user skill listings, manage community compliance, inspect swap transactions, and broadcast platform updates.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => handleDownloadCSV('users')}
                disabled={isExporting}
                className="flex items-center space-x-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-xl px-3.5 py-2 text-xs font-semibold transition-colors shadow-2xs disabled:opacity-50"
                title="Download Users list as CSV"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                <span>Users CSV</span>
              </button>
              <button
                onClick={() => handleDownloadCSV('swaps')}
                disabled={isExporting}
                className="flex items-center space-x-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-xl px-3.5 py-2 text-xs font-semibold transition-colors shadow-2xs disabled:opacity-50"
                title="Download Swaps list as CSV"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-indigo-600" />
                <span>Swaps CSV</span>
              </button>
              <button
                onClick={handleDownloadReport}
                disabled={isExporting}
                className="flex items-center space-x-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl px-4 py-2 text-xs font-semibold transition-colors shadow-xs disabled:opacity-50"
              >
                <Download className="w-3.5 h-3.5" />
                <span>{isExporting ? 'Exporting...' : 'Full Audit JSON'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-xs">
            <div className="text-2xl font-extrabold text-slate-900 tracking-tight">{stats.totalUsers}</div>
            <div className="text-xs text-slate-500 mt-0.5 font-medium">Total Members</div>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-xs">
            <div className="text-2xl font-extrabold text-emerald-700 tracking-tight">{stats.activeUsers}</div>
            <div className="text-xs text-slate-500 mt-0.5 font-medium">Active Accounts</div>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-xs">
            <div className="text-2xl font-extrabold text-rose-600 tracking-tight">{stats.bannedUsers}</div>
            <div className="text-xs text-slate-500 mt-0.5 font-medium">Banned Members</div>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-xs">
            <div className="text-2xl font-extrabold text-slate-900 tracking-tight">{stats.totalSwaps}</div>
            <div className="text-xs text-slate-500 mt-0.5 font-medium">Total Swaps</div>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-xs">
            <div className="text-2xl font-extrabold text-amber-600 tracking-tight">{stats.pendingSwaps}</div>
            <div className="text-xs text-slate-500 mt-0.5 font-medium">Pending Swaps</div>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-xs">
            <div className="text-2xl font-extrabold text-indigo-600 tracking-tight">{stats.completedSwaps}</div>
            <div className="text-xs text-slate-500 mt-0.5 font-medium">Completed Swaps</div>
          </div>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-slate-200 space-x-2 sm:space-x-3 overflow-x-auto pb-px">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center space-x-2 pb-3 px-3 text-xs sm:text-sm font-semibold transition-all relative border-b-2 whitespace-nowrap ${
                  isActive 
                    ? 'text-indigo-600 border-indigo-600' 
                    : 'text-slate-500 border-transparent hover:text-slate-800'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
                {tab.count !== undefined && (
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                    isActive 
                      ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' 
                      : 'bg-slate-100 text-slate-600'
                  }`}>
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Tab 1: User Management & Skill Moderation */}
        {activeTab === 'users' && (
          <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-7 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-5">
              <div>
                <h2 className="text-lg font-bold text-slate-900 tracking-tight">Community Members & Moderation</h2>
                <p className="text-xs text-slate-500 mt-0.5">Audit member listings, remove spammy keywords, and maintain platform standards.</p>
              </div>
              <span className="text-xs text-slate-600 font-semibold bg-slate-100 px-3 py-1 rounded-lg border border-slate-200 w-fit">
                {users.length} Registered Accounts
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 text-xs uppercase tracking-wider font-bold">
                    <th className="py-3 px-4">User</th>
                    <th className="py-3 px-4">Email</th>
                    <th className="py-3 px-4">Skills Offered</th>
                    <th className="py-3 px-4">Skills Wanted</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {users.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">{u.name}</div>
                        <div className="text-xs text-slate-400">{u.location || 'Location unlisted'}</div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 font-mono text-xs">{u.email}</td>
                      <td className="py-3.5 px-4">
                        <div className="flex flex-wrap gap-1 max-w-xs">
                          {u.skillsOffered.length === 0 ? (
                            <span className="text-slate-400 text-xs italic">None</span>
                          ) : (
                            u.skillsOffered.map(s => (
                              <span key={s} className="bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-md px-2 py-0.5 text-xs font-medium">
                                {s}
                              </span>
                            ))
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex flex-wrap gap-1 max-w-xs">
                          {u.skillsWanted.length === 0 ? (
                            <span className="text-slate-400 text-xs italic">None</span>
                          ) : (
                            u.skillsWanted.map(s => (
                              <span key={s} className="bg-indigo-50 border border-indigo-200 text-indigo-700 rounded-md px-2 py-0.5 text-xs font-medium">
                                {s}
                              </span>
                            ))
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        {u.isBanned ? (
                          <span className="text-xs bg-rose-50 text-rose-700 border border-rose-200 px-2.5 py-0.5 rounded-full font-bold inline-flex items-center space-x-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                            <span>Banned</span>
                          </span>
                        ) : (
                          <span className="text-xs bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-0.5 rounded-full font-bold inline-flex items-center space-x-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            <span>Active</span>
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right space-x-2 whitespace-nowrap">
                        <button
                          onClick={() => handleOpenModeration(u)}
                          className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 px-3 py-1 rounded-xl text-xs font-semibold transition-colors shadow-2xs"
                        >
                          Moderate
                        </button>
                        {u.isBanned ? (
                          <button
                            onClick={() => unbanUser(u.id)}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1 rounded-xl text-xs font-semibold transition-colors shadow-xs"
                          >
                            Unban
                          </button>
                        ) : (
                          <button
                            onClick={() => banUser(u.id)}
                            className="border border-rose-300 text-rose-600 hover:bg-rose-50 px-3 py-1 rounded-xl text-xs font-semibold transition-colors"
                          >
                            Ban
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

        {/* Tab 2: Swaps Monitoring */}
        {activeTab === 'swaps' && (
          <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-7 shadow-xs">
            <h2 className="text-lg font-bold text-slate-900 tracking-tight mb-5">Live Swap Activity Monitor</h2>
            <div className="space-y-3">
              {swapRequests.length === 0 ? (
                <p className="text-slate-400 text-center py-12">No swaps recorded on the platform yet.</p>
              ) : (
                swapRequests.map((s) => {
                  const fromU = users.find(u => u.id === s.fromUserId);
                  const toU = users.find(u => u.id === s.toUserId);
                  return (
                    <div key={s.id} className="bg-slate-50/70 border border-slate-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <div className="flex items-center space-x-2 text-sm">
                          <span className="text-slate-900 font-bold">{fromU?.name || 'User ' + s.fromUserId}</span>
                          <span className="text-indigo-600 font-bold">⇄</span>
                          <span className="text-slate-900 font-bold">{toU?.name || 'User ' + s.toUserId}</span>
                        </div>
                        <div className="text-xs text-slate-600 mt-1 flex items-center space-x-2">
                          <span>Offered: <span className="text-emerald-700 font-bold">{s.skillOffered}</span></span>
                          <span className="text-slate-400">•</span>
                          <span>Wanted: <span className="text-indigo-700 font-bold">{s.skillWanted}</span></span>
                        </div>
                        {s.message && (
                          <p className="text-xs text-slate-600 italic mt-1 bg-white p-2 rounded-lg border border-slate-200 max-w-xl">
                            "{s.message}"
                          </p>
                        )}
                      </div>
                      <div className="sm:text-right flex-shrink-0">
                        <span className={`text-xs px-2.5 py-0.5 rounded-full border font-bold uppercase tracking-wider inline-block ${
                          s.status === 'pending' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                          s.status === 'accepted' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                          s.status === 'completed' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                          'bg-slate-100 text-slate-600 border-slate-200'
                        }`}>
                          {s.status}
                        </span>
                        <div className="text-[11px] text-slate-400 mt-1.5 font-medium">
                          {new Date(s.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* Tab 3: Platform Broadcasts */}
        {activeTab === 'messages' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-7 shadow-xs">
              <div className="flex items-center space-x-2 mb-1.5">
                <Send className="w-4 h-4 text-indigo-600" />
                <h2 className="text-lg font-bold text-slate-900 tracking-tight">Create Platform Broadcast</h2>
              </div>
              <p className="text-xs text-slate-500 mb-5">Dispatch downtime notices, system alerts, or feature releases to all active members.</p>

              <form onSubmit={handleSendMessage} className="space-y-4">
                <div>
                  <label className="block text-xs uppercase tracking-wider font-bold text-slate-600 mb-2">Broadcast Title</label>
                  <input
                    type="text"
                    required
                    value={messageForm.title}
                    onChange={(e) => setMessageForm(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="e.g. Scheduled Network Upgrade"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-indigo-500 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs uppercase tracking-wider font-bold text-slate-600 mb-2">Alert Category</label>
                  <select
                    value={messageForm.type}
                    onChange={(e) => setMessageForm(prev => ({ ...prev, type: e.target.value as any }))}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-slate-900 focus:bg-white focus:outline-none focus:border-indigo-500 text-sm cursor-pointer font-medium"
                  >
                    <option value="info">General Info</option>
                    <option value="announcement">Feature Announcement</option>
                    <option value="warning">System Alert / Maintenance</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs uppercase tracking-wider font-bold text-slate-600 mb-2">Announcement Message</label>
                  <textarea
                    required
                    rows={4}
                    value={messageForm.message}
                    onChange={(e) => setMessageForm(prev => ({ ...prev, message: e.target.value }))}
                    placeholder="Provide details on the release or scheduled maintenance window..."
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-indigo-500 text-sm resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSendingMessage}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5 rounded-xl transition-colors shadow-xs disabled:opacity-50 text-sm"
                >
                  {isSendingMessage ? 'Broadcasting...' : 'Send Broadcast to Community'}
                </button>
              </form>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-7 shadow-xs flex flex-col">
              <h2 className="text-lg font-bold text-slate-900 tracking-tight mb-5">Recent Broadcast Logs</h2>
              <div className="space-y-3 flex-1 overflow-y-auto max-h-[400px] pr-1">
                {adminMessages.length === 0 ? (
                  <p className="text-slate-400 text-xs italic py-8 text-center">No platform broadcasts dispatched yet.</p>
                ) : (
                  adminMessages.map(m => (
                    <div key={m.id} className="bg-slate-50 border border-slate-200 rounded-xl p-3.5">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="font-bold text-slate-900 text-sm">{m.title}</h4>
                        <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-md border ${
                          m.type === 'warning' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                          m.type === 'announcement' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                          'bg-indigo-50 text-indigo-700 border border-indigo-200'
                        }`}>
                          {m.type}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 mb-2 leading-relaxed">{m.message}</p>
                      <span className="text-[10px] text-slate-400 flex items-center space-x-1 font-medium">
                        <Clock className="w-3 h-3 inline" />
                        <span>{new Date(m.createdAt).toLocaleString()}</span>
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: Stats & Full Export */}
        {activeTab === 'stats' && (
          <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-7 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900 tracking-tight">Platform Analytics & Report Generator</h2>
                <p className="text-slate-500 text-xs mt-0.5">Export official user audit data, feedback ratings, and swap activity reports.</p>
              </div>
              <button
                onClick={handleDownloadReport}
                disabled={isExporting}
                className="flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-4 py-2 rounded-xl transition-colors shadow-xs text-xs disabled:opacity-50 w-fit"
              >
                <Download className="w-3.5 h-3.5" />
                <span>{isExporting ? 'Preparing...' : 'Download Full Audit JSON'}</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                <h3 className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-3">Member Standing</h3>
                <div className="space-y-2.5 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-medium">Total Registered</span>
                    <span className="text-slate-900 font-bold">{stats.totalUsers}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-medium">Good Standing</span>
                    <span className="text-emerald-700 font-bold">{stats.activeUsers}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-medium">Suspended / Banned</span>
                    <span className="text-rose-600 font-bold">{stats.bannedUsers}</span>
                  </div>
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                <h3 className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-3">Swap Conversion</h3>
                <div className="space-y-2.5 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-medium">Total Proposed</span>
                    <span className="text-slate-900 font-bold">{stats.totalSwaps}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-medium">Awaiting Response</span>
                    <span className="text-amber-600 font-bold">{stats.pendingSwaps}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-medium">Completed Sessions</span>
                    <span className="text-indigo-600 font-bold">{stats.completedSwaps}</span>
                  </div>
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                <h3 className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">Audit Compliance</h3>
                <p className="text-xs text-slate-500 leading-relaxed font-medium">
                  Generated reports contain structured transactions with Unix timestamps, user IDs, swap tags, and star ratings for regulatory review and backup purposes.
                </p>
              </div>
            </div>

            {/* Standard Format Report Downloads */}
            <div className="border border-slate-200 bg-slate-50/50 rounded-xl p-5">
              <h3 className="text-sm font-bold text-slate-900 mb-1">Download Individual Datasets</h3>
              <p className="text-xs text-slate-500 mb-4">
                Export specific sections in standard CSV spreadsheet format.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                <div className="border border-slate-200 bg-white rounded-xl p-3.5 flex flex-col justify-between shadow-2xs">
                  <div>
                    <div className="flex items-center space-x-1.5 text-emerald-700 mb-1.5 font-bold text-xs">
                      <FileSpreadsheet className="w-3.5 h-3.5" />
                      <span>User Directory CSV</span>
                    </div>
                    <p className="text-[11px] text-slate-500 mb-3">
                      Complete member list, registered emails, skills catalog, and activity standing.
                    </p>
                  </div>
                  <button
                    onClick={() => handleDownloadCSV('users')}
                    disabled={isExporting}
                    className="w-full flex items-center justify-center space-x-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-lg py-1.5 text-xs font-semibold transition-colors shadow-2xs disabled:opacity-50"
                  >
                    <Download className="w-3 h-3" />
                    <span>Download CSV</span>
                  </button>
                </div>

                <div className="border border-slate-200 bg-white rounded-xl p-3.5 flex flex-col justify-between shadow-2xs">
                  <div>
                    <div className="flex items-center space-x-1.5 text-indigo-700 mb-1.5 font-bold text-xs">
                      <FileSpreadsheet className="w-3.5 h-3.5" />
                      <span>Swap Activity CSV</span>
                    </div>
                    <p className="text-[11px] text-slate-500 mb-3">
                      Full swap records, pair connections, initial proposals, and current statuses.
                    </p>
                  </div>
                  <button
                    onClick={() => handleDownloadCSV('swaps')}
                    disabled={isExporting}
                    className="w-full flex items-center justify-center space-x-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-lg py-1.5 text-xs font-semibold transition-colors shadow-2xs disabled:opacity-50"
                  >
                    <Download className="w-3 h-3" />
                    <span>Download CSV</span>
                  </button>
                </div>

                <div className="border border-slate-200 bg-white rounded-xl p-3.5 flex flex-col justify-between shadow-2xs">
                  <div>
                    <div className="flex items-center space-x-1.5 text-amber-700 mb-1.5 font-bold text-xs">
                      <FileSpreadsheet className="w-3.5 h-3.5" />
                      <span>Feedback & Ratings CSV</span>
                    </div>
                    <p className="text-[11px] text-slate-500 mb-3">
                      Verified participant review remarks and numeric star ratings from swaps.
                    </p>
                  </div>
                  <button
                    onClick={() => handleDownloadCSV('feedback')}
                    disabled={isExporting}
                    className="w-full flex items-center justify-center space-x-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-lg py-1.5 text-xs font-semibold transition-colors shadow-2xs disabled:opacity-50"
                  >
                    <Download className="w-3 h-3" />
                    <span>Download CSV</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Skill Moderation Modal */}
        {selectedUserForModeration && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
            <div className="relative w-full max-w-lg bg-white border border-slate-200 rounded-2xl p-6 sm:p-7 text-slate-900 shadow-2xl space-y-5">
              <button
                onClick={() => setSelectedUserForModeration(null)}
                className="absolute top-6 right-6 text-slate-400 hover:text-slate-700 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <div>
                <h3 className="text-lg font-bold text-slate-900 tracking-tight">Moderate Member Skills</h3>
                <p className="text-xs text-slate-500 mt-0.5 font-medium">
                  Remove offensive or non-compliant skill listings for <span className="text-indigo-600 font-bold">{selectedUserForModeration.name}</span>
                </p>
              </div>

              {/* Skills Offered Moderation */}
              <div>
                <label className="block text-xs uppercase tracking-wider font-bold text-slate-600 mb-2">Offered Skills (Click X to strip tag)</label>
                <div className="flex flex-wrap gap-1.5 min-h-[40px] p-2 bg-slate-50 border border-slate-200 rounded-xl">
                  {editingSkillsOffered.length === 0 ? (
                    <span className="text-slate-400 text-xs italic">No skills currently listed</span>
                  ) : (
                    editingSkillsOffered.map((skill, index) => (
                      <span key={index} className="inline-flex items-center space-x-1 bg-emerald-50 border border-emerald-200 rounded-md px-2 py-0.5 text-xs text-emerald-700 font-semibold">
                        <span>{skill}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveOfferedSkill(index)}
                          className="hover:text-rose-600 ml-1"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))
                  )}
                </div>
              </div>

              {/* Skills Wanted Moderation */}
              <div>
                <label className="block text-xs uppercase tracking-wider font-bold text-slate-600 mb-2">Wanted Skills (Click X to strip tag)</label>
                <div className="flex flex-wrap gap-1.5 min-h-[40px] p-2 bg-slate-50 border border-slate-200 rounded-xl">
                  {editingSkillsWanted.length === 0 ? (
                    <span className="text-slate-400 text-xs italic">No skills currently listed</span>
                  ) : (
                    editingSkillsWanted.map((skill, index) => (
                      <span key={index} className="inline-flex items-center space-x-1 bg-indigo-50 border border-indigo-200 rounded-md px-2 py-0.5 text-xs text-indigo-700 font-semibold">
                        <span>{skill}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveWantedSkill(index)}
                          className="hover:text-rose-600 ml-1"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))
                  )}
                </div>
              </div>

              {/* Moderation Reason / Note */}
              <div>
                <label className="block text-xs uppercase tracking-wider font-bold text-slate-600 mb-2">Reason Notice</label>
                <input
                  type="text"
                  value={moderationReason}
                  onChange={(e) => setModerationReason(e.target.value)}
                  placeholder="e.g. Inappropriate skill description removed per community guidelines"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-slate-900 text-xs focus:bg-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex justify-end space-x-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedUserForModeration(null)}
                  className="px-4 py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveModeratedSkills}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl text-xs transition-colors shadow-xs"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPanel;