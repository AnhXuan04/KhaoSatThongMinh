import { FaQrcode } from 'react-icons/fa';
import { FiEdit3, FiEye, FiPlus, FiSearch, FiTrash2 } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import './MngSurvey.css';

type SurveyStatus = 'HOẠT ĐỘNG' | 'BẢN NHÁP';

type SurveyRow = {
	id: string;
	title: string;
	category: string;
	status: SurveyStatus;
	createdAt: string;
};

const surveyRows: SurveyRow[] = [
	{
		id: '#001',
		title: 'Khảo sát sự hài lòng nhân viên 2024',
		category: 'Nhân sự & Văn hóa',
		status: 'HOẠT ĐỘNG',
		createdAt: '15 Th05, 2024'
	},
	{
		id: '#002',
		title: 'Đánh giá sản phẩm - Q2',
		category: 'Phát triển Sản phẩm',
		status: 'BẢN NHÁP',
		createdAt: '12 Th05, 2024'
	},
	{
		id: '#003',
		title: 'Nghiên cứu thị trường AI',
		category: 'Chiến lược & Công nghệ',
		status: 'HOẠT ĐỘNG',
		createdAt: '08 Th05, 2024'
	}
];

const statusLabelClass: Record<SurveyStatus, string> = {
	'HOẠT ĐỘNG': 'active',
	'BẢN NHÁP': 'draft'
};

export default function MngSurvey() {
	const navigate = useNavigate();

	return (
		<div className="mngSurveyPage">
			<main className="mngSurveyMain">
				<section className="mngSurveyHero">
					<div>
						<span className="mngSurveyEyebrow">QUẢN LÝ KHẢO SÁT</span>
						<h1>Danh sách khảo sát</h1>
					</div>

					<div className="mngSurveyHeroActions">
						<button type="button" className="mngSurveyPrimaryBtn">
							<FiPlus />
							Tạo khảo sát mới
						</button>
					</div>
				</section>

				<section className="mngSurveyPanel">
					<div className="mngSurveyToolbar">
						<label className="mngSurveySearch">
							<FiSearch />
							<input type="search" placeholder="Tìm theo tiêu đề, danh mục..." aria-label="Tìm khảo sát" />
						</label>

						<div className="mngSurveyToolbarMeta">
							<span>3 khảo sát</span>
						</div>
					</div>

					<div className="mngSurveyTableWrap">
						<table className="mngSurveyTable">
							<thead>
								<tr>
									<th>ID</th>
									<th>TIÊU ĐỀ &amp; DANH MỤC</th>
									<th>TRẠNG THÁI</th>
									<th>NGÀY TẠO</th>
									<th>THAO TÁC</th>
								</tr>
							</thead>
							<tbody>
								{surveyRows.map((survey) => (
									<tr key={survey.id}>
										<td className="mngSurveyId">{survey.id}</td>
										<td>
											<div className="mngSurveyTitleGroup">
												<strong>{survey.title}</strong>
												<span>{survey.category}</span>
											</div>
										</td>
										<td>
											<span className={`mngSurveyStatus ${statusLabelClass[survey.status]}`}>
												{survey.status}
											</span>
										</td>
										<td className="mngSurveyDate">{survey.createdAt}</td>
										<td>
											<div className="mngSurveyActions">
												<button type="button" className="iconBtn" aria-label={`Mã QR của ${survey.title}`} title="Mã QR">
													<FaQrcode />
												</button>
												<button type="button" className="iconBtn" aria-label={`Chỉnh sửa ${survey.title}`} title="Chỉnh sửa">
													<FiEdit3 />
												</button>
												<button type="button" className="iconBtn" aria-label={`Xóa ${survey.title}`} title="Xóa">
													<FiTrash2 />
												</button>
												<button
													type="button"
													className="viewBtn"
													aria-label={`Xem phản hồi của ${survey.title}`}
													onClick={() => navigate(`/manage-surveys/review?surveyId=${encodeURIComponent(survey.id)}`)}
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
					</div>
				</section>
			</main>
		</div>
	);
}
