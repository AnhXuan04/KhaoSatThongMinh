import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { FiClock, FiCheckCircle, FiAlertTriangle, FiFileText } from 'react-icons/fi';
import './SurveyResponseAnalytics.css';

type QualityResult = {
	responseId: number;
	surveyId: number;
	surveyTitle: string;
	respondentEmail: string;
	qualityScore: number;
	superficial: boolean;
	rewardEligible: boolean;
	recommendation: string;
	coinStatus: string;
	submittedAt: string;
};

type QualityAnalytics = {
	totalResponses: number;
	totalAnalyzedResponses: number;
	seriousResponses: number;
	superficialResponses: number;
	qualityResponses: number;
	rewardEligibleResponses: number;
	rewardEligibleRate: number;
	pendingCoinTransactions: number;
	averageQualityScore: number;
	recentResults: QualityResult[];
};

type ContentReport = {
	surveyId: number;
	surveyTitle: string;
	totalResponses: number;
	eligibleResponses: number;
	excludedResponses: number;
	generatedAt: string;
	executiveSummary: string;
	respondentSummary?: string;
	answerSummary?: string;
	recommendation: string;
	highlights: string[];
	plainText: string;
};

const defaultAnalytics: QualityAnalytics = {
	totalResponses: 0,
	totalAnalyzedResponses: 0,
	seriousResponses: 0,
	superficialResponses: 0,
	qualityResponses: 0,
	rewardEligibleResponses: 0,
	rewardEligibleRate: 0,
	pendingCoinTransactions: 0,
	averageQualityScore: 0,
	recentResults: [],
};

export default function SurveyResponseAnalytics() {
	const navigate = useNavigate();
	const [searchParams] = useSearchParams();
	const surveyId = searchParams.get('surveyId');
	const [analytics, setAnalytics] = useState<QualityAnalytics>(defaultAnalytics);
	const [contentReport, setContentReport] = useState<ContentReport | null>(null);
	const [loading, setLoading] = useState(true);
	const [refreshingReport, setRefreshingReport] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [updatedAt, setUpdatedAt] = useState<Date | null>(null);

	const getAuthToken = (): string | null => {
		return sessionStorage.getItem('token') || localStorage.getItem('token');
	};

	useEffect(() => {
		const fetchAnalytics = async () => {
			const token = getAuthToken();
			if (!token) {
				setError('Bạn cần đăng nhập');
				setLoading(false);
				return;
			}

			try {
				const analyticsPath = surveyId
					? `/api/surveys/${encodeURIComponent(surveyId)}/analytics/quality`
					: '/api/surveys/analytics/quality';
				const response = await axios.get((analyticsPath), {
					headers: { Authorization: `Bearer ${token}` },
				});

				const data = response.data || {};
				setAnalytics({
					...defaultAnalytics,
					...data,
					recentResults: Array.isArray(data.recentResults) ? data.recentResults : [],
				});
				if (surveyId) {
					try {
						const reportResponse = await axios.get((`/api/surveys/${encodeURIComponent(surveyId)}/content-report`), {
							headers: { Authorization: `Bearer ${token}` },
						});
						setContentReport(reportResponse.data || null);
					} catch (reportErr) {
						console.error('Lỗi khi tải báo cáo nội dung khảo sát:', reportErr);
						setContentReport(null);
					}
				} else {
					setContentReport(null);
				}
				setUpdatedAt(new Date());
				setError(null);
			} catch (err) {
				console.error('Lỗi khi tải phân tích AI:', err);
				setError('Lỗi khi tải dữ liệu phân tích AI');
			} finally {
				setLoading(false);
			}
		};

		fetchAnalytics();
	}, [surveyId]);

	const analyzedResponses = analytics.totalAnalyzedResponses;
	const seriousResponses = analytics.seriousResponses || analytics.qualityResponses;
	const seriousRate = analyzedResponses ? Math.round((seriousResponses * 100) / analyzedResponses) : 0;
	const superficialRate = analyzedResponses ? Math.round((analytics.superficialResponses * 100) / analyzedResponses) : 0;
	const currentMonth = new Intl.DateTimeFormat('vi-VN', { month: '2-digit', year: 'numeric' }).format(new Date());
	const updatedText = updatedAt
		? updatedAt.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
		: '--:--';

	const summary = useMemo(() => [
		{ title: 'Tổng phản hồi', value: analytics.totalResponses, icon: <FiFileText /> },
		{ title: 'Nghiêm túc', value: seriousResponses, icon: <FiCheckCircle /> },
		{ title: 'Hời hợt', value: analytics.superficialResponses, icon: <FiAlertTriangle /> },
		{ title: 'Đủ điều kiện cộng Coin', value: `${analytics.rewardEligibleRate}%`, icon: <FiClock /> },
	], [analytics, seriousResponses]);

	const downloadContentReport = () => {
		if (!contentReport?.plainText) return;
		const blob = new Blob([contentReport.plainText], { type: 'text/plain;charset=utf-8' });
		const url = URL.createObjectURL(blob);
		const link = document.createElement('a');
		link.href = url;
		link.download = `bao-cao-khao-sat-${contentReport.surveyId}.txt`;
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
		URL.revokeObjectURL(url);
	};

	const reportEligibleResponses = contentReport?.eligibleResponses ?? contentReport?.totalResponses ?? 0;
	const reportExcludedResponses = contentReport?.excludedResponses ?? 0;

	const refreshContentReport = async () => {
		const token = getAuthToken();
		if (!surveyId || !token) return;

		setRefreshingReport(true);
		try {
			const response = await axios.post((`/api/surveys/${encodeURIComponent(surveyId)}/content-report/refresh`), null, {
				headers: { Authorization: `Bearer ${token}` },
			});
			setContentReport(response.data || null);
			setUpdatedAt(new Date());
		} catch (err) {
			console.error('Lỗi khi cập nhật báo cáo nội dung khảo sát:', err);
			const message = axios.isAxiosError(err)
				? (err.response?.data?.message || err.response?.data?.detail || err.message)
				: 'Lỗi khi cập nhật báo cáo khảo sát';
			setError(`Lỗi khi cập nhật báo cáo khảo sát: ${message}`);
		} finally {
			setRefreshingReport(false);
		}
	};

	if (loading) {
		return <div className="sra-state">Đang tải dữ liệu phân tích AI...</div>;
	}

	if (error) {
		return <div className="sra-state sra-state-error">{error}</div>;
	}

	return (
		<div className="sra-root">
			<h2 className="sra-title">Tổng hợp AI</h2>
			<div className="sra-updated">Cập nhật: {updatedText}</div>

			<div className="sra-summary">
				{summary.map((s) => (
					<div key={s.title} className="sra-card">
						<div className="sra-card-left">
							<div className="sra-card-value">{s.value}</div>
							<div className="sra-card-title">{s.title}</div>
						</div>
						<div className="sra-card-icon">{s.icon}</div>
					</div>
				))}
			</div>

			<div className="sra-analytics">
				<div className="sra-analytics-left">
					<div className="sra-analytics-header">Phân tích Tỉ lệ Chất lượng</div>
					<div className="sra-analytics-sub">So sánh trực quan giữa phản hồi nghiêm túc và hời hợt giúp bạn tối ưu hóa ngân sách trả thưởng.</div>

					<div className="sra-progress-month">THÁNG {currentMonth}<div className="sra-progress-badge">{seriousRate >= 70 ? 'High Quality' : 'Needs Review'}</div></div>
					<div className="sra-progress-track">
						<div className="sra-progress-fill" style={{ width: `${seriousRate}%` }} />
					</div>

					<div className="sra-percent-row">
						<div className="sra-percent-card">
							<div className="sra-percent-value">{seriousRate}%</div>
							<div className="sra-percent-label">Nghiêm túc</div>
						</div>
						<div className="sra-percent-card">
							<div className="sra-percent-value">{superficialRate}%</div>
							<div className="sra-percent-label">Hời hợt</div>
						</div>
					</div>
				</div>

				<div className="sra-report-card">
					<div className="sra-report-header">
						<div>
							<div className="sra-report-title">Báo cáo Đánh giá Chi tiết</div>
							<div className="sra-report-meta">
								{contentReport
									? `${reportEligibleResponses}/${contentReport.totalResponses} phản hồi đủ điều kiện • ${contentReport.generatedAt}`
									: 'Bấm cập nhật để tạo báo cáo từ số liệu phản hồi hiện tại'}
							</div>
						</div>
						<div className="sra-report-actions">
							{surveyId && (
								<button type="button" className="sra-report-download" onClick={refreshContentReport} disabled={refreshingReport}>
									{refreshingReport ? 'Đang cập nhật...' : 'Cập nhật báo cáo'}
								</button>
							)}
							{contentReport?.plainText && (
							<button type="button" className="sra-report-download" onClick={downloadContentReport}>
								Tải TXT
							</button>
							)}
						</div>
					</div>
					{contentReport ? (
						<div className="sra-report-body">
							<div className="sra-report-quality">
								<span>Tổng phản hồi: <strong>{contentReport.totalResponses}</strong></span>
								<span>Đủ điều kiện phân tích: <strong>{reportEligibleResponses}</strong></span>
								<span>Không đủ điều kiện: <strong>{reportExcludedResponses}</strong></span>
							</div>
							<p>{contentReport.executiveSummary}</p>
							{contentReport.respondentSummary && <p>{contentReport.respondentSummary}</p>}
							{contentReport.answerSummary && <p>{contentReport.answerSummary}</p>}
							{contentReport.highlights?.length > 0 && (
								<ul className="sra-report-highlights">
									{contentReport.highlights.slice(0, 5).map((item, index) => (
										<li key={index}>{item}</li>
									))}
								</ul>
							)}
							<p className="sra-report-recommendation">{contentReport.recommendation}</p>
						</div>
					) : (
						<div className="sra-empty">Chưa có báo cáo nội dung đã lưu cho khảo sát này.</div>
					)}
				</div>

				<div className="sra-analytics-right">
					<div className="sra-list-header">
						Phản hồi mới được phân tích
						<a href="/dashboard" className="sra-view-all" onClick={(event) => {
							event.preventDefault();
							navigate('/dashboard');
						}}>Xem tất cả</a>
					</div>
					{analytics.recentResults.length > 0 ? (
						<ul className="sra-list">
							{analytics.recentResults.map((item) => (
								<li key={item.responseId}>
									<button
										type="button"
										className="sra-list-item"
										onClick={() => navigate(`/manage-surveys/review?surveyId=${item.surveyId}&tab=personal&responseId=${item.responseId}`)}
									>
										<div className="sra-list-left">
											<div className="sra-list-icon"><FiFileText /></div>
											<div>
												<div className="sra-list-title">{item.surveyTitle}</div>
												<div className="sra-list-meta">{item.respondentEmail} • {item.submittedAt}</div>
											</div>
										</div>
										<div className={`sra-list-score ${item.superficial ? 'is-bad' : 'is-good'}`}>{item.qualityScore}%</div>
									</button>
								</li>
							))}
						</ul>
					) : (
						<div className="sra-empty">Chưa có phản hồi nào được AI phân tích.</div>
					)}
				</div>
			</div>
		</div>
	);
}

