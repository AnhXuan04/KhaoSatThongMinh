import { useNavigate } from 'react-router-dom';
import {
  FiClock,
  FiDollarSign,
  FiShield,
  FiTarget,
  FiUsers,
  FiZap
} from 'react-icons/fi';
import './HomePage.css';

export default function HomePage() {
  const navigate = useNavigate();

  return (
    <div className="homePageContainer">
      {/* Main Content */}
      <main className="homeMainContent">
        {/* Hero Section */}
        <section className="heroSection">
          <div className="heroLeft">
            <div className="preBadge">
              <FiZap className="preBadgeIcon" aria-hidden="true" />
              <span>NỀN TẢNG KHẢO SÁT THẾ HỆ MỚI</span>
            </div>

            <h1 className="heroTitle">
              Biến Ý Kiến Thành
              <br />
              <span className="titleHighlight">Phần Thưởng</span>
            </h1>

            <p className="heroDescription">
              Chia sẻ quan điểm của bạn về các thương hiệu hàng đầu và tích lũy Coin để đổi lấy quà tặng hấp dẫn.
            </p>

            <div className="heroActions">
              <button 
                className="btnStartNow"
                onClick={() => navigate('/signup')}
              >
                Bắt đầu ngay →
              </button>
              <button className="btnLearnMore" onClick={() => navigate('/creator-package')}>
                Mua gói tạo khảo sát
              </button>
            </div>

            <div className="heroStats">
              <div className="statItem">
                <span className="statAvatar"><FiUsers /></span>
                <p className="statText">
                  Gia nhập cùng <strong>10,000+</strong> người dùng khác
                </p>
              </div>
            </div>
          </div>

          {/* Hero Right - Image + Stats Card */}
          <div className="heroRight">
            <div className="heroImageWrapper">
              <div className="heroImage">
                <img 
                  src="https://images.unsplash.com/photo-1552664730-d307ca884978?w=600&h=400&fit=crop"
                  alt="Team collaboration"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Features Section - Optional */}
        <section className="featuresSection">
          <h2>Tại sao chọn FORMSYNC?</h2>
          <div className="featuresGrid">
            <div className="featureCard">
              <div className="featureIcon"><FiDollarSign /></div>
              <h3>Nhận Phần Thưởng</h3>
              <p>Kiếm Coin từ mỗi khảo sát và tích lũy để đổi quà</p>
            </div>
            <div className="featureCard">
              <div className="featureIcon"><FiTarget /></div>
              <h3>Khảo Sát Phù Hợp</h3>
              <p>Nhận các bản khảo sát phù hợp với chuyên môn của bạn</p>
            </div>
            <div className="featureCard">
              <div className="featureIcon"><FiShield /></div>
              <h3>An Toàn & Bảo Mật</h3>
              <p>Dữ liệu của bạn luôn được bảo vệ và mã hóa</p>
            </div>
            <div className="featureCard">
              <div className="featureIcon"><FiClock /></div>
              <h3>Nhanh Chóng</h3>
              <p>Trả thưởng ngay tức thì sau khi hoàn thành</p>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="homeFooter">
        <div className="footerContent">
          <p>&copy; 2024 FORMSYNC. Tất cả quyền được bảo lưu.</p>
          <div className="footerLinks">
            <a href="#">Điều khoản sử dụng</a>
            <a href="#">Chính sách bảo mật</a>
            <a href="#">Liên hệ</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
