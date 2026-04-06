import { Link, useLocation } from 'react-router-dom';
import { FaUserAstronaut, FaCoins } from 'react-icons/fa';
import './UserHeader.css';

export default function UserHeader() {
  const location = useLocation();

  return (
    <header className="userHeader">
      <Link to="/surveys" className="userInfo">
        <div className="userAvatarBox">
          <FaUserAstronaut size={20} />
        </div>
        <div className="userNameText">
          <span className="welcomeText">CHÀO MỪNG,</span>
          <span className="nameText">Alex Editor</span>
        </div>
      </Link>

      <nav className="userNavLinks">
        <Link to="/surveys" className={location.pathname === '/surveys' ? 'active' : ''}>SURVEYS</Link>
        <Link to="/wallet" className={location.pathname === '/wallet' ? 'active' : ''}>WALLET</Link>
        <Link to="/history" className={location.pathname === '/history' ? 'active' : ''}>HISTORY</Link>
        {/* Link tới trang Profile sắp tạo */}
        <Link to="/user-profile" className={location.pathname === '/user-profile' ? 'active' : ''}>PROFILE</Link> 
      </nav>

      <div className="coinBalance">
        <FaCoins className="coinIcon" />
        <span>2,450 Coins</span>
      </div>
    </header>
  );
}