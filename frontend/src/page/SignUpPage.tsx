import { useState } from 'react';
import { FcGoogle } from 'react-icons/fc';
import { AiOutlineEye, AiOutlineEyeInvisible } from 'react-icons/ai';

// Nhúng chung file CSS giao diện
import './Auth.css';
import { Link } from 'react-router-dom';

export default function SignUpPage() {
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    console.log('Đang đăng ký tài khoản mới...');
  };

  return (
    <div className="pageContainer">
      <div className="cardContainer">
    
        <div className="headerSection">
          <h2 className="title">Đăng Ký</h2>
          <p className="subtitle">Vui lòng nhập thông tin để tạo tài khoản mới.</p>
        </div>

        <form className="formContainer" onSubmit={handleSubmit}>
          <div className="inputGroup">
            <label className="inputLabel" htmlFor="fullname">
              Họ và Tên
            </label>
            <input
              className="inputField"
              id="fullname"
              type="text"
              placeholder="Nguyễn Văn An"
              required
            />
          </div>

          <div className="inputGroup">
            <label className="inputLabel" htmlFor="email">
              EMAIL
            </label>
            <input
              className="inputField"
              id="email"
              type="email"
              placeholder="name@gmail.com"
              required
            />
          </div>

          <div className="inputGroup">
            <div className="labelWrapper">
              <label className="inputLabel" htmlFor="password">
                PASSWORD
              </label>
            </div>
            
            <div className="passwordInputWrapper">
              <input
                className="inputField passwordField"
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                required
              />
              <button
                type="button"
                className="togglePasswordButton"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <AiOutlineEyeInvisible /> : <AiOutlineEye />}
              </button>
            </div>
          </div>

          <button className="logInButton" type="submit">
            Đăng Ký
          </button>
        </form>

        <div className="dividerContainer">
          <div className="dividerLine"></div>
          <span className="dividerText">HOẶC</span>
          <div className="dividerLine"></div>
        </div>

        <div className="socialButtonsSection">
          <button className="socialButton" type="button">
            <FcGoogle />
            Google
          </button>
        </div>

        <div className="footerSection">
          Bạn đã có tài khoản?{' '}
          <Link className="footerLink" to="/login">
            Đăng nhập ngay
          </Link>
        </div>
        
      </div>
    </div>
  );
}