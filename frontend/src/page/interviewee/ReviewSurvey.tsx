import { apiUrl } from '../../config/api';
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Eye, Star } from 'lucide-react';

import './ViewSurvey.css';

interface AnswerDetail {
  questionId: number;
  questionTitle: string;
  questionType: string;
  questionKind?: string;
  values: string[];
  cloudinaryPublicId?: string;
  secureUrl?: string;
  originalFileName?: string;
  fileSize?: number;
  fileType?: string;
  format?: string;
}

interface ResponseDetail {
  responseId: number;
  surveyTitle: string;
  completedAt: string;
  answers: AnswerDetail[];
}

export default function ReviewSurvey() {
  const { responseId } = useParams<{ responseId: string }>();
  const navigate = useNavigate();
  const token = sessionStorage.getItem('token') || localStorage.getItem('token');

  const [detail, setDetail] = useState<ResponseDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [previewFile, setPreviewFile] = useState<{ name: string; url: string } | null>(null);

  const getGoogleViewerUrl = (fileUrl?: string | null) => {
    if (!fileUrl) return '';
    return `https://docs.google.com/gview?url=${encodeURIComponent(fileUrl)}&embedded=true`;
  };

  useEffect(() => {
    if (!responseId) return;
    const fetch_ = async () => {
      try {
        const res = await fetch(apiUrl(`/api/surveys/responses/${responseId}`), {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) {
            const text = await res.text();
  console.error("API ERROR:", text); 
           setError('Không thể tải phản hồi.'); return; }
        setDetail(await res.json());
      } catch {
        setError('Lỗi kết nối.');
      } finally {
        setLoading(false);
      }
    };
    fetch_();
  }, [responseId, token]);

  if (loading) return <div style={{ padding: 24 }}>Đang tải...</div>;
  if (error) return <div style={{ padding: 24, color: 'red' }}>{error}</div>;
  if (!detail) return null;

  return (
    <div className="view-survey-container">
      <div className="survey-header">
        <h1>{detail.surveyTitle}</h1>
        <div className="readonly-badge">Xem lại — Hoàn thành: {detail.completedAt}</div>
      </div>

      <div className="survey-questions">
        {detail.answers.map((ans, idx) => (
          <div className="question-block readonly" key={ans.questionId}>
            <div className="question-title">
              <span className="question-number">{String(idx + 1).padStart(2, '0')}.</span>
              <span className="question-text">{ans.questionTitle}</span>
            </div>

            <div className="question-body">
              {ans.questionKind === 'file_upload' && ans.secureUrl ? (
                <div className="file-info">
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      onClick={() => setPreviewFile({ name: ans.originalFileName || 'Tệp', url: ans.secureUrl || '' })}
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: '#0066cc',
                        textDecoration: 'underline',
                        padding: 0,
                      }}
                    >
                      <Eye size={12} /> Xem tệp: {ans.originalFileName || 'Tệp đã tải lên'}
                    </button>
                  </div>
                  {ans.fileSize && (
                    <p className="file-size" style={{ margin: '8px 0 0 0' }}>({(ans.fileSize / 1024).toFixed(2)} KB)</p>
                  )}
                </div>
              ) : ans.questionKind === 'linear_scale' ? (
                <div className="linear-scale-container">
                  <div className="scale-options">
                    {[1, 2, 3, 4, 5].map((value) => (
                      <button
                        key={value}
                        type="button"
                        className={`scale-button ${Number(ans.values[0]) === value ? 'selected' : ''}`}
                        disabled
                      >
                        {value}
                      </button>
                    ))}
                  </div>
                </div>
              ) : ans.questionKind === 'rating' ? (
                <div className="rating-container">
                  <div className="rating-stars">
                    {[1, 2, 3, 4, 5].map((value) => (
                      <button
                        key={value}
                        type="button"
                        className={`star-button ${Number(ans.values[0]) >= value ? 'filled' : ''}`}
                        disabled
                      >
                        <Star
                          size={34}
                          className={`star-icon ${Number(ans.values[0]) >= value ? 'filled' : ''}`}
                        />
                      </button>
                    ))}
                  </div>
                </div>
              ) : ans.questionType === 'short_text' ? (
                <input
                  className="short-text-input"
                  type="text"
                  value={ans.values[0] || ''}
                  disabled
                />
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {ans.values.map((v, i) => (
                    <label key={i} className="option-row">
                      <input
                        type={ans.questionType === 'checkbox' ? 'checkbox' : 'radio'}
                        checked
                        readOnly
                      />
                      <span>{v}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="survey-actions">
        <button className="btn btn-secondary" onClick={() => navigate(-1)}>Quay lại</button>
      </div>

      {previewFile && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
        }}>
          <div style={{
            background: 'white',
            borderRadius: 8,
            width: '90%',
            maxWidth: 800,
            maxHeight: '90vh',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}>
            <div style={{
              padding: '16px',
              borderBottom: '1px solid #ddd',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}>
              <h3 style={{ margin: 0 }}>{previewFile.name}</h3>
              <button
                type="button"
                onClick={() => setPreviewFile(null)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: 24,
                  cursor: 'pointer',
                  color: '#666',
                }}
              >
                ✕
              </button>
            </div>
            <iframe
              title="file-preview"
              src={getGoogleViewerUrl(previewFile.url)}
              width="100%"
              style={{ flex: 1, border: 'none' }}
            />
            <div style={{ padding: '16px', borderTop: '1px solid #ddd', textAlign: 'right' }}>
              <a
                href={previewFile.url}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'inline-block',
                  padding: '8px 16px',
                  background: '#0066cc',
                  color: 'white',
                  borderRadius: 4,
                  textDecoration: 'none',
                  fontSize: 14,
                }}
              >
              
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
