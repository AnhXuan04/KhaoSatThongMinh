import { apiUrl } from '../../config/api';
import { useEffect, useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { Eye } from 'lucide-react';
import { FiStar } from 'react-icons/fi';
import './SurveyResponseQuestion.css';

type Option = {
	text: string;
	count: number;
	percentage: number;
};

type Question = {
	id: number;
	title: string;
	type: string;
	questionKind?: string;
	options: Option[];
	totalResponses: number;
};

type Feedback = {
	name: string;
	text: string;
	questionId?: number;
	responderId: number;
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
	questionKind?: string;
	totalResponses: number;
	options: ApiOptionStatistic[];
};

type FileUploadItem = {
	questionId: number;
	responseId: number;
	name: string;
	url: string;
	fileType?: string;
	fileSize?: number;
	originalFileName?: string;
};

type ApiResponse = {
	responseId: number;
	userName: string;
	userEmail: string;
	avatar: string;
	rating: number | null;
	comment: string;
	submittedAt: string;
};

type AnswerDetail = {
	questionId: number;
	questionTitle: string;
	questionType: string;
	questionKind?: string;
	values: string[];
	secureUrl?: string;
	originalFileName?: string;
	fileSize?: number;
	fileType?: string;
};

type ResponseDetail = {
	responseId: number;
	answers: AnswerDetail[];
};

export default function SurveyResponseQuestion() {
	const [searchParams] = useSearchParams();
	const surveyId = searchParams.get('surveyId');

	const [survey, setSurvey] = useState<{ title: string; questions: Question[] } | null>(null);
	const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
	const [fileUploads, setFileUploads] = useState<FileUploadItem[]>([]);
	const [responseDetails, setResponseDetails] = useState<ResponseDetail[]>([]);
	const [selectedQuestionId, setSelectedQuestionId] = useState<number | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [previewFile, setPreviewFile] = useState<{ name: string; url: string } | null>(null);

	const getAuthToken = (): string | null => {
		return sessionStorage.getItem('token') || localStorage.getItem('token');
	};

	const getGoogleViewerUrl = (fileUrl?: string | null) => {
		if (!fileUrl) return '';
		return `https://docs.google.com/gview?url=${encodeURIComponent(fileUrl)}&embedded=true`;
	};

	useEffect(() => {
		const fetchData = async () => {
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
				// Fetch survey statistics and responses list in parallel
				const [statsRes, responsesListRes] = await Promise.all([
					axios.get(apiUrl(`/api/surveys/${encodeURIComponent(surveyId)}/statistics`), {
						headers: { Authorization: `Bearer ${token}` },
					}),
					axios.get(apiUrl(`/api/surveys/${encodeURIComponent(surveyId)}/responses`), {
						headers: { Authorization: `Bearer ${token}` },
					}),
				]);

				const statsData: ApiQuestionStatistic[] = statsRes.data || [];
				const responsesList: ApiResponse[] = responsesListRes.data || [];

				// Transform statistics to our format
				const questions: Question[] = statsData.map((stat) => ({
					id: stat.questionId,
					title: stat.title,
					type: stat.type,
					questionKind: stat.questionKind || stat.kind,
					options: (stat.options || []).map((opt) => ({
						text: opt.text,
						count: opt.count,
						percentage: opt.percentage,
					})),
					totalResponses: stat.totalResponses,
				}));

				setSurvey({
					title: 'Khảo sát',
					questions,
				});

				const detailResults = await Promise.all(
					responsesList.map(async (response) => {
						try {
							const detailRes = await axios.get(
								apiUrl(`/api/surveys/responses/${response.responseId}`),
								{ headers: { Authorization: `Bearer ${token}` } }
							);
							return detailRes.data;
						} catch {
							return null;
						}
					})
				);
				setResponseDetails(detailResults.filter(Boolean) as ResponseDetail[]);

				const uploads: FileUploadItem[] = [];
				const textFeedbacks: Feedback[] = [];
				for (const detail of detailResults) {
					if (!detail?.answers) continue;
					for (const answer of detail.answers) {
						if ((answer.questionKind === 'file_upload' || answer.questionType === 'file_upload') && answer.secureUrl) {
							uploads.push({
								questionId: answer.questionId,
								responseId: detail.responseId,
								name: answer.originalFileName || `Tệp từ phản hồi #${detail.responseId}`,
								url: answer.secureUrl,
								fileType: answer.fileType,
								fileSize: answer.fileSize,
								originalFileName: answer.originalFileName,
							});
						}
						if (
							(answer.questionKind === 'short_answer' || answer.questionKind === 'paragraph' || answer.questionType === 'short_text')
							&& answer.questionKind !== 'linear_scale'
							&& answer.questionKind !== 'rating'
							&& answer.questionKind !== 'file_upload'
						) {
							for (const value of answer.values || []) {
								if (value && value.trim()) {
									const responseMeta = responsesList.find((response) => response.responseId === detail.responseId);
									textFeedbacks.push({
										name: responseMeta?.userName || 'Anonymous',
										text: value.trim(),
										questionId: answer.questionId,
										responderId: detail.responseId,
									});
								}
							}
						}
					}
				}
				setFileUploads(uploads);
				setFeedbacks(textFeedbacks);

				// Set first question as selected
				if (questions.length > 0) {
					setSelectedQuestionId(questions[0].id);
				}

				setError(null);
			} catch (err) {
				console.error('Error fetching data:', err);
				setError('Lỗi khi tải dữ liệu');
			} finally {
				setLoading(false);
			}
		};

		fetchData();
	}, [surveyId]);

	const selectedQuestion = useMemo(() => {
		return survey?.questions.find((q) => q.id === selectedQuestionId);
	}, [survey, selectedQuestionId]);

	const selectedAnswers = useMemo(() => {
		if (!selectedQuestionId) return [];
		return responseDetails.flatMap((detail) =>
			(detail.answers || []).filter((answer) => Number(answer.questionId) === selectedQuestionId)
		);
	}, [responseDetails, selectedQuestionId]);

	const selectedFileUploads = useMemo(() => {
		if (!selectedQuestionId) return [];
		return fileUploads.filter((file) => file.questionId === selectedQuestionId);
	}, [fileUploads, selectedQuestionId]);

	const numericAnswers = useMemo(() => {
		return selectedAnswers
			.flatMap((answer) => answer.values || [])
			.map((value) => Number.parseInt(value, 10))
			.filter((value) => !Number.isNaN(value) && value >= 1 && value <= 5);
	}, [selectedAnswers]);

	const numericDistribution = useMemo(() => {
		const total = numericAnswers.length;
		return [1, 2, 3, 4, 5].map((value) => {
			const count = numericAnswers.filter((answer) => answer === value).length;
			return {
				value,
				count,
				percentage: total > 0 ? Math.round((count * 100) / total) : 0,
			};
		});
	}, [numericAnswers]);

	const selectedTextFeedbacks = useMemo(() => {
		if (!selectedQuestionId) return [];
		return feedbacks.filter((feedback) => feedback.questionId === selectedQuestionId);
	}, [feedbacks, selectedQuestionId]);

	const shouldShowTextFeedbacks = selectedQuestion
		&& (selectedQuestion.questionKind === 'short_answer'
			|| selectedQuestion.questionKind === 'paragraph'
			|| selectedQuestion.type === 'short_text')
		&& selectedQuestion.questionKind !== 'linear_scale'
		&& selectedQuestion.questionKind !== 'rating'
		&& selectedQuestion.questionKind !== 'file_upload';

	if (loading) {
		return <div className="surveyResponseQuestionState">Đang tải dữ liệu...</div>;
	}

	if (error) {
		return <div className="surveyResponseQuestionState surveyResponseQuestionStateError">{error}</div>;
	}

	if (!survey) {
		return null;
	}

	return (
		<div className="surveyResponseQuestionPage">
			<header className="surveyResponseQuestionHeader">
				<div className="surveyResponseQuestionTitle">
					<h1>Kết quả Khảo sát</h1>
				</div>
				<button type="button" className="surveyResponseQuestionMenuBtn">
					⋮
				</button>
			</header>

			<main className="surveyResponseQuestionMain">
				{/* CURRENT FOCUS */}
				<section className="surveyResponseQuestionFocus">
					<span className="surveyResponseQuestionFocusLabel">CHỌN CÂU HỎI</span>
					<div className="surveyResponseQuestionFocusDropdown">
						<select
							value={selectedQuestionId || ''}
							onChange={(e) => setSelectedQuestionId(Number(e.target.value))}
							className="surveyResponseQuestionSelect"
						>
							{survey.questions.map((q, idx) => (
								<option key={q.id} value={q.id}>
									Câu {idx + 1}: {q.title}
								</option>
							))}
						</select>
					</div>
				</section>

				{/* QUESTION DETAIL */}
				{selectedQuestion && (
					<section className="surveyResponseQuestionDetail">
						<h2 className="surveyResponseQuestionText">{selectedQuestion.title}</h2>
						<div className="surveyResponseQuestionMeta">
							<span className="surveyResponseQuestionType">
								{selectedQuestion.questionKind === 'file_upload' || selectedQuestion.type === 'file_upload'
									? 'TẢI TỆP LÊN'
									: selectedQuestion.questionKind === 'linear_scale'
										? 'PHẠM VI TUYẾN TÍNH'
										: selectedQuestion.questionKind === 'rating'
											? 'XẾP HẠNG'
									: selectedQuestion.type === 'multiple_choice'
									? 'TRẮC NGHIỆM'
									: selectedQuestion.type === 'checkbox'
										? 'HỘP KIỂM'
										: 'VĂN BẢN'}
							</span>
							<span className="surveyResponseQuestionCount">
								{selectedQuestion.totalResponses} PHẢN HỒI
							</span>
						</div>

						{(selectedQuestion.questionKind === 'file_upload' || selectedQuestion.type === 'file_upload') ? (
							<div className="surveyResponseQuestionFeedback">
								<h3 className="surveyResponseQuestionFeedbackTitle">Danh sách tệp đã tải lên</h3>
								{selectedFileUploads.length > 0 ? (
									<div className="surveyResponseQuestionFeedbackList">
										{selectedFileUploads.map((file, index) => (
											<article key={`${file.responseId}-${index}`} className="surveyResponseQuestionFeedbackCard">
												<p className="surveyResponseQuestionFeedbackText">
													<button
														type="button"
														onClick={() => setPreviewFile({ name: file.name, url: file.url })}
														style={{
															background: 'none',
															border: 'none',
															padding: 0,
															cursor: 'pointer',
															color: '#0066cc',
															textDecoration: 'underline',
														}}
													>
														
														<Eye size={12} /> {file.name}
														</button>
												</p>
												
											</article>
										))}
									</div>
								) : (
									<div className="surveyResponseQuestionFeedbackCard">Chưa có tệp nào được tải lên.</div>
								)}
							</div>
						) : selectedQuestion.questionKind === 'rating' ? (
							<div className="surveyResponseQuestionRating">
								<div className="surveyResponseQuestionRatingSummary">
									<strong>
										Điểm trung bình {numericAnswers.length > 0
											? (numericAnswers.reduce((sum, value) => sum + value, 0) / numericAnswers.length).toFixed(2)
											: '0.00'}
									</strong>
									<span>{numericAnswers.length} phản hồi</span>
								</div>
								<div className="surveyResponseQuestionRatingStars">
									{Array.from({ length: 5 }).map((_, index) => {
										const average = numericAnswers.length > 0
											? numericAnswers.reduce((sum, value) => sum + value, 0) / numericAnswers.length
											: 0;
										const filled = index < Math.round(average);
										return (
											<FiStar
												key={index}
												size={34}
												className={`surveyResponseQuestionRatingStar ${filled ? 'filled' : ''}`}
											/>
										);
									})}
								</div>
								<div className="surveyResponseQuestionScaleBars">
									{numericDistribution.map((item) => (
										<div key={item.value} className="surveyResponseQuestionScaleItem">
											<div className="surveyResponseQuestionOptionHeader">
												<span className="surveyResponseQuestionOptionName">{item.value} sao</span>
												<span className="surveyResponseQuestionOptionPercentage">{item.percentage}%</span>
											</div>
											<div className="surveyResponseQuestionOptionBar">
												<div className="surveyResponseQuestionOptionBarFill" style={{ width: `${item.percentage}%` }} />
											</div>
											<span className="surveyResponseQuestionOptionCount">
												{item.count} người tham gia đã chọn
											</span>
										</div>
									))}
								</div>
							</div>
						) : selectedQuestion.questionKind === 'linear_scale' ? (
							<div className="surveyResponseQuestionScale">
								<div className="surveyResponseQuestionScalePreview">
									{[1, 2, 3, 4, 5].map((value) => (
										<span key={value} className="surveyResponseQuestionScalePreviewItem">{value}</span>
									))}
								</div>
								<div className="surveyResponseQuestionScaleBars">
									{numericDistribution.map((item) => (
										<div key={item.value} className="surveyResponseQuestionScaleItem">
											<div className="surveyResponseQuestionOptionHeader">
												<span className="surveyResponseQuestionOptionName">Mức {item.value}</span>
												<span className="surveyResponseQuestionOptionPercentage">{item.percentage}%</span>
											</div>
											<div className="surveyResponseQuestionOptionBar">
												<div className="surveyResponseQuestionOptionBarFill" style={{ width: `${item.percentage}%` }} />
											</div>
											<span className="surveyResponseQuestionOptionCount">
												{item.count} người tham gia đã chọn
											</span>
										</div>
									))}
								</div>
							</div>
						) : shouldShowTextFeedbacks ? (
							<div className="surveyResponseQuestionTextAnswers">
								{selectedTextFeedbacks.length > 0 ? (
									selectedTextFeedbacks.map((feedback, index) => (
										<div key={index} className="surveyResponseQuestionTextAnswer">
											{feedback.text}
										</div>
									))
								) : (
									<div className="surveyResponseQuestionFeedbackCard">Chưa có câu trả lời văn bản.</div>
								)}
							</div>
						) : (
							<div className="surveyResponseQuestionOptions">
								{selectedQuestion.options.length > 0 ? (
									selectedQuestion.options.map((option, index) => (
										<div key={index} className="surveyResponseQuestionOptionItem">
											<div className="surveyResponseQuestionOptionHeader">
												<span className="surveyResponseQuestionOptionName">{option.text}</span>
												<span className="surveyResponseQuestionOptionPercentage">{option.percentage}%</span>
											</div>
											<div className="surveyResponseQuestionOptionBar">
												<div
													className="surveyResponseQuestionOptionBarFill"
													style={{ width: `${option.percentage}%` }}
												/>
											</div>
											<span className="surveyResponseQuestionOptionCount">
												{option.count} người tham gia đã chọn
											</span>
										</div>
									))
								) : (
									<div className="surveyResponseQuestionFeedbackCard">
										Câu hỏi này chưa có dữ liệu thống kê.
									</div>
								)}
							</div>
						)}
					</section>
				)}

			</main>

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
						maxWidth: 900,
						height: '90vh',
						display: 'flex',
						flexDirection: 'column',
						overflow: 'hidden',
					}}>
						<div style={{ padding: 16, borderBottom: '1px solid #ddd', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
							<h3 style={{ margin: 0 }}>{previewFile?.name}</h3>
							<button type="button" onClick={() => setPreviewFile(null)} style={{ background: 'none', border: 'none', fontSize: 24, cursor: 'pointer' }}>✕</button>
						</div>
						<iframe
							title="file-preview"
							src={getGoogleViewerUrl(previewFile?.url)}
							style={{ flex: 1, width: '100%', border: 'none' }}
						/>
					</div>
				</div>
			)}
		</div>
	);
}
