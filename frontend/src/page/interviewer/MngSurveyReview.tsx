import { apiUrl } from '../../config/api';
import { FiStar } from 'react-icons/fi';
import { useSearchParams } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import SurveyResponseQuestion from './SurveyResponseQuestion';
import SurveyResponsePersonal from './SurveyResponsePersonal';
import './MngSurveyReview.css';

type FeedbackItem = {
  responseId: number;
  name: string;
  email: string;
  avatar: string;
  rating: number | null;
  comment: string;
  submittedAt: string;
};

type ApiResponseItem = {
  responseId: number;
  userName: string;
  userEmail: string;
  avatar: string;
  rating: number | null;
  comment: string;
  submittedAt: string;
};

type ApiOptionStatistic = {
  text: string;
  count: number;
  percentage: number;
};

type ApiQuestionStatistic = {
  questionId: number;
  title: string;
  type: string;
  kind?: string;
  totalResponses: number;
  options: ApiOptionStatistic[];
};

type FileItem = {
  responseId: number;
  questionId: number;
  name: string;
  url: string;
  fileType?: string;
  fileSize?: number;
};

type AnswerDetail = {
  questionId: number | string;
  questionKind?: string;
  questionType?: string;
  values?: string[];
  secureUrl?: string;
  originalFileName?: string;
  fileSize?: number;
  fileType?: string;
};

type ResponseDetail = {
  responseId: number;
  answers?: AnswerDetail[];
};

export default function MngSurveyReview() {
  const [searchParams] = useSearchParams();
  const surveyId = searchParams.get('surveyId');
  const requestedTab = searchParams.get('tab');
  const initialTab = requestedTab === 'questions' || requestedTab === 'personal' ? requestedTab : 'summary';
  const [activeTab, setActiveTab] = useState<'summary' | 'questions' | 'personal'>(initialTab);

  const [feedbackItems, setFeedbackItems] = useState<FeedbackItem[]>([]);
  const [questionStats, setQuestionStats] = useState<ApiQuestionStatistic[]>([]);
  const [fileMap, setFileMap] = useState<Record<number, FileItem[]>>({});
  const [responseDetails, setResponseDetails] = useState<ResponseDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const getAuthToken = (): string | null => {
    return sessionStorage.getItem('token') || localStorage.getItem('token');
  };

  useEffect(() => {
    const fetchResponses = async () => {
      if (!surveyId) {
        setError('Không tìm thấy khảo sát');
        setLoading(false);
        return;
      }

      const token = getAuthToken();
      if (!token) {
        setError('Bạn cần đăng nhập');
        setLoading(false);
        return;
      }

      try {
        const [responsesRes, statsRes] = await Promise.all([
          axios.get(apiUrl(`/api/surveys/${encodeURIComponent(surveyId)}/responses`), { headers: { Authorization: `Bearer ${token}` } }),
          axios.get(apiUrl(`/api/surveys/${encodeURIComponent(surveyId)}/statistics`), { headers: { Authorization: `Bearer ${token}` } }),
        ]);

        const responses = responsesRes.data || [];
        const stats: ApiQuestionStatistic[] = statsRes.data || [];

        // Build feedback items
        const items: FeedbackItem[] = responses.map((item: ApiResponseItem) => ({
          responseId: item.responseId,
          name: item.userName,
          email: item.userEmail,
          avatar: item.avatar,
          rating: item.rating || null,
          comment: item.comment || '',
          submittedAt: item.submittedAt,
        }));

        setFeedbackItems(items);
        setQuestionStats(stats);

        // Fetch details to collect uploaded files per question
        try {
          const promises = (responses || []).map(async (r: ApiResponseItem) => {
            try {
              const det = await axios.get(apiUrl(`/api/surveys/responses/${r.responseId}`), { headers: { Authorization: `Bearer ${token}` } });
              return det.data;
            } catch {
              return null;
            }
          });

          const details = await Promise.all(promises);
          setResponseDetails(details.filter(Boolean));
          const map: Record<number, FileItem[]> = {};
          for (const d of details) {
            if (!d || !d.answers) continue;
            for (const ans of d.answers) {
              if ((ans.questionKind === 'file_upload' || ans.questionType === 'file_upload') && ans.secureUrl) {
                const qid = Number(ans.questionId);
                if (!map[qid]) map[qid] = [];
                map[qid].push({
                  responseId: d.responseId,
                  questionId: qid,
                  name: ans.originalFileName || `File-${d.responseId}`,
                  url: ans.secureUrl,
                  fileType: ans.fileType,
                  fileSize: ans.fileSize,
                });
              }
            }
          }
          setFileMap(map);
        } catch (e) {
          console.error('Error fetching details for files', e);
        }

        setError(null);
      } catch (err) {
        console.error('Lỗi khi tải phản hồi:', err);
        setError('Lỗi khi tải danh sách phản hồi');
        setFeedbackItems([]);
        setQuestionStats([]);
      } finally {
        setLoading(false);
      }
    };

    fetchResponses();
  }, [surveyId]);



  const summary = useMemo(() => {
    const total = feedbackItems.length;
    const ratedItems = feedbackItems.filter((item) => item.rating !== null);
    const averageRating = ratedItems.length ? ratedItems.reduce((s, i) => s + (i.rating || 0), 0) / ratedItems.length : 0;
    const commentItems = feedbackItems.filter((item) => item.comment.trim().length > 0);
    return { total, averageRating, commentCount: commentItems.length };
  }, [feedbackItems]);

  const legendTones = ['#2563eb', '#60a5fa', '#93c5fd', '#bfdbfe', '#dbeafe'];

  const getDonutBackground = (options: ApiOptionStatistic[]) => {
    const positiveOptions = options.filter((item) => item.percentage > 0);
    if (positiveOptions.length === 0) return 'conic-gradient(#e5e7eb 0deg 360deg)';
    let currentDeg = 0;
    const segments = positiveOptions.map((item, index) => {
      const startDeg = currentDeg;
      const endDeg = index === positiveOptions.length - 1 ? 360 : Math.min(360, currentDeg + (item.percentage / 100) * 360);
      currentDeg = endDeg;
      return `${legendTones[index % legendTones.length]} ${startDeg}deg ${endDeg}deg`;
    });
    if (currentDeg < 360) segments.push(`#e5e7eb ${currentDeg}deg 360deg`);
    return `conic-gradient(${segments.join(', ')})`;
  };

  return (
    <div className="mngSurveyReviewPage">
      <main className="mngSurveyReviewMain">
        <section className="mngSurveyReviewTabs" aria-label="Survey review tabs">
          <button type="button" className={activeTab === 'summary' ? 'isActive' : ''} onClick={() => setActiveTab('summary')}>Tóm tắt</button>
          <button type="button" className={activeTab === 'questions' ? 'isActive' : ''} onClick={() => setActiveTab('questions')}>Câu hỏi</button>
          <button type="button" className={activeTab === 'personal' ? 'isActive' : ''} onClick={() => setActiveTab('personal')}>Cá nhân</button>
        </section>

        {activeTab === 'questions' ? (
          <SurveyResponseQuestion />
        ) : activeTab === 'personal' ? (
          <SurveyResponsePersonal />
        ) : (
          <>
            <section className="mngSurveyReviewHero">
              <div className="mngSurveyReviewHeroLeft">
                <span className="mngSurveyReviewEyebrow">THỐNG KÊ CHUNG</span>
                <div className="mngSurveyReviewHeroNumber">{summary.total} Phản hồi đã nhận.</div>
                
              </div>
            </section>

            {loading && <div className="mngSurveyReviewState">Đang tải dữ liệu phản hồi...</div>}
            {error && <div className="mngSurveyReviewState mngSurveyReviewStateError">{error}</div>}

            {!loading && !error && (
              <>
                {questionStats.length > 0 ? (
                  <section>
                    {questionStats.map((question, questionIndex) => {
                      const questionOptions = question.options || [];
                      const topPercentage = questionOptions.length > 0 ? Math.max(...questionOptions.map((i) => i.percentage)) : 0;
                      const qKind = question.kind || question.type;
                      const answersForQ = responseDetails.flatMap((response) =>
                        (response.answers || []).filter(
                          (ans) => Number(ans.questionId) === Number(question.questionId)
                        )
                      );

                      return (
                        <article key={question.questionId} className="mngSurveyReviewPanel mngSurveyReviewPanelFull">
                          <div className="mngSurveyReviewPanelHeader mngSurveyReviewPanelHeaderSpread">
                            <div>
                              <span className="mngSurveyReviewPanelIndex">{String(questionIndex + 1).padStart(2, '0')}</span>
                              <h2>{question.title}</h2>
                            </div>
                            <span className="mngSurveyReviewCountBadge">{question.totalResponses} phản hồi</span>
                          </div>

                          <div className="mngSurveyReviewQuestionBody">

                            {/* MULTIPLE CHOICE + DROPDOWN => PIE */}
                            {(
                              (question.type === 'multiple_choice' && qKind !== 'linear_scale' && qKind !== 'rating') || qKind === 'dropdown'
                            ) && (
                                <div className="mngSurveyReviewQuestionChart">
                                  <div
                                    className="mngSurveyReviewDonut"
                                    aria-hidden="true"
                                    style={{ background: getDonutBackground(questionOptions) }}
                                  >
                                    <div className="mngSurveyReviewDonutInner">
                                      <span>{topPercentage}%</span>
                                    </div>
                                  </div>

                                  <div className="mngSurveyReviewLegend">
                                    {questionOptions.map((item, index) => (
                                      <div
                                        key={`${question.questionId}-${item.text}-${index}`}
                                        className="mngSurveyReviewLegendItem"
                                      >
                                        <span
                                          className="mngSurveyReviewLegendDot"
                                          style={{ background: legendTones[index % legendTones.length] }}
                                        />
                                        <span>{item.text}</span>
                                        <strong>{item.percentage}%</strong>
                                      </div>
                                    ))}
                                  </div>

                                </div>
                              )}

                            {/* CHECKBOX => BAR */}
                            {question.type === 'checkbox' && (
                              <div className="mngSurveyReviewBars">
                                {questionOptions.map((item, index) => (
                                  <div
                                    key={`${question.questionId}-${item.text}-${index}`}
                                    className="mngSurveyReviewBarRow"
                                  >
                                    <div className="mngSurveyReviewBarLabel">
                                      {item.text}
                                    </div>

                                    <div className="mngSurveyReviewBarWrapper">
                                      <div
                                        className="mngSurveyReviewBar"
                                        style={{
                                          width: `${item.percentage}%`,
                                          background: legendTones[index % legendTones.length],
                                        }}
                                      />
                                    </div>

                                    <div className="mngSurveyReviewBarPercent">
                                      {item.percentage}%
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}

                            {/* FILE_UPLOAD */}
                            {/* RATING */}
                            {(qKind === 'rating' || question.type === 'rating') && (
                              <div className="mngSurveyReviewRating">
                                {(() => {
                                  const answersForQ = responseDetails.flatMap((d: ResponseDetail) => (d.answers || []).filter((a: AnswerDetail) => Number(a.questionId) === question.questionId));
                                  const nums = answersForQ.map((a: AnswerDetail) => {
                                    const v = a.values && a.values.length > 0 ? parseInt(a.values[0]) : NaN;
                                    return Number.isNaN(v) ? null : v;
                                  }).filter((n: number | null) => n !== null) as number[];
                                  const total = nums.length;
                                  const avg = total ? nums.reduce((s, n) => s + n, 0) / total : 0;

                                  const counts = [0, 0, 0, 0, 0];
                                  nums.forEach((v) => { if (v >= 1 && v <= 5) counts[v - 1]++; });

                                  return (
                                    <div>
                                      <div className="mngRatingHeader">
                                        <strong>Average rating ({avg.toFixed(2)})</strong>
                                      </div>

                                      <div className="mngRatingStarsRow">
                                        {Array.from({ length: 5 }).map((_, i) => {
                                          const fill = Math.max(0, Math.min(1, avg - i));
                                          return (
                                            <div key={i} className="mngRatingStar">
                                              <div className="mngRatingStarLabel">{i + 1}</div>
                                              <div className="mngRatingStarBox">
                                                <span className="mngRatingStarBase"><FiStar /></span>
                                                <span className="mngRatingStarFill" style={{ width: `${fill * 100}%` }}><FiStar /></span>
                                              </div>
                                            </div>
                                          );
                                        })}
                                      </div>

                                      <div className="mngRatingDistribution">
                                        {counts.map((c, idx) => {
                                          const pct = total ? Math.round((c * 100) / total) : 0;
                                          return (
                                            <div key={idx} className="mngRatingDistCol">
                                              <div className="mngRatingDistBarWrap">
                                                <div className="mngRatingDistBar" style={{ height: `${pct}%` }} />
                                              </div>
                                              <div className="mngRatingDistCount">{c} ({pct}%)</div>
                                              <div className="mngRatingDistLabel">{idx + 1}</div>
                                            </div>
                                          );
                                        })}
                                      </div>
                                    </div>
                                  );
                                })()}
                              </div>
                            )}

                            {qKind === 'linear_scale' && (() => {
                              const nums = answersForQ
                                .flatMap((a: AnswerDetail) => a.values || [])
                                .map((v) => parseInt(v))
                                .filter((v) => !Number.isNaN(v));

                              const total = nums.length;

                              const scaleOptions = [1, 2, 3, 4, 5].map((num) => {
                                const count = nums.filter((v) => v === num).length;
                                return {
                                  label: String(num),
                                  count,
                                  percentage: total > 0 ? Math.round((count * 100) / total) : 0,
                                };
                              });

                              const maxCount = Math.max(...scaleOptions.map((o) => o.count), 1);

                              return (
                                <div className="mngSurveyReviewLinearChart">
                                  <div className="mngSurveyReviewLinearTotal">
                                    {total} câu trả lời
                                  </div>

                                  <div className="mngSurveyReviewLinearBars">
                                    {scaleOptions.map((item) => (
                                      <div key={item.label} className="mngSurveyReviewLinearColumn">
                                        <div className="mngSurveyReviewLinearBarArea">
                                          {item.count > 0 ? (
                                            <div
                                              className="mngSurveyReviewLinearBar"
                                              style={{ height: `${(item.count / maxCount) * 100}%` }}
                                            >
                                              <span>{item.count} ({item.percentage}%)</span>
                                            </div>
                                          ) : (
                                            <span className="mngSurveyReviewLinearZero">
                                              0 (0%)
                                            </span>
                                          )}
                                        </div>

                                        <div className="mngSurveyReviewLinearLabel">
                                          {item.label}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              );
                            })()}

                            {/* SHORT TEXT */}
                            {((qKind === 'short_answer' || qKind === 'paragraph' || question.type === 'short_text') && qKind !== 'linear_scale' && qKind !== 'rating' && qKind !== 'file_upload') && (
                              <div className="mngSurveyReviewTexts">
                                {(() => {
                                  const answersForQ = responseDetails.flatMap((d: ResponseDetail) => (d.answers || []).filter((a: AnswerDetail) => Number(a.questionId) === question.questionId));
                                  const texts = answersForQ.flatMap((a: AnswerDetail) => a.values || []).filter(Boolean) as string[];
                                  if (texts.length === 0) return <div className="mngSurveyReviewEmptyComment">Chưa có câu trả lời văn bản</div>;
                                  return (
                                    <div className="mngSurveyReviewTextList">
                                      {texts.slice(0, 10).map((t, idx) => (
                                        <div key={idx} className="mngSurveyReviewTextItem">"{t}"</div>
                                      ))}
                                    </div>
                                  );
                                })()}
                              </div>
                            )}

                            {(qKind === 'file_upload' || question.type === 'file_upload') && (
                              <div className="mngSurveyReviewFiles">
                                {(fileMap[question.questionId] || []).length > 0 ? (
                                  fileMap[question.questionId].map((file, index) => (
                                    <a
                                      key={index}
                                      href={file.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="mngSurveyReviewFileItem"
                                    >
                                      📎 {file.name}
                                    </a>
                                  ))
                                ) : (
                                  <div className="mngSurveyReviewEmptyComment">
                                    Chưa có tệp được tải lên
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </article>
                      );
                    })}
                  </section>
                ) : (
                  <div className="mngSurveyReviewState">Khảo sát chưa có câu hỏi để hiển thị biểu đồ.</div>
                )}
              </>
            )}
          </>
        )}
      </main>
    </div>
  );
}
