import { FiMenu, FiUser } from 'react-icons/fi';
import { Link, useLocation } from 'react-router-dom';
import './Navbar.css';

export default function Navbar() {
  const location = useLocation(); // Lấy đường dẫn hiện tại để bôi xanh menu đang chọn

  return (
    <nav className="navbar">
      <Link to="/dashboard" className="navLeft">
        <FiMenu size={24} style={{ color: '#111827' }} />
        <span>SurveyEdit</span>
      </Link>
      
      <div className="navCenter">
        <Link to="/dashboard" className={location.pathname === '/dashboard' ? 'active' : ''}>
          Dashboard
        </Link>
        <Link to="/surveys" className={location.pathname === '/surveys' ? 'active' : ''}>
          Khảo sát
        </Link>
        <Link to="/library" className={location.pathname === '/library' ? 'active' : ''}>
          Thư viện
        </Link>
      </div>
      
      <div className="navRight">
        <Link to="/profile" className="avatar" aria-label="User profile">
          <FiUser size={18} />
        </Link>
      </div>
    </nav>
  );
}
