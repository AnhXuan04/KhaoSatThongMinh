import { apiUrl } from '../../config/api';
import { useEffect, useState } from 'react';
import { FiArrowRight, FiPlus, FiBarChart2, FiUser } from 'react-icons/fi';
import './Dashboard.css';
import { Link, useNavigate } from 'react-router-dom';

type QualityAnalytics = {
  totalResponses: number;
  totalAnalyzedResponses: number;
  seriousResponses: number;
  superficialResponses: number;
  qualityResponses: number;
  rewardEligibleResponses: number;
  rewardEligibleRate: number;
  pendingCoinTransactions: number;
  averageQualityScore: number;
  recentResults: Array<{
    responseId: number;
    surveyId: number;
    surveyTitle: string;
    respondentEmail: string;
    qualityScore: number;
    superficial: boolean;
    rewardEligible: boolean;
    recommendation: string;
    coinStatus: string;
    submittedAt: string;
  }>;
};

const defaultAnalytics: QualityAnalytics = {
  totalResponses: 0,
  totalAnalyzedResponses: 0,
  seriousResponses: 0,
  superficialResponses: 0,
  qualityResponses: 0,
  rewardEligibleResponses: 0,
  rewardEligibleRate: 0,
  pendingCoinTransactions: 0,
  averageQualityScore: 0,
  recentResults: [],
};

export default function DashboardPage() {
  const navigate = useNavigate();
  const [fullName, setFullName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [recentSurveys, setRecentSurveys] = useState<any[]>([]);
  const [qualityAnalytics, setQualityAnalytics] = useState<QualityAnalytics>(defaultAnalytics);

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
        setFullName(data.fullName || userEmail);
        setAvatarUrl(data.avatarUrl || '');
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
        const surveyRes = await fetch(apiUrl('/api/surveys/my'), {
          headers: { Authorization: `Bearer ${token}` }
        });
        const analyticsRes = await fetch(apiUrl('/api/surveys/analytics/quality'), {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (surveyRes.ok) {
          const data = await surveyRes.json();
          setRecentSurveys(Array.isArray(data) ? data.slice(0, 2) : []);
        }

        if (analyticsRes.ok) {
          const data = await analyticsRes.json();
          setQualityAnalytics({
            ...defaultAnalytics,
            ...data,
            recentResults: Array.isArray(data?.recentResults) ? data.recentResults : [],
          });
        }
      } catch (err) {
        console.error('Không thể tải khảo sát gần đây:', err);
      }
    };

    fetchSurveys();
  }, []);

  const analyzedResponses = qualityAnalytics.totalAnalyzedResponses;
  const seriousResponses = qualityAnalytics.seriousResponses || qualityAnalytics.qualityResponses;
  const superficialResponses = qualityAnalytics.superficialResponses;
  const rewardEligibleRate = qualityAnalytics.rewardEligibleRate;
  const averageQualityScore = Math.max(0, Math.min(100, qualityAnalytics.averageQualityScore || 0));
  const chartDescription = analyzedResponses
    ? `Đã phân tích ${analyzedResponses} phản hồi, trong đó ${seriousResponses} phản hồi nghiêm túc và ${superficialResponses} phản hồi hời hợt. Tỷ lệ đủ điều kiện cộng Coin hiện là ${rewardEligibleRate}%.`
    : 'Chưa có phản hồi nào được AI phân tích. Khi khảo sát có dữ liệu, biểu đồ này sẽ tự cập nhật theo chất lượng phản hồi thực tế.';

  return (
    <div className="dashboardContainer">
      <div className="mainContent">
        
        <div className="sectionWrapper">
          <div className="sectionContent">
            <div className="card profileCard">
              <div className="profileInfo">
                <div className="profileAvatar">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt={fullName || 'Người dùng'} />
                  ) : (
                    <FiUser size={30} />
                  )}
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
              <div
                className="chartCircle"
                style={{ background: `conic-gradient(#0052ff ${averageQualityScore}%, #e5e7eb 0)` }}
              >
                <div className="chartInner">
                  <h3>{averageQualityScore}%</h3>
                  <span>HOÀN TẤT</span>
                </div>
              </div>
              <div className="chartText">
                <h3>Hiệu suất Khảo sát</h3>
                <p>{chartDescription}</p>
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

        <div className="sectionWrapper">
          <div className="sectionContent qualityGrid">
            <div className="card qualitySummaryCard">
              <h3>Tổng hợp AI</h3>
              <div className="qualityStats">
                <div><span>Tổng phản hồi</span><strong>{qualityAnalytics.totalResponses}</strong></div>
                <div><span>Nghiêm túc</span><strong>{qualityAnalytics.seriousResponses || qualityAnalytics.qualityResponses}</strong></div>
                <div><span>Hời hợt</span><strong>{qualityAnalytics.superficialResponses}</strong></div>
                <div><span>Đủ điều kiện cộng Coin</span><strong>{qualityAnalytics.rewardEligibleRate}%</strong></div>
              </div>
            </div>

            <div className="card qualityRecentCard">
              <div className="recentHeader compact">
                <h3>Phản hồi mới được phân tích</h3>
              </div>
              <div className="qualityList">
                {qualityAnalytics.recentResults.length ? qualityAnalytics.recentResults.map((item) => (
                  <button
                    type="button"
                    key={item.responseId}
                    className="qualityItem"
                    onClick={() => navigate(`/manage-surveys/review?surveyId=${item.surveyId}&tab=personal&responseId=${item.responseId}`)}
                  >
                    <div>
                      <strong>{item.surveyTitle}</strong>
                      <span>{item.respondentEmail} - {item.submittedAt}</span>
                    </div>
                    <div className={`qualityBadge ${item.superficial ? 'bad' : 'good'}`}>
                      {item.qualityScore}%
                    </div>
                  </button>
                )) : <p className="emptyQuality">Chưa có phản hồi nào được AI phân tích.</p>}
              </div>
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
