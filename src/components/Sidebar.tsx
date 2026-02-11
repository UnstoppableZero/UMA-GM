// src/components/Sidebar.tsx
import { Link, useLocation } from 'react-router-dom';

export function Sidebar() {
  const location = useLocation(); // Hook to get current URL

  return (
    <div style={{
      width: '250px',
      minHeight: '100vh',
      flexShrink: 0,
      backgroundColor: '#1a252f', // Dark blue-grey
      color: 'white',
      padding: '20px',
      boxSizing: 'border-box',
      display: 'flex',
      flexDirection: 'column'
    }}>
      <h2 style={{ marginBottom: '30px', color: '#ecf0f1', textAlign: 'center', borderBottom: '1px solid #34495e', paddingBottom: '20px' }}>
        🐴 UmaGM
      </h2>
      
      <nav style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
        
        {/* MAIN MANAGEMENT */}
        <div style={sectionTitle}>MY STABLE</div>
        <NavLink to="/" label="Dashboard" icon="📊" active={location.pathname === '/'} />
        <NavLink to="/roster" label="Roster" icon="🐎" active={location.pathname === '/roster'} />
        <NavLink to="/scout" label="Scouting" icon="🔍" active={location.pathname === '/scout'} />

        {/* LEAGUE & WORLD */}
        <div style={{ ...sectionTitle, marginTop: '20px' }}>LEAGUE</div>
        <NavLink to="/league" label="Standings" icon="🏆" active={location.pathname === '/league'} />
        <NavLink to="/calendar" label="Schedule" icon="📅" active={location.pathname === '/calendar'} />
        <NavLink to="/history" label="History" icon="🏛️" active={location.pathname === '/history'} />
        <NavLink to="/hof" label="Hall of Fame" icon="🌟" active={location.pathname === '/hof'} />

        {/* SYSTEM */}
        <div style={{ marginTop: 'auto', paddingTop: '20px', borderTop: '1px solid #34495e', display: 'flex', flexDirection: 'column', gap: '5px' }}>
           <NavLink to="/settings" label="Settings" icon="⚙️" active={location.pathname === '/settings'} />
           
           {/* NEW DEV TOOLS LINK */}
           <NavLink to="/devtools" label="Dev Tools" icon="🛠️" active={location.pathname === '/devtools'} />
        </div>

      </nav>
    </div>
  );
}

// --- HELPER COMPONENTS ---

const sectionTitle: React.CSSProperties = {
  fontSize: '11px',
  fontWeight: 'bold',
  color: '#7f8c8d',
  letterSpacing: '1px',
  marginBottom: '5px',
  paddingLeft: '10px'
};

const NavLink = ({ to, label, icon, active }: { to: string, label: string, icon: string, active: boolean }) => (
  <Link to={to} style={{
    display: 'flex', alignItems: 'center', gap: '10px',
    padding: '10px 15px',
    borderRadius: '6px',
    textDecoration: 'none',
    fontSize: '15px',
    transition: 'all 0.2s',
    // Dynamic Styling based on 'active' prop
    backgroundColor: active ? '#3498db' : 'transparent', // Blue if active
    color: active ? 'white' : '#bdc3c7',                 // White if active, Grey if not
    fontWeight: active ? 'bold' : 'normal',
    borderLeft: active ? '4px solid white' : '4px solid transparent' // Visual indicator
  }}>
    <span>{icon}</span>
    <span>{label}</span>
  </Link>
);