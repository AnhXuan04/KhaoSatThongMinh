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
  { key: 'dashboard', label: 'Tổng quan', icon: FiGrid, active: true },
  { key: 'users', label: 'Quản lý Người dùng', icon: FiUsers, active: false },
  { key: 'categories', label: 'Quản lý Danh mục', icon: FiFolder, active: false },
  { key: 'quality', label: 'Phân tích Chất lượng', icon: FiBarChart2, active: false }
];

const kpis = [
  { title: 'Tổng người dùng', value: '42,850', note: '+12% tháng này', accent: false },
  { title: 'Đang hoạt động', value: '1,204', note: 'Truy cập trong 15 phút qua', accent: true },
  { title: 'Đăng ký mới hôm nay', value: '158', note: 'Mục tiêu: 200/ngày', accent: false }
];

const categories = [
  { name: 'Công nghệ', detail: '1,240 khảo sát • 85% hoàn thành' },
  { name: 'Y tế & Sức khỏe', detail: '850 khảo sát • 92% hoàn thành' },
  { name: 'Kinh doanh', detail: '2,100 khảo sát • 78% hoàn thành' }
];

const bars = [42, 64, 56, 82, 68, 48, 78];

export default function DashboardAdmin() {
  const navigate = useNavigate();
  const [fullName, setFullName] = useState('');

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userEmail');
    navigate('/login');
  };

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
        console.error('Không thể tải dữ liệu dashboard admin:', error);
      }
    };

    fetchProfile();
  }, [navigate]);

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
              <button key={menu.key} type="button" className={`adminMenuItem ${menu.active ? 'active' : ''}`}>
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
          <button type="button">Xem tất cả</button>
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
            </article>
          ))}
        </div>

        <div className="adminBottomGrid">
          <article className="adminPanel">
            <div className="adminPanelHead">
              <h3>Quản lý Danh mục</h3>
              <button type="button">Thêm mới</button>
            </div>

            <div className="adminCategoryList">
              {categories.map((category) => (
                <div className="adminCategoryItem" key={category.name}>
                  <span className="adminCategoryIcon"><FiClipboard /></span>
                  <div>
                    <h4>{category.name}</h4>
                    <p>{category.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          </article>

          <article className="adminPanel">
            <div className="adminPanelHead">
              <h3>Phân tích Chất lượng</h3>
              <button type="button">7 ngày qua</button>
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
                <span>TỶ LỆ HOÀN THÀNH</span>
                <strong>84.2%</strong>
              </div>
              <div>
                <span>ĐỘ TIN CẬY DỮ LIỆU</span>
                <strong>98.1</strong>
              </div>
            </div>
          </article>
        </div>
      </section>
    </div>
  );
}