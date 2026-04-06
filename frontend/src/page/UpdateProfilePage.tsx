import { useNavigate } from 'react-router-dom';
import Navbar from '../assets/components/Navbar';
import './UpdateProfile.css';

export default function UpdateProfilePage() {
  const navigate = useNavigate();

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Đã lưu hồ sơ');
    navigate('/dashboard'); // Lưu xong quay về Dashboard
  };

  return (
    <div className="profilePageContainer">
      {/* Component Navbar dùng chung đã được tái sử dụng! */}
      <Navbar />

      <div className="profileContent">
        <div className="profileHeader">
          <h1>Cập nhật Hồ sơ</h1>
          <p>Quản lý thông tin cá nhân và tùy chọn tài khoản của bạn.</p>
        </div>

        <form className="editCard" onSubmit={handleSave}>
          
          {/* Khu vực đổi Avatar */}
          <div className="avatarSection">
            <img 
              className="avatarPreview" 
              src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" 
              alt="Avatar" 
            />
            <div className="avatarActions">
              <h3>Ảnh đại diện</h3>
              <p>Nên dùng ảnh vuông, kích thước tối thiểu 200x200px.</p>
              <button type="button" className="changePicBtn">Đổi ảnh mới</button>
              <button type="button" className="removePicBtn">Gỡ ảnh</button>
            </div>
          </div>

          {/* Form thông tin */}
          <div className="formGrid">
            <div className="formGroup">
              <label>Họ và Tên</label>
              <input type="text" defaultValue="Lê Anh" required />
            </div>

            <div className="formGroup">
              <label>Chức vụ</label>
              <input type="text" defaultValue="Quản trị viên hệ thống" />
            </div>

            <div className="formGroup fullWidth">
              <label>Địa chỉ Email</label>
              <input type="email" defaultValue="leanh@company.com" required />
            </div>
          </div>

          {/* Nút thao tác */}
          <div className="actionButtons">
            <button 
              type="button" 
              className="cancelBtn" 
              onClick={() => navigate('/dashboard')}
            >
              Hủy bỏ
            </button>
            <button type="submit" className="saveBtn">Lưu thay đổi</button>
          </div>

        </form>
      </div>
    </div>
  );
}