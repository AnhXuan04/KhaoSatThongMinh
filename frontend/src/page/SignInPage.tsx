import React, { useState } from 'react';
import { FcGoogle } from 'react-icons/fc';
import { AiOutlineEye, AiOutlineEyeInvisible } from 'react-icons/ai';

import './Auth.css';
import { Link } from 'react-router-dom';

const SignInPage = () => {
  const [showPassword, setShowPassword] = useState(false);
  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    console.log('Đang đăng nhập...');
  };

  return (
    <div className="pageContainer">
      <div className="cardContainer">
        
        <div className="headerSection">
          <h2 className="title">Đăng Nhập</h2>
          <p className="subtitle">Vui lòng nhập thông tin đăng nhập của bạn.</p>
        </div>

        <form className="formContainer" onSubmit={handleSubmit}>
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
                MẬT KHẨU
              </label>
              <Link className="forgotPasswordLink" to="/forgot-password">
                Quên mật khẩu?
              </Link>
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
            Đăng Nhập
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
          Bạn chưa có tài khoản?{' '}
          <Link className="footerLink" to="/signup">
            Tạo tài khoản
          </Link>
        </div>
        
      </div>
    </div>
  );
};

export default SignInPage;