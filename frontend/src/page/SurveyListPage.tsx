import { 
  FiMonitor, FiPlusSquare, FiTrendingUp, FiBookOpen, FiPlus 
} from 'react-icons/fi';
import './SurveyListPage.css';


// --- Dữ liệu mẫu (Mock Data) để render danh sách ---
const newSurveys = [
  {
    id: 1,
    icon: <FiMonitor />,
    category: 'CÔNG NGHỆ',
    title: 'Trí Tuệ Nhân Tạo 2024',
    desc: 'Khảo sát về xu hướng sử dụng AI trong công việc hàng ngày tại Việt...',
    time: '15 phút',
    coins: '+250 Coins',
  },
  {
    id: 2,
    icon: <FiPlusSquare />,
    category: 'SỨC KHỎE',
    title: 'Chế Độ Dinh Dưỡng',
    desc: 'Thói quen ăn uống và nhu cầu thực phẩm sạch của giới trẻ thành thị.',
    time: '10 phút',
    coins: '+180 Coins',
  },
  {
    id: 3,
    icon: <FiTrendingUp />,
    category: 'KINH DOANH',
    title: 'Thương Mại Điện Tử',
    desc: 'Trải nghiệm mua sắm trực tuyến trên các nền tảng mạng xã hội.',
    time: '20 phút',
    coins: '+350 Coins',
  },
  {
    id: 4,
    icon: <FiBookOpen />,
    category: 'GIÁO DỤC',
    title: 'Kỹ Năng Số Tương Lai',
    desc: 'Đánh giá tầm quan trọng của các chứng chỉ trực tuyến hiện nay.',
    time: '12 phút',
    coins: '+200 Coins',
  },
];

const historySurveys = [
  {
    id: 1,
    title: 'Xu hướng Du lịch 2024',
    date: 'Hoàn thành: 14:20, Hôm nay',
    reward: '+150',
  },
  {
    id: 2,
    title: 'Thị hiếu Phim ảnh',
    date: 'Hoàn thành: 09:15, Hôm qua',
    reward: '+120',
  },
];

export default function SurveyListPage() {
  return (
    <div className="surveyPageContainer">
      {/* Nội dung chính */}
      <main className="surveyContent">
        
        {/* Section 01: Khảo Sát Mới */}
        <section>
          <div className="sectionHeader">
            <div className="sectionTitleGroup">
              <span className="sectionNumber">01</span>
              <h2 className="sectionTitle">Khảo Sát Mới</h2>
            </div>
            <p className="sectionSubtitle">
              Hãy chia sẻ ý kiến của bạn để nhận phần thưởng xứng đáng.
            </p>
          </div>

          <div className="surveyGrid">
            {newSurveys.map((survey) => (
              <div className="surveyActionCard" key={survey.id}>
                <div className="cardTopRow">
                  <div className="iconWrapper">{survey.icon}</div>
                  <span className="categoryTag">{survey.category}</span>
                </div>
                <h3>{survey.title}</h3>
                <p>{survey.desc}</p>
                <div className="cardBottomRow">
                  <span className="surveyMeta">{survey.time} • {survey.coins}</span>
                  <button className="joinBtn">Tham gia</button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Section 02: Lịch Sử Khảo Sát */}
        <section>
          <div className="sectionHeader">
            <div className="sectionTitleGroup">
              <span className="sectionNumber">02</span>
              <h2 className="sectionTitle">Lịch Sử Khảo Sát</h2>
            </div>
          </div>

          <div className="historyList">
            {historySurveys.map((item) => (
              <div className="historyItem" key={item.id}>
                <div className="historyInfo">
                  <h4>{item.title}</h4>
                  <p>{item.date}</p>
                </div>
                <div className="historyReward">
                  <span className="rewardAmount">{item.reward}</span>
                  <span className="rewardLabel">COINS</span>
                </div>
              </div>
            ))}
          </div>
        </section>

      </main>

      {/* Nút Floating Action Button (+) */}
      <button className="fabBtn">
        <FiPlus />
      </button>
      
    </div>
  );
}