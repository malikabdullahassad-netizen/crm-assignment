// Navbar.tsx
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();

  return (
    <nav className="navbar">
      <h2 className="navbar__brand">Lead Manager</h2>
      <div className="nav-user">
        <span className="nav-user__name">{user?.name || 'User'}</span>
        <button type="button" className="logout-button" onClick={logout}>
          Logout
        </button>
      </div>
    </nav>
  );
}