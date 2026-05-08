import { useState, useEffect } from 'react';
import { Trash2, Plus, Copy, Circle, Square, Edit } from 'lucide-react';
import axios from 'axios';
import './CreateSurveys.css';
import { useLocation, useNavigate } from 'react-router-dom';

interface QuestionOption {
  id: string;
  text: string;
}

interface Question {
  id: string;
  type: 'multiple_choice' | 'checkbox' | 'short_text';
  title: string;
  options: QuestionOption[];
  required: boolean;
}

interface Survey {
  title: string;
  description: string;
  questions: Question[];
}

export default function CreateSurveys() {
  const location = useLocation();
  const navigate = useNavigate();
  const params = new URLSearchParams(location.search);
  const editId = params.get('editId');
  const [step, setStep] = useState<1 | 2>(1);
  const [survey, setSurvey] = useState<Survey>({
    title: '',
    description: '',
    questions: [],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Get auth token from storage
  const getAuthToken = (): string | null => {
    return sessionStorage.getItem('token') || localStorage.getItem('token');
  };

  // Save survey to backend
  const handleSaveSurvey = async () => {
    if (!survey.title.trim()) {
      setError('Vui lòng nhập tiêu đề khảo sát');
      return;
    }

    if (survey.questions.length === 0) {
      setError('Vui lòng thêm ít nhất một câu hỏi');
      return;
    }

    const token = getAuthToken();
    if (!token) {
      setError('Bạn cần đăng nhập để tạo khảo sát');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Transform survey data to match backend request format
      const surveyData = {
        title: survey.title,
        description: survey.description,
        questions: survey.questions.map((q) => ({
          title: q.title,
          type: q.type,
          required: q.required,
          options: q.options.map((opt) => ({
            text: opt.text,
          })),
        })),
      };

      if (editId) {
        await axios.put(
          `http://localhost:8080/api/surveys/${encodeURIComponent(editId)}`,
          surveyData,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          }
        );
      } else {
        await axios.post(
          'http://localhost:8080/api/surveys/create',
          surveyData,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          }
        );
      }

      setSuccess(true);
      setLoading(false);

      // Reset form after successful save
      setTimeout(() => {
        setSurvey({
          title: '',
          description: '',
          questions: [],
        });
        setStep(1);
        setSuccess(false);
        if (editId) {
          navigate('/manage-surveys');
        }
      }, 2000);
    } catch (err: unknown) {
      setLoading(false);
      if (axios.isAxiosError(err)) {
        const errorMsg =
          err.response?.data?.message ||
          err.response?.data ||
          'Lỗi khi tạo khảo sát';
        setError(
          typeof errorMsg === 'string' ? errorMsg : 'Lỗi khi tạo khảo sát'
        );
      } else {
        setError('Lỗi khi tạo khảo sát');
      }
    }
  };

  useEffect(() => {
    const loadForEdit = async () => {
      if (!editId) return;

      const token = getAuthToken();
      if (!token) return;

      try {
        const resp = await axios.get(
          `http://localhost:8080/api/surveys/${encodeURIComponent(editId)}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        const data = resp.data as any;
        // Map backend SurveyRequest shape into local state
        setSurvey({
          title: data.title || '',
          description: data.description || '',
          questions: (data.questions || []).map((q: any, idx: number) => ({
            id: `q-${idx}-${Date.now()}`,
            type: q.type || 'short_text',
            title: q.title || '',
            options: (q.options || []).map((o: any, oi: number) => ({ id: `o-${oi}-${Date.now()}`, text: o.text || '' })),
            required: q.required || false,
          })),
        });
        setStep(2);
      } catch (e) {
        console.error('Load survey for edit failed', e);
      }
    };

    loadForEdit();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editId]);

  // ==================== Step 1: Survey Info ====================
  const handleTitleChange = (value: string) => {
    setSurvey({ ...survey, title: value });
  };

  const handleDescriptionChange = (value: string) => {
    setSurvey({ ...survey, description: value });
  };

  const handleNextStep = () => {
    if (survey.title.trim()) {
      setStep(2);
    } else {
      alert('Vui lòng nhập tiêu đề khảo sát');
    }
  };

  // ==================== Step 2: Questions ====================
  const addQuestion = (type: Question['type']) => {
    const newQuestion: Question = {
      id: Date.now().toString(),
      type,
      title: '',
      options: type !== 'short_text' ? [
        { id: '1', text: '' },
        { id: '2', text: '' },
      ] : [],
      required: false,
    };
    setSurvey({
      ...survey,
      questions: [...survey.questions, newQuestion],
    });
  };

  const updateQuestion = (id: string, updates: Partial<Question>) => {
    setSurvey({
      ...survey,
      questions: survey.questions.map((q) =>
        q.id === id ? { ...q, ...updates } : q
      ),
    });
  };

  const deleteQuestion = (id: string) => {
    setSurvey({
      ...survey,
      questions: survey.questions.filter((q) => q.id !== id),
    });
  };

  const duplicateQuestion = (id: string) => {
    const question = survey.questions.find((q) => q.id === id);
    if (question) {
      const newQuestion = {
        ...question,
        id: Date.now().toString(),
      };
      setSurvey({
        ...survey,
        questions: [...survey.questions, newQuestion],
      });
    }
  };

  const addOption = (questionId: string) => {
    setSurvey({
      ...survey,
      questions: survey.questions.map((q) =>
        q.id === questionId
          ? {
              ...q,
              options: [
                ...q.options,
                {
                  id: Date.now().toString(),
                  text: '',
                },
              ],
            }
          : q
      ),
    });
  };

  const updateOption = (
    questionId: string,
    optionId: string,
    text: string
  ) => {
    setSurvey({
      ...survey,
      questions: survey.questions.map((q) =>
        q.id === questionId
          ? {
              ...q,
              options: q.options.map((o) =>
                o.id === optionId ? { ...o, text } : o
              ),
            }
          : q
      ),
    });
  };

  const deleteOption = (questionId: string, optionId: string) => {
    setSurvey({
      ...survey,
      questions: survey.questions.map((q) =>
        q.id === questionId
          ? {
              ...q,
              options: q.options.filter((o) => o.id !== optionId),
            }
          : q
      ),
    });
  };

  const getQuestionTypeLabel = (type: Question['type']) => {
    const labels = {
      multiple_choice: 'Trắc nghiệm',
      checkbox: 'Checkbox',
      short_text: 'Văn bản ngắn',
    };
    return labels[type];
  };

  return (
    <div className="create-surveys-container">
      <div className="surveys-wrapper">
        {/* Error Message */}
        {error && (
          <div
            style={{
              padding: '12px 16px',
              marginBottom: '16px',
              backgroundColor: '#fee',
              color: '#c33',
              borderRadius: '4px',
              border: '1px solid #fcc',
            }}
          >
            {error}
          </div>
        )}

        {/* Success Message */}
        {success && (
          <div
            style={{
              padding: '12px 16px',
              marginBottom: '16px',
              backgroundColor: '#efe',
              color: '#3c3',
              borderRadius: '4px',
              border: '1px solid #cfc',
            }}
          >
            ✓ Khảo sát đã được tạo thành công!
          </div>
        )}
        {/* ==================== STEP 1 ==================== */}
        {step === 1 && (
          <div className="step-content">
            <div className="step-header">
              <div className="step-number">01</div>
              <div className="step-title-section">
                <h2>Tạo Khảo Sát</h2>
                <p>Nhập thông tin cơ bản cho cuộc khảo sát của bạn</p>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">SURVEY TITLE</label>
              <input
                type="text"
                className="form-input"
                placeholder="Nhập tên cuộc khảo sát..."
                value={survey.title}
                onChange={(e) => handleTitleChange(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">DESCRIPTION</label>
              <textarea
                className="form-textarea"
                placeholder="Mô tả chi tiết mục đích của khảo sát này..."
                rows={5}
                value={survey.description}
                onChange={(e) => handleDescriptionChange(e.target.value)}
              />
            </div>

            <div className="form-actions">
              <button
                className="btn btn-primary"
                onClick={handleNextStep}
              >
                Tiếp Tục
              </button>
            </div>
          </div>
        )}

        {/* ==================== STEP 2 ==================== */}
        {step === 2 && (
          <div className="step-content">
            <div className="step-header">
              <div className="step-number">02</div>
              <div className="step-title-section">
                <h2>Tạo Câu Hỏi</h2>
              </div>
            </div>

            {/* Question Type Selector */}
            <div className="question-type-selector">
              <h3>Thêm câu hỏi mới</h3>
              <div className="button-group">
                <button
                  className="type-btn type-multiple-choice"
                  onClick={() => addQuestion('multiple_choice')}
                >
                  <Circle size={16} className="type-icon" />
                  <span>Trắc Nghiệm</span>
                </button>
                <button
                  className="type-btn type-checkbox"
                  onClick={() => addQuestion('checkbox')}
                >
                  <Square size={16} className="type-icon" />
                  <span>Checkbox</span>
                </button>
                <button
                  className="type-btn type-short-text"
                  onClick={() => addQuestion('short_text')}
                >
                  <Edit size={16} className="type-icon" />
                  <span>Văn Bản Ngắn</span>
                </button>
              </div>
            </div>

            {/* Questions List */}
            <div className="questions-list">
              {survey.questions.length === 0 ? (
                <div className="empty-state">
                  <p>Chưa có câu hỏi nào. Thêm câu hỏi đầu tiên để bắt đầu!</p>
                </div>
              ) : (
                survey.questions.map((question, index) => (
                  <div key={question.id} className="question-card">
                    <div className="question-header">
                      <div className="question-number">Câu {index + 1}</div>
                      <div className="question-type-badge">
                        {getQuestionTypeLabel(question.type)}
                      </div>
                      <div className="question-actions">
                        <button
                          className="action-btn"
                          onClick={() =>
                            duplicateQuestion(question.id)
                          }
                          title="Nhân bản"
                        >
                          <Copy size={18} />
                        </button>
                        <button
                          className="action-btn"
                          onClick={() =>
                            deleteQuestion(question.id)
                          }
                          title="Xóa"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>

                    <div className="question-content">
                      <input
                        type="text"
                        className="question-title-input"
                        placeholder="Nhập câu hỏi..."
                        value={question.title}
                        onChange={(e) =>
                          updateQuestion(question.id, {
                            title: e.target.value,
                          })
                        }
                      />

                      {/* Options Section */}
                      {question.type !== 'short_text' && (
                        <div className="options-section">
                          <div className="options-label">Đáp án:</div>
                          <div className="options-list">
                            {question.options.map((option) => (
                              <div
                                key={option.id}
                                className="option-item"
                              >
                                <div className="option-icon">
                                  {question.type === 'multiple_choice' ? (
                                    <span className="icon-multiple-choice">
                                      ◯
                                    </span>
                                  ) : (
                                    <span className="icon-checkbox">☐</span>
                                  )}
                                </div>
                                <input
                                  type="text"
                                  className="option-input"
                                  placeholder={`Đáp án ${
                                    question.options.indexOf(option) + 1
                                  }`}
                                  value={option.text}
                                  onChange={(e) =>
                                    updateOption(
                                      question.id,
                                      option.id,
                                      e.target.value
                                    )
                                  }
                                />
                                <button
                                  className="delete-option-btn"
                                  onClick={() =>
                                    deleteOption(question.id, option.id)
                                  }
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            ))}
                          </div>
                          <button
                            className="add-option-btn"
                            onClick={() => addOption(question.id)}
                          >
                            <Plus size={16} /> Thêm đáp án
                          </button>
                        </div>
                      )}

                      {/* Short Text Preview */}
                      {question.type === 'short_text' && (
                        <div className="short-text-preview">
                          <input
                            type="text"
                            className="short-text-input"
                            placeholder="Người trả lời sẽ nhập ở đây..."
                            disabled
                          />
                        </div>
                      )}

                      {/* Required Checkbox */}
                      <div className="question-footer">
                        <label className="required-checkbox">
                          <input
                            type="checkbox"
                            checked={question.required}
                            onChange={(e) =>
                              updateQuestion(question.id, {
                                required: e.target.checked,
                              })
                            }
                          />
                          <span>Bắt buộc trả lời</span>
                        </label>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Form Actions */}
            <div className="form-actions">
              <button
                className="btn btn-secondary"
                onClick={() => setStep(1)}
              >
                Quay Lại
              </button>
              <button
                className="btn btn-primary"
                onClick={handleSaveSurvey}
                disabled={loading}
              >
                {loading ? 'Đang lưu...' : 'Lưu Khảo Sát'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
