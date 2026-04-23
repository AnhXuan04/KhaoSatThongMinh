import { useEffect, useState } from 'react';
import {
  FiBarChart2,
  FiClipboard,
  FiFolder,
  FiGrid,
  FiShield,
  FiUser,
  FiUsers
} from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import './DashboardAdmin.css';

const sideMenus = [
  { key: 'dashboard', label: 'Tổng quan', icon: FiGrid, active: true, path: '/dashboard-admin' },
  { key: 'users', label: 'Quản lý Người dùng', icon: FiUsers, active: false, path: '/dashboard-admin/users' },
  { key: 'categories', label: 'Quản lý Lĩnh vực', icon: FiFolder, active: false, path: '/dashboard-admin/categories' },
  { key: 'quality', label: 'Phân tích Chất lượng', icon: FiBarChart2, active: false, path: '/dashboard-admin' }
];

type DashboardStats = {
  totalUsers: number;
  totalSurveys: number;
  superficialSurveys: number;
  nonSuperficialSurveys: number;
  rewardEligibleResponses: number;
};

type SurveyField = {
  id: number;
  name: string;
  description?: string;
};

const defaultStats: DashboardStats = {
  totalUsers: 0,
  totalSurveys: 0,
  superficialSurveys: 0,
  nonSuperficialSurveys: 0,
  rewardEligibleResponses: 0
};

const numberFormatter = new Intl.NumberFormat('vi-VN');

export default function DashboardAdmin() {
  const navigate = useNavigate();
  const [fullName, setFullName] = useState('');
  const [stats, setStats] = useState<DashboardStats>(defaultStats);
  const [surveyFields, setSurveyFields] = useState<SurveyField[]>([]);

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

    const fetchDashboardData = async () => {
      try {
        const profileResponse = await fetch('http://localhost:8080/api/user/profile', {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        const statsResponse = await fetch('http://localhost:8080/api/admin/stats', {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        const surveyFieldsResponse = await fetch('http://localhost:8080/api/admin/survey-fields', {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        if (profileResponse.ok) {
          const profileData = await profileResponse.json();
          setFullName(profileData.fullName || userEmail);
        } else {
          setFullName(userEmail);
        }

        if (statsResponse.ok) {
          const statsData = await statsResponse.json();
          setStats({
            totalUsers: Number(statsData.totalUsers) || 0,
            totalSurveys: Number(statsData.totalSurveys) || 0,
            superficialSurveys: Number(statsData.superficialSurveys) || 0,
            nonSuperficialSurveys: Number(statsData.nonSuperficialSurveys) || 0,
            rewardEligibleResponses: Number(statsData.rewardEligibleResponses) || 0
          });
        } else {
          setStats(defaultStats);
        }

        if (surveyFieldsResponse.ok) {
          const surveyFieldsData = await surveyFieldsResponse.json();
          setSurveyFields(Array.isArray(surveyFieldsData) ? surveyFieldsData : []);
        } else {
          setSurveyFields([]);
        }
      } catch (error) {
        console.error('Không thể tải dữ liệu dashboard admin:', error);
        setFullName(userEmail);
        setStats(defaultStats);
        setSurveyFields([]);
      }
    };

    fetchDashboardData();
  }, [navigate]);

  const totalQualityResponses = stats.superficialSurveys + stats.nonSuperficialSurveys;

  const bars = [
    totalQualityResponses > 0
      ? Math.min((stats.superficialSurveys / totalQualityResponses) * 100, 100)
      : 0,
    totalQualityResponses > 0
      ? Math.min((stats.nonSuperficialSurveys / totalQualityResponses) * 100, 100)
      : 0,
    totalQualityResponses > 0
      ? Math.min((stats.rewardEligibleResponses / totalQualityResponses) * 100, 100)
      : 0
  ];

  const kpis = [
    {
      title: 'Tổng người dùng',
      value: numberFormatter.format(stats.totalUsers),
      note: 'Tổng tài khoản hiện có trong hệ thống',
      accent: false
    },
    {
      title: 'Tổng bài khảo sát',
      value: numberFormatter.format(stats.totalSurveys),
      note: 'Tổng số bài khảo sát đã được tạo',
      accent: false
    }
  ];

  return (
    <div className="adminPage">
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
            <p>admin@survey.vn</p>
          </div>
        </div>

        <nav className="adminMenu">
          {sideMenus.map((menu) => {
            const Icon = menu.icon;
            return (
              <button
                key={menu.key}
                type="button"
                className={`adminMenuItem ${menu.active ? 'active' : ''}`}
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

      <section className="adminMain">

        <div className="adminSectionTitle">
          <h2>Tổng quan</h2>
        </div>

        <div className="adminKpiGrid">
          {kpis.map((kpi) => (
            <article key={kpi.title} className={`adminKpiCard ${kpi.accent ? 'accent' : ''}`}>
              <h3>{kpi.title}</h3>
              <strong>{kpi.value}</strong>
              <p>{kpi.note}</p>
              {kpi.accent && (
                <div className="adminMiniUsers">
                  <span><FiUser /></span>
                  <span><FiUser /></span>
                  <span><FiUser /></span>
                </div>
              )}
              {!kpi.accent && kpi.title === 'Tổng người dùng' && <FiUsers className="adminKpiBgIcon" />}
              {!kpi.accent && kpi.title === 'Tổng bài khảo sát' && <FiClipboard className="adminKpiBgIcon" />}
            </article>
          ))}
        </div>

        <div className="adminBottomGrid">
          <article className="adminPanel">
            <div className="adminPanelHead">
              <h3>Quản lý Danh mục</h3>
              <button type="button" onClick={() => navigate('/dashboard-admin/categories?openAddField=1')}>
                Thêm mới
              </button>
            </div>

            <div className="adminCategoryList">
              {surveyFields.map((category) => (
                <div className="adminCategoryItem" key={category.id}>
                  <span className="adminCategoryIcon"><FiClipboard /></span>
                  <div>
                    <h4>{category.name}</h4>
                    <p>{category.description || 'Chưa có mô tả'}</p>
                  </div>
                </div>
              ))}
              {!surveyFields.length && <p>Chưa có lĩnh vực khảo sát nào trong hệ thống.</p>}
            </div>
          </article>

          <article className="adminPanel">
            <div className="adminPanelHead">
              <h3>Phân tích Chất lượng</h3>
              <button type="button">Đánh giá thưởng coin</button>
            </div>

            <div className="adminBars" aria-label="Biểu đồ chất lượng">
              {bars.map((bar, index) => (
                <div
                  key={`${bar}-${index}`}
                  className={`bar ${index === bars.length - 1 ? 'active' : ''}`}
                  style={{ height: `${bar}%` }}
                />
              ))}
            </div>

            <div className="adminMetrics">
              <div>
                <span>KHẢO SÁT HỜI HỢT</span>
                <strong>{numberFormatter.format(stats.superficialSurveys)}</strong>
              </div>
              <div>
                <span>KHẢO SÁT CHẤT LƯỢNG</span>
                <strong>{numberFormatter.format(stats.nonSuperficialSurveys)}</strong>
              </div>
              <div>
                <span>ĐỦ ĐIỀU KIỆN CỘNG COIN</span>
                <strong>{numberFormatter.format(stats.rewardEligibleResponses)}</strong>
              </div>
            </div>
          </article>
        </div>
      </section>
    </div>
  );
}