import { useEffect, useState } from 'react';
import { FiArrowRight, FiPlus, FiBarChart2 } from 'react-icons/fi';
import './Dashboard.css';
import { Link, useNavigate } from 'react-router-dom';

export default function DashboardPage() {
  const navigate = useNavigate();
  const [fullName, setFullName] = useState('');
  const [recentSurveys, setRecentSurveys] = useState<any[]>([]);

  useEffect(() => {
    const token = sessionStorage.getItem('token');
    const userEmail = sessionStorage.getItem('userEmail');

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

  useEffect(() => {
    const token = sessionStorage.getItem('token');
    if (!token) return;

    const fetchSurveys = async () => {
      try {
        const res = await fetch('http://localhost:8080/api/surveys/my', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (!res.ok) return;
        const data = await res.json();
        setRecentSurveys(Array.isArray(data) ? data.slice(0, 2) : []);
      } catch (err) {
        console.error('Không thể tải khảo sát gần đây:', err);
      }
    };

    fetchSurveys();
  }, []);

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
                  <h2>Xin Chào, {fullName || 'Thành viên mới'}</h2>
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
              <button className="actionBtn" onClick={() => navigate('/create-surveys')}>
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
              <a href="#" className="viewAll" onClick={(e) => {
                e.preventDefault();
                navigate('/manage-surveys');
              }}>
                XEM TẤT CẢ
              </a>
            </div>
            
            <div className="recentGrid">
              {recentSurveys && recentSurveys.length > 0 ? (
                recentSurveys.map((s, idx) => (
                  <div key={s.id || idx} className="card surveyCard">
                    <div className="surveyCardHeader">
                      <div className="iconBox"><FiBarChart2 /></div>
                      
                    </div>
                    <h4 className="" style={{ cursor: 'pointer' }} onClick={() => navigate(`/create-surveys?editId=${encodeURIComponent(s.id)}`)}>
                      {s.title}
                    </h4>
                    <p>{s.description}</p>
                    {idx === 1 && (
                      <button className="addBtn" onClick={() => navigate('/create-surveys')}>
                        <FiPlus />
                      </button>
                    )}
                  </div>
                ))
              ) : null}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}