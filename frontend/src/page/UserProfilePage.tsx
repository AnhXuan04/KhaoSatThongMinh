import { FiEdit2 } from 'react-icons/fi';
import UserHeader from '../assets/components/UserHeader';
import './UserProfilePage.css';

export default function UserProfilePage() {
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
                  src="https://api.dicebear.com/7.x/avataaars/svg?seed=Alex" 
                  alt="Avatar" 
                  className="avatarImg" 
                />
                <button className="editIconBtn">
                  <FiEdit2 size={14} />
                </button>
              </div>
              <div className="avatarInfo">
                <h3>Alex Editor</h3>
                <p>Thành viên Premium • Từ 2023</p>
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
                <input type="text" className="grayInput" defaultValue="Alex Editor" />
              </div>
            </div>
            
            <div className="formGrid">
              <div className="inputGroup">
                <label>ĐỊA CHỈ EMAIL</label>
                <input type="email" className="grayInput" defaultValue="alex.editor@example.com" />
              </div>
              <div className="inputGroup">
                <label>SỐ ĐIỆN THOẠI</label>
                <input type="tel" className="grayInput" defaultValue="+84 90 123 4567" />
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
                <select className="grayInput" defaultValue="bien_tap">
                  <option value="bien_tap">Biên tập viên cao cấp</option>
                  <option value="ky_su">Kỹ sư phần mềm</option>
                  <option value="sinh_vien">Sinh viên</option>
                </select>
              </div>
            </div>

            <div className="formRow">
              <div className="inputGroup">
                <label>LĨNH VỰC QUAN TÂM</label>
                <div className="tagsWrapper">
                  {/* Class 'selected' để tô màu xanh cho những mục đã chọn */}
                  <button className="tagBtn selected">Kinh tế vĩ mô</button>
                  <button className="tagBtn selected">Công nghệ AI</button>
                  <button className="tagBtn">Văn hóa & Nghệ thuật</button>
                  <button className="tagBtn">Phát triển bền vững</button>
                  <button className="tagBtn selected">Tài chính cá nhân</button>
                </div>
              </div>
            </div>
            <div className="profileActionContainer">
          <button 
            className="saveProfileBtn"
            onClick={() => alert('Đã lưu thông tin thành công!')}
          >
            Lưu cập nhật
          </button>
        </div>
          </div>
        </div>
      </main>
    </div>
  );
}