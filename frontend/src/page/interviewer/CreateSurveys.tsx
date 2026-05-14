import { useState, useEffect, useRef, type ReactNode } from 'react';
import {
  Trash2,
  Plus,
  Copy,
  ChevronDown,
  Minus,
  AlignLeft,
  Circle,
  CheckSquare,
  ChevronDownCircle,
  Upload,
  LineChart,
  Star,
  Grid2x2,
  Table2,
} from 'lucide-react';
import { MdAddCircleOutline } from "react-icons/md";
import { MdCheckBox } from "react-icons/md";
import { MdShortText } from "react-icons/md";
import axios from 'axios';
import './CreateSurveys.css';
import { useLocation, useNavigate } from 'react-router-dom';

interface QuestionOption {
  id: string;
  text: string;
}

type QuestionBackendType = 'multiple_choice' | 'checkbox' | 'short_text';

type QuestionKind =
  | 'short_answer'
  | 'paragraph'
  | 'multiple_choice'
  | 'checkbox'
  | 'dropdown'
  | 'file_upload'
  | 'linear_scale'
  | 'rating'
  | 'multiple_choice_grid'
  | 'checkbox_grid';

interface Question {
  id: string;
  kind: QuestionKind;
  type: QuestionBackendType;
  title: string;
  options: QuestionOption[];
  required: boolean;
  maxFileSizeMb?: number;
  maxFileCount?: number;
}

interface SurveyField {
  id: number;
  name: string;
  description?: string;
}

interface Survey {
  title: string;
  description: string;
  surveyFieldId?: number;
  questions: Question[];
}

interface SurveyApiQuestion {
  type?: QuestionBackendType;
  kind?: QuestionKind;
  title?: string;
  required?: boolean;
  maxFileSizeMb?: number;
  maxFileCount?: number;
  options?: Array<{
    text?: string;
  }>;
}

interface SurveyApiResponse {
  title?: string;
  description?: string;
  surveyFieldId?: number;
  questions?: SurveyApiQuestion[];
}

interface QuestionToolOption {
  label: string;
  icon: ReactNode;
  kind: QuestionKind;
  type: QuestionBackendType;
}

const QUESTION_TOOL_OPTIONS: QuestionToolOption[] = [
  { label: 'Trả lời ngắn', icon: <Minus size={18} />, kind: 'short_answer', type: 'short_text' },
  { label: 'Đoạn', icon: <AlignLeft size={18} />, kind: 'paragraph', type: 'short_text' },
  { label: 'Trắc nghiệm', icon: <Circle size={18} />, kind: 'multiple_choice', type: 'multiple_choice' },
  { label: 'Hộp kiểm', icon: <CheckSquare size={18} />, kind: 'checkbox', type: 'checkbox' },
  { label: 'Menu thả xuống', icon: <ChevronDownCircle size={18} />, kind: 'dropdown', type: 'multiple_choice' },
  { label: 'Tải tệp lên', icon: <Upload size={18} />, kind: 'file_upload', type: 'short_text' },
  { label: 'Phạm vi tuyến tính', icon: <LineChart size={18} />, kind: 'linear_scale', type: 'short_text' },
  { label: 'Xếp hạng', icon: <Star size={18} />, kind: 'rating', type: 'short_text' },
  { label: 'Lưới trắc nghiệm', icon: <Grid2x2 size={18} />, kind: 'multiple_choice_grid', type: 'multiple_choice' },
  { label: 'Lưới hộp kiểm', icon: <Table2 size={18} />, kind: 'checkbox_grid', type: 'checkbox' },
];

const getQuestionBackendType = (kind: QuestionKind): QuestionBackendType => {
  switch (kind) {
    case 'checkbox':
    case 'checkbox_grid':
      return 'checkbox';
    case 'multiple_choice':
    case 'dropdown':
    case 'multiple_choice_grid':
      return 'multiple_choice';
    default:
      return 'short_text';
  }
};

const getQuestionKindLabel = (kind: QuestionKind): string => {
  const option = QUESTION_TOOL_OPTIONS.find((item) => item.kind === kind);
  return option?.label || 'Trả lời ngắn';
};

const getQuestionKindIcon = (kind: QuestionKind): ReactNode => {
  return QUESTION_TOOL_OPTIONS.find((item) => item.kind === kind)?.icon || <Minus size={18} />;
};

// Hàm mapping từ backend type về frontend kind khi tải khảo sát
const getKindFromBackendType = (backendType: QuestionBackendType): QuestionKind => {
  switch (backendType) {
    case 'checkbox':
      return 'checkbox';
    case 'multiple_choice':
      return 'multiple_choice';
    case 'short_text':
    default:
      return 'short_answer'; // Default cho short_text
  }
};

const getDefaultOptionsForKind = (kind: QuestionKind, questionId: string): QuestionOption[] => {
  if (
    kind === 'multiple_choice' ||
    kind === 'checkbox' ||
    kind === 'dropdown' ||
    kind === 'multiple_choice_grid' ||
    kind === 'checkbox_grid'
  ) {
    return [
      { id: `${questionId}-o1`, text: '' },
      { id: `${questionId}-o2`, text: '' },
    ];
  }

  return [];
};

const createQuestion = (kind: QuestionKind, id: string = crypto.randomUUID()): Question => ({
  id,
  kind,
  type: getQuestionBackendType(kind),
  title: '',
  options: getDefaultOptionsForKind(kind, id),
  required: false,
  maxFileSizeMb: kind === 'file_upload' ? 10 : undefined,
  maxFileCount: kind === 'file_upload' ? 1 : undefined,
});

const isOptionBasedKind = (kind: QuestionKind): boolean => {
  return (
    kind === 'multiple_choice' ||
    kind === 'checkbox' ||
    kind === 'dropdown' ||
    kind === 'multiple_choice_grid' ||
    kind === 'checkbox_grid'
  );
};

export default function CreateSurveys() {
  const location = useLocation();
  const navigate = useNavigate();
  const params = new URLSearchParams(location.search);
  const editId = params.get('editId');
  const questionsEndRef = useRef<HTMLDivElement>(null);
  const [survey, setSurvey] = useState<Survey>({
    title: '',
    description: '',
    surveyFieldId: undefined,
    questions: [createQuestion('short_answer', 'initial-question')],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [surveyFields, setSurveyFields] = useState<SurveyField[]>([]);
  const [openQuestionMenuId, setOpenQuestionMenuId] = useState<string | null>(null);

  // Get auth token from storage
  const getAuthToken = (): string | null => {
    return sessionStorage.getItem('token') || localStorage.getItem('token');
  };

  // Fetch survey fields
  useEffect(() => {
    const token = getAuthToken();
    if (!token) return;

    const fetchFields = async () => {
      try {
        const res = await fetch('http://localhost:8080/api/surveys/fields/list', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (!res.ok) return;
        const data = await res.json();
        setSurveyFields(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error('Lỗi khi tải lĩnh vực:', err);
      }
    };

    fetchFields();
  }, []);

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
        surveyFieldId: survey.surveyFieldId,
        questions: survey.questions.map((q) => ({
          title: q.title,
          type: q.type,
          kind: q.kind,
          required: q.required,
          maxFileSizeMb: q.maxFileSizeMb,
          maxFileCount: q.maxFileCount,
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
          surveyFieldId: undefined,
          questions: [],
        });
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

        const data = resp.data as SurveyApiResponse;
        setSurvey({
          title: data.title || '',
          description: data.description || '',
          surveyFieldId: data.surveyFieldId,
          questions: (data.questions || []).map((q, idx) => ({
            id: `q-${idx}-${Date.now()}`,
            kind: (q.kind as QuestionKind) || getKindFromBackendType(q.type || 'short_text'),
            type: q.type || 'short_text',
            title: q.title || '',
            options: (q.options || []).map((o, oi) => ({ id: `o-${oi}-${Date.now()}`, text: o.text || '' })),
            required: q.required || false,
            maxFileSizeMb: q.maxFileSizeMb,
            maxFileCount: q.maxFileCount,
          })),
        });
      } catch (e) {
        console.error('Load survey for edit failed', e);
      }
    };

    loadForEdit();
  }, [editId]);

  // Auto-scroll to newest question
  useEffect(() => {
    if (questionsEndRef.current) {
      setTimeout(() => {
        questionsEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
      }, 100);
    }
  }, [survey.questions.length]);

  // ==================== Step 1: Survey Info ====================
  const handleTitleChange = (value: string) => {
    setSurvey({ ...survey, title: value });
  };

  const handleDescriptionChange = (value: string) => {
    setSurvey({ ...survey, description: value });
  };

  // ==================== Step 2: Questions ====================
  const addQuestion = (kind: QuestionKind) => {
    const newQuestion = createQuestion(kind);
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
        id: crypto.randomUUID(),
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

  const selectQuestionType = (questionId: string, selectedKind: QuestionKind) => {
    updateQuestion(questionId, {
      kind: selectedKind,
      type: getQuestionBackendType(selectedKind),
      options:
        selectedKind === 'short_answer' || selectedKind === 'paragraph' || selectedKind === 'file_upload' || selectedKind === 'linear_scale' || selectedKind === 'rating'
          ? []
          : survey.questions.find((q) => q.id === questionId)?.options?.length
            ? survey.questions.find((q) => q.id === questionId)!.options
            : [
              { id: `${questionId}-o1`, text: '' },
              { id: `${questionId}-o2`, text: '' },
            ],
    });
    setOpenQuestionMenuId(null);
  };

  return (
    <div className="create-surveys-container">
      <div className="surveys-wrapper">
        <div className="surveys-main">
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

          <div className="step-content">
            <div className="step-header">
              <div className="step-number">01</div>
              <div className="step-title-section">
                <h2>Tạo Khảo Sát</h2>
              </div>
            </div>

            <div className="form-card">
              <div className="form-group">
                <label className="form-label">Tiêu Đề</label>
                <input
                  type="text"
                  className="form-input form-input-ghost"
                  placeholder="Nhập tên cuộc khảo sát..."
                  value={survey.title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">MÔ TẢ</label>
                <textarea
                  className="form-textarea form-textarea-ghost"
                  placeholder="Mô tả chi tiết mục đích của khảo sát này..."
                  rows={5}
                  value={survey.description}
                  onChange={(e) => handleDescriptionChange(e.target.value)}
                />
              </div>

              <div className="form-group field-select-group">
                <label className="form-label">LĨNH VỰC <span style={{ color: 'red' }}>*</span></label>
                <select
                  className="form-input"
                  value={survey.surveyFieldId || ''}
                  onChange={(e) => setSurvey({ ...survey, surveyFieldId: e.target.value ? parseInt(e.target.value) : undefined })}
                >
                  <option value="">-- Chọn lĩnh vực --</option>
                  {surveyFields.map((field) => (
                    <option key={field.id} value={field.id}>{field.name}</option>
                  ))}
                </select>
              </div>
            </div>

          </div>

          <div className="step-content step-content-questions">
            <div className="step-header step-header-compact">
              <div className="step-number">02</div>
              <div className="step-title-section">
                <h2>Cấu Trúc Câu Hỏi</h2>
              </div>
            </div>

            <div className="questions-area">

              <div className="questions-list-wrapper">
                <div className="questions-list">
                  {survey.questions.length === 0 ? (
                    <div className="empty-state">
                      <p>Chưa có câu hỏi nào. Thêm câu hỏi đầu tiên để bắt đầu!</p>
                    </div>
                  ) : (
                    survey.questions.map((question,) => (
                      <div key={question.id} className="question-card">
                        <div className="question-main">
                          <div className="question-top-row">
                            <input
                              type="text"
                              className="question-title-input question-title-input-plain"
                              placeholder="Câu hỏi chưa có tiêu đề"
                              value={question.title}
                              onChange={(e) => updateQuestion(question.id, { title: e.target.value })}
                            />

                            <div className="question-inner-toolbar">
                              <button
                                type="button"
                                className="type-select-trigger"
                                onClick={() =>
                                  setOpenQuestionMenuId(
                                    openQuestionMenuId === question.id ? null : question.id
                                  )
                                }
                              >
                                <span className="type-select-trigger-icon">
                                  {getQuestionKindIcon(question.kind)}
                                </span>
                                <span className="type-select-trigger-label">
                                  {getQuestionKindLabel(question.kind)}
                                </span>
                                <ChevronDown size={16} className="type-select-trigger-chevron" />
                              </button>

                              {openQuestionMenuId === question.id && (
                                <div className="type-select-menu">
                                  {QUESTION_TOOL_OPTIONS.map((option, optionIndex) => (
                                    <button
                                      key={`${option.label}-${optionIndex}`}
                                      type="button"
                                      className={`type-select-menu-item${question.kind === option.kind ? ' is-active' : ''}`}
                                      onClick={() => selectQuestionType(question.id, option.kind)}
                                    >
                                      <span className="type-select-menu-icon">{option.icon}</span>
                                      <span className="type-select-menu-label">{option.label}</span>
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="question-header">
                            <div className="question-actions">
                              <button
                                className="action-btn"
                                onClick={() => duplicateQuestion(question.id)}
                                title="Nhân bản"
                              >
                                <Copy size={18} />
                              </button>
                              <button
                                className="action-btn"
                                onClick={() => deleteQuestion(question.id)}
                                title="Xóa"
                              >
                                <Trash2 size={18} />
                              </button>
                            </div>
                          </div>

                          {isOptionBasedKind(question.kind) && (
                            <div className="options-section options-section-plain">
                              <div className="options-list">
                                {question.options.map((option) => (
                                  <div key={option.id} className="option-item option-item-plain">
                                    <div className="option-icon">
                                      {question.kind === 'checkbox' || question.kind === 'checkbox_grid' ? (
                                        <span className="icon-checkbox">☐</span>
                                      ) : (
                                        <span className="icon-multiple-choice">◯</span>
                                      )}
                                    </div>
                                    <input
                                      type="text"
                                      className="option-input option-input-plain"
                                      placeholder={`Đáp án ${question.options.indexOf(option) + 1}`}
                                      value={option.text}
                                      onChange={(e) => updateOption(question.id, option.id, e.target.value)}
                                    />
                                    <button
                                      className="delete-option-btn"
                                      onClick={() => deleteOption(question.id, option.id)}
                                    >
                                      <Trash2 size={16} />
                                    </button>
                                  </div>
                                ))}
                              </div>
                              <button className="add-option-btn" onClick={() => addOption(question.id)}>
                                <Plus size={16} /> Thêm đáp án
                              </button>
                            </div>
                          )}

                          {question.kind === 'short_answer' && (
                            <div className="short-text-preview">
                              <input
                                type="text"
                                className="short-text-input"
                                placeholder="Người trả lời sẽ nhập ở đây..."
                                disabled
                              />
                            </div>
                          )}

                          {question.kind === 'paragraph' && (
                            <div className="short-text-preview">
                              <textarea
                                className="short-text-input"
                                placeholder="Người trả lời sẽ nhập đoạn văn ở đây..."
                                rows={3}
                                disabled
                              />
                            </div>
                          )}

                          {question.kind === 'dropdown' && (
                            <div className="short-text-preview">
                              <select className="short-text-input" disabled defaultValue="">
                                <option value="">Chọn một đáp án</option>
                                {question.options.map((option, index) => (
                                  <option key={option.id} value={index}>
                                    {option.text || `Đáp án ${index + 1}`}
                                  </option>
                                ))}
                              </select>
                            </div>
                          )}

                          {question.kind === 'file_upload' && (
                            <div className="file-upload-settings">
                              <div className="short-text-preview">
                                <div className="upload-preview-box">
                                  <Upload size={18} />
                                  <span>Tải tệp lên</span>
                                </div>
                              </div>

                              <div className="file-upload-settings-grid">
                                <div className="form-group file-upload-setting-group">
                                  <label className="form-label">Kích thước tệp tối đa</label>
                                  <select
                                    className="form-input file-upload-setting-select"
                                    value={question.maxFileSizeMb ?? 10}
                                    onChange={(e) => updateQuestion(question.id, { maxFileSizeMb: Number(e.target.value) })}
                                  >
                                    <option value={1}>1MB</option>
                                    <option value={10}>10MB</option>
                                    <option value={100}>100MB</option>
                                    <option value={1024}>1GB</option>
                                  </select>
                                </div>

                                <div className="form-group file-upload-setting-group">
                                  <label className="form-label">Số lượng tệp tối đa</label>
                                  <select
                                    className="form-input file-upload-setting-select"
                                    value={question.maxFileCount ?? 1}
                                    onChange={(e) => updateQuestion(question.id, { maxFileCount: Number(e.target.value) })}
                                  >
                                    <option value={1}>1</option>
                                    <option value={5}>5</option>
                                    <option value={10}>10</option>
                                  </select>
                                </div>
                              </div>
                            </div>
                          )}

                          {question.kind === 'linear_scale' && (
                            <div className="short-text-preview">
                              <div className="scale-preview">
                                {[1, 2, 3, 4, 5].map((value) => (
                                  <span key={value} className="scale-preview-item">{value}</span>
                                ))}
                              </div>
                            </div>
                          )}

                          {question.kind === 'rating' && (
                            <div className="short-text-preview">
                              <div className="rating-preview">
                                {[1, 2, 3, 4, 5].map((value) => (
                                  <Star key={value} size={18} className="rating-preview-star" />
                                ))}
                              </div>
                            </div>
                          )}

                          {(question.kind === 'multiple_choice_grid' || question.kind === 'checkbox_grid') && (
                            <div className="short-text-preview">
                              <div className="grid-preview">
                                <div className="grid-preview-header">
                                  <span />
                                  <span>Cột 1</span>
                                  <span>Cột 2</span>
                                  <span>Cột 3</span>
                                </div>
                                <div className="grid-preview-row">
                                  <span>Hàng 1</span>
                                  <span>◯</span>
                                  <span>◯</span>
                                  <span>◯</span>
                                </div>
                                <div className="grid-preview-row">
                                  <span>Hàng 2</span>
                                  <span>◯</span>
                                  <span>◯</span>
                                  <span>◯</span>
                                </div>
                              </div>
                            </div>
                          )}

                          <div className="question-footer">
                            <label className="required-checkbox">
                              <input
                                type="checkbox"
                                checked={question.required}
                                onChange={(e) => updateQuestion(question.id, { required: e.target.checked })}
                              />
                              <span>Bắt buộc trả lời</span>
                            </label>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                  <div ref={questionsEndRef} />
                </div>
              </div>

              <div className="floating-toolbar">
                <button onClick={() => addQuestion('multiple_choice')} title="Multiple Choice">
                  <MdAddCircleOutline size={22} />
                </button>

                <button onClick={() => addQuestion('checkbox')} title="Checkbox">
                  <MdCheckBox size={22} />
                </button>

                <button onClick={() => addQuestion('short_answer')} title="Short Answer">
                  <MdShortText size={22} />
                </button>
              </div>
            </div>

            <div className="form-actions form-actions-end">
              <button
                className="btn btn-primary"
                onClick={handleSaveSurvey}
                disabled={loading}
              >
                {loading ? 'Đang lưu...' : 'Lưu Khảo Sát'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
