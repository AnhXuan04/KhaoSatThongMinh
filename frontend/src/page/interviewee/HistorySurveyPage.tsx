import { apiUrl } from '../../config/api';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiCalendar, FiChevronRight } from 'react-icons/fi';
import './HistorySurvey.css';

interface HistoryItem {
  responseId: number;
  surveyId: number;
  title: string;
  description: string;
  surveyField: string;
  completedAt: string;
}

export default function HistorySurvey() {
  const token = sessionStorage.getItem('token') || localStorage.getItem('token');
  const navigate = useNavigate();
  const [historyData, setHistoryData] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedField, setSelectedField] = useState<string>('Tất cả');

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await fetch(apiUrl('/api/surveys/history'), {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data: HistoryItem[] = await res.json();
          setHistoryData(data);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, [token]);

  const fields = useMemo(
    () => ['Tất cả', ...Array.from(new Set(historyData.map(i => i.surveyField.trim()))).sort()],
    [historyData]
  );

  const filteredHistory = useMemo(() => {
    if (selectedField === 'Tất cả') return historyData;
    return historyData.filter(i => i.surveyField.trim() === selectedField);
  }, [selectedField, historyData]);

  return (
    <div className="historySurveyPage">
      <div className="historySurveyContainer">
        <div className="historySurveyStats">
          <div className="statCard">
            <span className="statLabel">Tổng số bài</span>
            <div className="statValueRow">
              <strong>{filteredHistory.length}</strong>
              <span>bài</span>
            </div>
          </div>
          <div className="statCard accent">
            <span className="statLabel">Lĩnh vực</span>
            <div className="statValueRow">
              <strong>{new Set(filteredHistory.map(i => i.surveyField)).size}</strong>
              <span>lĩnh vực</span>
            </div>
          </div>
        </div>

        <div className="historyHeader">
          <div>
            <h2>Hoàn thành gần đây</h2>
            <p>Theo dõi các khảo sát đã làm.</p>
          </div>
        </div>

        <div className="fieldChips">
          {fields.map((field) => (
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

        <div className="historyList">
          {loading && <div className="emptyState">Đang tải...</div>}

          {!loading && filteredHistory.length === 0 && (
            <div className="emptyState">Chưa có khảo sát nào.</div>
          )}

          {filteredHistory.map((item, idx) => (
            <article className="historyCard" key={`${item.responseId}-${idx}`}>
              <div className="historyCardTop">
                <span className="fieldTag">{item.surveyField}</span>
              </div>

              <h3>{item.title}</h3>

              <div className="historyCardBottom">
                <div className="completedMeta">
                  <FiCalendar size={14} />
                  <span>Hoàn thành: {item.completedAt}</span>
                </div>
                <button
                  className="reviewButton"
                  type="button"
                  onClick={() => navigate(`/survey-review/${item.responseId}`)}
                >
                  Xem lại <FiChevronRight size={14} />
                </button>
              </div>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}
