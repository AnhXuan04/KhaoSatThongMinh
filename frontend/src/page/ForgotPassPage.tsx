import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Auth.css';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState(''); 
  const [errorMessage, setErrorMessage] = useState(''); 
  const [isLoading, setIsLoading] = useState(false); 

  const navigate = useNavigate();

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (isLoading) return;
    setMessage('');
    setErrorMessage('');
    setIsLoading(true);

    try {
      const response = await fetch(('/api/auth/forgot-password'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email }) // Gửi email xuống BE
      });

      const result = await response.text();

      if (response.ok) {
        setMessage(result); 

        setTimeout(() => {
           navigate('/reset-password', { state: { email: email } }); 
        }, 2000);
        return;
      } else {
        setErrorMessage(result);
      }
    } catch (error) {
      console.error("Lỗi:", error);
      setErrorMessage("Không thể kết nối đến máy chủ.");
    }
    setIsLoading(false);
  };

  return (
    <div className="pageContainer">
      <div className="cardContainer">
        
        <div className="headerSection">
          <h2 className="title">Quên Mật Khẩu</h2>
          <p className="subtitle">Nhập địa chỉ email của bạn và chúng tôi sẽ gửi cho bạn mã OTP khôi phục.</p>
        </div>

        <form className="formContainer" onSubmit={handleSubmit}>
          <div className="inputGroup">
            <label className="inputLabel" htmlFor="email">
              ĐỊA CHỈ EMAIL
            </label>
            <input
              className="inputField"
              id="email"
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setErrorMessage('');
                setMessage('');
              }}
              placeholder="name@gmail.com"
              required
            />
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
            {isLoading ? 'Đang gửi...' : 'Gửi Yêu Cầu'}
          </button>
        </form>

        <div className="footerSection">
          Bạn đã nhớ mật khẩu?{' '}
          <Link className="footerLink" to="/login">
            Đăng nhập
          </Link>
        </div>
        
      </div>
    </div>
  );
}
