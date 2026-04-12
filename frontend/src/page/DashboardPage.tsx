import { useEffect, useState } from 'react';
import { FiArrowRight, FiPlus, FiBarChart2, FiUsers } from 'react-icons/fi';
import './Dashboard.css';
import { Link, useNavigate } from 'react-router-dom';

export default function DashboardPage() {
  const navigate = useNavigate();
  const [fullName, setFullName] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userEmail = localStorage.getItem('userEmail');

    if (!token || !userEmail) {
      navigate('/login');
      return;
    }

    const fetchProfile = async () => {
      try {
        const response = await fetch('http://localhost:8080/api/user/profile', {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        if (!response.ok) {
          return;
        }

        const data = await response.json();
        setFullName(data.fullName || userEmail);
      } catch (error) {
        console.error('Không thể tải dữ liệu dashboard:', error);
      }
    };

    fetchProfile();
  }, [navigate]);

  return (
    <div className="dashboardContainer">
      <div className="mainContent">
        
        <div className="sectionWrapper">
          <div className="sectionContent">
            <div className="card profileCard">
              <div className="profileInfo">
                <div className="profileAvatar">
                  {/* Thay link ảnh thật của bạn vào đây */}
                  <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${fullName || 'User'}`} alt={fullName || 'Người dùng'} />
                  <div className="statusDot"></div>
                </div>
                <div className="profileText">
                  <h2>Chào buổi sáng, {fullName || 'Thành viên mới'}</h2>
                  <p>Người tạo khảo sát chuyên nghiệp</p>
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