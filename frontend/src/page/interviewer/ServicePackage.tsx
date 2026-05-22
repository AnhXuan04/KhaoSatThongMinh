import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import "./ServicePackage.css";

interface SubscriptionResponse {
    status: string;
    billingCycle: string;
    planName: string;
    featuresJson?: string;
    startedAt: string;
    expiresAt: string;
    premium: boolean;
    planId: number;
}

interface ServicePackageType {
	status: string;
	paymentType: string;
	name: string;
	planId: number;
	billingCycle: string;
	startDate: string;
	endDate: string;
	usedSurveys: number;
	surveyLimit: number;
	features: string[];
}

interface PaymentHistoryItem {
	txnRef: string;
	planName: string;
	billingCycle: string;
	amount: string | number;
	status: string;
	paymentDate: string;
}

const getAuthToken = () => sessionStorage.getItem("token") || localStorage.getItem("token") || "";

const convertStatus = (status: string) => {
	switch (status) {
		case "ACTIVE":
			return "ĐANG HOẠT ĐỘNG";
		case "CANCELED":
			return "ĐÃ HỦY";
		case "EXPIRED":
			return "HẾT HẠN";
		default:
			return "KHÔNG CÓ GÓI";
	}
};

const convertBilling = (cycle: string) => {
	switch (cycle) {
		case "MONTHLY":
			return "Thanh toán hàng tháng";
		case "YEARLY":
			return "Thanh toán hàng năm";
		default:
			return "Không xác định";
	}
};

const formatDate = (dateStr: string) => (dateStr ? new Date(dateStr).toLocaleDateString("vi-VN") : "");

const formatAmount = (amount: string | number) => {
	const numericAmount = typeof amount === "string" ? Number(amount) : amount;
	if (!Number.isFinite(numericAmount)) {
		return "0 ₫";
	}

	return new Intl.NumberFormat("vi-VN", {
		style: "currency",
		currency: "VND",
		maximumFractionDigits: 0,
	}).format(numericAmount);
};

const convertPaymentStatus = (status: string) => {
	switch (status) {
		case "SUCCESS":
			return "Thành công";
		case "FAILED":
			return "Thất bại";
		default:
			return "Đang xử lý";
	}
};

const mapSubscriptionToUI = (data: SubscriptionResponse): ServicePackageType => {
	let features = ["Tính năng cơ bản"];

	if (data.featuresJson) {
		try {
			const parsed = JSON.parse(data.featuresJson);
			if (Array.isArray(parsed) && parsed.length > 0) {
				features = parsed.map((item) => String(item));
			}
		} catch {
			features = ["Tính năng cơ bản"];
		}
	}

	return {
		status: convertStatus(data.status),
		paymentType: convertBilling(data.billingCycle),
		name: data.planName || "Gói cơ bản",
		planId: data.planId,
		billingCycle: data.billingCycle,
		startDate: formatDate(data.startedAt),
		endDate: formatDate(data.expiresAt),
		usedSurveys: 1000,
		surveyLimit: 1000,
		features,
	};
};

const ServicePackage: React.FC = () => {
	const [currentPackage, setCurrentPackage] = useState<ServicePackageType | null>(null);
	const [loadError, setLoadError] = useState<string | null>(null);
	const [paymentHistory, setPaymentHistory] = useState<PaymentHistoryItem[]>([]);
	const [historyLoading, setHistoryLoading] = useState(false);
	const [historyError, setHistoryError] = useState<string | null>(null);
	const [renewModalOpen, setRenewModalOpen] = useState(false);
	const [renewBillingCycle, setRenewBillingCycle] = useState<'MONTHLY' | 'YEARLY'>('MONTHLY');
	const [renewLoading, setRenewLoading] = useState(false);
	const [renewError, setRenewError] = useState<string | null>(null);
	const [renewSuccess, setRenewSuccess] = useState<string | null>(null);

	useEffect(() => {
		const paymentSuccess = sessionStorage.getItem('premiumPaymentSuccess');
		const paymentReturnUrl = sessionStorage.getItem('premiumPaymentReturnUrl');
		if (paymentSuccess && paymentReturnUrl === '/service-package') {
			setRenewSuccess('Gia hạn gói dịch vụ thành công.');
		}
		sessionStorage.removeItem('premiumPaymentSuccess');
		sessionStorage.removeItem('premiumPaymentReturnUrl');
	}, []);

	const loadPaymentHistory = useCallback(async () => {
		try {
			setHistoryLoading(true);
			setHistoryError(null);

			const token = getAuthToken();
			if (!token) {
				throw new Error("Bạn chưa đăng nhập hoặc phiên đăng nhập đã hết hạn.");
			}

			const res = await axios.get("http://localhost:8080/api/payments/vnpay/history", {
				headers: { Authorization: `Bearer ${token}` },
			});

			setPaymentHistory(Array.isArray(res.data) ? res.data : []);
		} catch (err) {
			console.error(err);
			setHistoryError(err instanceof Error ? err.message : "Không thể tải lịch sử thanh toán.");
		} finally {
			setHistoryLoading(false);
		}
	}, []);

	const loadSubscription = useCallback(async () => {
		try {
			setLoadError(null);

			const token = getAuthToken();
			if (!token) {
				throw new Error("Bạn chưa đăng nhập hoặc phiên đăng nhập đã hết hạn.");
			}

			const res = await axios.get("http://localhost:8080/api/subscription/current", {
				headers: { Authorization: `Bearer ${token}` },
			});

			setCurrentPackage(mapSubscriptionToUI(res.data));
			loadPaymentHistory();
		} catch (err) {
			console.error(err);
			setLoadError(err instanceof Error ? err.message : "Không thể tải thông tin gói cước.");
		}
	}, [loadPaymentHistory]);

	useEffect(() => {
		void loadSubscription();
	}, [loadSubscription]);

	const handleCancel = async () => {
		try {
			const token = getAuthToken();
			if (!token) {
				throw new Error("Bạn chưa đăng nhập hoặc phiên đăng nhập đã hết hạn.");
			}

			await axios.post(
				"http://localhost:8080/api/subscription/cancel",
				{},
				{
					headers: { Authorization: `Bearer ${token}` },
				}
			);

			alert("Đã huỷ gói!");
			void loadSubscription();
		} catch (err) {
			console.error(err);
			alert(err instanceof Error ? err.message : "Không thể huỷ gói dịch vụ.");
		}
	};

	const openRenewModal = () => {
		if (currentPackage) {
			setRenewBillingCycle((currentPackage.billingCycle as 'MONTHLY' | 'YEARLY') || 'MONTHLY');
		}
		setRenewError(null);
		setRenewModalOpen(true);
	};

	const closeRenewModal = () => {
		if (!renewLoading) {
			setRenewModalOpen(false);
			setRenewError(null);
		}
	};

	const handleRenew = async () => {
		if (!currentPackage) {
			return;
		}

		try {
			setRenewLoading(true);
			setRenewError(null);

			const token = getAuthToken();
			if (!token) {
				throw new Error('Bạn chưa đăng nhập hoặc phiên đăng nhập đã hết hạn.');
			}

			sessionStorage.setItem('premiumPaymentReturnUrl', '/service-package');
			sessionStorage.removeItem('premiumPaymentSuccess');

			const res = await axios.post(
				'http://localhost:8080/api/payments/vnpay/create',
				{
					planId: currentPackage.planId,
					billingCycle: renewBillingCycle,
				},
				{
					headers: { Authorization: `Bearer ${token}` },
				}
			);

			const paymentUrl = res.data?.paymentUrl;
			if (!paymentUrl) {
				throw new Error('Không nhận được URL thanh toán.');
			}

			window.location.href = paymentUrl;
		} catch (err) {
			console.error(err);
			setRenewError(err instanceof Error ? err.message : 'Không thể khởi tạo gia hạn.');
		} finally {
			setRenewLoading(false);
		}
	};

	if (loadError) return <div className="container">{loadError}</div>;

	if (!currentPackage) return <div>Loading...</div>;

	const percent = Math.min((currentPackage.usedSurveys / currentPackage.surveyLimit) * 100, 100);

	return (
		<div className="container">
			<h2 className="title">Gói cước hiện tại</h2>
			{renewSuccess && <div className="success-banner">{renewSuccess}</div>}

			<div className="flex">
				<div className="card card-main">
					<div className="row">
						<span className="status-badge">{currentPackage.status}</span>
						<span className="sub-text">{currentPackage.paymentType}</span>
					</div>

					<div className="package-name">{currentPackage.name}</div>

					<div className="row">
						<div>
							<div className="sub-text">NGÀY BẮT ĐẦU</div>
							<div>{currentPackage.startDate}</div>
						</div>
						<div>
							<div className="sub-text">NGÀY HẾT HẠN</div>
							<div>{currentPackage.endDate}</div>
						</div>
					</div>

					<div className="btn-group">
						<button className="btn-primary" onClick={openRenewModal}>Gia hạn gói</button>
						<button className="btn-danger" onClick={handleCancel}>
							Huỷ gói dịch vụ
						</button>
					</div>
				</div>

				<div className="card card-side">
					<div className="sub-text">HẠN MỨC KHẢO SÁT</div>

					<div>
						{currentPackage.usedSurveys} / {currentPackage.surveyLimit}
					</div>

					<div className="progress-bar">
						<div className="progress-fill" style={{ width: `${percent}%` }}></div>
					</div>

					<ul>
						{currentPackage.features.map((feature, index) => (
							<li key={`${feature}-${index}`}>{feature}</li>
						))}
					</ul>
				</div>
			</div>

			<div className="card">
				<h3>Lịch sử thanh toán</h3>
				{historyError && <div className="sub-text">{historyError}</div>}
				<table className="table">
					<thead>
						<tr>
							<th>MÃ GIAO DỊCH</th>
							<th>GÓI</th>
							<th>NGÀY</th>
							<th className="text-right">SỐ TIỀN</th>
							<th>TRẠNG THÁI</th>
						</tr>
					</thead>
					<tbody>
						{historyLoading && (
							<tr>
								<td colSpan={5}>Đang tải lịch sử thanh toán...</td>
							</tr>
						)}
						{!historyLoading && paymentHistory.length === 0 && (
							<tr>
								<td colSpan={5}>Chưa có giao dịch nào.</td>
							</tr>
						)}
						{!historyLoading && paymentHistory.map((item) => (
							<tr key={item.txnRef}>
								<td>{item.txnRef}</td>
								<td>{item.planName}</td>
								<td>{formatDate(item.paymentDate)}</td>
								<td className="text-right">{formatAmount(item.amount)}</td>
								<td>{convertPaymentStatus(item.status)}</td>
							</tr>
						))}
					</tbody>
				</table>
			</div>

			{renewModalOpen && currentPackage && (
				<div className="modal-overlay" role="presentation" onClick={closeRenewModal}>
					<div className="renew-modal" role="dialog" aria-modal="true" aria-labelledby="renew-title" onClick={(event) => event.stopPropagation()}>
						<div className="renew-modal-header">
							<div>
								<h3 id="renew-title">Gia hạn gói</h3>
								<p>Chọn chu kỳ thanh toán cho {currentPackage.name}.</p>
							</div>
							<button type="button" className="renew-modal-close" onClick={closeRenewModal}>
								×
							</button>
						</div>

						{renewError && <div className="renew-error">{renewError}</div>}

						<div className="renew-plan-grid">
							<button
								type="button"
								className={`planOptionCard ${renewBillingCycle === 'MONTHLY' ? 'active' : ''}`}
								onClick={() => setRenewBillingCycle('MONTHLY')}
							>
								<span className="planOptionLabel">Gói tháng</span>
								<strong>Thanh toán hàng tháng</strong>
								<small>Gia hạn trong 1 tháng</small>
							</button>
							<button
								type="button"
								className={`planOptionCard ${renewBillingCycle === 'YEARLY' ? 'active' : ''}`}
								onClick={() => setRenewBillingCycle('YEARLY')}
							>
								<span className="planOptionLabel">Gói năm</span>
								<strong>Thanh toán hàng năm</strong>
								<small>Gia hạn trong 12 tháng</small>
							</button>
						</div>

						<div className="renew-modal-footer">
							<button type="button" className="btn-secondary" onClick={closeRenewModal} disabled={renewLoading}>
								Hủy
							</button>
							<button type="button" className="btn-primary" onClick={handleRenew} disabled={renewLoading}>
								{renewLoading ? 'Đang chuyển đến VNPay...' : 'Thanh toán & Gia hạn'}
							</button>
						</div>
					</div>
				</div>
			)}

			<div className="footer">Cập nhật lần cuối: Hôm nay</div>
		</div>
	);
};

export default ServicePackage;
