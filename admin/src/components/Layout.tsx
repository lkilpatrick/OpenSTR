import { useNavigate, NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import PropertySwitcher from './PropertySwitcher';

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    navigate('/login');
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', fontFamily: 'system-ui, sans-serif' }}>
      {/* Sidebar */}
      <aside style={{ width: 220, background: '#1e293b', color: '#fff', display: 'flex', flexDirection: 'column', padding: '24px 0' }}>
        <div style={{ padding: '0 20px 24px' }}>
          <h2 style={{ margin: 0, fontSize: 18, color: '#60a5fa' }}>OpenSTR</h2>
          <PropertySwitcher />
        </div>

        <nav style={{ flex: 1 }}>
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              style={({ isActive }) => navStyle(isActive)}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div style={{ padding: '0 20px' }}>
          <p style={{ fontSize: 13, color: '#94a3b8', marginBottom: 8 }}>{user?.name}</p>
          <button onClick={handleLogout} style={logoutStyle}>Sign Out</button>
        </div>
      </aside>

      {/* Main content */}
      <main style={{ flex: 1, background: '#f8fafc', padding: 32, overflowY: 'auto' }}>
        <Outlet />
      </main>
    </div>
  );
}

const NAV_ITEMS = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/sessions', label: 'Sessions' },
  { to: '/checklists', label: 'Checklists' },
  { to: '/issues', label: 'Issues & Messages' },
  { to: '/cleaners', label: 'Cleaner Performance' },
  { to: '/standards', label: 'Standards' },
  { to: '/properties', label: 'Properties' },
];

function navStyle(isActive: boolean): React.CSSProperties {
  return {
    display: 'block', padding: '10px 20px', color: isActive ? '#fff' : '#94a3b8',
    textDecoration: 'none', background: isActive ? 'rgba(255,255,255,.1)' : 'transparent',
    fontWeight: isActive ? 600 : 400, fontSize: 14,
  };
}

const logoutStyle: React.CSSProperties = {
  background: 'transparent', border: '1px solid #475569', color: '#94a3b8',
  borderRadius: 6, padding: '6px 12px', fontSize: 13, cursor: 'pointer', width: '100%',
};
