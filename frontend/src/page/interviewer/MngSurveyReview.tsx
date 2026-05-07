import {  FiFilter, FiStar } from 'react-icons/fi';
import { useSearchParams, useNavigate } from 'react-router-dom';
import './MngSurveyReview.css';

type FeedbackItem = {
	id: number;
	name: string;
	email: string;
	avatar: string;
	rating: number;
	comment: string;
};

const feedbackItems: FeedbackItem[] = [
	{
		id: 1,
		name: 'Nguyễn Văn Hùng',
		email: 'hung.nv@company.com',
		avatar: 'NH',
		rating: 4,
		comment: 'Môi trường làm việc rất năng động, phù hợp với người thích thử thách và học nhanh.'
	},
	{
		id: 2,
		name: 'Trần Thị Linh',
		email: 'linh.tt@company.com',
		avatar: 'TL',
		rating: 5,
		comment: 'Mọi thứ đều tuyệt vời, quy trình rõ ràng và phản hồi từ team rất nhanh.'
	}
];

const renderStars = (rating: number) => {
	return Array.from({ length: 5 }, (_, index) => index < rating);
};

export default function MngSurveyReview() {
	const navigate = useNavigate();
	const [searchParams] = useSearchParams();
	const surveyId = searchParams.get('surveyId');

	return (
		<div className="mngSurveyReviewPage">
			<main className="mngSurveyReviewMain">
				<section className="mngSurveyReviewHeader">
					<div>
						<span className="mngSurveyReviewEyebrow">PHẢN HỒI KHẢO SÁT</span>
						<h1>Danh sách Phản hồi</h1>
						<p>{surveyId ? `Đang xem phản hồi cho khảo sát ${surveyId}` : 'Tổng hợp các phản hồi gần đây của người tham gia.'}</p>
					</div>

					<div className="mngSurveyReviewActions">
						<button type="button" className="mngSurveyReviewGhostBtn">
							<FiFilter />
							Lọc theo
						</button>
					</div>
				</section>

				<section className="mngSurveyReviewList">
					{feedbackItems.map((item) => (
						<article key={item.id} className="mngSurveyReviewCard">
							<div className="mngSurveyReviewAvatar">{item.avatar}</div>

							<div className="mngSurveyReviewPerson">
								<h3>{item.name}</h3>
								<p>{item.email}</p>
							</div>

							<div className="mngSurveyReviewRatingBlock">
								<span className="mngSurveyReviewLabel">Hài lòng chung</span>
								<div className="mngSurveyReviewStars" aria-label={`Đánh giá ${item.rating} trên 5`}>
									{renderStars(item.rating).map((filled, index) => (
										<FiStar key={index} className={filled ? 'starFilled' : 'starEmpty'} />
									))}
								</div>
							</div>

							<div className="mngSurveyReviewCommentBlock">
								<span className="mngSurveyReviewLabel">Ý kiến đóng góp</span>
								<p>“{item.comment}”</p>
							</div>

							<button type="button" className="mngSurveyReviewDetailBtn" onClick={() => navigate('/surveys')}>
								Chi tiết
							</button>
						</article>
					))}
				</section>
			</main>
		</div>
	);
}