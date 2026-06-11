import type { IconType } from 'react-icons';
import { FiBarChart2, FiFolder, FiGrid, FiMessageSquare, FiUsers } from 'react-icons/fi';

export type AdminSideMenuKey = 'dashboard' | 'users' | 'surveys' | 'categories' | 'quality';

export type AdminSideMenuItem = {
  key: AdminSideMenuKey;
  label: string;
  icon: IconType;
  path: string;
};

export const adminSideMenus: AdminSideMenuItem[] = [
  { key: 'dashboard', label: 'Tổng quan', icon: FiGrid, path: '/dashboard-admin' },
  { key: 'users', label: 'Quản lý Người dùng', icon: FiUsers, path: '/dashboard-admin/users' },
  { key: 'surveys', label: 'Quản lý Khảo sát', icon: FiMessageSquare, path: '/dashboard-admin/surveys' },
  { key: 'categories', label: 'Quản lý Lĩnh vực', icon: FiFolder, path: '/dashboard-admin/categories' },
  { key: 'quality', label: 'Phân tích Chất lượng', icon: FiBarChart2, path: '/dashboard-admin/quality' }
];
