'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import api from '@/app/api/axios';
import { useAuthProtection } from '@/app/hooks/useAuthProtection';

interface TestSettings {
  duration: number;
  maxAttempts: number;
  enableProctor: boolean;
  enableTimer: boolean;
  tabSwitch: boolean;
  camera: boolean;
  microphone: boolean;
  fullScreen: boolean;
  multiMonitor: boolean;
  photosRandom: boolean;
  startTime: string;
  endTime: string;
  showResult: string;
}

interface ExamDetails {
  id: number;
  title: string;
  testLink: string;
}

export default function TestSettingsPage() {
  useAuthProtection();

  const params = useParams();
  const router = useRouter();
  const examId = params.examId as string;

  const [examDetails, setExamDetails] = useState<ExamDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [testLink, setTestLink] = useState<string>('');

  const [settings, setSettings] = useState<TestSettings>({
    duration: 60,
    maxAttempts: 1,
    enableProctor: false,
    enableTimer: true,
    tabSwitch: false,
    camera: false,
    microphone: false,
    fullScreen: false,
    multiMonitor: false,
    photosRandom: false,
    startTime: '',
    endTime: '',
    showResult: 'IMMEDIATELY',
  });

  useEffect(() => {
    const loadExamDetails = async () => {
      try {
        setLoading(true);
        const response = await api.get(`/exam/${examId}`);
        const data = response.data;
        setExamDetails({
          id: data.examId || data.id,
          title: data.title,
          testLink: data.testLink || '',
        });
        setTestLink(data.testLink || '');

        // Load existing settings if available
        if (data.settings) {
          setSettings(prev => ({
            ...prev,
            duration: data.settings.duration || prev.duration,
            maxAttempts: data.settings.maxAttempts || prev.maxAttempts,
            enableProctor: data.settings.enableProctor ?? prev.enableProctor,
            enableTimer: data.settings.enableTimer ?? prev.enableTimer,
            tabSwitch: data.settings.tabSwitch ?? prev.tabSwitch,
            camera: data.settings.camera ?? prev.camera,
            microphone: data.settings.microphone ?? prev.microphone,
            fullScreen: data.settings.fullScreen ?? prev.fullScreen,
            multiMonitor: data.settings.multiMonitor ?? prev.multiMonitor,
            photosRandom: data.settings.photosRandom ?? prev.photosRandom,
            startTime: data.settings.startTime ? data.settings.startTime.slice(0, 16) : '',
            endTime: data.settings.endTime ? data.settings.endTime.slice(0, 16) : '',
            showResult: data.settings.showResult || 'IMMEDIATELY',
          }));
        }
      } catch (err: any) {
        console.error('Error loading exam details:', err);
        setExamDetails({
          id: parseInt(examId),
          title: 'Exam',
          testLink: '',
        });
      } finally {
        setLoading(false);
      }
    };

    if (examId) {
      loadExamDetails();
    }
  }, [examId]);

  const handleSettingChange = (key: keyof TestSettings, value: any) => {
    setSettings((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleCopyLink = () => {
    if (!testLink) return;
    const fullLink = `${window.location.origin}/attempt/${testLink}`;
    navigator.clipboard.writeText(fullLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveSettings = async () => {
    try {
      setSaving(true);
      setError(null);
      setSuccessMsg(null);

      await api.post(`/settings`, {
        examId: parseInt(examId),
        ...settings,
      });

      // Refresh exam details to get updated test link
      try {
        const res = await api.get(`/exam/${examId}`);
        if (res.data.testLink) {
          setTestLink(res.data.testLink);
          setExamDetails(prev => prev ? { ...prev, testLink: res.data.testLink } : prev);
        }
      } catch (e) {
        // ignore
      }

      setSuccessMsg('Settings saved successfully!');
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err) {
      console.error('Error saving settings:', err);
      setError('Failed to save settings. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (!examDetails) {
    return (
      <div className="min-h-screen bg-slate-50 flex justify-center items-center">
        <div className="text-xl font-semibold text-red-600">Exam not found</div>
      </div>
    );
  }

  const fullTestLink = testLink ? `${typeof window !== 'undefined' ? window.location.origin : ''}/attempt/${testLink}` : '';

  return (
    <div className="min-h-screen bg-[#fafaf7] font-sans text-[#23201a]">
      {/* Header */}
      <header className="bg-white border-b border-[#ece7df] sticky top-0 z-10 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-20 items-center">
            <h1 className="text-2xl font-bold font-serif">Test Settings</h1>
            <button
              onClick={() => router.push(`/dashboard/exam/${examId}`)}
              className="px-5 py-2 border border-[#3b7c5c] rounded-lg text-base font-semibold text-[#3b7c5c] bg-white hover:bg-[#f3f0e7] transition-colors flex items-center gap-2"
            >
              <span className="text-xl">←</span> Back to Exam
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
        {/* Student Test Link Section */}
        <div className="bg-white p-8 rounded-2xl shadow border border-[#ece7df] mb-8">
          <h2 className="text-xl font-bold font-serif mb-6">Student Test Link</h2>
          <div className="flex flex-col md:flex-row gap-4 items-center">
            <input
              readOnly
              value={fullTestLink || 'Link will be generated after saving'}
              className="flex-1 px-4 py-3 bg-[#f5f5f2] border border-[#b3b3a8] rounded-lg text-[#23201a] font-mono text-base outline-none"
            />
            <button
              onClick={handleCopyLink}
              disabled={!testLink}
              className={`px-6 py-3 rounded-lg font-semibold text-base transition-colors shadow border ${
                copied
                  ? 'bg-[#eafaf1] text-[#217a4a] border-[#3b7c5c]'
                  : testLink
                  ? 'bg-[#3b7c5c] text-white border-[#3b7c5c] hover:bg-[#2e6248]'
                  : 'bg-[#ece7df] text-[#b3b3a8] border-[#ece7df] cursor-not-allowed'
              }`}
            >
              {copied ? '✓ Copied' : <span className="flex items-center gap-2"> Copy Link</span>}
            </button>
          </div>
          <p className="mt-2 text-sm text-[#7c766a] font-sans">Share this link with students to let them take the exam.</p>
        </div>

        {/* Alert Messages */}
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl flex items-center gap-3">
            <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            {error}
          </div>
        )}
        {successMsg && (
          <div className="p-4 bg-green-50 border border-green-200 text-green-700 rounded-xl flex items-center gap-3">
            <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
            {successMsg}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Basic & Scheduling */}
          <div className="space-y-8">
            {/* Basic Settings */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
              <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
                <span className="w-8 h-8 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center text-sm font-sans">⚙️</span>
                Basic Settings
              </h3>

              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2 font-sans">Duration (minutes)</label>
                  <input
                    type="number"
                    min="1"
                    value={settings.duration}
                    onChange={(e) => handleSettingChange('duration', parseInt(e.target.value))}
                    className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2 font-sans">Maximum Attempts</label>
                  <input
                    type="number"
                    min="1"
                    value={settings.maxAttempts}
                    onChange={(e) => handleSettingChange('maxAttempts', parseInt(e.target.value))}
                    className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all outline-none"
                  />
                  <p className="text-xs text-slate-400 mt-1 font-sans">How many times a student can attempt this exam</p>
                </div>
              </div>
            </div>

            {/* Scheduling Settings */}
            <div className="bg-[#fafdff] p-6 rounded-2xl shadow border border-[#e3eafc]">
              <div className="flex items-center gap-3 mb-4">
                <span className="w-9 h-9 bg-[#fff7d6] text-[#f7c873] rounded-lg flex items-center justify-center text-2xl">
                  <svg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='currentColor' className='w-6 h-6'><path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' /></svg>
                </span>
                <h3 className="text-xl font-bold text-[#23201a] font-serif">Scheduling</h3>
              </div>
              <div className="space-y-5">
                <div>
                  <label className="block text-base font-semibold text-[#23201a] mb-2">Can't start before</label>
                  <input
                    type="datetime-local"
                    value={settings.startTime}
                    onChange={(e) => handleSettingChange('startTime', e.target.value)}
                    className="w-full px-4 py-3 border border-[#b3b3a8] rounded-lg bg-white text-[#23201a] focus:outline-none focus:ring-2 focus:ring-[#3b7c5c] text-base"
                    placeholder="dd / mm / yyyy, --:-- --"
                  />
                  <p className="text-xs text-[#7c766a] mt-1 font-sans">Students cannot start the exam before this date &amp; time</p>
                </div>
                <div>
                  <label className="block text-base font-semibold text-[#23201a] mb-2">Can't start after</label>
                  <input
                    type="datetime-local"
                    value={settings.endTime}
                    onChange={(e) => handleSettingChange('endTime', e.target.value)}
                    className="w-full px-4 py-3 border border-[#b3b3a8] rounded-lg bg-white text-[#23201a] focus:outline-none focus:ring-2 focus:ring-[#3b7c5c] text-base"
                    placeholder="dd / mm / yyyy, --:-- --"
                  />
                  <p className="text-xs text-[#7c766a] mt-1 font-sans">Students cannot start the exam after this date &amp; time</p>
                </div>
              </div>
            </div>

            {/* Result Visibility */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
              <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
                
                Result Visibility
              </h3>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-3 font-sans">Show result to the user</label>
                <div className="space-y-3">
                  <label
                    className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                      settings.showResult === 'IMMEDIATELY'
                        ? 'border-purple-500 bg-purple-50'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="showResult"
                      value="IMMEDIATELY"
                      checked={settings.showResult === 'IMMEDIATELY'}
                      onChange={(e) => handleSettingChange('showResult', e.target.value)}
                      className="w-5 h-5 text-purple-600 accent-purple-600"
                    />
                    <div>
                      <span className="font-semibold text-slate-800">Immediately</span>
                      <p className="text-xs text-slate-500 mt-0.5 font-sans">Students see their score right after submitting the exam</p>
                    </div>
                  </label>
                  <label
                    className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                      settings.showResult === 'NEVER'
                        ? 'border-purple-500 bg-purple-50'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="showResult"
                      value="NEVER"
                      checked={settings.showResult === 'NEVER'}
                      onChange={(e) => handleSettingChange('showResult', e.target.value)}
                      className="w-5 h-5 text-purple-600 accent-purple-600"
                    />
                    <div>
                      <span className="font-semibold text-slate-800">Never (Manual Publish)</span>
                      <p className="text-xs text-slate-500 mt-0.5 font-sans">Results are hidden until you manually publish them from the exam page</p>
                    </div>
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Proctoring & Timer */}
          <div className="space-y-8">
            {/* Proctoring Settings */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
              <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
                <span className="w-8 h-8 bg-red-100 text-red-600 rounded-lg flex items-center justify-center text-sm font-sans">🛡️</span>
                Proctoring Settings
              </h3>

              <div className="space-y-4">
                <label className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer hover:bg-slate-100 transition-colors">
                  <input
                    type="checkbox"
                    checked={settings.enableProctor}
                    onChange={(e) => handleSettingChange('enableProctor', e.target.checked)}
                    className="w-5 h-5 accent-purple-600"
                  />
                  <div>
                    <span className="font-semibold text-slate-800">Enable Proctoring</span>
                    <p className="text-xs text-slate-500 font-sans">Monitor student behaviour during the exam</p>
                  </div>
                </label>

                {settings.enableProctor && (
                  <div className="ml-2 space-y-3 border-l-2 border-purple-200 pl-4">
                    {[
                      { key: 'camera' as keyof TestSettings, label: 'Require Camera', desc: 'Face detection & identity verification' },
                      { key: 'microphone' as keyof TestSettings, label: 'Require Microphone', desc: 'Background noise monitoring' },
                      { key: 'tabSwitch' as keyof TestSettings, label: 'Detect Tab Switches', desc: 'Alert when students leave the exam tab' },
                      { key: 'fullScreen' as keyof TestSettings, label: 'Require Fullscreen', desc: 'Force fullscreen mode during the exam' },
                      { key: 'multiMonitor' as keyof TestSettings, label: 'Detect Multiple Monitors', desc: 'Detect if student has multiple screens' },
                      { key: 'photosRandom' as keyof TestSettings, label: 'Take Random Photos', desc: 'Capture periodic snapshots during exam' },
                    ].map(item => (
                      <label key={item.key} className="flex items-center gap-3 p-3 rounded-lg cursor-pointer hover:bg-slate-50 transition-colors">
                        <input
                          type="checkbox"
                          checked={settings[item.key] as boolean}
                          onChange={(e) => handleSettingChange(item.key, e.target.checked)}
                          className="w-4 h-4 accent-purple-600"
                        />
                        <div>
                          <span className="text-sm font-medium text-slate-700 font-sans">{item.label}</span>
                          <p className="text-xs text-slate-400 font-sans">{item.desc}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Timer Settings */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
              <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
                <span className="w-8 h-8 bg-purple-100 text-purple-600 rounded-lg flex items-center justify-center text-sm font-sans">⏱️</span>
                Timer Settings
              </h3>

              <label className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer hover:bg-slate-100 transition-colors">
                <input
                  type="checkbox"
                  checked={settings.enableTimer}
                  onChange={(e) => handleSettingChange('enableTimer', e.target.checked)}
                  className="w-5 h-5 accent-purple-600"
                />
                <div>
                  <span className="font-semibold text-slate-800">Show Timer to Students</span>
                  <p className="text-xs text-slate-500 font-sans">Display a countdown timer during the exam. Auto-submits when time runs out.</p>
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 pt-2">
          <button
            type="button"
            onClick={() => router.push(`/dashboard/exam/${examId}`)}
            className="px-8 py-3 border border-slate-300 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors font-sans"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSaveSettings}
            disabled={saving}
            className="px-8 py-3 bg-gradient-to-r text-white border-[#3b7c5c] bg-[#2e6248] rounded-xl text-sm font-bold shadow-lg hover:bg-[#27523c] disabled:opacity-50 font-sans"
          >
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </main>
    </div>
  );
}
