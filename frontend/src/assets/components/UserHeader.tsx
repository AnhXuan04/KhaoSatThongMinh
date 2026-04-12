import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { FaUserAstronaut, FaCoins, FaSignOutAlt } from 'react-icons/fa';
import './UserHeader.css';

export default function UserHeader() {
  const location = useLocation();
  const navigate = useNavigate();
  const [userName, setUserName] = useState('Thành viên');

  //Tự động lấy tên người dùng khi Header được hiển thị
  useEffect(() => {
    const fetchUserName = async () => {
      const email = localStorage.getItem('userEmail');
      const token = localStorage.getItem('token');

      if (email && token) {
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
    localStorage.removeItem('token');
    localStorage.removeItem('userEmail');
    
    navigate('/login');
  }

  return (
    <header className="userHeader">
      <Link to="/surveys" className="userInfo">
        <div className="userAvatarBox">
          <FaUserAstronaut size={20} />
        </div>
        <div className="userNameText">
          <span className="welcomeText">CHÀO MỪNG,</span>
          <span className="nameText">{userName}</span>
        </div>
      </Link>

      <nav className="userNavLinks">
        <Link to="/surveys" className={location.pathname === '/surveys' ? 'active' : ''}>SURVEYS</Link>
        <Link to="/wallet" className={location.pathname === '/wallet' ? 'active' : ''}>WALLET</Link>
        <Link to="/history" className={location.pathname === '/history' ? 'active' : ''}>HISTORY</Link>
        <Link to="/user-profile" className={location.pathname === '/user-profile' ? 'active' : ''}>PROFILE</Link> 
      </nav>

      <div className="coinBalance">
        <FaCoins className="coinIcon" />
        <span>2,450 Coins</span>
      </div>

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