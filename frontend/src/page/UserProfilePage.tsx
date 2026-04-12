import React, { useState, useEffect } from 'react';
import { FiEdit2 } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import UserHeader from '../assets/components/UserHeader';
import './UserProfilePage.css';

// Danh sách các lĩnh vực quan tâm mặc định để render ra giao diện
const AVAILABLE_INTERESTS = [
  'Kinh tế vĩ mô',
  'Công nghệ AI',
  'Văn hóa & Nghệ thuật',
  'Phát triển bền vững',
  'Tài chính cá nhân'
];

export default function UserProfilePage() {
  const navigate = useNavigate();

  // 1. Quản lý State cho form
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    job: 'bien_tap', // Giá trị mặc định
    interests: [] as string[] // Mảng chứa các lĩnh vực đã chọn
  });

  const [message, setMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Lấy thông tin xác thực từ LocalStorage
  const token = localStorage.getItem('token');
  const userEmail = localStorage.getItem('userEmail');

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

      if (response.ok) {
        setMessage("Cập nhật thông tin thành công!");
      } else {
        setErrorMessage(result);
      }
    } catch (error) {
      console.error("Lỗi cập nhật:", error);
      setErrorMessage("Không thể kết nối đến máy chủ.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="userProfileContainer">
      <UserHeader />

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
                <img 
                  src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${formData.fullName || 'User'}`} 
                  alt="Avatar" 
                  className="avatarImg" 
                />
                <button className="editIconBtn">
                  <FiEdit2 size={14} />
                </button>
              </div>
              <div className="avatarInfo">
                <h3>{formData.fullName || 'Thành viên mới'}</h3>
                <p>Thành viên tiêu chuẩn</p>
                <span className="changePhotoText">THAY ĐỔI ẢNH</span>
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