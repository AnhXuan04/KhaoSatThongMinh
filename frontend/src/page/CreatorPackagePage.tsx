import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import './CreatorPackagePage.css';

type PlanDto = {
  id: number;
  code: string;
  name: string;
  priceMonthly: number;
  priceYearly: number;
  featuresJson: string;
  active: boolean;
};

type PaymentCreateDto = {
  paymentUrl?: string;
  txnRef?: string;
};

export default function CreatorPackagePage() {
  const PAID_TXN_REF_KEY = 'pendingPremiumTxnRef';
  const PAID_TXN_EMAIL_KEY = 'pendingPremiumEmail';
  const PAYMENT_RETURN_URL_KEY = 'premiumPaymentReturnUrl';
  const PAYMENT_SUCCESS_KEY = 'premiumPaymentSuccess';

  const [billingCycle, setBillingCycle] = useState<'MONTHLY' | 'YEARLY'>('MONTHLY');
  const [plan, setPlan] = useState<PlanDto | null>(null);
  const [planLoading, setPlanLoading] = useState(true);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: ''
  });
  const [errorMessage, setErrorMessage] = useState('');
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paidTxnRef, setPaidTxnRef] = useState('');
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  const hasEnoughSignUpInfo = () => {
    return formData.fullName.trim() && formData.email.trim() && formData.password.trim();
  };

  const createPaymentAndRedirect = async () => {
    if (!plan) {
      throw new Error('Chưa tải được gói dịch vụ.');
    }

    if (!hasEnoughSignUpInfo()) {
      throw new Error('Vui lòng nhập đầy đủ họ tên, email và mật khẩu trước khi thanh toán.');
    }

    sessionStorage.setItem('premiumPaymentReturnUrl', '/creator-package');

    const response = await fetch('http://localhost:8080/api/payments/vnpay/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        planId: plan.id,
        billingCycle,
        payerEmail: formData.email.trim().toLowerCase()
      })
    });

    if (!response.ok) {
      const message = await response.text();
      throw new Error(message || 'Không thể tạo thanh toán.');
    }

    const result: PaymentCreateDto = await response.json();
    if (result?.txnRef) {
      sessionStorage.setItem(PAID_TXN_REF_KEY, result.txnRef);
      sessionStorage.setItem(PAID_TXN_EMAIL_KEY, formData.email.trim().toLowerCase());
      setPaidTxnRef(result.txnRef);
    }

    if (result?.paymentUrl) {
      window.location.href = result.paymentUrl;
      return;
    }

    throw new Error('Không nhận được URL thanh toán.');
  };

  useEffect(() => {
    const paymentSuccessFlag = sessionStorage.getItem(PAYMENT_SUCCESS_KEY);
    const paymentReturnUrl = sessionStorage.getItem(PAYMENT_RETURN_URL_KEY);

    if (paymentSuccessFlag && paymentReturnUrl === '/creator-package') {
      setPaymentSuccess(true);
    }

    sessionStorage.removeItem(PAYMENT_SUCCESS_KEY);
    sessionStorage.removeItem(PAYMENT_RETURN_URL_KEY);

    const storedTxnRef = sessionStorage.getItem(PAID_TXN_REF_KEY) || '';
    const storedEmail = sessionStorage.getItem(PAID_TXN_EMAIL_KEY) || '';
    if (storedTxnRef) {
      setPaidTxnRef(storedTxnRef);
      if (storedEmail) {
        setFormData((prev) => ({ ...prev, email: storedEmail }));
      }
    }

    const fetchCurrentPlan = async () => {
      try {
        const response = await fetch('http://localhost:8080/api/plans/current');
        if (!response.ok) {
          throw new Error('Không thể tải thông tin gói.');
        }

        const result = await response.json();
        setPlan(result);
      } catch (error) {
        console.error(' lỗi tải plan:', error);
        setErrorMessage('Không thể tải thông tin gói dịch vụ. Vui lòng thử lại sau.');
      } finally {
        setPlanLoading(false);
      }
    };

    fetchCurrentPlan();
  }, []);

  const getFeatures = () => {
    if (!plan?.featuresJson) {
      return [] as string[];
    }

    try {
      const parsed = JSON.parse(plan.featuresJson);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      maximumFractionDigits: 0
    }).format(price);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
    if (errorMessage) setErrorMessage('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!paidTxnRef) {
      setErrorMessage('Vui lòng nhấn Chọn và thanh toán thành công trước khi hoàn tất đăng ký.');
      return;
    }

    const paidEmail = sessionStorage.getItem(PAID_TXN_EMAIL_KEY);
    if (paidEmail && paidEmail.toLowerCase() !== formData.email.trim().toLowerCase()) {
      setErrorMessage('Email đăng ký phải trùng với email đã thanh toán.');
      return;
    }

    if (!plan) {
      setErrorMessage('Chưa tải được gói dịch vụ. Vui lòng thử lại sau.');
      return;
    }

    setPaymentLoading(true);

    try {
      const signUpResponse = await fetch('http://localhost:8080/api/auth/signup/interviewer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          paidTxnRef
        })
      });

      const signUpResult = await signUpResponse.text();
      if (!signUpResponse.ok) {
        throw new Error(signUpResult || 'Đăng ký thất bại.');
      }

      sessionStorage.removeItem(PAID_TXN_REF_KEY);
      sessionStorage.removeItem(PAID_TXN_EMAIL_KEY);
      window.location.href = '/login';
    } catch (error) {
      console.error('Loi goi API:', error);
      const message = error instanceof Error ? error.message : 'Không thể kết nối đến máy chủ.';
      setErrorMessage(message);
    } finally {
      setPaymentLoading(false);
    }
  };

  const handlePayment = async () => {
    if (!plan) {
      setErrorMessage('Chưa tải được gói dịch vụ.');
      return;
    }

    setPaymentLoading(true);
    try {
      await createPaymentAndRedirect();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Không thể kết nối đến máy chủ.';
      setErrorMessage(message);
    } finally {
      setPaymentLoading(false);
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

            <button type="submit" className="completeBtn" disabled={paymentLoading || planLoading}>
              {paymentLoading ? 'Đang xử lý...' : 'Hoàn Tất Đăng Ký'}
            </button>
          </form>
        </section>

        <section className="rightPanel">
          <div className="planHead">
            <h2>Chọn Gói Của Bạn</h2>
            <p>Hệ thống hiện cung cấp một gói Premium với lựa chọn thanh toán theo tháng hoặc năm.</p>
          </div>

          <div className="billingSwitch">
            <button type="button" className={billingCycle === 'MONTHLY' ? 'active' : ''} onClick={() => setBillingCycle('MONTHLY')}>
              Hàng tháng
            </button>
            <button type="button" className={billingCycle === 'YEARLY' ? 'active' : ''} onClick={() => setBillingCycle('YEARLY')}>
              Hàng năm
            </button>
          </div>

          <div className="planGrid">
            {!planLoading && plan && (
              <article className="planCard active">
                <div className="popularTag">Gói hiện hành</div>
                <span className="planName">{plan.name}</span>
                <div className="planPriceWrap">
                  <strong>{formatPrice(billingCycle === 'MONTHLY' ? plan.priceMonthly : plan.priceYearly)}</strong>
                  <span>{billingCycle === 'MONTHLY' ? '/tháng' : '/năm'}</span>
                </div>

                <div className="planPriceOptions" aria-label="Bảng giá gói">
                  <button
                    type="button"
                    className={`planPriceOption ${billingCycle === 'MONTHLY' ? 'active' : ''}`}
                    onClick={() => setBillingCycle('MONTHLY')}
                  >
                    <span className="label">Gói tháng</span>
                    <strong>{formatPrice(plan.priceMonthly)}</strong>
                    <small className="period">Thanh toán mỗi tháng</small>
                  </button>
                  <button
                    type="button"
                    className={`planPriceOption ${billingCycle === 'YEARLY' ? 'active' : ''}`}
                    onClick={() => setBillingCycle('YEARLY')}
                  >
                    <span className="label">Gói năm</span>
                    <strong>{formatPrice(plan.priceYearly)}</strong>
                    <small className="period">Thanh toán theo năm</small>
                  </button>
                </div>

                <ul>
                  {getFeatures().map((feature) => (
                    <li key={feature}>{feature}</li>
                  ))}
                </ul>

                <button type="button" disabled={paymentLoading} onClick={handlePayment}>
                  {paymentLoading ? 'Đang chuyển đến VNPay...' : 'Chọn'}
                </button>
                {paymentSuccess && paidTxnRef && <p>Đã thanh toán thành công. Vui lòng nhấn Hoàn Tất Đăng Ký để tạo tài khoản.</p>}
              </article>
            )}

            {planLoading && <p>Đang tải thông tin gói...</p>}
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
