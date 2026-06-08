import React, { useState } from 'react';
import { AiOutlineEye, AiOutlineEyeInvisible } from 'react-icons/ai';

import './Auth.css';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';

const getRoleFromToken = (token: string) => {
  try {
    const payload = token.split('.')[1];
    if (!payload) {
      return null;
    }
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64 + '==='.slice((base64.length + 3) % 4);
    const decoded = JSON.parse(atob(padded));
    return typeof decoded?.role === 'string' ? decoded.role : null;
  } catch {
    return null;
  }
};

const SignInPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const returnUrl = searchParams.get('returnUrl');
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
    const response = await fetch('/api/auth/signin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    });

    const result = await response.text();

    if (response.ok) {
      sessionStorage.setItem('token', result);
      sessionStorage.setItem('userEmail', formData.email);
      
      // If there's a returnUrl (e.g., survey page), redirect back to it
      if (returnUrl) {
        navigate(returnUrl);
        return;
      }
      
      const role = getRoleFromToken(result);
      if (role === 'ADMIN') {
        navigate('/dashboard-admin');
        return;
      }
      if (role === 'INTERVIEWER') {
        navigate('/dashboard');
        return;
      }
      navigate('/surveys');
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
