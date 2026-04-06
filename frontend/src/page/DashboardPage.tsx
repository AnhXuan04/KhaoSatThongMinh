import { FiArrowRight, FiPlus, FiBarChart2, FiUsers } from 'react-icons/fi';
import './Dashboard.css';
import Navbar from '../assets/components/Navbar';
import { Link } from 'react-router-dom';

export default function DashboardPage() {
  return (
    <div className="dashboardContainer">
      {/* Navbar */}
      <Navbar />

      <div className="mainContent">
        
        <div className="sectionWrapper">
          <div className="sectionContent">
            <div className="card profileCard">
              <div className="profileInfo">
                <div className="profileAvatar">
                  {/* Thay link ảnh thật của bạn vào đây */}
                  <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" alt="Lê Anh" />
                  <div className="statusDot"></div>
                </div>
                <div className="profileText">
                  <h2>Chào buổi sáng, Lê Anh</h2>
                  <p>Quản trị viên hệ thống khảo sát cao cấp</p>
                </div>
              </div>
              <Link to="/update-profile">
                <button className="updateBtn">Cập nhật Hồ sơ</button>
              </Link>
              
            </div>
          </div>
        </div>

        <div className="sectionWrapper">
          <div className="sectionContent insightsGrid">
            
            {/* Chart Card */}
            <div className="card chartCard">
              <div className="chartCircle">
                <div className="chartInner">
                  <h3>78%</h3>
                  <span>HOÀN TẤT</span>
                </div>
              </div>
              <div className="chartText">
                <h3>Hiệu suất Khảo sát</h3>
                <p>
                  Các chỉ số phản hồi của bạn đang vượt 12% so với 
                  tháng trước. Sự tham gia của khách hàng đạt mức kỷ 
                  lục trong tuần này.
                </p>
                <div className="legend">
                  <div className="legendItem">
                    <div className="dot blue"></div> Hoàn thành
                  </div>
                  <div className="legendItem">
                    <div className="dot gray"></div> Đang chờ
                  </div>
                </div>
              </div>
            </div>

            <div className="card actionCard">
              <div className="actionIcon">
                <FiPlus size={20} />
              </div>
              <h3>Tạo Khảo sát Mới</h3>
              <p>Bắt đầu thu thập thông tin chuyên sâu ngay lập tức.</p>
              <button className="actionBtn">
                BẮT ĐẦU NGAY <FiArrowRight size={16} />
              </button>
            </div>

          </div>
        </div>

        {/* 03 / RECENT */}
        <div className="sectionWrapper">
          <div className="sectionContent">
            <div className="recentHeader">
              <h3>Đã chỉnh sửa gần đây</h3>
              <a href="#" className="viewAll">XEM TẤT CẢ</a>
            </div>
            
            <div className="recentGrid">
              
              {/* Survey Card 1 */}
              <div className="card surveyCard">
                <div className="surveyCardHeader">
                  <div className="iconBox"><FiBarChart2 /></div>
                  <span className="statusTag active">HOẠT ĐỘNG</span>
                </div>
                <h4>Đánh giá Trải nghiệm Khách hàng Q3</h4>
                <p>Phân tích chuyên sâu về sự hài lòng của khách hàng tại thị trường Đông Nam Á.</p>
              </div>

              {/* Survey Card 2 */}
              <div className="card surveyCard">
                <div className="surveyCardHeader">
                  <div className="iconBox"><FiUsers /></div>
                  <span className="statusTag draft">BẢN NHÁP</span>
                </div>
                <h4>Khảo sát Văn hóa Doanh nghiệp 2024</h4>
                <p>Thăm dò ý kiến nhân viên về môi trường làm việc và các giá trị cốt lõi.</p>
                {/* Nút cộng màu xanh lồi ra ngoài */}
                <button className="addBtn"><FiPlus /></button>
              </div>

            </div>
          </div>
        </div>

      </div>
    </div>
  );
}