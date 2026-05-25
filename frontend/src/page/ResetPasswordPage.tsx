import { apiUrl } from '../config/api';
import React, { useState, useEffect } from 'react';
import { AiOutlineEye, AiOutlineEyeInvisible } from 'react-icons/ai';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import './Auth.css';

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const emailFromState = location.state?.email || '';

  const [otpCode, setOtpCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  const [message, setMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!emailFromState) {
      navigate('/forgot-password');
    }
  }, [emailFromState, navigate]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setMessage('');
    setErrorMessage('');
    setIsLoading(true);

    try {
      const response = await fetch(apiUrl('/api/auth/reset-password'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            email: emailFromState, 
            otpCode: otpCode, 
            newPassword: newPassword 
        })
      });

      const result = await response.text();

      if (response.ok) {
        setMessage(result);
        
        setTimeout(() => {
           navigate('/login'); 
        }, 2000);
      } else {
        setErrorMessage(result); 
      }
    } catch (error) {
      console.error("Lỗi:", error);
      setErrorMessage("Không thể kết nối đến máy chủ.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="pageContainer">
      <div className="cardContainer">
        
        <div className="headerSection">
          <h2 className="title">Tạo Mật Khẩu Mới</h2>
          <p className="subtitle">
            Chúng tôi đã gửi mã OTP gồm 6 chữ số đến email <br/>
            <strong>{emailFromState}</strong>
          </p>
        </div>

        <form className="formContainer" onSubmit={handleSubmit}>
          <div className="inputGroup">
            <label className="inputLabel" htmlFor="otp">
              MÃ XÁC NHẬN (OTP)
            </label>
            <input
              className="inputField"
              id="otp"
              type="text"
              maxLength={6}
              value={otpCode}
              onChange={(e) => {
                setOtpCode(e.target.value);
                setErrorMessage('');
              }}
              placeholder="Nhập mã 6 số"
              required
            />
          </div>

          <div className="inputGroup">
            <label className="inputLabel" htmlFor="newPassword">
              MẬT KHẨU MỚI
            </label>
            <div className="passwordInputWrapper">
              <input
                className="inputField passwordField"
                id="newPassword"
                type={showPassword ? "text" : "password"}
                value={newPassword}
                onChange={(e) => {
                  setNewPassword(e.target.value);
                  setErrorMessage('');
                }}
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

          {errorMessage && (
            <div className="errorMessageContainer">
              {errorMessage}
            </div>
          )}

          {message && (
            <div className="errorMessageContainer" style={{ backgroundColor: '#dcfce7', color: '#166534', borderColor: '#86efac' }}>
              {message}
            </div>
          )}

          <button className="logInButton" type="submit" disabled={isLoading}>
            {isLoading ? 'Đang xử lý...' : 'Xác Nhận & Đổi Mật Khẩu'}
          </button>
        </form>

        <div className="footerSection">
          <Link className="footerLink" to="/login">
            Quay lại đăng nhập
          </Link>
        </div>
        
      </div>
    </div>
  );
}