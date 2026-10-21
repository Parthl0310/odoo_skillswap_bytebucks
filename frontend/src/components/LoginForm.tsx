import React, { useState } from 'react';
import {
  Mail,
  Lock,
  User as UserIcon,
  Eye,
  EyeOff,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  ArrowRightLeft,
  ShieldCheck,
  Users,
  MapPin,
  Clock,
  BookOpen,
  Loader2,
  Check,
  Compass
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface LoginFormProps {
  onToggleMode?: () => void;
  isRegister?: boolean;
}

const POPULAR_SKILLS = [
  'React',
  'Python',
  'UI/UX Design',
  'JavaScript',
  'Graphic Design',
  'Data Science',
  'Photography',
  'Machine Learning'
];

const AVAILABILITY_OPTIONS = [
  { id: 'flexible', label: 'Flexible' },
  { id: 'weekdays', label: 'Weekdays' },
  { id: 'weekends', label: 'Weekends' },
  { id: 'evenings', label: 'Evenings' }
];

const LoginForm: React.FC<LoginFormProps> = ({ onToggleMode, isRegister: externalIsRegister }) => {
  const { login, register, isLoading } = useAuth();

  // Internal tab state if controlled or uncontrolled
  const [internalIsRegister, setInternalIsRegister] = useState(externalIsRegister || false);
  const isRegister = externalIsRegister !== undefined ? externalIsRegister : internalIsRegister;

  const setMode = (registerMode: boolean) => {
    setInternalIsRegister(registerMode);
    if (onToggleMode && registerMode !== isRegister) {
      onToggleMode();
    }
  };

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
    location: '',
    availability: 'flexible',
    skillsOffered: [] as string[],
    skillsWanted: [] as string[]
  });

  const [skillInputOffered, setSkillInputOffered] = useState('');
  const [skillInputWanted, setSkillInputWanted] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [demoActive, setDemoActive] = useState<string | null>(null);

  const calculatePasswordStrength = (pass: string) => {
    if (!pass) return { score: 0, text: '', color: 'bg-slate-200' };
    let score = 0;
    if (pass.length >= 6) score += 1;
    if (pass.length >= 8) score += 1;
    if (/[A-Z]/.test(pass) && /[0-9]/.test(pass)) score += 1;
    if (/[^A-Za-z0-9]/.test(pass)) score += 1;

    switch (score) {
      case 1:
        return { score: 1, text: 'Weak (min 6 chars)', color: 'bg-red-500' };
      case 2:
        return { score: 2, text: 'Fair', color: 'bg-amber-500' };
      case 3:
        return { score: 3, text: 'Good', color: 'bg-blue-500' };
      case 4:
      default:
        return { score: 4, text: 'Strong', color: 'bg-emerald-500' };
    }
  };

  const passwordStrength = calculatePasswordStrength(formData.password);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (error) setError('');
  };

  const handleAddSkillOffered = (skillToAdd?: string) => {
    const skill = (skillToAdd || skillInputOffered).trim();
    if (skill && !formData.skillsOffered.includes(skill)) {
      setFormData(prev => ({
        ...prev,
        skillsOffered: [...prev.skillsOffered, skill]
      }));
      setSkillInputOffered('');
    }
  };

  const handleRemoveSkillOffered = (skillToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      skillsOffered: prev.skillsOffered.filter(s => s !== skillToRemove)
    }));
  };

  const handleAddSkillWanted = (skillToAdd?: string) => {
    const skill = (skillToAdd || skillInputWanted).trim();
    if (skill && !formData.skillsWanted.includes(skill)) {
      setFormData(prev => ({
        ...prev,
        skillsWanted: [...prev.skillsWanted, skill]
      }));
      setSkillInputWanted('');
    }
  };

  const handleRemoveSkillWanted = (skillToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      skillsWanted: prev.skillsWanted.filter(s => s !== skillToRemove)
    }));
  };

  const handleQuickDemo = (email: string, pass: string, label: string) => {
    setFormData(prev => ({
      ...prev,
      email,
      password: pass
    }));
    setDemoActive(label);
    setError('');
    setTimeout(() => setDemoActive(null), 2500);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    if (isRegister) {
      if (!formData.name.trim()) {
        setError('Please enter your full name');
        return;
      }
      if (formData.name.trim().length < 2) {
        setError('Name must be at least 2 characters');
        return;
      }
      if (!formData.email.trim() || !formData.email.includes('@')) {
        setError('Please enter a valid email address');
        return;
      }
      if (formData.password.length < 6) {
        setError('Password must be at least 6 characters long');
        return;
      }
      if (formData.password !== formData.confirmPassword) {
        setError('Passwords do not match');
        return;
      }

      const result = await register({
        name: formData.name.trim(),
        email: formData.email.trim(),
        password: formData.password,
        location: formData.location.trim() || undefined,
        availability: formData.availability as any,
        skillsOffered: formData.skillsOffered,
        skillsWanted: formData.skillsWanted,
        isPublic: true
      });

      if (!result.success) {
        setError(result.error || 'Registration failed. Please check your information.');
      }
    } else {
      if (!formData.email.trim()) {
        setError('Please enter your email');
        return;
      }
      if (!formData.password) {
        setError('Please enter your password');
        return;
      }

      const result = await login(formData.email.trim(), formData.password);
      if (!result.success) {
        setError(result.error || 'Invalid email or password');
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800 flex items-center justify-center p-4 sm:p-6 lg:p-8 relative selection:bg-indigo-500 selection:text-white">
      <div className="relative w-full max-w-6xl z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 bg-white border border-slate-200 rounded-3xl shadow-xl overflow-hidden">
          
          {/* LEFT PANEL: Platform Showcase & Value Proposition */}
          <div className="lg:col-span-5 p-8 sm:p-10 lg:p-12 bg-slate-50 border-b lg:border-b-0 lg:border-r border-slate-200 flex flex-col justify-between relative overflow-hidden">
            <div className="relative z-10">
              {/* Logo / Brand Header */}
              <div className="flex items-center space-x-3 mb-10">
                <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center shadow-md shadow-indigo-600/20">
                  <ArrowRightLeft className="w-5 h-5 text-white" />
                </div>
                <div>
                  <span className="text-xl font-bold tracking-tight text-slate-900">
                    SkillSwap
                  </span>
                  <div className="flex items-center space-x-1.5">
                    <span className="text-[10px] font-bold tracking-wider uppercase text-indigo-700 bg-indigo-50 border border-indigo-200 px-1.5 py-0.5 rounded">
                      Platform v2.0
                    </span>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[11px] text-slate-500 font-medium">Live Network</span>
                  </div>
                </div>
              </div>

              {/* Catchy Headline */}
              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 leading-tight mb-4">
                Trade your skills. <br />
                <span className="text-indigo-600">
                  Expand your horizons.
                </span>
              </h2>
              <p className="text-sm sm:text-base text-slate-600 leading-relaxed mb-8">
                Exchange knowledge directly with passionate peers without currency. Teach what you love, master what you need.
              </p>

              {/* Value Feature Cards */}
              <div className="space-y-3.5 mb-10">
                <div className="flex items-start space-x-3.5 p-3.5 rounded-2xl bg-white border border-slate-200 shadow-2xs">
                  <div className="p-2 rounded-xl bg-blue-50 text-blue-600 mt-0.5">
                    <Compass className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">Smart Reciprocal Matching</h4>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Instantly discover partners whose wanted skills match what you have to teach.
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3.5 p-3.5 rounded-2xl bg-white border border-slate-200 shadow-2xs">
                  <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600 mt-0.5">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">Real-Time Chat & Workspace</h4>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Coordinate swap sessions, exchange files, and schedule meetings seamlessly.
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3.5 p-3.5 rounded-2xl bg-white border border-slate-200 shadow-2xs">
                  <div className="p-2 rounded-xl bg-purple-50 text-purple-600 mt-0.5">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">Peer Reviews & Reputation</h4>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Build your verified skill reputation with authentic feedback after every session.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Social Proof / Stats Strip */}
            <div className="relative z-10 pt-6 border-t border-slate-200 flex items-center justify-between text-xs text-slate-600">
              <div className="flex items-center space-x-2">
                <div className="flex -space-x-2 overflow-hidden">
                  <div className="inline-block h-7 w-7 rounded-full ring-2 ring-white bg-gradient-to-tr from-pink-500 to-rose-400 text-[10px] font-bold text-white flex items-center justify-center">S</div>
                  <div className="inline-block h-7 w-7 rounded-full ring-2 ring-white bg-gradient-to-tr from-blue-500 to-cyan-400 text-[10px] font-bold text-white flex items-center justify-center">M</div>
                  <div className="inline-block h-7 w-7 rounded-full ring-2 ring-white bg-gradient-to-tr from-purple-500 to-indigo-400 text-[10px] font-bold text-white flex items-center justify-center">E</div>
                </div>
                <span className="font-medium">500+ Skills Shared</span>
              </div>
              <div className="flex items-center space-x-1 text-amber-500 font-bold">
                <span>★ 4.9/5</span>
                <span className="text-slate-400 font-normal">rating</span>
              </div>
            </div>
          </div>

          {/* RIGHT PANEL: Authentication Form */}
          <div className="lg:col-span-7 p-8 sm:p-10 lg:p-12 flex flex-col justify-center bg-white">
            
            {/* Tab Switcher: Sign In vs Create Account */}
            <div className="flex items-center justify-between mb-8">
              <div className="p-1 bg-slate-100 border border-slate-200 rounded-2xl flex items-center w-full max-w-xs">
                <button
                  type="button"
                  onClick={() => setMode(false)}
                  className={`flex-1 py-2 px-4 rounded-xl text-sm font-bold transition-all ${
                    !isRegister
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => setMode(true)}
                  className={`flex-1 py-2 px-4 rounded-xl text-sm font-bold transition-all ${
                    isRegister
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Create Account
                </button>
              </div>

              {/* Mode indicator label */}
              <span className="hidden sm:inline-block text-xs text-slate-400 font-medium">
                {isRegister ? 'Takes less than 1 min' : 'Welcome back'}
              </span>
            </div>

            {/* Form Title & Subtitle */}
            <div className="mb-6">
              <h3 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                {isRegister ? 'Join the SkillSwap community' : 'Sign in to your account'}
              </h3>
              <p className="text-sm text-slate-500 mt-1">
                {isRegister
                  ? 'Connect with peers ready to exchange their knowledge with you.'
                  : 'Enter your credentials to access your swaps and chat sessions.'}
              </p>
            </div>

            {/* Quick Demo Credentials Strip (for Login Mode) */}
            {!isRegister && (
              <div className="mb-6 p-4 rounded-2xl bg-indigo-50/60 border border-indigo-100">
                <div className="flex items-center justify-between mb-2.5">
                  <div className="flex items-center space-x-1.5 text-xs font-bold text-indigo-900">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Quick Demo Sign-in</span>
                  </div>
                  {demoActive && (
                    <span className="text-[11px] text-emerald-600 font-bold flex items-center space-x-1">
                      <Check className="w-3 h-3" />
                      <span>{demoActive} loaded!</span>
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => handleQuickDemo('sarah.johnson@skillswap.com', 'password123', 'Sarah (User)')}
                    className="px-3 py-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 hover:border-indigo-300 text-left transition-all shadow-2xs group"
                  >
                    <div className="text-[11px] font-bold text-slate-800 group-hover:text-indigo-600">👤 User (Sarah)</div>
                    <div className="text-[10px] text-slate-500 truncate">React & UI/UX Expert</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleQuickDemo('demo@skillswap.com', 'demo123', 'Demo Explorer')}
                    className="px-3 py-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 hover:border-indigo-300 text-left transition-all shadow-2xs group"
                  >
                    <div className="text-[11px] font-bold text-slate-800 group-hover:text-indigo-600">⚡ Explorer</div>
                    <div className="text-[10px] text-slate-500 truncate">demo@skillswap.com</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleQuickDemo('admin@skillswap.com', 'admin123', 'Administrator')}
                    className="px-3 py-2 rounded-xl bg-white hover:bg-slate-50 border border-purple-200 hover:border-purple-300 text-left transition-all shadow-2xs group"
                  >
                    <div className="text-[11px] font-bold text-purple-700 group-hover:text-purple-800">🛡️ Administrator</div>
                    <div className="text-[10px] text-slate-500 truncate">Full Admin Panel</div>
                  </button>
                </div>
              </div>
            )}

            {/* Error Banner */}
            {error && (
              <div className="mb-6 p-4 rounded-2xl bg-red-50 border border-red-200 flex items-start space-x-3 text-red-700 animate-in fade-in duration-150">
                <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-500 mt-0.5" />
                <div className="flex-1 text-sm font-medium leading-snug">{error}</div>
              </div>
            )}

            {/* Success Banner */}
            {successMessage && (
              <div className="mb-6 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-start space-x-3 text-emerald-700 animate-in fade-in duration-150">
                <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-emerald-500 mt-0.5" />
                <div className="flex-1 text-sm font-medium leading-snug">{successMessage}</div>
              </div>
            )}

            {/* Main Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              
              {/* REGISTER ONLY: Name & Location */}
              {isRegister && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Full Name */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                      Full Name <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                        <UserIcon className="w-4 h-4" />
                      </div>
                      <input
                        name="name"
                        type="text"
                        required
                        value={formData.name}
                        onChange={handleChange}
                        className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-10 pr-4 py-3 text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium"
                        placeholder="Alex Morgan"
                        autoComplete="name"
                      />
                    </div>
                  </div>

                  {/* Location */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                      Location <span className="text-slate-400 normal-case font-normal">(Optional)</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                        <MapPin className="w-4 h-4" />
                      </div>
                      <input
                        name="location"
                        type="text"
                        value={formData.location}
                        onChange={handleChange}
                        className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-10 pr-4 py-3 text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium"
                        placeholder="e.g. San Francisco, CA"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Email Address */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Email Address <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    name="email"
                    type="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-10 pr-4 py-3 text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium"
                    placeholder="you@domain.com"
                    autoComplete="email"
                  />
                </div>
              </div>

              {/* Passwords */}
              <div className={`grid grid-cols-1 ${isRegister ? 'sm:grid-cols-2' : ''} gap-4`}>
                
                {/* Password Field */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Password <span className="text-red-500">*</span>
                    </label>
                    {!isRegister && (
                      <button
                        type="button"
                        onClick={() => setError('For demo purposes, you can use the quick-fill buttons above or reset via administrator.')}
                        className="text-xs text-indigo-600 hover:text-indigo-700 font-semibold transition-colors"
                      >
                        Forgot password?
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={formData.password}
                      onChange={handleChange}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-10 pr-10 py-3 text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium"
                      placeholder="At least 6 characters"
                      autoComplete={isRegister ? 'new-password' : 'current-password'}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>

                  {/* Password Strength Indicator (Register Mode) */}
                  {isRegister && formData.password.length > 0 && (
                    <div className="mt-2 space-y-1">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-500">Strength:</span>
                        <span className="font-semibold text-slate-700">{passwordStrength.text}</span>
                      </div>
                      <div className="grid grid-cols-4 gap-1 h-1.5 w-full">
                        <div className={`h-full rounded-full ${passwordStrength.score >= 1 ? passwordStrength.color : 'bg-slate-200'}`} />
                        <div className={`h-full rounded-full ${passwordStrength.score >= 2 ? passwordStrength.color : 'bg-slate-200'}`} />
                        <div className={`h-full rounded-full ${passwordStrength.score >= 3 ? passwordStrength.color : 'bg-slate-200'}`} />
                        <div className={`h-full rounded-full ${passwordStrength.score >= 4 ? passwordStrength.color : 'bg-slate-200'}`} />
                      </div>
                    </div>
                  )}
                </div>

                {/* Confirm Password (Register Mode) */}
                {isRegister && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                        Confirm Password <span className="text-red-500">*</span>
                      </label>
                      {formData.confirmPassword && (
                        <span className="text-[11px] flex items-center space-x-1 font-semibold">
                          {formData.password === formData.confirmPassword ? (
                            <span className="text-emerald-600 flex items-center space-x-0.5">
                              <Check className="w-3 h-3" />
                              <span>Matches</span>
                            </span>
                          ) : (
                            <span className="text-red-500">Mismatch</span>
                          )}
                        </span>
                      )}
                    </div>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                        <Lock className="w-4 h-4" />
                      </div>
                      <input
                        name="confirmPassword"
                        type={showConfirmPassword ? 'text' : 'password'}
                        required
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        className={`w-full bg-slate-50 border rounded-xl pl-10 pr-10 py-3 text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 transition-all font-medium ${
                          formData.confirmPassword && formData.password !== formData.confirmPassword
                            ? 'border-red-400 focus:ring-red-400/20 focus:border-red-500'
                            : 'border-slate-300 focus:ring-indigo-500/20 focus:border-indigo-500'
                        }`}
                        placeholder="Re-enter password"
                        autoComplete="new-password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                        tabIndex={-1}
                      >
                        {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* REGISTER ONLY: Availability & Skills */}
              {isRegister && (
                <>
                  {/* Availability */}
                  <div className="pt-2">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                      When are you usually available for swaps?
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {AVAILABILITY_OPTIONS.map(opt => (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, availability: opt.id }))}
                          className={`py-2 px-3 rounded-xl text-xs font-semibold border text-center transition-all ${
                            formData.availability === opt.id
                              ? 'bg-indigo-50 border-indigo-300 text-indigo-700 shadow-xs'
                              : 'bg-slate-50 border-slate-200 text-slate-600 hover:text-slate-800 hover:border-slate-300'
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Skills You Can Offer */}
                  <div className="pt-2">
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                        Skills You Can Teach / Offer
                      </label>
                      <span className="text-[11px] text-slate-400 font-medium">Press enter or pick tags</span>
                    </div>

                    <div className="flex items-center space-x-2 mb-2">
                      <input
                        type="text"
                        value={skillInputOffered}
                        onChange={e => setSkillInputOffered(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddSkillOffered();
                          }
                        }}
                        placeholder="e.g. React, Python, Guitar..."
                        className="flex-1 bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-medium"
                      />
                      <button
                        type="button"
                        onClick={() => handleAddSkillOffered()}
                        className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white transition-colors"
                      >
                        Add
                      </button>
                    </div>

                    {/* Selected Tags */}
                    {formData.skillsOffered.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5 mb-2.5">
                        {formData.skillsOffered.map(skill => (
                          <span
                            key={skill}
                            className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200"
                          >
                            <span>{skill}</span>
                            <button
                              type="button"
                              onClick={() => handleRemoveSkillOffered(skill)}
                              className="text-emerald-500 hover:text-emerald-800"
                            >
                              ×
                            </button>
                          </span>
                        ))}
                      </div>
                    ) : (
                      /* Suggested popular tags */
                      <div className="flex flex-wrap gap-1.5 mb-2.5">
                        <span className="text-[11px] text-slate-400 mr-1 self-center font-medium">Popular:</span>
                        {POPULAR_SKILLS.slice(0, 5).map(skill => (
                          <button
                            key={skill}
                            type="button"
                            onClick={() => handleAddSkillOffered(skill)}
                            className="text-[11px] px-2.5 py-0.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition-colors font-medium"
                          >
                            + {skill}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Skills You Want to Learn */}
                  <div className="pt-1">
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                        Skills You Want to Learn
                      </label>
                      <span className="text-[11px] text-slate-400 font-medium">What do you want to learn?</span>
                    </div>

                    <div className="flex items-center space-x-2 mb-2">
                      <input
                        type="text"
                        value={skillInputWanted}
                        onChange={e => setSkillInputWanted(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddSkillWanted();
                          }
                        }}
                        placeholder="e.g. Machine Learning, Public Speaking..."
                        className="flex-1 bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-medium"
                      />
                      <button
                        type="button"
                        onClick={() => handleAddSkillWanted()}
                        className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white transition-colors"
                      >
                        Add
                      </button>
                    </div>

                    {formData.skillsWanted.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mb-2">
                        {formData.skillsWanted.map(skill => (
                          <span
                            key={skill}
                            className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200"
                          >
                            <span>{skill}</span>
                            <button
                              type="button"
                              onClick={() => handleRemoveSkillWanted(skill)}
                              className="text-indigo-400 hover:text-indigo-700"
                            >
                              ×
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}

              {/* Submit CTA Button */}
              <div className="pt-3">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3.5 px-6 rounded-xl shadow-xs transition-colors flex items-center justify-center space-x-2 disabled:opacity-50"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>{isRegister ? 'Creating your account...' : 'Authenticating...'}</span>
                    </>
                  ) : (
                    <>
                      <span>{isRegister ? 'Create My Account' : 'Sign In to SkillSwap'}</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>

              {/* Bottom Mode Switcher Link */}
              <div className="text-center pt-4">
                <p className="text-xs sm:text-sm text-slate-500">
                  {isRegister ? 'Already have an account?' : "Don't have an account yet?"}{' '}
                  <button
                    type="button"
                    onClick={() => setMode(!isRegister)}
                    className="font-bold text-indigo-600 hover:text-indigo-700 hover:underline transition-colors"
                  >
                    {isRegister ? 'Sign In instead' : 'Create an account for free'}
                  </button>
                </p>
              </div>
            </form>
          </div>
        </div>

        {/* Minimal Footer */}
        <div className="mt-8 text-center text-xs text-slate-400 flex items-center justify-center space-x-4">
          <span>© 2026 SkillSwap Platform</span>
          <span>•</span>
          <span>Reciprocal Skill Exchange</span>
          <span>•</span>
          <span>Safe & Verified</span>
        </div>
      </div>
    </div>
  );
};

export default LoginForm;