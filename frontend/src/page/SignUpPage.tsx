import { useState } from 'react';
import { AiOutlineEye, AiOutlineEyeInvisible } from 'react-icons/ai';
import { Link, useNavigate } from 'react-router-dom';

import './Auth.css';

export default function SignUpPage() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
  fullName: '',
  email: '',
  password: ''
});

const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  setFormData({ ...formData, [e.target.id]: e.target.value });
  if (errorMessage) setErrorMessage('');
};

  const handleSubmit = async (event: React.FormEvent) => {
      event.preventDefault();
      if (isSubmitting) return;
      setIsSubmitting(true);
      setErrorMessage('');
      
      try {
      const response = await fetch(('/api/auth/signup'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    });

    const result = await response.text(); // Lấy message trả về từ BE

    if (response.ok) {
      navigate('/verify-otp', { state: { email: formData.email } });
    } else {
      setErrorMessage(result);
      setIsSubmitting(false);
    }
  } catch (error) {
    console.error("Lỗi gọi API:", error);
    setErrorMessage('Không thể kết nối đến máy chủ.');
    setIsSubmitting(false);
  }
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
            <label className="inputLabel" htmlFor="fullName">
              Họ và Tên
            </label>
            <input
              className="inputField"
              id="fullName"
              type="text"
              placeholder="Nguyễn Văn An"
              value={formData.fullName}
              onChange={handleChange}
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
              value={formData.email}
              onChange={handleChange}
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

          <button className="logInButton" type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Đang gửi...' : 'Đăng Ký'}
          </button>
        </form>

        <div className="dividerContainer">
          <div className="dividerLine"></div>
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
