import React, { useState } from 'react';
import { RadarProvider, useRadar } from './context/RadarContext';
import { Header } from './components/common/Header';
import { RoleSelectScreen } from './components/auth/RoleSelectScreen';
import { CoachGroupsHub } from './components/coach/CoachGroupsHub';
import { CoachDashboard } from './components/coach/CoachDashboard';
import { RunnerView } from './components/runner/RunnerView';
import { AlertsDrawer } from './components/coach/AlertsDrawer';
import { AthleteDetailModal } from './components/coach/AthleteDetailModal';

const AppContent: React.FC = () => {
  const { userRole, selectedGroupId, athletes, selectedAthleteId, setSelectedAthleteId } = useRadar();
  const [isAlertsOpen, setIsAlertsOpen] = useState(false);

  const selectedAthlete = athletes.find(a => a.id === selectedAthleteId) || null;

  // Si no se ha seleccionado rol, mostrar la pantalla de Login / Selección
  if (!userRole) {
    return <RoleSelectScreen />;
  }

  return (
    <div className="min-h-screen bg-[#0B0F19] text-slate-100 flex flex-col font-['Inter',sans-serif]">
      {/* Header */}
      <Header
        onOpenAlerts={() => setIsAlertsOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 pb-16">
        {userRole === 'coach' ? (
          selectedGroupId ? (
            <CoachDashboard />
          ) : (
            <CoachGroupsHub />
          )
        ) : (
          <RunnerView />
        )}
      </main>

      {/* Alerts Drawer */}
      {isAlertsOpen && (
        <AlertsDrawer
          onClose={() => setIsAlertsOpen(false)}
          onSelectAthlete={(id) => setSelectedAthleteId(id)}
        />
      )}

      {/* Global Athlete Detail Modal */}
      {selectedAthlete && userRole === 'coach' && (
        <AthleteDetailModal
          athlete={selectedAthlete}
          onClose={() => setSelectedAthleteId(null)}
        />
      )}
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <RadarProvider>
      <AppContent />
    </RadarProvider>
  );
};

export default App;
