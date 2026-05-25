import { apiUrl } from '../../config/api';
import { useEffect, useState } from 'react';
import {
	FiBarChart2,
	FiClipboard,
	FiEdit3,
	FiFolder,
	FiGrid,
	FiPlus,
	FiShield,
	FiTrash2,
	FiUser,
	FiUsers
} from 'react-icons/fi';
import { useLocation, useNavigate } from 'react-router-dom';
import './MngSurveyField.css';

const sideMenus = [
	{ key: 'dashboard', label: 'Tổng quan', icon: FiGrid, active: false, path: '/dashboard-admin' },
	{ key: 'users', label: 'Quản lý Người dùng', icon: FiUsers, active: false, path: '/dashboard-admin/users' },
	{ key: 'categories', label: 'Quản lý Lĩnh vực', icon: FiFolder, active: true, path: '/dashboard-admin/categories' },
	{ key: 'quality', label: 'Phân tích Chất lượng', icon: FiBarChart2, active: false, path: '/dashboard-admin/quality' }
];

type SurveyFieldData = {
	id: number;
	name: string;
	description: string;
};


export default function MngSurveyField() {
	const navigate = useNavigate();
	const location = useLocation();
	const [fullName, setFullName] = useState('');
	const [adminEmail, setAdminEmail] = useState('');
	const [surveyFields, setSurveyFields] = useState<SurveyFieldData[]>([]);
	const [isAddFieldOpen, setIsAddFieldOpen] = useState(false);
	const [isEditFieldOpen, setIsEditFieldOpen] = useState(false);
	const [editingField, setEditingField] = useState<SurveyFieldData | null>(null);
	const [newFieldName, setNewFieldName] = useState('');
	const [newFieldDescription, setNewFieldDescription] = useState('');
	const [editFieldName, setEditFieldName] = useState('');
	const [editFieldDescription, setEditFieldDescription] = useState('');
	const [isLoading, setIsLoading] = useState(false);
	const [errorMsg, setErrorMsg] = useState('');

	const handleLogout = () => {
		sessionStorage.removeItem('token');
		sessionStorage.removeItem('userEmail');
		navigate('/login');
	};

	const openAddFieldPopup = () => {
		setNewFieldName('');
		setNewFieldDescription('');
		setErrorMsg('');
		setIsAddFieldOpen(true);
	};

	const closeAddFieldPopup = () => {
		setIsAddFieldOpen(false);
	};

	const openEditFieldPopup = (field: SurveyFieldData) => {
		setEditingField(field);
		setEditFieldName(field.name);
		setEditFieldDescription(field.description);
		setErrorMsg('');
		setIsEditFieldOpen(true);
	};

	const closeEditFieldPopup = () => {
		setIsEditFieldOpen(false);
		setEditingField(null);
	};

	const handleAddFieldSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		if (!newFieldName.trim()) {
			setErrorMsg('Vui lòng nhập tên lĩnh vực');
			return;
		}

		setIsLoading(true);
		setErrorMsg('');
		const token = sessionStorage.getItem('token');

		try {
			const response = await fetch(apiUrl('/api/admin/survey-fields'), {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${token}`
				},
				body: JSON.stringify({
					name: newFieldName.trim(),
					description: newFieldDescription.trim()
				})
			});

			if (!response.ok) {
				throw new Error('Không thể tạo lĩnh vực');
			}

			await fetchSurveyFields();
			closeAddFieldPopup();
		} catch (error) {
			setErrorMsg(error instanceof Error ? error.message : 'Lỗi không xác định');
		} finally {
			setIsLoading(false);
		}
	};

	const handleEditFieldSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		if (!editingField) {
			return;
		}

		if (!editFieldName.trim()) {
			setErrorMsg('Vui lòng nhập tên lĩnh vực');
			return;
		}

		setIsLoading(true);
		setErrorMsg('');
		const token = sessionStorage.getItem('token');

		try {
			const response = await fetch(apiUrl(`/api/admin/survey-fields/${editingField.id}`), {
				method: 'PUT',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${token}`
				},
				body: JSON.stringify({
					name: editFieldName.trim(),
					description: editFieldDescription.trim()
				})
			});

			if (!response.ok) {
				throw new Error('Không thể cập nhật lĩnh vực');
			}

			await fetchSurveyFields();
			closeEditFieldPopup();
	} catch (error) {
			setErrorMsg(error instanceof Error ? error.message : 'Lỗi không xác định');
		} finally {
			setIsLoading(false);
		}
	};

	const fetchSurveyFields = async () => {
		const token = sessionStorage.getItem('token');
		try {
			const response = await fetch(apiUrl('/api/admin/survey-fields'), {
				headers: {
					Authorization: `Bearer ${token}`
				}
			});

			if (!response.ok) {
				return;
			}

			const data = await response.json();
			setSurveyFields(Array.isArray(data) ? data : []);
		} catch (error) {
			console.error('Không thể tải danh sách lĩnh vực:', error);
		}
	};

	const handleDeleteField = async (fieldId: number, fieldName: string) => {
		if (!window.confirm(`Bạn có chắc chắn muốn xóa lĩnh vực "${fieldName}"?`)) {
			return;
		}

		const token = sessionStorage.getItem('token');
		try {
			const response = await fetch(apiUrl(`/api/admin/survey-fields/${fieldId}`), {
				method: 'DELETE',
				headers: {
					Authorization: `Bearer ${token}`
				}
			});

			if (!response.ok) {
				throw new Error('Không thể xóa lĩnh vực');
			}

			await fetchSurveyFields();
		} catch (error) {
			alert(error instanceof Error ? error.message : 'Lỗi không xác định');
		}
	};

	useEffect(() => {
		const searchParams = new URLSearchParams(location.search);
		if (searchParams.get('openAddField') !== '1') {
			return;
		}

		setNewFieldName('');
		setNewFieldDescription('');
		setErrorMsg('');
		setIsAddFieldOpen(true);

		searchParams.delete('openAddField');
		navigate(
			{
				pathname: location.pathname,
				search: searchParams.toString() ? `?${searchParams.toString()}` : ''
			},
			{ replace: true }
		);
	}, [location.pathname, location.search, navigate]);

	useEffect(() => {
		const token = sessionStorage.getItem('token');
		const userEmail = sessionStorage.getItem('userEmail');

		if (!token || !userEmail) {
			navigate('/login');
			return;
		}

		const fetchProfile = async () => {
			try {
				const response = await fetch(apiUrl('/api/user/profile'), {
					headers: {
						Authorization: `Bearer ${token}`
					}
				});

				if (!response.ok) {
					return;
				}

				const data = await response.json();
				setFullName(data.fullName || userEmail);
				setAdminEmail(data.email || userEmail);
			} catch (error) {
				console.error('Không thể tải dữ liệu quản lý danh mục:', error);
			}
		};

		fetchProfile();
		fetchSurveyFields();
	}, [navigate]);

	return (
		<div className="mngFieldPage">
			{isEditFieldOpen && editingField && (
				<div className="mngFieldModalOverlay" onClick={closeEditFieldPopup} role="presentation">
					<div
						className="mngFieldModal"
						onClick={(event) => event.stopPropagation()}
						role="dialog"
						aria-modal="true"
						aria-labelledby="edit-field-title"
					>
						<div className="mngFieldModalHeader">
							<h2 id="edit-field-title">Chỉnh Sửa Lĩnh Vực</h2>
							<button type="button" className="mngFieldModalClose" onClick={closeEditFieldPopup} aria-label="Đóng popup">
								×
							</button>
						</div>

						<form className="mngFieldModalBody" onSubmit={handleEditFieldSubmit}>
							<label className="mngFieldFormGroup">
								<span>Tên lĩnh vực</span>
								<input
									type="text"
									placeholder="Ví dụ: Công nghệ mới, Marketing..."
									value={editFieldName}
									onChange={(event) => setEditFieldName(event.target.value)}
									disabled={isLoading}
								/>
							</label>

							<label className="mngFieldFormGroup">
								<span>Mô tả ngắn</span>
								<textarea
									rows={4}
									placeholder="Mô tả tóm tắt về lĩnh vực khảo sát này..."
									value={editFieldDescription}
									onChange={(event) => setEditFieldDescription(event.target.value)}
									disabled={isLoading}
								/>
							</label>

							{errorMsg && (
								<div style={{ color: '#dc2626', fontSize: '13px', background: '#fee2e2', padding: '8px 12px', borderRadius: '8px' }}>
									{errorMsg}
								</div>
							)}

							<div className="mngFieldModalFooter">
								<button type="button" className="mngFieldModalSecondary" onClick={closeEditFieldPopup} disabled={isLoading}>
									Hủy
								</button>
								<button type="submit" className="mngFieldModalPrimary" disabled={isLoading}>
									{isLoading ? 'Đang lưu...' : 'Lưu Thay Đổi'}
								</button>
							</div>
						</form>
					</div>
				</div>
			)}

			{isAddFieldOpen && (
				<div className="mngFieldModalOverlay" onClick={closeAddFieldPopup} role="presentation">
					<div
						className="mngFieldModal"
						onClick={(event) => event.stopPropagation()}
						role="dialog"
						aria-modal="true"
						aria-labelledby="add-field-title"
					>
						<div className="mngFieldModalHeader">
							<h2 id="add-field-title">Thêm Lĩnh Vực Mới</h2>
							<button type="button" className="mngFieldModalClose" onClick={closeAddFieldPopup} aria-label="Đóng popup">
								×
							</button>
						</div>

						<form className="mngFieldModalBody" onSubmit={handleAddFieldSubmit}>
							<label className="mngFieldFormGroup">
								<span>Tên lĩnh vực</span>
								<input
									type="text"
									placeholder="Ví dụ: Công nghệ mới, Marketing..."
									value={newFieldName}
									onChange={(event) => setNewFieldName(event.target.value)}
									disabled={isLoading}
								/>
							</label>

							<label className="mngFieldFormGroup">
								<span>Mô tả ngắn</span>
								<textarea
									rows={4}
									placeholder="Mô tả tóm tắt về lĩnh vực khảo sát này..."
									value={newFieldDescription}
									onChange={(event) => setNewFieldDescription(event.target.value)}
									disabled={isLoading}
								/>
							</label>

							{errorMsg && (
								<div style={{ color: '#dc2626', fontSize: '13px', background: '#fee2e2', padding: '8px 12px', borderRadius: '8px' }}>
									{errorMsg}
								</div>
							)}

							<div className="mngFieldModalFooter">
								<button 
									type="button" 
									className="mngFieldModalSecondary" 
									onClick={closeAddFieldPopup}
									disabled={isLoading}
								>
									Hủy
								</button>
								<button 
									type="submit" 
									className="mngFieldModalPrimary"
									disabled={isLoading}
								>
									{isLoading ? 'Đang lưu...' : 'Lưu Lĩnh Vực'}
								</button>
							</div>
						</form>
					</div>
				</div>
			)}

			<aside className="mngFieldSidebar">
				<div className="mngFieldBrand">
					<FiShield />
					<span>Quản trị Khảo sát</span>
				</div>

				<div className="mngFieldIdentity">
					<div className="mngFieldIdentityIcon">
						<FiUser />
					</div>
					<div>
						<h4>{fullName || 'Quản trị viên'}</h4>
						<p>{adminEmail || 'admin@survey.vn'}</p>
					</div>
				</div>

				<nav className="mngFieldMenu">
					{sideMenus.map((menu) => {
						const Icon = menu.icon;
						return (
							<button
								key={menu.key}
								type="button"
								className={`mngFieldMenuItem ${menu.active ? 'active' : ''}`}
								onClick={() => navigate(menu.path)}
							>
								<Icon />
								<span>{menu.label}</span>
							</button>
						);
					})}
				</nav>

				<div className="mngFieldQuickActions">
					<button type="button" className="mngFieldQuickBtn" onClick={handleLogout}>
						Đăng xuất
					</button>
				</div>
			</aside>

			<section className="mngFieldMain">
				<div className="mngFieldHeader">
					<h1>Quản lý Danh mục Khảo sát</h1>
					<p>Tổng cộng <strong>{surveyFields.length}</strong> danh mục</p>
					{errorMsg && <p style={{ color: '#dc2626', marginTop: '8px' }}>{errorMsg}</p>}
				</div>

				<div className="mngFieldGrid">
					{surveyFields.map((field) => (
						<article key={field.id} className="mngFieldCard">
							<div className="mngFieldCardHeader">
								<div 
									className="mngFieldCardIcon" 
									style={{ color: 'blue' }}
								>
									<FiClipboard />
								</div>
								<div className="mngFieldCardActions">
										<button type="button" aria-label={`Chỉnh sửa ${field.name}`} onClick={() => openEditFieldPopup(field)}>
										<FiEdit3 />
									</button>
								<button 
									type="button" 
									aria-label={`Xóa ${field.name}`}
									onClick={() => handleDeleteField(field.id, field.name)}
								>
										<FiTrash2 />
									</button>
								</div>
							</div>

							<div className="mngFieldCardContent">
								<h3>{field.name}</h3>
								<p>{field.description}</p>
								<div className="mngFieldCardMeta">
									<span>0 KHẢO SÁT</span>
									<div className="mngFieldCardAvatars">
										<span className="avatar"><FiUser size={13} /></span>
										<span className="avatar"><FiUser size={13} /></span>
									</div>
								</div>
							</div>
						</article>
					))}

					<article className="mngFieldCard mngFieldCardAdd">
						<div className="mngFieldCardAddContent">
							<button type="button" className="mngFieldAddBtn" onClick={openAddFieldPopup}>
								<FiPlus />
							</button>
							<h3>Thêm Lĩnh Vực Mới</h3>
							<p>Tạo hoặc nhập thêm danh mục khảo sát mới</p>
						</div>
					</article>
				</div>
			</section>
		</div>
	);
}
