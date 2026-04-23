import { useEffect, useMemo, useState } from 'react';
import {
	FiBarChart2,
	FiChevronLeft,
	FiChevronRight,
	FiFolder,
	FiGrid,
	FiLock,
	FiMoreHorizontal,
	FiSearch,
	FiShield,
	FiTrash2,
	FiUser,
	FiUsers
} from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import './MngUser.css';

const sideMenus = [
	{ key: 'dashboard', label: 'Tổng quan', icon: FiGrid, active: false, path: '/dashboard-admin' },
	{ key: 'users', label: 'Quản lý Người dùng', icon: FiUsers, active: true, path: '/dashboard-admin/users' },
	{ key: 'categories', label: 'Quản lý Lĩnh vực', icon: FiFolder, active: false, path: '/dashboard-admin/categories' },
	{ key: 'quality', label: 'Phân tích Chất lượng', icon: FiBarChart2, active: false, path: '/dashboard-admin' }
];

const userTabs = [
	{ key: 'all', label: 'Tất cả', active: true },
	{ key: 'creator', label: 'Người tạo khảo sát', active: false },
	{ key: 'participant', label: 'Người tham gia', active: false }
] as const;

type UserTabKey = (typeof userTabs)[number]['key'];

type UserRow = {
	id: number;
	name: string;
	email: string;
	initials: string;
	role: string;
	rawRole: string;
	job: string;
	interests: string[];
	phone: string;
};

const roleApiMap: Record<UserTabKey, string | null> = {
	all: null,
	creator: 'INTERVIEWER',
	participant: 'INTERVIEWEE'
};

const getInitials = (fullName: string) => {
	if (!fullName) {
		return 'NA';
	}

	const parts = fullName.trim().split(/\s+/).filter(Boolean);
	const first = parts[0]?.[0] ?? '';
	const last = parts.length > 1 ? parts[parts.length - 1]?.[0] ?? '' : '';
	return `${first}${last}`.toUpperCase();
};

export default function MngUser() {
	const navigate = useNavigate();
	const [fullName, setFullName] = useState('');
	const [users, setUsers] = useState<UserRow[]>([]);
	const [searchTerm, setSearchTerm] = useState('');
	const [activeTab, setActiveTab] = useState<UserTabKey>('all');

	const handleLogout = () => {
		localStorage.removeItem('token');
		localStorage.removeItem('userEmail');
		navigate('/login');
	};

	useEffect(() => {
		const token = localStorage.getItem('token');
		const userEmail = localStorage.getItem('userEmail');

		if (!token || !userEmail) {
			navigate('/login');
			return;
		}

		const fetchProfile = async () => {
			try {
				const response = await fetch('http://localhost:8080/api/user/profile', {
					headers: {
						Authorization: `Bearer ${token}`
					}
				});

				if (!response.ok) {
					return;
				}

				const data = await response.json();
				setFullName(data.fullName || userEmail);
			} catch (error) {
				console.error('Không thể tải dữ liệu quản lý người dùng:', error);
			}
		};

		const fetchUsers = async (roleKey: UserTabKey) => {
			try {
				const roleParam = roleApiMap[roleKey];
				const url = roleParam
					? `http://localhost:8080/api/admin/users?role=${encodeURIComponent(roleParam)}`
					: 'http://localhost:8080/api/admin/users';
				const response = await fetch(url, {
					headers: {
						Authorization: `Bearer ${token}`
					}
				});

				if (!response.ok) {
					console.error('Không thể tải danh sách người dùng:', response.status);
					return;
				}

				const data = await response.json();
				const mapped = (Array.isArray(data) ? data : [])
					.filter((item) => item?.role !== 'ADMIN')
					.map((item) => {
						const roleKeyValue = item.role || 'UNKNOWN';
						return {
							id: item.id,
							name: item.fullName || item.email,
							email: item.email,
							initials: getInitials(item.fullName || item.email),
							role: roleKeyValue,
							rawRole: roleKeyValue,
							job: item.job || '—',
							interests: Array.isArray(item.interests) ? item.interests : [],
							phone: item.phone || '—'
						};
					});

				setUsers(mapped);
			} catch (error) {
				console.error('Không thể tải danh sách người dùng:', error);
			}
		};

		fetchProfile();
		fetchUsers(activeTab);
	}, [activeTab, navigate]);

	const filteredUsers = useMemo(() => {
		const keyword = searchTerm.trim().toLowerCase();
		const byTab = users.filter((user) => {
			if (activeTab === 'creator') {
				return user.rawRole === 'INTERVIEWER';
			}
			if (activeTab === 'participant') {
				return user.rawRole === 'INTERVIEWEE';
			}
			return true;
		});

		if (!keyword) {
			return byTab;
		}

		return byTab.filter((user) =>
			[user.name, user.email, user.phone].some((value) =>
				value?.toLowerCase().includes(keyword)
			)
		);
	}, [activeTab, searchTerm, users]);

	return (
		<div className="mngUserPage">
			<aside className="mngUserSidebar">
				<div className="mngUserBrand">
					<FiShield />
					<span>Quản trị Khảo sát</span>
				</div>

				<div className="mngUserIdentity">
					<div className="mngUserIdentityIcon">
						<FiUser />
					</div>
					<div>
						<h4>{fullName || 'Quản trị viên'}</h4>
						<p>admin@survey.vn</p>
					</div>
				</div>

				<nav className="mngUserMenu">
					{sideMenus.map((menu) => {
						const Icon = menu.icon;

						return (
							<button
								key={menu.key}
								type="button"
								className={`mngUserMenuItem ${menu.active ? 'active' : ''}`}
								onClick={() => navigate(menu.path)}
							>
								<Icon />
								<span>{menu.label}</span>
							</button>
						);
					})}
				</nav>

				<div className="mngUserQuickActions">
					<button type="button" className="mngUserQuickBtn" onClick={handleLogout}>
						Đăng xuất
					</button>
				</div>
			</aside>

			<section className="mngUserMain">
				<div className="mngUserShell">
					<div className="mngUserTopBar">
						<div className="mngUserTabs" role="tablist" aria-label="Nhóm người dùng">
							{userTabs.map((tab) => (
								<button
									key={tab.key}
									type="button"
									className={`mngUserTab ${activeTab === tab.key ? 'active' : ''}`}
									onClick={() => setActiveTab(tab.key)}
								>
									{tab.label}
								</button>
							))}
						</div>
					</div>

					<article className="mngUserCard">
						<div className="mngUserCardToolbar">
							<label className="mngUserSearch">
								<FiSearch />
								<input
									type="search"
									placeholder="Tìm kiếm theo tên, email, số điện thoại"
									aria-label="Tìm kiếm người dùng"
									value={searchTerm}
									onChange={(event) => setSearchTerm(event.target.value)}
								/>
							</label>

							<button type="button" className="mngUserMenuBtn" aria-label="Tùy chọn hiển thị">
								<FiMoreHorizontal />
							</button>
						</div>

						<div className="mngUserTableWrap">
							<table className="mngUserTable">
								<thead>
								<tr>
									<th>ID</th>
									<th>HỌ TÊN &amp; EMAIL</th>
									<th>VAI TRÒ</th>
									<th>CÔNG VIỆC</th>
									<th>LĨNH VỰC QUAN TÂM</th>
									<th>SỐ ĐIỆN THOẠI</th>
									<th>HÀNH ĐỘNG</th>
								</tr>
								</thead>
								<tbody>
								{filteredUsers.map((user) => (
									<tr key={user.id}>
										<td className="mngUserId">{String(user.id)}</td>
										<td>
											<div className="mngUserProfile">
												<div className="mngUserAvatar">{user.initials}</div>
												<div>
													<strong>{user.name}</strong>
													<p>{user.email}</p>
												</div>
											</div>
										</td>
										<td>
											<span className="mngUserRole">{user.role}</span>
										</td>
										<td className="mngUserJob">{user.job}</td>
										<td>
											<div className="mngUserTags">
												{user.interests.length === 0 ? (
													<span className="mngUserTag">—</span>
												) : (
													user.interests.map((interest) => (
														<span key={interest} className="mngUserTag">
																{interest}
															</span>
													))
												)}
											</div>
										</td>
										<td className="mngUserPhone">{user.phone}</td>
										<td>
											<div className="mngUserActions">
												<button type="button" aria-label={`Khóa ${user.name}`}>
													<FiLock />
												</button>
												<button type="button" aria-label={`Xóa ${user.name}`}>
													<FiTrash2 />
												</button>
											</div>
										</td>
									</tr>
								))}
								</tbody>
							</table>
						</div>

						<div className="mngUserFooter">
							<div className="mngUserPagination" aria-label="Phân trang người dùng">
								<button type="button" disabled>
									<FiChevronLeft />
								</button>
								<button type="button" className="active">
									1
								</button>
								<button type="button">2</button>
								<button type="button">3</button>
								<span>...</span>
								<button type="button">...</button>
								<button type="button">
									<FiChevronRight />
								</button>
							</div>
						</div>
					</article>
				</div>
			</section>
		</div>
	);
}
