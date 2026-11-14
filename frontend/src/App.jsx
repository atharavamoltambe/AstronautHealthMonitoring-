import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import HumanBodyVitals from './components/HumanBodyVitals';
import AIAssessment from './components/AIAssessment';
import Login from './components/Login';
import { 
  ensureAuthToken, 
  fetchMissions, 
  fetchMissionDays, 
  fetchVitalsSummary, 
  fetchHealthRecords, 
  fetchChecklists, 
  updateChecklist,
  fetchAssessments,
  createMission,
  createMissionDay,
  logoutAstronaut,
  getStoredAstronaut,
  DEFAULT_MISSION_DAY_ID
} from './services/api';
import { Menu, X, Satellite, Radio } from 'lucide-react';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Core Data States
  const [loading, setLoading] = useState(true);
  const [missions, setMissions] = useState([]);
  const [activeMission, setActiveMission] = useState(null);
  const [missionDays, setMissionDays] = useState([]);
  const [activeDay, setActiveDay] = useState(null);
  const [vitalsSummary, setVitalsSummary] = useState(null);
  const [healthRecords, setHealthRecords] = useState([]);
  const [checklists, setChecklists] = useState([]);
  const [assessments, setAssessments] = useState([]);

  // Check existing session on mount
  useEffect(() => {
    const token = localStorage.getItem('novaguard_token');
    const storedUser = getStoredAstronaut();
    if (token) {
      setIsAuthenticated(true);
      setCurrentUser(storedUser || {
        name: 'Cmdr. Alex Carter',
        callSign: 'ORION-LEAD',
        role: 'Commander',
        missionName: 'Artemis III - Lunar Base',
      });
      loadData();
    } else {
      setLoading(false);
    }
  }, []);

  // Load telemetry data from backend
  const loadData = async () => {
    setLoading(true);
    try {
      await ensureAuthToken();

      // Fetch missions
      let mList = await fetchMissions();
      let currentMission = mList[0] || null;

      // If this astronaut has no missions yet, automatically provision one
      if (!currentMission) {
        const storedUser = getStoredAstronaut();
        const missionName = storedUser?.missionName || 'Artemis Exploration Mission';
        currentMission = await createMission({
          name: missionName,
          description: `Spaceflight health monitoring for ${storedUser?.name || 'Astronaut'}`,
          start_date: new Date().toISOString().split('T')[0],
        });
        mList = [currentMission];
      }

      setMissions(mList);
      setActiveMission(currentMission);

      // Fetch flight days for current mission
      let days = await fetchMissionDays(currentMission.id);
      let currentDay = days[0] || null;

      // If flight days are empty, automatically provision Flight Day 1
      if (!currentDay) {
        currentDay = await createMissionDay(currentMission.id, {
          day_number: 1,
          date: new Date().toISOString().split('T')[0],
          notes: 'Flight Day 1 Initial Telemetry Ingestion',
        });
        days = [currentDay];
      }

      setMissionDays(days);
      setActiveDay(currentDay);

      const dayId = currentDay.id;

      // Fetch flight day specific records in parallel
      const [summaryData, recordsData, checklistData, assessmentData] = await Promise.all([
        fetchVitalsSummary(dayId).catch(() => null),
        fetchHealthRecords(dayId).catch(() => []),
        fetchChecklists(dayId).catch(() => []),
        fetchAssessments(dayId).catch(() => []),
      ]);

      setVitalsSummary(summaryData);
      setHealthRecords(recordsData);
      setChecklists(checklistData);
      setAssessments(assessmentData);
    } catch (err) {
      console.error('Error loading mission telemetry:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLoginSuccess = (userData) => {
    setCurrentUser(userData);
    setIsAuthenticated(true);
    loadData();
  };

  const handleLogout = () => {
    logoutAstronaut();
    setIsAuthenticated(false);
    setCurrentUser(null);
    setActiveTab('dashboard');
  };

  const handleToggleChecklist = async (id, isCompleted) => {
    try {
      await updateChecklist(id, isCompleted);
      setChecklists(prev => prev.map(c => c.id === id ? { ...c, is_completed: isCompleted } : c));
    } catch (err) {
      console.error('Failed to update checklist item:', err);
    }
  };

  const activeMissionDayId = activeDay?.id || DEFAULT_MISSION_DAY_ID;

  // Render Login Screen if not authenticated
  if (!isAuthenticated) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="min-h-screen bg-[#060b18] text-slate-100 flex flex-col md:flex-row antialiased selection:bg-cyan-500 selection:text-black">
      
      {/* Mobile Top Header */}
      <div className="md:hidden flex items-center justify-between p-4 bg-[#0a1226] border-b border-cyan-500/20">
        <div className="flex items-center space-x-2">
          <Satellite className="w-5 h-5 text-cyan-400" />
          <span className="font-mono font-bold text-white tracking-wider">NovaGuard</span>
        </div>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-1.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-300"
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Desktop & Mobile Sidebar */}
      <div className={`${mobileMenuOpen ? 'block' : 'hidden'} md:block z-40`}>
        <Sidebar 
          activeTab={activeTab} 
          onSelectTab={(tab) => {
            setActiveTab(tab);
            setMobileMenuOpen(false);
          }}
          currentUser={currentUser}
          onLogout={handleLogout}
        />
      </div>

      {/* Main Content Viewport */}
      <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full overflow-y-auto">
        {loading ? (
          <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
            <div className="relative">
              <div className="w-12 h-12 rounded-full border-2 border-cyan-500/20 border-t-cyan-400 animate-spin"></div>
              <Satellite className="w-5 h-5 text-cyan-400 absolute inset-0 m-auto animate-pulse" />
            </div>
            <p className="text-xs font-mono text-cyan-400 tracking-widest uppercase">
              Streaming Telemetry for {currentUser?.name || 'Astronaut'}...
            </p>
          </div>
        ) : (
          <>
            {activeTab === 'dashboard' && (
              <Dashboard
                missions={missions}
                activeMission={activeMission}
                activeDay={activeDay}
                vitalsSummary={vitalsSummary}
                checklists={checklists}
                onToggleChecklist={handleToggleChecklist}
                assessments={assessments}
                onNavigate={(tab) => setActiveTab(tab)}
              />
            )}

            {activeTab === 'scanner' && (
              <HumanBodyVitals
                missionDayId={activeMissionDayId}
                vitalsSummary={vitalsSummary}
                healthRecords={healthRecords}
                onRefresh={loadData}
              />
            )}

            {activeTab === 'ai' && (
              <AIAssessment
                missionDayId={activeMissionDayId}
                assessments={assessments}
                onRefresh={loadData}
              />
            )}
          </>
        )}
      </main>

    </div>
  );
}
