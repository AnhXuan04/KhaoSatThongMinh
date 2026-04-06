import { Link } from 'react-router-dom';
import './Auth.css';

export default function ForgotPasswordPage() {
  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    console.log('Đang gửi yêu cầu đặt lại mật khẩu...');
    // Thêm logic gọi API gửi email ở đây
  };

  return (
    <div className="pageContainer">
      <div className="cardContainer">
        
        <div className="headerSection">
          <h2 className="title">Quên Mật Khẩu</h2>
          <p className="subtitle">Nhập địa chỉ email của bạn và chúng tôi sẽ gửi cho bạn mật khẩu mới.</p>
        </div>

        <form className="formContainer" onSubmit={handleSubmit}>
          <div className="inputGroup">
            <label className="inputLabel" htmlFor="email">
              EMAIL ADDRESS
            </label>
            <input
              className="inputField"
              id="email"
              type="email"
              placeholder="name@gmail.com"
              required
            />
          </div>

          <button className="logInButton" type="submit">
            Gửi Yêu Cầu
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