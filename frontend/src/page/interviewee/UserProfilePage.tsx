import React, { useState, useEffect, useRef } from 'react';
import { FiEdit2, FiUser } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import './UserProfilePage.css';

// Danh sách các lĩnh vực quan tâm mặc định để render ra giao diện
const AVAILABLE_INTERESTS = [
  'Kinh tế',
  'Công nghệ',
  'Y Tế',
  'Giáo Dục',
  // 'Tài chính cá nhân'
];

export default function UserProfilePage() {
  const navigate = useNavigate();

  // 1. Quản lý State cho form
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    job: 'bien_tap', // Giá trị mặc định
    avatarUrl: '',
    interests: [] as string[] // Mảng chứa các lĩnh vực đã chọn
  });

  const [message, setMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement | null>(null);

  // Lấy thông tin xác thực từ sessionStorage
  const token = sessionStorage.getItem('token');
  const userEmail = sessionStorage.getItem('userEmail');

  // 2. Fetch dữ liệu khi vừa vào trang
  useEffect(() => {
    if (!token || !userEmail) {
      navigate('/login');
      return;
    }

    const fetchProfile = async () => {
      try {
        const response = await fetch(`http://localhost:8080/api/user/profile`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          setFormData({
            fullName: data.fullName || '',
            email: data.email || userEmail,
            phone: data.phone || '',
            job: data.job || 'bien_tap',
            avatarUrl: data.avatarUrl || '',
            // Backend có thể trả về chuỗi cách nhau dấu phẩy hoặc mảng, ta xử lý ép kiểu về mảng
            interests: data.interests ? (Array.isArray(data.interests) ? data.interests : data.interests.split(',')) : []
          });
        }
      } catch (error) {
        console.error("Lỗi tải thông tin:", error);
      }
    };

    fetchProfile();
  }, [token, userEmail, navigate]);

  // 3. Xử lý khi người dùng gõ vào input
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setMessage('');
    setErrorMessage('');
  };

  // 4. Xử lý khi người dùng bấm vào các Tag lĩnh vực
  const toggleInterest = (interest: string) => {
    setFormData(prev => {
      const isSelected = prev.interests.includes(interest);
      const newInterests = isSelected
        ? prev.interests.filter(i => i !== interest) // Xóa đi nếu đã có
        : [...prev.interests, interest];             // Thêm vào nếu chưa có
      
      return { ...prev, interests: newInterests };
    });
    setMessage('');
    setErrorMessage('');
  };

  // 5. Xử lý khi bấm nút Lưu
  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];

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
      const response = await fetch('http://localhost:8080/api/user/avatar', {
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

  const handleSave = async () => {
    setIsLoading(true);
    setMessage('');
    setErrorMessage('');

    try {
      const response = await fetch(`http://localhost:8080/api/user/profile`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        // Nếu Backend lưu tags dạng chuỗi cách dấu phẩy, ta dùng join(', ')
        body: JSON.stringify({
          ...formData,
          interests: formData.interests.join(',') 
        })
      });

      const result = await response.text();

      if (!response.ok) {
        setErrorMessage(result);
        return;
      }

      const hasPasswordChange = oldPassword || newPassword || confirmPassword;
      if (hasPasswordChange) {
        if (!oldPassword || !newPassword) {
          setErrorMessage('Vui lòng nhập mật khẩu hiện tại và mật khẩu mới.');
          return;
        }

        if (newPassword !== confirmPassword) {
          setErrorMessage('Mật khẩu mới không khớp.');
          return;
        }

        const passwordResponse = await fetch('http://localhost:8080/api/user/change-password', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            currentPassword: oldPassword,
            newPassword: newPassword
          })
        });

        const passwordResult = await passwordResponse.text();

        if (!passwordResponse.ok) {
          setErrorMessage(passwordResult || 'Mật khẩu hiện tại không đúng!');
          return;
        }

        setMessage(passwordResult || 'Đổi mật khẩu thành công!');
        return;
      }

      setMessage(result || 'Cập nhật thông tin thành công!');
    } catch (error) {
      console.error("Lỗi cập nhật:", error);
      setErrorMessage("Không thể kết nối đến máy chủ.");
    } finally {
      setIsLoading(false);
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    }
  };

  return (
    <div className="userProfileContainer">
      <main className="profileMainContent">
        {/* Tiêu đề trang */}
        <div className="pageHeader">
          <span className="preTitle">CÀI ĐẶT TÀI KHOẢN</span>
          <h1 className="pageTitle">Cập nhật thông tin</h1>
          <p className="pageDesc">
            Tùy chỉnh thông tin định danh của bạn để nhận được các bản khảo sát và nội dung biên tập phù hợp nhất với chuyên môn.
          </p>
        </div>

        {/* Section 1: Ảnh đại diện */}
        <div className="contentSection">
          <div className="sectionLabel">01. ẢNH ĐẠI DIỆN</div>
          <div className="sectionBody">
            <div className="avatarGroup">
              <div className="avatarWrapper">
                <div className="avatarImg">
                  {formData.avatarUrl ? (
                    <img src={formData.avatarUrl} alt="Avatar" />
                  ) : (
                    <FiUser size={42} />
                  )}
                </div>
                <input
                  ref={avatarInputRef}
                  type="file"
                  accept="image/*"
                  className="avatarFileInput"
                  onChange={handleAvatarChange}
                />
                <button
                  type="button"
                  className="editIconBtn"
                  onClick={() => avatarInputRef.current?.click()}
                  disabled={isUploadingAvatar}
                >
                  <FiEdit2 size={14} />
                </button>
              </div>
              <div className="avatarInfo">
                <h3>{formData.fullName || 'Thành viên mới'}</h3>
                <p>Thành viên tiêu chuẩn</p>
                <span className="changePhotoText">
                  {isUploadingAvatar ? 'ĐANG TẢI ẢNH...' : 'THAY ĐỔI ẢNH'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Thông tin cơ bản */}
        <div className="contentSection">
          <div className="sectionLabel">02. THÔNG TIN CƠ BẢN</div>
          <div className="sectionBody">
            <div className="formRow">
              <div className="inputGroup">
                <label>HỌ VÀ TÊN</label>
                <input 
                  type="text" 
                  name="fullName"
                  className="grayInput" 
                  value={formData.fullName} 
                  onChange={handleChange}
                />
              </div>
            </div>
            
            <div className="formGrid">
              <div className="inputGroup">
                <label>ĐỊA CHỈ EMAIL</label>
                <input 
                  type="email" 
                  className="grayInput" 
                  value={formData.email} 
                  disabled 
                  style={{ cursor: 'not-allowed', opacity: 0.7 }}
                />
              </div>
              <div className="inputGroup">
                <label>SỐ ĐIỆN THOẠI</label>
                <input 
                  type="tel" 
                  name="phone"
                  className="grayInput" 
                  value={formData.phone} 
                  onChange={handleChange}
                  placeholder="+84..."
                />
              </div>
            </div>
          </div>
        </div>

        {/* Section 3: Chuyên môn */}
        <div className="contentSection">
          <div className="sectionLabel">03. CHUYÊN MÔN</div>
          <div className="sectionBody">
            <div className="formRow">
              <div className="inputGroup">
                <label>NGHỀ NGHIỆP</label>
                <select 
                  name="job"
                  className="grayInput" 
                  value={formData.job}
                  onChange={handleChange}
                >
                  <option value="bien_tap">Biên tập viên cao cấp</option>
                  <option value="ky_su">Kỹ sư phần mềm</option>
                  <option value="sinh_vien">Sinh viên</option>
                  <option value="khac">Khác</option>
                </select>
              </div>
            </div>

            <div className="formRow">
              <div className="inputGroup">
                <label>LĨNH VỰC QUAN TÂM</label>
                <div className="tagsWrapper">
                  {AVAILABLE_INTERESTS.map((interest) => (
                    <button 
                      key={interest}
                      className={`tagBtn ${formData.interests.includes(interest) ? 'selected' : ''}`}
                      onClick={() => toggleInterest(interest)}
                    >
                      {interest}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="formRow">
              <div className="inputGroup">
                <label>MẬT KHẨU CŨ</label>
                <input
                  type="password"
                  className="grayInput"
                  value={oldPassword}
                  onChange={(e) => {
                    setOldPassword(e.target.value);
                    setMessage('');
                    setErrorMessage('');
                  }}
                  placeholder="Nhập mật khẩu cũ"
                />
              </div>
            </div>

            <div className="formRow">
              <div className="inputGroup">
                <label>MẬT KHẨU MỚI</label>
                <input
                  type="password"
                  className="grayInput"
                  value={newPassword}
                  onChange={(e) => {
                    setNewPassword(e.target.value);
                    setMessage('');
                    setErrorMessage('');
                  }}
                  placeholder="Nhập mật khẩu mới"
                />
              </div>
            </div>

            <div className="formRow">
              <div className="inputGroup">
                <label>NHẬP LẠI MẬT KHẨU MỚI</label>
                <input
                  type="password"
                  className="grayInput"
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    setMessage('');
                    setErrorMessage('');
                  }}
                  placeholder="Nhập lại mật khẩu mới"
                />
              </div>
            </div>

            {/* Vùng hiển thị thông báo lỗi/thành công */}
            {errorMessage && (
              <div style={{ color: '#dc2626', marginTop: '16px', fontSize: '14px' }}>
                {errorMessage}
              </div>
            )}
            {message && (
              <div style={{ color: '#166534', marginTop: '16px', fontSize: '14px' }}>
                {message}
              </div>
            )}

            <div className="profileActionContainer" style={{ marginTop: '24px' }}>
              <button 
                className="saveProfileBtn"
                onClick={handleSave}
                disabled={isLoading}
              >
                {isLoading ? 'Đang lưu...' : 'Lưu cập nhật'}
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
