import { apiUrl } from '../../config/api';
import { useEffect, useMemo, useState } from 'react';
import {
  FiBarChart2,
  FiChevronDown,
  FiCheckCircle,
  FiClock,
  FiFilter,
  FiFolder,
  FiGrid,
  FiSearch,
  FiShield,
  FiUser,
  FiUserCheck,
  FiUsers,
  FiXCircle
} from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import './DashboardAdmin.css';
import './MngQualitySurvey.css';

type CoinReview = {
  coinTransactionId: number;
  responseId: number;
  surveyTitle: string;
  respondentEmail: string;
  qualityScore: number;
  superficial: boolean;
  rewardEligible: boolean;
  analysisSummary: string;
  coinAmount: number;
  coinStatus: string;
  reason: string;
  submittedAt: string;
};

type DashboardStats = {
  superficialSurveys: number;
  nonSuperficialSurveys: number;
  rewardEligibleResponses: number;
};

const sideMenus = [
  { key: 'dashboard', label: 'Tổng quan', icon: FiGrid, path: '/dashboard-admin' },
  { key: 'users', label: 'Người dùng', icon: FiUsers, path: '/dashboard-admin/users' },
  { key: 'categories', label: 'Danh mục', icon: FiFolder, path: '/dashboard-admin/categories' },
  { key: 'quality', label: 'Phân tích chất lượng', icon: FiBarChart2, path: '/dashboard-admin/quality' }
];

const numberFormatter = new Intl.NumberFormat('vi-VN');

export default function MngQualitySurvey() {
  const navigate = useNavigate();
  const [fullName, setFullName] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [coinReviews, setCoinReviews] = useState<CoinReview[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    superficialSurveys: 0,
    nonSuperficialSurveys: 0,
    rewardEligibleResponses: 0
  });
  const [selectedSurvey, setSelectedSurvey] = useState('all');
  const [qualityFilter, setQualityFilter] = useState<'all' | 'verified' | 'review'>('all');
  const [isSurveyMenuOpen, setIsSurveyMenuOpen] = useState(false);

  const handleLogout = () => {
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('userEmail');
    navigate('/login');
  };

  useEffect(() => {
    const token = sessionStorage.getItem('token');
    const userEmail = sessionStorage.getItem('userEmail');

    if (!token || !userEmail) {
      navigate('/login');
      return;
    }

    const loadData = async () => {
      try {
        const [profileResponse, statsResponse, reviewsResponse] = await Promise.all([
          fetch(apiUrl('/api/user/profile'), {
            headers: { Authorization: `Bearer ${token}` }
          }),
          fetch(apiUrl('/api/admin/stats'), {
            headers: { Authorization: `Bearer ${token}` }
          }),
          fetch(apiUrl('/api/admin/coin-reviews'), {
            headers: { Authorization: `Bearer ${token}` }
          })
        ]);

        if (profileResponse.ok) {
          const profile = await profileResponse.json();
          setFullName(profile.fullName || userEmail);
          setAdminEmail(profile.email || userEmail);
        } else {
          setFullName(userEmail);
          setAdminEmail(userEmail);
        }

        if (statsResponse.ok) {
          const data = await statsResponse.json();
          setStats({
            superficialSurveys: Number(data.superficialSurveys) || 0,
            nonSuperficialSurveys: Number(data.nonSuperficialSurveys) || 0,
            rewardEligibleResponses: Number(data.rewardEligibleResponses) || 0
          });
        }

        if (reviewsResponse.ok) {
          const data = await reviewsResponse.json();
          setCoinReviews(Array.isArray(data) ? data : []);
        }
      } catch (error) {
        console.error('Không thể tải dữ liệu phân tích chất lượng:', error);
      }
    };

    loadData();
  }, [navigate]);

  const surveyOptions = useMemo(() => {
    return Array.from(new Set(coinReviews.map((item) => item.surveyTitle).filter(Boolean)));
  }, [coinReviews]);

  const selectedSurveyLabel = selectedSurvey === 'all' ? 'Tất cả bài khảo sát' : selectedSurvey;

  const filteredReviews = useMemo(() => {
    return coinReviews.filter((item) => {
      const matchesSurvey = selectedSurvey === 'all' || item.surveyTitle === selectedSurvey;
      const needsReview = item.qualityScore < 70 || item.superficial;
      const matchesQuality =
        qualityFilter === 'all' ||
        (qualityFilter === 'verified' && !needsReview) ||
        (qualityFilter === 'review' && needsReview);
      return matchesSurvey && matchesQuality;
    });
  }, [coinReviews, qualityFilter, selectedSurvey]);

  const totalResponses = stats.superficialSurveys + stats.nonSuperficialSurveys;
  const accuracyRate = totalResponses > 0
    ? Math.round((stats.nonSuperficialSurveys / totalResponses) * 1000) / 10
    : 0;

  const reviewCoin = async (transactionId: number, action: 'approve' | 'reject') => {
    const token = sessionStorage.getItem('token');
    if (!token) return;

    const response = await fetch(apiUrl(`/api/admin/coin-reviews/${transactionId}/${action}`), {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}` }
    });

    if (response.ok) {
      setCoinReviews((current) => current.filter((item) => item.coinTransactionId !== transactionId));
    }
  };

  return (
    <div className="adminPage qualityAdminPage">
      <aside className="adminSidebar">
        <div className="adminBrand">
          <FiShield />
          <span>Quản trị Khảo sát</span>
        </div>

        <div className="adminIdentity">
          <div className="adminIdentityIcon">
            <FiUser />
          </div>
          <div>
            <h4>{fullName || 'Quản trị viên'}</h4>
            <p>{adminEmail || 'admin@survey.vn'}</p>
          </div>
        </div>

        <nav className="adminMenu">
          {sideMenus.map((menu) => {
            const Icon = menu.icon;
            return (
              <button
                key={menu.key}
                type="button"
                className={`adminMenuItem ${menu.key === 'quality' ? 'active' : ''}`}
                onClick={() => navigate(menu.path)}
              >
                <Icon />
                <span>{menu.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="adminQuickActions">
          <button type="button" className="adminQuickBtn logout" onClick={handleLogout}>
            Đăng xuất
          </button>
        </div>
      </aside>

      <main className="qualityAdminMain">
        <div className="qualityPhoneShell">
          <header className="qualityTopbar">
            <h1>Phân tích Chất lượng</h1>
          </header>

          <section className="qualityControlPanel">
            <label>Chọn bài khảo sát</label>
            <div className="qualitySelectWrap">
              <span className="qualitySelectIcon">
                <FiSearch />
              </span>
              <button
                type="button"
                className="qualitySelectButton"
                onClick={() => setIsSurveyMenuOpen((open) => !open)}
              >
                <span>{selectedSurveyLabel}</span>
                <FiChevronDown className={isSurveyMenuOpen ? 'open' : ''} />
              </button>

              {isSurveyMenuOpen && (
                <div className="qualitySelectMenu">
                  <button
                    type="button"
                    className={selectedSurvey === 'all' ? 'active' : ''}
                    onClick={() => {
                      setSelectedSurvey('all');
                      setIsSurveyMenuOpen(false);
                    }}
                  >
                    <span>Tất cả bài khảo sát</span>
                    <small>{numberFormatter.format(coinReviews.length)} phản hồi</small>
                  </button>
                  {surveyOptions.map((title) => {
                    const count = coinReviews.filter((item) => item.surveyTitle === title).length;
                    return (
                      <button
                        key={title}
                        type="button"
                        className={selectedSurvey === title ? 'active' : ''}
                        onClick={() => {
                          setSelectedSurvey(title);
                          setIsSurveyMenuOpen(false);
                        }}
                      >
                        <span>{title}</span>
                        <small>{numberFormatter.format(count)} phản hồi</small>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
            <div className="qualitySegment">
              <button
                type="button"
                className={qualityFilter === 'all' ? 'active' : ''}
                onClick={() => setQualityFilter('all')}
              >
                <FiFilter /> Tất cả
              </button>
              <button
                type="button"
                className={qualityFilter === 'verified' ? 'active' : ''}
                onClick={() => setQualityFilter('verified')}
              >
                Đạt
              </button>
              <button
                type="button"
                className={qualityFilter === 'review' ? 'active' : ''}
                onClick={() => setQualityFilter('review')}
              >
                Cần xem lại
              </button>
            </div>
          </section>

          <section className="qualityHeroCard">
            <div>
              <span>Tổng phản hồi</span>
              <strong>{numberFormatter.format(totalResponses)}</strong>
            </div>
            <FiBarChart2 />
          </section>

          <section className="qualityMiniStats">
            <article>
              <span>Tỷ lệ chính xác</span>
              <strong>{accuracyRate}%</strong>
            </article>
            <article>
              <span>Chờ duyệt</span>
              <strong>{numberFormatter.format(filteredReviews.length)}</strong>
            </article>
          </section>

          <section className="qualityListSection">
            <h2>Danh sách phản hồi</h2>
            <div className="qualityReviewList">
              {filteredReviews.map((item) => {
                const needsReview = item.qualityScore < 70 || item.superficial;
                return (
                  <article className="qualityReviewCard" key={item.coinTransactionId}>
                    <div className="qualityReviewer">
                      <span className="qualityReviewerIcon">
                        <FiUserCheck />
                      </span>
                      <div>
                        <h3>{item.respondentEmail || 'Interviewee'}</h3>
                        <div className="qualityReviewerMeta">
                          <span className={needsReview ? 'review' : 'verified'}>
                            {needsReview ? 'Cần kiểm tra lại' : 'AI Verified'}
                          </span>
                          <small><FiClock /> {item.submittedAt || 'Mới gửi'}</small>
                        </div>
                      </div>
                    </div>

                    <div className="qualityScoreGrid">
                      <div>
                        <span>Chất lượng phản hồi</span>
                        <strong className={needsReview ? 'warning' : ''}>{item.qualityScore}<em>%</em></strong>
                      </div>
                      <div>
                        <span>Thưởng đề xuất</span>
                        <strong>{item.coinAmount}<em> coin</em></strong>
                      </div>
                    </div>

                    <div className="qualityTags">
                      <span className="ok"><FiCheckCircle /> Đủ dữ liệu câu hỏi</span>
                      {!needsReview && <span className="ok"><FiCheckCircle /> Thời gian hợp lệ</span>}
                      {!needsReview && <span className="ok"><FiCheckCircle /> Logic nhất quán</span>}
                      {needsReview && <span className="bad"><FiXCircle /> Thời gian quá nhanh</span>}
                    </div>

                    <div className="qualityActions">
                      <button type="button" onClick={() => reviewCoin(item.coinTransactionId, 'approve')}>Duyệt</button>
                      <button type="button" className="reject" onClick={() => reviewCoin(item.coinTransactionId, 'reject')}>Từ chối</button>
                    </div>
                  </article>
                );
              })}

              {!filteredReviews.length && (
                <div className="qualityEmpty">
                  Không có phản hồi nào đang chờ duyệt.
                </div>
              )}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
