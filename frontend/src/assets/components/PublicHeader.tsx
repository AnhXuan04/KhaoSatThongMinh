import { Link } from 'react-router-dom';
import './PublicHeader.css';

export default function PublicHeader() {
  return (
    <nav className="publicHeader">
      <div className="publicHeaderContent">
        <Link to="/" className="publicHeaderLogo">
          <span className="publicHeaderText">FORMSYNC</span>
        </Link>

        <div className="publicHeaderActions">
          <Link to="/login" className="publicBtnLogin">Đăng nhập</Link>
          <Link to="/signup" className="publicBtnSignup">Đăng ký</Link>
        </div>
      </div>
    </nav>
  );
}