import axios from 'axios';
import { useEffect, useState } from 'react';
import { FaQrcode } from 'react-icons/fa';
import { FiEdit3, FiEye, FiPlus, FiSearch, FiTrash2 } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import './MngSurvey.css';

type SurveyRow = {
	id: number;
	title: string;
	description: string;
	questionCount: number;
	createdAt: string;
};

export default function MngSurvey() {
	const navigate = useNavigate();
	const [surveys, setSurveys] = useState<SurveyRow[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string>('');
	const [searchTerm, setSearchTerm] = useState('');

	const getAuthToken = () => {
		return sessionStorage.getItem('token') || localStorage.getItem('token') || '';
	};

	useEffect(() => {
		loadSurveys();
	}, []);

	const loadSurveys = async () => {
		try {
			setLoading(true);
			setError('');

			const token = getAuthToken();
			if (!token) {
				setError('Bạn chưa đăng nhập hoặc phiên đăng nhập đã hết hạn.');
				setLoading(false);
				return;
			}

			const response = await axios.get('http://localhost:8080/api/surveys/my', {
				headers: { Authorization: `Bearer ${token}` }
			});

			setSurveys(response.data);
		} catch (err) {
			console.error('Error loading surveys:', err);
			setError('Không thể tải danh sách khảo sát. Vui lòng thử lại.');
		} finally {
			setLoading(false);
		}
	};

	const handleEdit = (id: number) => {
		navigate(`/create-surveys?editId=${encodeURIComponent(id)}`);
	};

	const handleDelete = async (id: number) => {
		if (!window.confirm('Bạn có chắc muốn xóa khảo sát này?')) return;

		try {
			setLoading(true);
			setError('');

			const token = getAuthToken();
			if (!token) {
				setError('Bạn chưa đăng nhập hoặc phiên đăng nhập đã hết hạn.');
				setLoading(false);
				return;
			}

			await axios.delete(`http://localhost:8080/api/surveys/${encodeURIComponent(id)}`, {
				headers: { Authorization: `Bearer ${token}` }
			});

			// Remove from local state
			setSurveys(prev => prev.filter(s => s.id !== id));
		} catch (err) {
			console.error('Delete survey error', err);
			setError('Xóa khảo sát thất bại. Vui lòng thử lại.');
		} finally {
			setLoading(false);
		}
	};

	const filteredSurveys = surveys.filter(survey =>
		survey.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
		survey.description.toLowerCase().includes(searchTerm.toLowerCase())
	);

	return (
		<div className="mngSurveyPage">
			<main className="mngSurveyMain">
				<section className="mngSurveyHero">
					<div>
						<span className="mngSurveyEyebrow">QUẢN LÝ KHẢO SÁT</span>
						<h1>Danh sách khảo sát</h1>
					</div>

					<div className="mngSurveyHeroActions">
						<button type="button" className="mngSurveyPrimaryBtn" onClick={() => navigate('/create-surveys')}>
							<FiPlus />
							Tạo khảo sát mới
						</button>
					</div>
				</section>

				{error && <div style={{ color: 'red', padding: '10px', margin: '0 20px' }}>{error}</div>}

				<section className="mngSurveyPanel">
					<div className="mngSurveyToolbar">
						<label className="mngSurveySearch">
							<FiSearch />
							<input
								type="search"
								placeholder="Tìm theo tiêu đề, danh mục..."
								aria-label="Tìm khảo sát"
								value={searchTerm}
								onChange={(e) => setSearchTerm(e.target.value)}
							/>
						</label>

						<div className="mngSurveyToolbarMeta">
							<span>{filteredSurveys.length} khảo sát</span>
						</div>
					</div>

					<div className="mngSurveyTableWrap">
						{loading ? (
							<div style={{ textAlign: 'center', padding: '20px' }}>Đang tải...</div>
						) : filteredSurveys.length === 0 ? (
							<div style={{ textAlign: 'center', padding: '20px' }}>
								{surveys.length === 0 ? 'Bạn chưa tạo khảo sát nào.' : 'Không tìm thấy khảo sát phù hợp.'}
							</div>
						) : (
							<table className="mngSurveyTable">
								<thead>
									<tr>
										<th>ID</th>
										<th>TIÊU ĐỀ &amp; MÔ TẢ</th>
										<th>SỐ CÂU HỎI</th>
										<th>NGÀY TẠO</th>
										<th>THAO TÁC</th>
									</tr>
								</thead>
								<tbody>
									{filteredSurveys.map((survey, index) => (
										<tr key={survey.id}>
											<td className="mngSurveyId">#{index + 1}</td>
											<td>
												<div className="mngSurveyTitleGroup">
													<strong style={{ cursor: 'pointer' }} onClick={() => navigate(`/create-surveys?editId=${encodeURIComponent(survey.id)}`)}>{survey.title}</strong>
													<span style={{ cursor: 'pointer' }} onClick={() => navigate(`/create-surveys?editId=${encodeURIComponent(survey.id)}`)}>{survey.description}</span>
												</div>
											</td>
											<td>{survey.questionCount}</td>
											<td className="mngSurveyDate">{survey.createdAt}</td>
											<td>
												<div className="mngSurveyActions">
													<button
														type="button"
														className="iconBtn"
														aria-label={`Mã QR của ${survey.title}`}
														title="Mã QR"
													>
														<FaQrcode />
													</button>
													<button
														type="button"
														className="iconBtn"
														aria-label={`Chỉnh sửa ${survey.title}`}
														title="Chỉnh sửa"
														onClick={() => handleEdit(survey.id)}
													>
														<FiEdit3 />
													</button>
													<button
														type="button"
														className="iconBtn"
														aria-label={`Xóa ${survey.title}`}
														title="Xóa"
														onClick={() => handleDelete(survey.id)}
													>
														<FiTrash2 />
													</button>
													<button
														type="button"
														className="viewBtn"
														aria-label={`Xem phản hồi của ${survey.title}`}
														onClick={() =>
															navigate(
																`/manage-surveys/review?surveyId=${encodeURIComponent(survey.id)}`
															)
														}
													>
														<FiEye />
														<span>Xem phản hồi</span>
													</button>
												</div>
											</td>
										</tr>
									))}
								</tbody>
							</table>
						)}
					</div>
				</section>
			</main>
		</div>
	);
}
