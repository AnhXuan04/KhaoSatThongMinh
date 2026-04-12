import React, { useState } from 'react';
import { FcGoogle } from 'react-icons/fc';
import { AiOutlineEye, AiOutlineEyeInvisible } from 'react-icons/ai';

import './Auth.css';
import { Link, useNavigate } from 'react-router-dom';

const SignInPage = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const [formData, setFormData] = useState({
  email: '',
  password: ''
});

const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  setFormData({ ...formData, [e.target.id]: e.target.value });
  if (errorMessage) setErrorMessage('');
};

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setErrorMessage('');
    
    try {
    const response = await fetch('http://localhost:8080/api/auth/signin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    });

    const result = await response.text();

    if (response.ok) {
      localStorage.setItem('token', result);
      localStorage.setItem('userEmail', formData.email);
      navigate('/user-profile'); 
    } else {
      setErrorMessage(result);
    }
  } catch (error) {
    console.error("Lỗi kết nối server:", error);
    setErrorMessage("Không thể kết nối đến máy chủ. Vui lòng thử lại sau!");
  }
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
              value={formData.email}
              onChange={handleChange}
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
                value={formData.password}
                onChange={handleChange}
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
          
          {errorMessage && (
            <div className="errorMessageContainer">
              {errorMessage}
            </div>
          )}

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