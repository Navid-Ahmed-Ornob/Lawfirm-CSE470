// Top navigation bar: role-based menu and logout.
import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const MENUS = {
    client: [
        { to: '/appointments', label: 'Appointments' },
        { to: '/documents', label: 'Documents' },
    ],
    lawyer: [
        { to: '/schedule', label: 'My Schedule' },
        { to: '/appointments', label: 'Appointments' },
        { to: '/documents', label: 'Documents' },
    ],
};

export default function Navbar() {
    const { user, logout } = useAuth();
    const toast = useToast();
    const navigate = useNavigate();
    const location = useLocation();
    const [menuOpen, setMenuOpen] = useState(false);
    const navRef = useRef(null);

    // Close the menu on page change and when clicking outside the navbar.
    useEffect(() => {
        setMenuOpen(false);
    }, [location.pathname]);

    useEffect(() => {
        const onClick = (e) => {
            if (navRef.current && !navRef.current.contains(e.target)) setMenuOpen(false);
        };
        document.addEventListener('mousedown', onClick);
        return () => document.removeEventListener('mousedown', onClick);
    }, []);

    const handleLogout = async () => {
        await logout();
        toast.success('You have been logged out.');
        navigate('/login');
    };

    const homeLink = user ? (user.role === 'admin' ? '/admin' : '/dashboard') : '/';

    return (
        <header>
            <nav ref={navRef}>
                <div className="nav_logo">
                    <h1>
                        <Link to={homeLink}>⚖️ LAW FIRM</Link>
                    </h1>
                </div>

                <ul className="nav_link">
                    {!user && (
                        <>
                            <li><NavLink to="/login">Login</NavLink></li>
                            <li><NavLink to="/register">Register</NavLink></li>
                        </>
                    )}

                    {user && user.role === 'admin' && (
                        <li><NavLink to="/admin">Admin Panel</NavLink></li>
                    )}

                    {user && MENUS[user.role] && (
                        <>
                            <li><NavLink to="/dashboard">Dashboard</NavLink></li>
                            <li className="nav_menu_item">
                                <button type="button" className="nav_button" onClick={() => setMenuOpen((open) => !open)}>
                                    ☰ Menu
                                </button>
                                {menuOpen && (
                                    <div className="dropdown_panel dropdown_menu">
                                        <div className="dropdown_header">
                                            <strong>Navigation</strong>
                                            <button type="button" className="dropdown_close" onClick={() => setMenuOpen(false)}>✕</button>
                                        </div>
                                        {MENUS[user.role].map((item) => (
                                            <Link key={item.to} to={item.to} className="notif_item">
                                                {item.label}
                                            </Link>
                                        ))}
                                    </div>
                                )}
                            </li>
                        </>
                    )}

                    {user && (
                        <li className="nav_user">
                            <span className="user_badge">
                                {user.role === 'admin' ? '🛡️' : '👤'} {user.full_name}
                            </span>
                        </li>
                    )}

                    {user && (
                        <li>
                            <a href="#logout" className="btn_logout" onClick={(e) => { e.preventDefault(); handleLogout(); }}>
                                Logout
                            </a>
                        </li>
                    )}
                </ul>
            </nav>
        </header>
    );
}
