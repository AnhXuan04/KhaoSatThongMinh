import { useEffect, useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { FiPrinter, FiTrash2, FiChevronLeft, FiChevronRight, FiEye, FiUser } from 'react-icons/fi';
import './SurveyResponsePersonal.css';

type AnswerDetail = {
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
};

type ResponseDetail = {
	responseId: number;
	surveyId: number;
	surveyTitle: string;
	completedAt: string;
	answers: AnswerDetail[];
	userName?: string;
	userEmail?: string;
	userTitle?: string;
	userCompany?: string;
	userAvatar?: string;
};

type ApiResponseDetail = {
	responseId: number;
	surveyId: number;
	surveyTitle: string;
	completedAt: string;
	answers: AnswerDetail[];
};

export default function SurveyResponsePersonal() {
	const [searchParams] = useSearchParams();
	const surveyId = searchParams.get('surveyId');
	const targetResponseId = searchParams.get('responseId');

	const [responses, setResponses] = useState<ResponseDetail[]>([]);
	const [currentIndex, setCurrentIndex] = useState(0);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [previewFile, setPreviewFile] = useState<{ name: string; url: string } | null>(null);

	const getGoogleViewerUrl = (fileUrl?: string | null) => {
		if (!fileUrl) return '';
		return `https://docs.google.com/gview?url=${encodeURIComponent(fileUrl)}&embedded=true`;
	};

	const getAuthToken = (): string | null => {
		return sessionStorage.getItem('token') || localStorage.getItem('token');
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
				// Fetch responses list to get all response IDs
				const responsesListRes = await axios.get(
					`http://localhost:8080/api/surveys/${encodeURIComponent(surveyId)}/responses`,
					{
						headers: { Authorization: `Bearer ${token}` },
					}
				);

				const responsesList = responsesListRes.data || [];

				// Fetch details for each response
				const detailedResponses: ResponseDetail[] = [];
				for (const resp of responsesList) {
					try {
						const detailRes = await axios.get(
							`http://localhost:8080/api/surveys/responses/${resp.responseId}`,
							{
								headers: { Authorization: `Bearer ${token}` },
							}
						);
						const detail: ApiResponseDetail = detailRes.data;
						detailedResponses.push({
							...detail,
							userName: resp.userName,
							userEmail: resp.userEmail,
							userAvatar: resp.avatar,
						});
					} catch (err) {
						console.error(`Error fetching response ${resp.responseId}:`, err);
					}
				}

				setResponses(detailedResponses);
				if (targetResponseId) {
					const targetIndex = detailedResponses.findIndex((response) => String(response.responseId) === targetResponseId);
					if (targetIndex >= 0) {
						setCurrentIndex(targetIndex);
					}
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
	}, [surveyId, targetResponseId]);

	const currentResponse = useMemo(() => {
		return responses[currentIndex] || null;
	}, [responses, currentIndex]);

	const handlePrevious = () => {
		if (currentIndex > 0) {
			setCurrentIndex(currentIndex - 1);
		}
	};

	const handleNext = () => {
		if (currentIndex < responses.length - 1) {
			setCurrentIndex(currentIndex + 1);
		}
	};

	if (loading) {
		return <div className="surveyResponsePersonalState">Đang tải dữ liệu...</div>;
	}

	if (error) {
		return <div className="surveyResponsePersonalState surveyResponsePersonalStateError">{error}</div>;
	}

	if (responses.length === 0) {
		return <div className="surveyResponsePersonalState">Chưa có phản hồi nào</div>;
	}

	return (
		<div className="surveyResponsePersonalPage">
			<header className="surveyResponsePersonalHeader">
				<div className="surveyResponsePersonalTitle">
					<h1>Kết quả Khảo sát</h1>
				</div>
				<button type="button" className="surveyResponsePersonalMenuBtn">
					⋮
				</button>
			</header>

			<main className="surveyResponsePersonalMain">
				{/* NAVIGATION */}
				<section className="surveyResponsePersonalNav">
					<button
						type="button"
						className="surveyResponsePersonalNavBtn"
						onClick={handlePrevious}
						disabled={currentIndex === 0}
					>
						<FiChevronLeft />
					</button>
					<span className="surveyResponsePersonalNavCounter">
						{currentIndex + 1} của {responses.length}
					</span>
					<button
						type="button"
						className="surveyResponsePersonalNavBtn"
						onClick={handleNext}
						disabled={currentIndex === responses.length - 1}
					>
						<FiChevronRight />
					</button>

					<div className="surveyResponsePersonalActions">
						<button type="button" className="surveyResponsePersonalActionBtn" title="In ấn">
							<FiPrinter />
						</button>
						<button type="button" className="surveyResponsePersonalActionBtn surveyResponsePersonalActionBtnDanger" title="Xóa">
							<FiTrash2 />
						</button>
					</div>
				</section>

				{/* RESPONSE DETAIL */}
				{currentResponse && (
					<>
						<section className="surveyResponsePersonalMetadata">
							<span className="surveyResponsePersonalMetadataLabel">THÔNG TIN</span>
							<p className="surveyResponsePersonalMetadataDate">
								Gửi vào {currentResponse.completedAt}
							</p>
						</section>

						{/* ANSWERS */}
						<section className="surveyResponsePersonalAnswers">
							{currentResponse.answers.map((answer, idx) => (
								<article key={idx} className="surveyResponsePersonalAnswerCard">
									<div className="surveyResponsePersonalAnswerNumber">{String(idx + 1).padStart(2, '0')}</div>
									<div className="surveyResponsePersonalAnswerContent">
										<h3 className="surveyResponsePersonalAnswerTitle">{answer.questionTitle}</h3>
										<p className="surveyResponsePersonalAnswerType">
											{answer.questionKind === 'file_upload'
												? 'Tải tệp lên'
												: answer.questionKind === 'linear_scale'
													? 'Thang tuyến tính'
													: answer.questionKind === 'rating'
														? 'Đánh giá sao'
														: answer.questionType === 'multiple_choice'
															? 'Trắc nghiệm'
															: answer.questionType === 'checkbox'
																? 'Hộp kiểm'
																: answer.questionType === 'short_text'
																	? 'Câu trả lời ngắn'
																	: answer.questionType}
										</p>

										{answer.questionType === 'multiple_choice' && (
											<div className="surveyResponsePersonalAnswerOptions">
												{answer.values.map((val, i) => (
													<div key={i} className="surveyResponsePersonalOption">
														<div className="surveyResponsePersonalRadio surveyResponsePersonalRadioSelected" />
														<span>{val}</span>
													</div>
												))}
											</div>
										)}

										{answer.questionType === 'checkbox' && (
											<div className="surveyResponsePersonalAnswerOptions">
												{answer.values.map((val, i) => (
													<div key={i} className="surveyResponsePersonalOption">
														<div className="surveyResponsePersonalCheckbox surveyResponsePersonalCheckboxSelected" />
														<span>{val}</span>
													</div>
												))}
											</div>
										)}

										{answer.questionType === 'short_text' && (
											<div className="surveyResponsePersonalAnswerText">
												{answer.values.map((val, i) => (
													<p key={i} className="surveyResponsePersonalTextContent">"{val}"</p>
												))}
											</div>
										)}

										{answer.questionKind === 'file_upload' && answer.secureUrl && (
											<div className="surveyResponsePersonalAnswerFile">
												<div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
													<button
														type="button"
														onClick={() => setPreviewFile({ name: answer.originalFileName || 'Tệp', url: answer.secureUrl || '' })}
														className="surveyResponsePersonalFileLink"
														style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#0066cc', textDecoration: 'underline', padding: 0 }}
													>
														<FiEye size={12} /> Xem tệp: {answer.originalFileName || 'Tệp đã tải lên'}
													</button>
													
												</div>

												{answer.fileSize && (
													<span className="surveyResponsePersonalFileSize">({(answer.fileSize / 1024).toFixed(2)} KB)</span>
												)}
											</div>
										)}

										{answer.questionKind === 'linear_scale' && answer.values.length > 0 && (
											<div className="surveyResponsePersonalAnswerScale">
												<span className="surveyResponsePersonalScaleValue">
													Mức độ: <strong>{answer.values[0]}/5</strong>
												</span>
											</div>
										)}

										{answer.questionKind === 'rating' && answer.values.length > 0 && (
											<div className="surveyResponsePersonalAnswerRating">
												<span className="surveyResponsePersonalRatingValue">
													Đánh giá: 
													{Array.from({ length: 5 }).map((_, i) => (
														<span key={i} className={`surveyResponsePersonalRatingStar ${i < parseInt(answer.values[0]) ? 'filled' : ''}`}>
															★
														</span>
													))}
												</span>
											</div>
										)}
									</div>
								</article>
							))}
						</section>

						{/* RESPONDENT INFO */}
						<section className="surveyResponsePersonalRespondent">
							<div className="surveyResponsePersonalRespondentCard">
								<div className="surveyResponsePersonalRespondentAvatar">
									<FiUser size={32} />
								</div>
								<div className="surveyResponsePersonalRespondentInfo">
									<span className="surveyResponsePersonalRespondentLabel">NGƯỜI TRẢ LỜI</span>
									<h3 className="surveyResponsePersonalRespondentName">
										{currentResponse.userName || 'Ẩn danh'}
									</h3>
									{currentResponse.userTitle && (
										<p className="surveyResponsePersonalRespondentTitle">
											{currentResponse.userTitle}
											{currentResponse.userCompany && ` • ${currentResponse.userCompany}`}
										</p>
									)}
									{currentResponse.userEmail && (
										<p className="surveyResponsePersonalRespondentEmail">{currentResponse.userEmail}</p>
									)}
								</div>
							</div>
						</section>
					</>
				)}
		</main>

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
	</div>
	);
}
