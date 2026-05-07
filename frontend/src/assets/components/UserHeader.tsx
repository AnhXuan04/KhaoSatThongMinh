import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { FaUserAstronaut, FaCoins, FaSignOutAlt } from 'react-icons/fa';
import './UserHeader.css';

interface UserHeaderProps {
  showCoin?: boolean;
}

type UserRole = 'INTERVIEWER' | 'INTERVIEWEE' | 'ADMIN';

const getRoleFromToken = (token: string): UserRole => {
  try {
    const payload = token.split('.')[1];
    if (!payload) {
      return 'INTERVIEWEE';
    }

    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64 + '==='.slice((base64.length + 3) % 4);
    const decoded = JSON.parse(atob(padded));
    const role = typeof decoded?.role === 'string' ? decoded.role : 'INTERVIEWEE';

    if (role === 'INTERVIEWER' || role === 'INTERVIEWEE' || role === 'ADMIN') {
      return role;
    }

    return 'INTERVIEWEE';
  } catch {
    return 'INTERVIEWEE';
  }
};

const navItemsByRole: Record<UserRole, Array<{ to: string; label: string }>> = {
  INTERVIEWER: [
    { to: '/dashboard', label: 'TỔNG QUAN' },
    { to: '/manage-surveys', label: 'QUẢN LÝ KHẢO SÁT' },
    { to: '/service-package', label: 'GÓI DỊCH VỤ' },
    { to: '/update-profile', label: 'HỒ SƠ' }
  ],
  INTERVIEWEE: [
    { to: '/surveys', label: 'KHẢO SÁT' },
    { to: '/user-profile', label: 'HỒ SƠ CỦA TÔI' },
    { to: '', label: 'LỊCH SỬ KHẢO SÁT' }
  ],
  ADMIN: [{ to: '/dashboard-admin', label: 'QUẢN TRỊ' }]
};

const homePathByRole: Record<UserRole, string> = {
  INTERVIEWER: '/dashboard',
  INTERVIEWEE: '/surveys',
  ADMIN: '/dashboard-admin'
};

export default function UserHeader({ showCoin = true }: UserHeaderProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const [userName, setUserName] = useState('Thành viên');
  const [userRole, setUserRole] = useState<UserRole>('INTERVIEWEE');

  //Tự động lấy tên người dùng khi Header được hiển thị
  useEffect(() => {
    const fetchUserName = async () => {
      const email = sessionStorage.getItem('userEmail');
      const token = sessionStorage.getItem('token');

      if (email && token) {
        setUserRole(getRoleFromToken(token));

        try {
          const response = await fetch(`http://localhost:8080/api/user/profile`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });

          if (response.ok) {
            const data = await response.json();
            setUserName(data.fullName || email.split('@')[0]);
          }
        } catch (error) {
          console.error("Lỗi tải tên người dùng ở Header:", error);
        }
      }
    };

    fetchUserName();
  }, []); 

  const handleLogout = () => {
    sessionStorage.clear();
    navigate('/');
  }

  const navItems = navItemsByRole[userRole];
  const homePath = homePathByRole[userRole];

  const isPathActive = (path: string) => {
    if (path === '/dashboard-admin') {
      return location.pathname.startsWith('/dashboard-admin');
    }
    if (path === '/dashboard') {
      return location.pathname === '/dashboard';
    }
    return location.pathname === path;
  };

  const canShowCoin = showCoin && userRole === 'INTERVIEWEE';

  return (
    <header className="userHeader">
      <Link to={homePath} className="userInfo">
        <div className="userAvatarBox">
          <FaUserAstronaut size={20} />
        </div>
        <div className="userNameText">
          <span className="welcomeText">CHÀO MỪNG,</span>
          <span className="nameText">{userName}</span>
        </div>
      </Link>

      <nav className="userNavLinks">
        {navItems.map((item) => (
          <Link key={item.to} to={item.to} className={isPathActive(item.to) ? 'active' : ''}>
            {item.label}
          </Link>
        ))}
      </nav>

      {canShowCoin && (
        <div className="coinBalance">
          <FaCoins className="coinIcon" />
          <span>2,450 Coins</span>
        </div>
      )}

      <button 
          onClick={handleLogout} 
          className="logoutButton"
          title="Đăng xuất"
        >
          <FaSignOutAlt size={20} />
        </button>
    </header>
  );
}