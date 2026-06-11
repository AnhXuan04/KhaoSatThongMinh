import { useEffect, useMemo, useState } from 'react';
import {
  FiCalendar,
  FiEye,
  FiEyeOff,
  FiFilter,
  FiMessageSquare,
  FiMoreVertical,
  FiSearch,
  FiShield,
  FiLock,
  FiTrash2,
  FiUnlock,
  FiUser
} from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import { adminSideMenus } from './adminSideMenus';
import './DashboardAdmin.css';
import './MngSystemSurvey.css';

type AdminSurvey = {
  id: number;
  title: string;
  creatorName: string;
  creatorEmail: string;
  responseCount: number;
  createdAt: string;
  status: string;
  hidden: boolean;
  locked: boolean;
};

type DashboardStats = {
  totalSurveys: number;
};

const numberFormatter = new Intl.NumberFormat('vi-VN');

const getStatusMeta = (status: string) => {
  if (status === 'BI_KHOA') {
    return { label: 'Đã khóa', className: 'locked' };
  }
  if (status === 'CHO_DUYET') {
    return { label: 'Chờ duyệt', className: 'pending' };
  }
  if (status === 'DA_AN') {
    return { label: 'Đã ẩn', className: 'hidden' };
  }
  return { label: 'Hoạt động', className: 'active' };
};

export default function MngSystemSurveyPage() {
  const navigate = useNavigate();
  const [fullName, setFullName] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [surveys, setSurveys] = useState<AdminSurvey[]>([]);
  const [stats, setStats] = useState<DashboardStats>({ totalSurveys: 0 });
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'locked'>('all');
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);

  const handleLogout = () => {
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('userEmail');
    navigate('/login');
  };

  const updateSurveyAction = async (
    survey: AdminSurvey,
    action: 'lock' | 'unlock' | 'hide' | 'unhide' | 'delete'
  ) => {
    const token = sessionStorage.getItem('token');
    if (!token) return;

    const confirmMessages: Record<typeof action, string> = {
      lock: `Bạn có chắc chắn muốn khóa khảo sát "${survey.title}"?`,
      unlock: `Bạn có muốn mở khóa khảo sát "${survey.title}"?`,
      hide: `Bạn có chắc chắn muốn ẩn khảo sát "${survey.title}"?`,
      unhide: `Bạn có muốn hiện lại khảo sát "${survey.title}"?`,
      delete: `Bạn có chắc chắn muốn xóa khảo sát "${survey.title}"?`
    };

    if (!window.confirm(confirmMessages[action])) {
      setOpenMenuId(null);
      return;
    }

    try {
      const response = await fetch(`/api/admin/surveys/${survey.id}${action === 'delete' ? '' : `/${action}`}`, {
        method: action === 'delete' ? 'DELETE' : 'PUT',
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!response.ok) {
        throw new Error('Không thể cập nhật khảo sát');
      }

      if (action === 'delete') {
        setSurveys((current) => current.filter((item) => item.id !== survey.id));
        setStats((current) => ({ totalSurveys: Math.max((current.totalSurveys || surveys.length) - 1, 0) }));
      } else {
        const updatedSurvey = await response.json();
        setSurveys((current) => current.map((item) => (item.id === survey.id ? updatedSurvey : item)));
      }
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Lỗi không xác định');
    } finally {
      setOpenMenuId(null);
    }
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
        const [profileResponse, statsResponse, surveysResponse] = await Promise.all([
          fetch('/api/user/profile', {
            headers: { Authorization: `Bearer ${token}` }
          }),
          fetch('/api/admin/stats', {
            headers: { Authorization: `Bearer ${token}` }
          }),
          fetch('/api/admin/surveys', {
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
          setStats({ totalSurveys: Number(data.totalSurveys) || 0 });
        }

        if (surveysResponse.ok) {
          const data = await surveysResponse.json();
          setSurveys(Array.isArray(data) ? data : []);
        }
      } catch (error) {
        console.error('Không thể tải danh sách khảo sát toàn hệ thống:', error);
        setFullName(userEmail);
        setAdminEmail(userEmail);
      }
    };

    loadData();
  }, [navigate]);

  const activeSurveys = surveys.filter((survey) => survey.status !== 'BI_KHOA' && survey.status !== 'DA_AN').length;
  const lockedSurveys = surveys.filter((survey) => survey.status === 'BI_KHOA').length;
  const activePercent = surveys.length > 0 ? Math.round((activeSurveys / surveys.length) * 1000) / 10 : 0;

  const filteredSurveys = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();

    return surveys.filter((survey) => {
      const isLocked = survey.status === 'BI_KHOA';
      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'active' && !isLocked && survey.status !== 'DA_AN') ||
        (statusFilter === 'locked' && isLocked);
      const matchesKeyword =
        !keyword ||
        [survey.title, survey.creatorName, survey.creatorEmail].some((value) =>
          value?.toLowerCase().includes(keyword)
        );

      return matchesStatus && matchesKeyword;
    });
  }, [searchTerm, statusFilter, surveys]);

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
            <p>{adminEmail || 'admin@survey.vn'}</p>
          </div>
        </div>

        <nav className="adminMenu">
          {adminSideMenus.map((menu) => {
            const Icon = menu.icon;
            return (
              <button
                key={menu.key}
                type="button"
                className={`adminMenuItem ${menu.key === 'surveys' ? 'active' : ''}`}
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

      <main className="systemSurveyMain">
        <section className="systemSurveyStats">
          <article className="systemSurveyStatCard blue">
            <span>Tổng số khảo sát</span>
            <strong>{numberFormatter.format(stats.totalSurveys || surveys.length)}</strong>
            <div className="systemSurveyProgress">
              <i style={{ width: '70%' }} />
            </div>
          </article>

          <article className="systemSurveyStatCard blue">
            <span>Khảo sát đang hoạt động</span>
            <strong>{numberFormatter.format(activeSurveys)}</strong>
            <div className="systemSurveyProgress">
              <i style={{ width: `${Math.min(activePercent, 100)}%` }} />
            </div>
          </article>

          <article className="systemSurveyStatCard red">
            <span>Vi phạm / bị khóa</span>
            <strong>{numberFormatter.format(lockedSurveys)}</strong>
            <small>Khóa</small>
            <div className="systemSurveyProgress">
              <i style={{ width: lockedSurveys > 0 ? '24%' : '0%' }} />
            </div>
          </article>
        </section>

        <section className="systemSurveyListHead">
          <div>
            <h1>Danh sách Khảo sát</h1>
            <p>Quản lý và giám sát nội dung khảo sát trên toàn hệ thống.</p>
          </div>

          <div className="systemSurveyTools">
            <label className="systemSurveySearch">
              <FiSearch />
              <input
                type="search"
                placeholder="Tìm kiếm tiêu đề..."
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
              />
            </label>

            <button
              type="button"
              className={statusFilter === 'locked' ? 'active' : ''}
              onClick={() => setStatusFilter((current) => (current === 'locked' ? 'all' : 'locked'))}
            >
              <FiFilter />
              Lọc
            </button>
          </div>
        </section>

        <section className="systemSurveyList">
          {filteredSurveys.map((survey) => {
            const statusMeta = getStatusMeta(survey.status);
            return (
              <article className="systemSurveyItem" key={survey.id}>
                <div
                  className="systemSurveyItemContent"
                  role="button"
                  tabIndex={0}
                  onClick={() => navigate(`/dashboard-admin/surveys/${survey.id}`)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      navigate(`/dashboard-admin/surveys/${survey.id}`);
                    }
                  }}
                >
                  <div className="systemSurveyTitleLine">
                    <h2>{survey.title}</h2>
                    <span className={`systemSurveyBadge ${statusMeta.className}`}>
                      {statusMeta.label}
                    </span>
                  </div>

                  <div className="systemSurveyMeta">
                    <span><FiUser /> {survey.creatorName || 'Không rõ'}</span>
                    <span><FiMessageSquare /> {numberFormatter.format(survey.responseCount || 0)} phản hồi</span>
                    <span><FiCalendar /> {survey.createdAt || '--/--/----'}</span>
                  </div>
                </div>

                <div className="systemSurveyMenuWrap">
                  <button
                    type="button"
                    className="systemSurveyMore"
                    aria-label={`Tùy chọn ${survey.title}`}
                    aria-expanded={openMenuId === survey.id}
                    onClick={(event) => {
                      event.stopPropagation();
                      setOpenMenuId((current) => (current === survey.id ? null : survey.id));
                    }}
                  >
                    <FiMoreVertical />
                  </button>

                  {openMenuId === survey.id && (
                    <div className="systemSurveyActionMenu">
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          updateSurveyAction(survey, survey.locked ? 'unlock' : 'lock');
                        }}
                      >
                        {survey.locked ? <FiUnlock /> : <FiLock />}
                        {survey.locked ? 'Mở khóa khảo sát' : 'Khóa khảo sát'}
                      </button>
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          updateSurveyAction(survey, survey.hidden ? 'unhide' : 'hide');
                        }}
                      >
                        {survey.hidden ? <FiEye /> : <FiEyeOff />}
                        {survey.hidden ? 'Hiện lại khảo sát' : 'Ẩn khảo sát'}
                      </button>
                      <button
                        type="button"
                        className="danger"
                        onClick={(event) => {
                          event.stopPropagation();
                          updateSurveyAction(survey, 'delete');
                        }}
                      >
                        <FiTrash2 />
                        Xóa khảo sát
                      </button>
                    </div>
                  )}
                </div>
              </article>
            );
          })}

          {!filteredSurveys.length && (
            <div className="systemSurveyEmpty">
              Không tìm thấy khảo sát phù hợp.
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
