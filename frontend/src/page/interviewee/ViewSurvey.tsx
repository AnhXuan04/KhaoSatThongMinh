import { apiUrl } from '../../config/api';
import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { Upload, Star, Eye } from 'lucide-react';
import './ViewSurvey.css';

interface Option { id?: number | string; text: string }
interface Question {
  id?: number | string;
  title: string;
  type: string;
  kind?: string;
  options?: Option[];
  required?: boolean;
  maxFileSizeMb?: number;
  maxFileCount?: number;
  mediaUrl?: string;
}
interface Survey { id?: number | string; title: string; description?: string; questions: Question[] }
interface BehaviorLog { questionId?: number; eventType: string; eventValue?: string; durationMs?: number }

export default function ViewSurvey() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const responseId = searchParams.get('responseId');
  const isReadonly = !!responseId;

  const navigate = useNavigate();
  const [survey, setSurvey] = useState<Survey | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [uploadingFiles, setUploadingFiles] = useState<Set<string>>(new Set());
  const [previewFile, setPreviewFile] = useState<{ name: string; url: string } | null>(null);
  const token = sessionStorage.getItem('token') || localStorage.getItem('token');
  const surveyStartedAtRef = useRef(Date.now());
  const questionTouchedAtRef = useRef<Record<string, number>>({});
  const behaviorLogsRef = useRef<BehaviorLog[]>([]);

  const getGoogleViewerUrl = (fileUrl?: string | null) => {
    if (!fileUrl) return '';
    return `https://docs.google.com/gview?url=${encodeURIComponent(fileUrl)}&embedded=true`;
  };

  useEffect(() => {
    if (!id) return;

    const fetchSurvey = async () => {
      try {
        const res = await fetch(apiUrl(`/api/surveys/view/${encodeURIComponent(id)}`));
        if (!res.ok) { setError('Không thể tải khảo sát'); setLoading(false); return; }
        const data = await res.json();
        setSurvey(data);
      } catch {
        setError('Lỗi khi tải khảo sát');
      } finally {
        if (!responseId) setLoading(false);
      }
    };

    fetchSurvey();
  }, [id]);

  // Nếu có responseId thì fetch câu trả lời cũ
  useEffect(() => {
    if (!responseId || !token) return;

    const fetchDetail = async () => {
      try {
        const res = await fetch(apiUrl(`/api/surveys/responses/${responseId}`), {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          // Map answers: { questionId: string | string[] | object }
          const mapped: Record<string, any> = {};
          for (const ans of data.answers) {
            // For file_upload questions, store all file metadata
            if (ans.questionKind === 'file_upload' && ans.secureUrl) {
              mapped[ans.questionId] = {
                cloudinaryPublicId: ans.cloudinaryPublicId,
                secureUrl: ans.secureUrl,
                originalFileName: ans.originalFileName,
                fileSize: ans.fileSize,
                fileType: ans.fileType,
              };
            } else if (ans.questionKind === 'linear_scale' || ans.questionKind === 'rating') {
              // For scale/rating, store the numeric value
              mapped[ans.questionId] = ans.values.length > 0 ? parseInt(ans.values[0]) : undefined;
            } else {
              // For other question types, store values as before
              mapped[ans.questionId] = ans.values.length === 1 ? ans.values[0] : ans.values;
            }
          }
          setAnswers(mapped);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };

    fetchDetail();
  }, [responseId, token]);

  const handleFileUpload = async (qId: any, file: File) => {
    if (!file) return;

    const question = survey?.questions.find((q) => String(q.id) === String(qId));
    const maxFileSizeMb = question?.maxFileSizeMb;
    if (maxFileSizeMb && file.size > maxFileSizeMb * 1024 * 1024) {
      alert(`File vượt quá giới hạn ${maxFileSizeMb}MB`);
      return;
    }

    setUploadingFiles(prev => new Set(prev).add(String(qId)));

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch(apiUrl('/api/surveys/upload/file'), {
        method: 'POST',
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: formData,
      });

      if (!res.ok) {
        alert('Tải tệp thất bại');
        return;
      }

      const fileData = await res.json();

      // Store file metadata in answers
      setAnswers((prev) => ({
        ...prev,
        [qId]: {
          cloudinaryPublicId: fileData.publicId,
          secureUrl: fileData.secureUrl,
          originalFileName: fileData.originalFileName,
          fileSize: fileData.fileSize,
          fileType: fileData.fileType,
          format: fileData.format,
        },
      }));
    } catch (e) {
      console.error(e);
      alert('Lỗi khi tải tệp lên');
    } finally {
      setUploadingFiles(prev => {
        const copy = new Set(prev);
        copy.delete(String(qId));
        return copy;
      });
    }
  };

  const handleChange = (qId: any, value: any, multiple = false) => {
    if (isReadonly) return;
    const key = String(qId);
    const now = Date.now();
    const previousTouch = questionTouchedAtRef.current[key] || surveyStartedAtRef.current;
    questionTouchedAtRef.current[key] = now;
    behaviorLogsRef.current.push({
      questionId: Number(qId),
      eventType: 'answer_change',
      eventValue: Array.isArray(value) ? value.join(', ') : String(value ?? ''),
      durationMs: now - previousTouch,
    });
    setAnswers((prev) => {
      const copy = { ...prev };
      if (multiple) {
        const setArr = new Set(copy[qId] || []);
        if (setArr.has(value)) setArr.delete(value); else setArr.add(value);
        copy[qId] = Array.from(setArr);
      } else {
        copy[qId] = value;
      }
      return copy;
    });
  };

  const handleSubmit = async () => {
    if (!survey || !id) return;

    const answerableQuestions = survey.questions.filter((q) => q.kind !== 'image' && q.kind !== 'video');

    for (const q of answerableQuestions) {
      const ans = answers[q.id as any];
      if (q.required && (ans === undefined || ans === '' || (Array.isArray(ans) && ans.length === 0))) {
        alert('Vui lòng trả lời tất cả các câu hỏi bắt buộc');
        return;
      }
    }

    const answerList = answerableQuestions
      .filter(q => answers[q.id as any] !== undefined && answers[q.id as any] !== '')
      .map(q => {
        const answer: any = { questionId: q.id };
        const ans = answers[q.id as any];

        if (q.kind === 'file_upload' && ans && typeof ans === 'object') {
          // File upload answer - include metadata
          answer.cloudinaryPublicId = ans.cloudinaryPublicId;
          answer.secureUrl = ans.secureUrl;
          answer.originalFileName = ans.originalFileName;
          answer.fileSize = ans.fileSize;
          answer.fileType = ans.fileType;
          answer.values = [''];
        } else {
          // Regular answer
          answer.values = Array.isArray(ans) ? ans : [ans];
        }

        return answer;
      });

    try {
      const totalDurationMs = Date.now() - surveyStartedAtRef.current;
      const behaviorLogs = [
        {
          eventType: 'survey_submit',
          eventValue: `answered=${answerList.length}/${answerableQuestions.length}`,
          durationMs: totalDurationMs,
        },
        ...behaviorLogsRef.current.slice(-120),
      ];

      const res = await fetch(apiUrl(`/api/surveys/${encodeURIComponent(id)}/responses`), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ answers: answerList, behaviorLogs }),
      });

      if (res.ok) {
        alert('Cảm ơn! Phản hồi đã được gửi thành công.');
        navigate(-1);
      } else {
        const msg = await res.text();
        alert(msg || 'Gửi phản hồi thất bại.');
      }
    } catch (e) {
      console.error(e);
      alert('Lỗi khi gửi phản hồi');
    }
  };

  if (loading) return <div style={{ padding: 20 }}>Đang tải khảo sát...</div>;
  if (error) return <div style={{ padding: 20, color: 'red' }}>{error}</div>;
  if (!survey) return <div style={{ padding: 20 }}>Không tìm thấy khảo sát</div>;

  return (
    <>
      <div className="view-survey-container">
      <div className="survey-header">
        <button className="back-link" onClick={() => navigate(-1)}>Quay lại</button>
        <h1>{survey.title}</h1>
        {survey.description && <p className="survey-desc">{survey.description}</p>}
        {isReadonly && (
          <div className="readonly-badge">Chế độ xem lại — không thể chỉnh sửa</div>
        )}
      </div>

      <div className="survey-questions">
        {survey.questions.map((q, idx) => (
          <div key={q.id || idx} className={`question-block ${isReadonly ? 'readonly' : ''}`}>
            <div className="question-title">
              <span className="question-number">{String(idx + 1).padStart(2, '0')}.</span>
              <span className="question-text">{q.title || (q.kind === 'image' ? 'Hình ảnh' : q.kind === 'video' ? 'Video' : '')}</span>
              {q.required && q.kind !== 'image' && q.kind !== 'video' && !isReadonly && <span className="required">BẮT BUỘC</span>}
            </div>

            <div className="question-body">
              {q.kind === 'image' && q.mediaUrl && (
                <div className="survey-media-block">
                  <img src={q.mediaUrl} alt={q.title || 'Hình ảnh khảo sát'} />
                </div>
              )}

              {q.kind === 'video' && q.mediaUrl && (
                <div className="survey-media-block">
                  <video src={q.mediaUrl} controls />
                </div>
              )}

              {(q.kind === 'dropdown' || (q.type === 'multiple_choice' && q.kind === 'dropdown')) ? (
                <select
                  value={answers[q.id as any] || ''}
                  onChange={(e) => handleChange(q.id as any, e.target.value)}
                  disabled={isReadonly}
                  className="dropdown-select"
                >
                  <option value="">Chọn một đáp án</option>
                  {(q.options || []).map((opt, oi) => (
                    <option key={oi} value={opt.text}>{opt.text}</option>
                  ))}
                </select>
              ) : q.type === 'multiple_choice' && (q.options || []).map((opt, oi) => (
                <label key={oi} className="option-row">
                  <input
                    type="radio"
                    name={`q-${q.id}`}
                    checked={answers[q.id as any] === opt.text}
                    onChange={() => handleChange(q.id as any, opt.text)}
                    disabled={isReadonly}
                  />
                  <span>{opt.text}</span>
                </label>
              ))}

              {q.type === 'checkbox' && (q.options || []).map((opt, oi) => (
                <label key={oi} className="option-row">
                  <input
                    type="checkbox"
                    name={`q-${q.id}`}
                    checked={(answers[q.id as any] || []).includes(opt.text)}
                    onChange={() => handleChange(q.id as any, opt.text, true)}
                    disabled={isReadonly}
                  />
                  <span>{opt.text}</span>
                </label>
              ))}

              {q.type === 'short_text'
                && q.kind !== 'file_upload'
                && q.kind !== 'image'
                && q.kind !== 'video'
                && q.kind !== 'linear_scale'
                && q.kind !== 'rating' && (
                <input
                  className="short-text-input"
                  type="text"
                  value={answers[q.id as any] || ''}
                  onChange={(e) => handleChange(q.id as any, e.target.value)}
                  placeholder={isReadonly ? '(Không có câu trả lời)' : 'Nhập phản hồi...'}
                  disabled={isReadonly}
                />
              )}

              {q.kind === 'file_upload' && (
                <div className="file-upload-container">
                  {!isReadonly ? (
                    <>
                      <label htmlFor={`file-${q.id}`} className="file-upload-label">
                        <div className="upload-box">
                          <Upload size={24} />
                          <span className="upload-text">
                            {answers[q.id as any]?.originalFileName || 'Nhấp để tải tệp lên'}
                          </span>
                          {uploadingFiles.has(String(q.id)) && <span className="uploading-text">(Đang tải...)</span>}
                        </div>
                      </label>
                      <input
                        id={`file-${q.id}`}
                        type="file"
                        accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.png,.jpg,.jpeg"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          const allowedExtensions = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'png', 'jpg', 'jpeg'];
                          const fileExt = (file.name || '').split('.').pop()?.toLowerCase() || '';
                          if (!allowedExtensions.includes(fileExt)) {
                            alert('Chỉ hỗ trợ PDF, Word, Excel, PowerPoint và ảnh');
                            e.currentTarget.value = '';
                            return;
                          }
                          handleFileUpload(q.id as any, file);
                        }}
                        disabled={isReadonly || uploadingFiles.has(String(q.id))}
                        className="file-input-hidden"
                      />
                      {answers[q.id as any]?.secureUrl && (
                        <div className="file-info">
                          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                            <p style={{ margin: 0 }} className="file-name">✓ {answers[q.id as any].originalFileName}</p>
                            <button
                              type="button"
                              onClick={() => setPreviewFile({ name: answers[q.id as any].originalFileName || 'Tệp', url: answers[q.id as any].secureUrl || '' })}
                              style={{
                                background: 'none',
                                border: '1px solid #0066cc',
                                cursor: 'pointer',
                                color: '#0066cc',
                                padding: '4px 8px',
                                borderRadius: 4,
                                fontSize: 12,
                              }}
                            >
                              <Eye size={12} /> Xem
                            </button>
                          </div>
                          {(q.maxFileSizeMb || q.maxFileCount) && (
                            <p className="file-size" style={{ marginTop: 8 }}>
                              {q.maxFileSizeMb ? `Tối đa ${q.maxFileSizeMb}MB` : ''}
                              {q.maxFileSizeMb && q.maxFileCount ? ' • ' : ''}
                              {q.maxFileCount ? `Số lượng tối đa ${q.maxFileCount}` : ''}
                            </p>
                          )}
                          <p className="file-size">({(answers[q.id as any].fileSize / 1024).toFixed(2)} KB)</p>
                        </div>
                      )}
                    </>
                  ) : (
                    // Read-only mode - show file preview link or message
                    answers[q.id as any]?.secureUrl ? (
                      <div className="file-info">
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                          <button
                            type="button"
                            onClick={() => setPreviewFile({ name: answers[q.id as any].originalFileName || 'Tệp', url: answers[q.id as any].secureUrl || '' })}
                            style={{
                              background: 'none',
                              border: 'none',
                              cursor: 'pointer',
                              color: '#0066cc',
                              textDecoration: 'underline',
                              padding: 0,
                            }}
                          >
                            <Eye size={12} /> Xem tệp: {answers[q.id as any].originalFileName || 'Tệp đã tải lên'}
                          </button>
                          
                        </div>

                        <p className="file-size">({(answers[q.id as any].fileSize / 1024).toFixed(2)} KB)</p>
                      </div>
                    ) : (
                      <div className="file-info no-file">Không có tệp đính kèm</div>
                    )
                  )}
                </div>
              )}

              {q.kind === 'linear_scale' && (
                <div className="linear-scale-container">
                  <div className="scale-options">
                    {[1, 2, 3, 4, 5].map((value) => (
                      <button
                        key={value}
                        className={`scale-button ${answers[q.id as any] === value ? 'selected' : ''}`}
                        onClick={() => !isReadonly && handleChange(q.id as any, value)}
                        disabled={isReadonly}
                      >
                        {value}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {q.kind === 'rating' && (
                <div className="rating-container">
                  <div className="rating-stars">
                    {[1, 2, 3, 4, 5].map((value) => (
                      <button
                        key={value}
                        className={`star-button ${(answers[q.id as any] || 0) >= value ? 'filled' : ''}`}
                        onClick={() => !isReadonly && handleChange(q.id as any, value)}
                        disabled={isReadonly}
                      >
                        <Star
                          size={28}
                          className={`star-icon ${(answers[q.id as any] || 0) >= value ? 'filled' : ''}`}
                        />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="survey-actions">
        <button className="btn btn-secondary" onClick={() => navigate(-1)}>
          {isReadonly ? 'Quay lại' : 'Hủy'}
        </button>
        {!isReadonly && (
          <button className="btn btn-primary" onClick={handleSubmit}>Gửi phản hồi</button>
        )}
      </div>
    </div>

    {previewFile && (
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundColor: 'rgba(0,0,0,0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
        }}
        onClick={() => setPreviewFile(null)}
      >
        <div
          style={{
            backgroundColor: 'white',
            borderRadius: 8,
            padding: 16,
            width: '90%',
            maxWidth: 1000,
            maxHeight: '90vh',
            display: 'flex',
            flexDirection: 'column',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <h2>{previewFile.name}</h2>
            <button
              type="button"
              onClick={() => setPreviewFile(null)}
              style={{
                background: 'none',
                border: 'none',
                fontSize: 24,
                cursor: 'pointer',
              }}
            >
              ✕
            </button>
          </div>
          <iframe
            title="file-preview"
            src={getGoogleViewerUrl(previewFile.url)}
            style={{
              width: '100%',
              height: '100%',
              flex: 1,
              border: 'none',
              borderRadius: 4,
            }}
          />
        </div>
      </div>
    )}
  </>
  );
}
