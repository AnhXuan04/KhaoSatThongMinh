import { apiUrl } from '../../config/api';
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiUser } from 'react-icons/fi';
import './UpdateProfile.css';

export default function UpdateProfilePage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    fullName: '',
    job: '',
    email: '',
    avatarUrl: ''
  });
  const [message, setMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const avatarInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const token = sessionStorage.getItem('token');
    const userEmail = sessionStorage.getItem('userEmail');

    if (!token || !userEmail) {
      navigate('/login');
      return;
    }

    const fetchProfile = async () => {
      try {
        const response = await fetch(apiUrl('/api/user/profile'), {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        if (!response.ok) {
          return;
        }

        const data = await response.json();
        setFormData({
          fullName: data.fullName || '',
          job: data.job || '',
          email: data.email || userEmail,
          avatarUrl: data.avatarUrl || ''
        });
      } catch (error) {
        console.error('Không thể tải dữ liệu hồ sơ:', error);
      }
    };

    fetchProfile();
  }, [navigate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setMessage('');
    setErrorMessage('');
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    const token = sessionStorage.getItem('token');

    if (!file || !token) return;

    if (!file.type.startsWith('image/')) {
      setErrorMessage('Vui lòng chọn tệp ảnh.');
      e.target.value = '';
      return;
    }

    const uploadData = new FormData();
    uploadData.append('file', file);

    setIsUploadingAvatar(true);
    setMessage('');
    setErrorMessage('');

    try {
      const response = await fetch(apiUrl('/api/user/avatar'), {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: uploadData
      });

      const result = await response.json();

      if (!response.ok) {
        setErrorMessage(result?.error || 'Tải ảnh đại diện thất bại.');
        return;
      }

      setFormData(prev => ({ ...prev, avatarUrl: result.avatarUrl || '' }));
      setMessage('Tải ảnh đại diện thành công!');
    } catch (error) {
      console.error('Lỗi tải ảnh đại diện:', error);
      setErrorMessage('Không thể tải ảnh đại diện lên máy chủ.');
    } finally {
      setIsUploadingAvatar(false);
      e.target.value = '';
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = sessionStorage.getItem('token');

    if (!token) {
      navigate('/login');
      return;
    }

    setIsLoading(true);
    setMessage('');
    setErrorMessage('');

    try {
      const response = await fetch(apiUrl('/api/user/profile'), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          fullName: formData.fullName,
          job: formData.job,
          avatarUrl: formData.avatarUrl
        })
      });

      const result = await response.text();

      if (!response.ok) {
        setErrorMessage(result);
        return;
      }

      const hasPasswordChange = oldPassword || newPassword;
      if (hasPasswordChange) {
        if (!oldPassword || !newPassword) {
          setErrorMessage('Vui lòng nhập cả mật khẩu cũ và mật khẩu mới.');
          return;
        }

        const passwordResponse = await fetch(apiUrl('/api/user/change-password'), {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            currentPassword: oldPassword,
            newPassword: newPassword
          })
        });

        const passwordResult = await passwordResponse.text();

        if (!passwordResponse.ok) {
          setErrorMessage(passwordResult || 'Đổi mật khẩu thất bại.');
          return;
        }

        setMessage(passwordResult || 'Cập nhật hồ sơ và đổi mật khẩu thành công!');
      } else {
        setMessage(result || 'Cập nhật hồ sơ thành công!');
      }

      setOldPassword('');
      setNewPassword('');
      navigate('/dashboard');
    } catch (error) {
      console.error('Lỗi cập nhật hồ sơ:', error);
      setErrorMessage('Không thể kết nối đến máy chủ.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="profilePageContainer">
      <div className="profileContent">
        <div className="profileHeader">
          <h1>Hồ sơ Người tạo khảo sát</h1>
          <p>Cập nhật thông tin chuyên môn để quản lý khảo sát và theo dõi hiệu quả tốt hơn.</p>
        </div>

        <form className="editCard" onSubmit={handleSave}>
          
          {/* Khu vực đổi Avatar */}
          <div className="avatarSection">
            <div className="avatarPreview">
              {formData.avatarUrl ? (
                <img src={formData.avatarUrl} alt="Avatar" />
              ) : (
                <FiUser size={42} />
              )}
            </div>
            <div className="avatarActions">
              <h3>Ảnh đại diện</h3>
              <p>Nên dùng ảnh vuông, tối thiểu 200x200px để hiển thị tốt trên dashboard.</p>
              <input
                ref={avatarInputRef}
                type="file"
                accept="image/*"
                className="avatarFileInput"
                onChange={handleAvatarChange}
              />
              <button
                type="button"
                className="changePicBtn"
                onClick={() => avatarInputRef.current?.click()}
                disabled={isUploadingAvatar}
              >
                {isUploadingAvatar ? 'Đang tải...' : 'Đổi ảnh mới'}
              </button>
              <button
                type="button"
                className="removePicBtn"
                onClick={() => setFormData(prev => ({ ...prev, avatarUrl: '' }))}
              >
                Gỡ ảnh
              </button>
            </div>
          </div>

          {/* Form thông tin */}
          <div className="formGrid">
            <div className="formGroup">
              <label>Họ và Tên</label>
              <input
                type="text"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                required
              />
            </div>

            <div className="formGroup">
              <label>Vai trò</label>
              <input
                type="text"
                name="job"
                value={formData.job}
                onChange={handleChange}
                placeholder="Ví dụ: Người tạo khảo sát"
              />
            </div>

            <div className="formGroup fullWidth">
              <label>Địa chỉ Email</label>
              <input type="email" value={formData.email} disabled />
            </div>

            <div className="formGroup">
              <label>Mật khẩu cũ</label>
              <input
                type="password"
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                placeholder="Nhập mật khẩu cũ"
              />
            </div>

            <div className="formGroup">
              <label>Mật khẩu mới</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Nhập mật khẩu mới"
              />
            </div>
          </div>

          {(errorMessage || message) && (
            <div className="formFeedback">
              {errorMessage && <span className="errorText">{errorMessage}</span>}
              {message && <span className="successText">{message}</span>}
            </div>
          )}

          <div className="actionButtons">
            <button 
              type="button" 
              className="cancelBtn" 
              onClick={() => navigate('/dashboard')}
            >
              Hủy bỏ
            </button>
            <button type="submit" className="saveBtn" disabled={isLoading}>
              {isLoading ? 'Đang lưu...' : 'Lưu thay đổi'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
