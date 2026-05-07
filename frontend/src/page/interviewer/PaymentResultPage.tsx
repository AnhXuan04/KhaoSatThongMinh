import { useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

const useQuery = () => {
  const { search } = useLocation();
  return new URLSearchParams(search);
};

export default function PaymentResultPage() {
  const PAID_TXN_REF_KEY = 'pendingPremiumTxnRef';
  const PAID_TXN_EMAIL_KEY = 'pendingPremiumEmail';
  const PAYMENT_RETURN_URL_KEY = 'premiumPaymentReturnUrl';
  const PAYMENT_SUCCESS_KEY = 'premiumPaymentSuccess';

  const navigate = useNavigate();
  const query = useQuery();
  const success = query.get('success') === 'true';
  const txnRef = query.get('txnRef');
  const code = query.get('code');
  const email = query.get('email');
  const returnUrl = sessionStorage.getItem(PAYMENT_RETURN_URL_KEY) || '/creator-package';

  useEffect(() => {
    if (!success) {
      return;
    }

    if (txnRef) {
      sessionStorage.setItem(PAID_TXN_REF_KEY, txnRef);
    }
    if (email) {
      sessionStorage.setItem(PAID_TXN_EMAIL_KEY, email.toLowerCase());
    }
    sessionStorage.setItem(PAYMENT_SUCCESS_KEY, '1');
  }, [email, success, txnRef]);

  useEffect(() => {
    if (success) {
      return;
    }

    sessionStorage.removeItem(PAID_TXN_REF_KEY);
    sessionStorage.removeItem(PAID_TXN_EMAIL_KEY);
  }, [success]);

  return (
    <div style={{ maxWidth: 640, margin: '80px auto', padding: '24px' }}>
      <h1>{success ? 'Thanh toán thành công' : 'Thanh toán thất bại'}</h1>
      <p>
        {success
          ? 'Thanh toán thành công. Vui lòng quay lại và nhấn Hoàn Tất Đăng Ký để tạo tài khoản.'
          : 'Giao dịch chưa hoàn tất. Vui lòng thử lại.'}
      </p>
      {txnRef && (
        <p>
          Mã giao dịch: <strong>{txnRef}</strong>
        </p>
      )}
      {code && (
        <p>
          Mã phản hồi VNPay: <strong>{code}</strong>
        </p>
      )}
      <div style={{ marginTop: 24 }}>
        {success ? (
            <button type="button" onClick={() => navigate(returnUrl, { replace: true })}>
              Quay lại {returnUrl === '/service-package' ? 'Gói cước' : 'Hoàn Tất Đăng Ký'}
          </button>
        ) : (
          <Link to="/creator-package">Quay lại chọn gói</Link>
        )}
      </div>
    </div>
  );
}

