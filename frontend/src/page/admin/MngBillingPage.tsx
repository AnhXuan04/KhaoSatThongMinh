import { type FormEvent, useEffect, useMemo, useState } from 'react';
import {
  FiEdit3,
  FiFilter,
  FiPlus,
  FiSearch,
  FiShield,
  FiTrash2,
  FiUser
} from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import { adminSideMenus } from './adminSideMenus';
import './DashboardAdmin.css';
import './MngBilling.css';

type PlanItem = {
  id: number;
  code: string;
  name: string;
  priceMonthly: number;
  priceYearly: number;
  active: boolean;
};

type TransactionItem = {
  id: number;
  payerEmail: string;
  planName: string;
  billingCycle: string;
  amount: number;
  status: string;
  createdAt: string;
};

type BillingDashboard = {
  totalRevenue: number;
  totalTransactions: number;
  successfulTransactions: number;
  failedTransactions: number;
  pendingTransactions: number;
  plans: PlanItem[];
  transactions: TransactionItem[];
};

const emptyDashboard: BillingDashboard = {
  totalRevenue: 0,
  totalTransactions: 0,
  successfulTransactions: 0,
  failedTransactions: 0,
  pendingTransactions: 0,
  plans: [],
  transactions: []
};

const moneyFormatter = new Intl.NumberFormat('vi-VN', {
  style: 'currency',
  currency: 'VND',
  maximumFractionDigits: 0
});

const numberFormatter = new Intl.NumberFormat('vi-VN');

const getCycleLabel = (cycle?: string) => {
  if (cycle === 'YEARLY') return 'Yearly';
  if (cycle === 'MONTHLY') return 'Monthly';
  return cycle || 'Monthly';
};

const getStatusLabel = (status: string) => {
  if (status === 'SUCCESS') return 'Success';
  if (status === 'FAILED') return 'Failed';
  return 'Pending';
};

export default function MngBillingPage() {
  const navigate = useNavigate();
  const [fullName, setFullName] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [dashboard, setDashboard] = useState<BillingDashboard>(emptyDashboard);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'SUCCESS' | 'FAILED' | 'PENDING'>('all');
  const [isAddPlanOpen, setIsAddPlanOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<PlanItem | null>(null);
  const [newPlanCode, setNewPlanCode] = useState('');
  const [newPlanName, setNewPlanName] = useState('');
  const [newPlanMonthly, setNewPlanMonthly] = useState('');
  const [newPlanYearly, setNewPlanYearly] = useState('');
  const [newPlanFeatures, setNewPlanFeatures] = useState('');
  const [planError, setPlanError] = useState('');
  const [isSavingPlan, setIsSavingPlan] = useState(false);

  const handleLogout = () => {
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('userEmail');
    navigate('/login');
  };

  const openAddPlanModal = () => {
    setEditingPlan(null);
    setNewPlanCode('');
    setNewPlanName('');
    setNewPlanMonthly('');
    setNewPlanYearly('');
    setNewPlanFeatures('');
    setPlanError('');
    setIsAddPlanOpen(true);
  };

  const openEditPlanModal = (plan: PlanItem) => {
    setEditingPlan(plan);
    setNewPlanCode(plan.code || '');
    setNewPlanName(plan.name || '');
    setNewPlanMonthly(String(plan.priceMonthly || 0));
    setNewPlanYearly(String(plan.priceYearly || 0));
    setNewPlanFeatures('');
    setPlanError('');
    setIsAddPlanOpen(true);
  };

  const closeAddPlanModal = () => {
    if (isSavingPlan) return;
    setIsAddPlanOpen(false);
    setEditingPlan(null);
  };

  const handleAddPlanSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const token = sessionStorage.getItem('token');
    if (!token) return;

    if (!newPlanCode.trim() || !newPlanName.trim()) {
      setPlanError('Vui lòng nhập mã gói và tên gói dịch vụ.');
      return;
    }

    const priceMonthly = Number(newPlanMonthly || 0);
    const priceYearly = Number(newPlanYearly || 0);

    if (Number.isNaN(priceMonthly) || Number.isNaN(priceYearly) || priceMonthly < 0 || priceYearly < 0) {
      setPlanError('Giá gói phải là số không âm.');
      return;
    }

    setIsSavingPlan(true);
    setPlanError('');

    try {
      const response = await fetch(editingPlan ? `/api/admin/plans/${editingPlan.id}` : '/api/admin/plans', {
        method: editingPlan ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          code: newPlanCode.trim(),
          name: newPlanName.trim(),
          priceMonthly,
          priceYearly,
          featuresJson: newPlanFeatures.trim() || '[]',
          active: true
        })
      });

      if (!response.ok) {
        const message = await response.text();
        throw new Error(message || 'Không thể thêm gói dịch vụ');
      }

      const savedPlan = await response.json();
      setDashboard((current) => ({
        ...current,
        plans: editingPlan
          ? current.plans
              .map((plan) => (plan.id === editingPlan.id ? savedPlan : plan))
              .sort((first, second) => first.priceMonthly - second.priceMonthly)
          : [...current.plans, savedPlan].sort((first, second) => first.priceMonthly - second.priceMonthly)
      }));
      setIsAddPlanOpen(false);
      setEditingPlan(null);
    } catch (error) {
      setPlanError(error instanceof Error ? error.message : 'Lỗi không xác định');
    } finally {
      setIsSavingPlan(false);
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
        const [profileResponse, billingResponse] = await Promise.all([
          fetch('/api/user/profile', {
            headers: { Authorization: `Bearer ${token}` }
          }),
          fetch('/api/admin/billing', {
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

        if (billingResponse.ok) {
          const data = await billingResponse.json();
          setDashboard({
            totalRevenue: Number(data.totalRevenue) || 0,
            totalTransactions: Number(data.totalTransactions) || 0,
            successfulTransactions: Number(data.successfulTransactions) || 0,
            failedTransactions: Number(data.failedTransactions) || 0,
            pendingTransactions: Number(data.pendingTransactions) || 0,
            plans: Array.isArray(data.plans) ? data.plans : [],
            transactions: Array.isArray(data.transactions) ? data.transactions : []
          });
        }
      } catch (error) {
        console.error('Không thể tải dữ liệu gói dịch vụ và thanh toán:', error);
        setFullName(userEmail);
        setAdminEmail(userEmail);
      }
    };

    loadData();
  }, [navigate]);

  const successRate = dashboard.totalTransactions > 0
    ? Math.round((dashboard.successfulTransactions / dashboard.totalTransactions) * 1000) / 10
    : 0;

  const filteredTransactions = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();

    return dashboard.transactions.filter((transaction) => {
      const matchesStatus = statusFilter === 'all' || transaction.status === statusFilter;
      const matchesKeyword =
        !keyword ||
        [transaction.payerEmail, transaction.planName, transaction.billingCycle].some((value) =>
          value?.toLowerCase().includes(keyword)
        );
      return matchesStatus && matchesKeyword;
    });
  }, [dashboard.transactions, searchTerm, statusFilter]);


  return (
    <div className="adminPage billingPage">
      {isAddPlanOpen && (
        <div className="billingModalOverlay" onClick={closeAddPlanModal} role="presentation">
          <div
            className="billingModal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="add-plan-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="billingModalHead">
              <h2 id="add-plan-title">{editingPlan ? 'Chỉnh sửa gói dịch vụ' : 'Thêm gói dịch vụ'}</h2>
              <button type="button" onClick={closeAddPlanModal} aria-label="Đóng">
                ×
              </button>
            </div>

            <form className="billingModalBody" onSubmit={handleAddPlanSubmit}>
              <label>
                <span>Mã gói</span>
                <input
                  type="text"
                  placeholder="Ví dụ: PRO_MONTHLY"
                  value={newPlanCode}
                  onChange={(event) => setNewPlanCode(event.target.value)}
                  disabled={isSavingPlan}
                />
              </label>

              <label>
                <span>Tên gói</span>
                <input
                  type="text"
                  placeholder="Ví dụ: Pro"
                  value={newPlanName}
                  onChange={(event) => setNewPlanName(event.target.value)}
                  disabled={isSavingPlan}
                />
              </label>

              <div className="billingModalGrid">
                <label>
                  <span>Giá tháng</span>
                  <input
                    type="number"
                    min="0"
                    placeholder="250000"
                    value={newPlanMonthly}
                    onChange={(event) => setNewPlanMonthly(event.target.value)}
                    disabled={isSavingPlan}
                  />
                </label>

                <label>
                  <span>Giá năm</span>
                  <input
                    type="number"
                    min="0"
                    placeholder="2400000"
                    value={newPlanYearly}
                    onChange={(event) => setNewPlanYearly(event.target.value)}
                    disabled={isSavingPlan}
                  />
                </label>
              </div>

              <label>
                <span>Tính năng JSON</span>
                <textarea
                  rows={4}
                  placeholder='["Không giới hạn khảo sát", "Báo cáo nâng cao"]'
                  value={newPlanFeatures}
                  onChange={(event) => setNewPlanFeatures(event.target.value)}
                  disabled={isSavingPlan}
                />
              </label>

              {planError && <div className="billingModalError">{planError}</div>}

              <div className="billingModalActions">
                <button type="button" className="secondary" onClick={closeAddPlanModal} disabled={isSavingPlan}>
                  Hủy
                </button>
                <button type="submit" disabled={isSavingPlan}>
                  {isSavingPlan ? 'Đang lưu...' : editingPlan ? 'Lưu thay đổi' : 'Lưu gói'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
                className={`adminMenuItem ${menu.key === 'billing' ? 'active' : ''}`}
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

      <main className="billingMain">
        <header className="billingHeader">
          <h1>Gói dịch vụ & Thanh toán</h1>
        </header>

        <section className="billingTopGrid">
          <article className="billingRevenueCard">
            <div>
              <span>Tổng doanh thu kỳ này</span>
              <strong>{moneyFormatter.format(dashboard.totalRevenue)}</strong>
              <small>{successRate}% giao dịch thanh toán thành công</small>
            </div>
            <div className="billingRevenueBar">
              <i style={{ width: `${Math.min(successRate, 100)}%` }} />
            </div>
          </article>

          <article className="billingTransactionCard">
            <span>Thống kê giao dịch</span>
            <strong>{numberFormatter.format(dashboard.totalTransactions)}</strong>
            <small>{numberFormatter.format(dashboard.successfulTransactions)} thành công</small>
            <div className="billingSplitBar">
              <i style={{ width: `${Math.min(successRate, 100)}%` }} />
            </div>
            <div className="billingSplitLabels">
              <span>Thành công</span>
              <span>Thất bại: {numberFormatter.format(dashboard.failedTransactions)}</span>
            </div>
          </article>
        </section>

        <section className="billingPanel">
          <div className="billingPanelHead">
            <h2>Danh sách Gói dịch vụ</h2>
            <button type="button" className="billingAddPlanBtn" onClick={openAddPlanModal}>
              <FiPlus />
              Thêm gói dịch vụ
            </button>
          </div>

          <table className="billingTable">
            <thead>
              <tr>
                <th>Tên gói</th>
                <th>Thông tin cơ bản</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {dashboard.plans.map((plan) => (
                <tr key={plan.id}>
                  <td><strong>{plan.name}</strong></td>
                  <td>
                    {plan.priceMonthly > 0
                      ? `${moneyFormatter.format(plan.priceMonthly)} / tháng`
                      : 'Miễn phí hoặc liên hệ'}
                  </td>
                  <td>
                    <div className="billingTableActions">
                      <button
                        type="button"
                        aria-label={`Chỉnh sửa ${plan.name}`}
                        onClick={() => openEditPlanModal(plan)}
                      >
                        <FiEdit3 />
                      </button>
                      <button type="button" aria-label={`Xóa ${plan.name}`}><FiTrash2 /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {!dashboard.plans.length && (
                <tr>
                  <td colSpan={3} className="billingEmpty">Chưa có gói dịch vụ nào.</td>
                </tr>
              )}
            </tbody>
          </table>
        </section>

        <section className="billingPanel">
          <div className="billingPanelHead transaction">
            <h2>Lịch sử Giao dịch</h2>
            <div className="billingTools">
              <label>
                <FiSearch />
                <input
                  type="search"
                  placeholder="Tìm theo email hoặc mã..."
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                />
              </label>
              <button
                type="button"
                onClick={() => setStatusFilter((current) => (current === 'SUCCESS' ? 'all' : 'SUCCESS'))}
                className={statusFilter === 'SUCCESS' ? 'active' : ''}
              >
                <FiFilter />
                Lọc
              </button>
            </div>
          </div>

          <table className="billingTable transactions">
            <thead>
              <tr>
                <th>Người dùng</th>
                <th>Gói dịch vụ</th>
                <th>Số tiền</th>
                <th>Ngày</th>
                <th>Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              {filteredTransactions.map((transaction) => (
                <tr key={transaction.id}>
                  <td>
                    <strong>{transaction.payerEmail || 'Không rõ'}</strong>
                    <span>ID: {transaction.id}</span>
                  </td>
                  <td>{transaction.planName} {getCycleLabel(transaction.billingCycle)}</td>
                  <td>{moneyFormatter.format(transaction.amount || 0)}</td>
                  <td>{transaction.createdAt || '--/--/----'}</td>
                  <td>
                    <span className={`billingStatus ${transaction.status.toLowerCase()}`}>
                      {getStatusLabel(transaction.status)}
                    </span>
                  </td>
                </tr>
              ))}
              {!filteredTransactions.length && (
                <tr>
                  <td colSpan={5} className="billingEmpty">Không có giao dịch phù hợp.</td>
                </tr>
              )}
            </tbody>
          </table>
        </section>
      </main>
    </div>
  );
}
