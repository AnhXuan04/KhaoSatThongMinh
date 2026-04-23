import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './CreatorPackagePage.css';

type PlanKey = 'personal' | 'pro' | 'business';

const planData: Record<PlanKey, { name: string; price: string; subtitle: string; features: string[] }> = {
  personal: {
    name: 'CÁ NHÂN',
    price: '$29',
    subtitle: '/tháng',
    features: ['10 khảo sát đồng thời', '1,000 lượt phản hồi']
  },
  pro: {
    name: 'CHUYÊN NGHIỆP',
    price: '$89',
    subtitle: '/tháng',
    features: ['Khảo sát không giới hạn', '10,000 lượt phản hồi', 'Phân tích logic']
  },
  business: {
    name: 'DOANH NGHIỆP',
    price: '$249',
    subtitle: '/tháng',
    features: ['Hỗ trợ tận tâm', 'Tùy chỉnh thương hiệu', 'Tích hợp SSO']
  }
};

export default function CreatorPackagePage() {
  const navigate = useNavigate();
  const [selectedPlan, setSelectedPlan] = useState<PlanKey>('pro');
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: ''
  });
  const [errorMessage, setErrorMessage] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
    if (errorMessage) setErrorMessage('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const response = await fetch('http://localhost:8080/api/auth/signup/interviewer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const result = await response.text();
      if (response.ok) {
        navigate('/login');
      } else {
        setErrorMessage(result);
      }
    } catch (error) {
      console.error('Loi goi API:', error);
      setErrorMessage('Khong the ket noi den may chu.');
    }
  };

  return (
    <div className="creatorPage">
      <main className="creatorMain">
        <section className="leftPanel">
          <span className="introTag">GÓI DÀNH CHO NGƯỜI TẠO KHẢO SÁT</span>
          <h1>Tạo Tài Khoản Người Tạo Khảo Sát</h1>
          <p>
            Tham gia nền tảng thu thập dữ liệu chính xác nhất thế giới. Thiết lập không gian
            làm việc của bạn trong vài giây.
          </p>

          <form className="creatorForm" onSubmit={handleSubmit}>
            <label htmlFor="fullName">1. Họ và tên</label>
            <input id="fullName" type="text" placeholder="Jane Cooper" value={formData.fullName} onChange={handleChange} required />

            <label htmlFor="email">2. Email công việc</label>
            <input id="email" type="email" placeholder="jane@company.com" value={formData.email} onChange={handleChange} required />

            <label htmlFor="password">3. Mật khẩu</label>
            <input id="password" type="password" placeholder="••••••••" value={formData.password} onChange={handleChange} required />

            {errorMessage && <p>{errorMessage}</p>}

            <button type="submit" className="completeBtn">Hoàn Tất Đăng Ký</button>
          </form>
        </section>

        <section className="rightPanel">
          <div className="planHead">
            <h2>Chọn Gói Của Bạn</h2>
            <p>Chọn gói giải pháp phù hợp nhất để thúc đẩy các nghiên cứu của bạn.</p>
          </div>

          <div className="billingSwitch">
            <button type="button">Hàng tháng</button>
            <button type="button">Hàng năm - Giảm 20%</button>
          </div>

          <div className="planGrid">
            {(Object.keys(planData) as PlanKey[]).map((key) => {
              const plan = planData[key];
              const active = selectedPlan === key;

              return (
                <article key={key} className={`planCard ${active ? 'active' : ''}`}>
                  {key === 'pro' && <div className="popularTag">Phổ biến nhất</div>}
                  <span className="planName">{plan.name}</span>
                  <div className="planPriceWrap">
                    <strong>{plan.price}</strong>
                    <span>{plan.subtitle}</span>
                  </div>

                  <ul>
                    {plan.features.map((feature) => (
                      <li key={feature}>{feature}</li>
                    ))}
                  </ul>

                  <button type="button" onClick={() => setSelectedPlan(key)}>
                    {active ? 'Đã chọn' : 'Chọn'}
                  </button>
                </article>
              );
            })}
          </div>

          <div className="rightBottom">
            <div className="proofWrap">
              <div className="avatarStack">
                <span>A</span>
                <span>B</span>
                <span>C</span>
                <span>+5k</span>
              </div>
              <p>Tham gia cùng hơn 5,000 tổ chức đang sử dụng các công cụ chính xác của chúng tôi.</p>
            </div>

          </div>
        </section>
      </main>

      <footer className="creatorFooter">
        <div className="footerBrand">
          <span>Precision Survey</span>
          <small>Nền tảng khảo sát thông minh cho nhóm nghiên cứu hiện đại.</small>
        </div>
        <div className="footerLinks" role="navigation" aria-label="Liên kết cuối trang">
          <Link to="/">Trang chủ</Link>
          <a href="#">Chính sách bảo mật</a>
          <a href="#">Điều khoản dịch vụ</a>
          <a href="#">Hỗ trợ</a>
        </div>
        <small>© 2026 Precision Survey. All rights reserved.</small>
      </footer>
    </div>
  );
}