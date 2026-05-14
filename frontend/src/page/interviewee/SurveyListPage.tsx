import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiBookOpen } from 'react-icons/fi';
import './SurveyListPage.css';

interface Survey {
  id: number;
  title: string;
  description: string;
  questionCount: number;
  createdAt: string;
  surveyField: string;
}

export default function SurveyListPage() {
  const navigate = useNavigate();
  const token = sessionStorage.getItem('token') || localStorage.getItem('token');

  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedField, setSelectedField] = useState('Tất cả');

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const allRes = await fetch('http://localhost:8080/api/surveys/all');
        if (!allRes.ok) throw new Error();
        const allData: Survey[] = await allRes.json();

        let completedIds = new Set<number>();
        if (token) {
          try {
            const compRes = await fetch('http://localhost:8080/api/surveys/completed', {
              headers: { Authorization: `Bearer ${token}` },
            });
            if (compRes.ok) {
              const compData: Survey[] = await compRes.json();
              completedIds = new Set(compData.map(s => s.id));
            }
          } catch { /* ignore */ }
        }

        setSurveys(allData.filter(s => !completedIds.has(s.id)));
      } catch {
        setError('Đã xảy ra lỗi khi tải dữ liệu.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchAll();
  }, [token]);

  const fields = useMemo(
    () => ['Tất cả', ...Array.from(new Set(surveys.map(s => s.surveyField)))],
    [surveys]
  );

  const filtered = useMemo(
    () => selectedField === 'Tất cả' ? surveys : surveys.filter(s => s.surveyField === selectedField),
    [surveys, selectedField]
  );

  return (
    <div className="surveyPageContainer">
      <main className="surveyContent">
        <section>
          <div className="sectionHeader">
            <div className="sectionTitleGroup">
              <span className="sectionNumber">01</span>
              <h2 className="sectionTitle">Khảo Sát Mới</h2>
            </div>
            <p className="sectionSubtitle">Hãy chia sẻ ý kiến của bạn để nhận phần thưởng xứng đáng.</p>
          </div>

          {/* Thanh lọc lĩnh vực */}
          {!isLoading && surveys.length > 0 && (
            <div className="fieldChips">
              {fields.map(field => (
                <button
                  key={field}
                  type="button"
                  className={`fieldChip ${selectedField === field ? 'active' : ''}`}
                  onClick={() => setSelectedField(field)}
                >
                  {field}
                </button>
              ))}
            </div>
          )}

          {isLoading && <p style={{ color: '#888' }}>Đang tải...</p>}
          {error && <p style={{ color: '#dc2626' }}>{error}</p>}
          {!isLoading && !error && filtered.length === 0 && (
            <p style={{ color: '#888' }}>Không có khảo sát nào.</p>
          )}

          <div className="surveyGrid">
            {filtered.map((survey) => (
              <div className="surveyActionCard" key={survey.id}>
                <div className="cardTopRow">
                  <div className="iconWrapper"><FiBookOpen /></div>
                  <span className="categoryTag">{survey.surveyField}</span>
                </div>
                <h3>{survey.title}</h3>
                <p>{survey.description}</p>
                <div className="cardBottomRow">
                  <span className="surveyMeta">{survey.questionCount} câu hỏi • {survey.createdAt}</span>
                  <button className="joinBtn" onClick={() => navigate(`/survey/${survey.id}`)}>Tham gia</button>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
