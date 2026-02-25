// src/App.tsx
import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Sidebar } from './components/Sidebar';
import { DashboardPage } from './pages/DashboardPage';
import { RosterPage } from './pages/RosterPage';
import { initGame } from './db';
import { LeaguePage } from './pages/LeaguePage';
import { TeamPage } from './pages/TeamPage';
import { ProfilePage } from './pages/ProfilePage';
import { HistoryPage } from './pages/HistoryPage';
import { HallOfFamePage } from './pages/HallOfFamePage';
import { ScoutPage } from './pages/ScoutPage';
import { CreateUmaPage } from './pages/CreateUmaPage';
import { EditUmaPage } from './pages/EditUmaPage';
import { CalendarPage } from './pages/CalendarPage';
import { DevToolsPage } from './pages/DevToolsPage';
import { LeagueRosterPage } from './pages/LeagueRosterPage';
import { AwardsRacePage } from './pages/AwardsRacePage';

function App() {
  useEffect(() => { initGame(); }, []);

  return (
    <Router>
      <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: 'var(--bg-base)' }}>
        <Sidebar />
        <div style={{ flexGrow: 1, padding: '40px', backgroundColor: 'var(--bg-base)', color: 'var(--text-primary)' }}>

          <Routes>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/roster" element={<RosterPage />} />
            <Route path="/league" element={<LeaguePage />} />
            <Route path="/team/:id" element={<TeamPage />} />
            <Route path="/settings" element={<div><h1>Settings</h1></div>} />
            <Route path="/uma/:id" element={<ProfilePage />} />
            <Route path="/history" element={<HistoryPage />} />
            <Route path="/hof" element={<HallOfFamePage />} />
            <Route path="/scout" element={<ScoutPage />} />
            <Route path="/create" element={<CreateUmaPage />} />
            <Route path="/edit/:id" element={<EditUmaPage />} />
            <Route path="/calendar" element={<CalendarPage />} />
            <Route path="/devtools" element={<DevToolsPage />} />
            <Route path="/league-roster" element={<LeagueRosterPage />} />
            <Route path="/awards" element={<AwardsRacePage />} />
          </Routes>

        </div>
      </div>
    </Router>
  );
}

export default App;