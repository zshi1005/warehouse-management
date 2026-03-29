'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Package, 
  Users, 
  UserCheck, 
  PackageSearch,
  LogIn,
  LogOut,
  ArrowRightLeft,
  LayoutDashboard,
  BarChart3,
  FolderOpen,
  MapPin,
  Tag,
  Award,
  FileBarChart,
  Building2
} from 'lucide-react';
import { useLanguage } from '@/i18n/LanguageContext';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';

const navItems = [
  { href: '/', labelKey: 'dashboard', icon: LayoutDashboard },
  { href: '/products', labelKey: 'products', icon: Package },
  { href: '/product-categories', labelKey: 'categories', icon: FolderOpen },
  { href: '/brands', labelKey: 'brands', icon: Award },
  { href: '/warehouse-locations', labelKey: 'warehouseLocations', icon: MapPin },
  { href: '/construction-sites', labelKey: 'constructionSites', icon: Building2 },
  { href: '/suppliers', labelKey: 'suppliers', icon: Users },
  { href: '/customers', labelKey: 'customers', icon: UserCheck },
  { href: '/inventory', labelKey: 'inventory', icon: PackageSearch },
  { href: '/stock-in', labelKey: 'stockIn', icon: LogIn },
  { href: '/stock-out', labelKey: 'stockOut', icon: LogOut },
  { href: '/stock-out-categories', labelKey: 'stockOutCategories', icon: Tag },
  { href: '/stock-transfers', labelKey: 'transfer', icon: ArrowRightLeft },
  { href: '/reports', labelKey: 'reports', icon: FileBarChart },
];

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { t, language } = useLanguage();

  const systemName = language === 'zh' ? '仓库管理系统' : 'Warehouse Management System';

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 顶部导航栏 */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Package className="h-8 w-8 text-blue-600" />
              <h1 className="ml-3 text-xl font-bold text-gray-900">{systemName}</h1>
            </div>
            <LanguageSwitcher />
          </div>
        </div>
      </header>

      <div className="flex">
        {/* 侧边栏 */}
        <aside className="w-64 bg-white min-h-screen shadow-sm border-r border-gray-200">
          <nav className="mt-6 px-3">
            <div className="space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                const label = t.nav[item.labelKey as keyof typeof t.nav] || item.labelKey;
                
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`
                      flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors
                      ${isActive 
                        ? 'bg-blue-50 text-blue-700' 
                        : 'text-gray-700 hover:bg-gray-50'
                      }
                    `}
                  >
                    <Icon className={`mr-3 h-5 w-5 ${isActive ? 'text-blue-600' : 'text-gray-400'}`} />
                    {label}
                  </Link>
                );
              })}
            </div>
          </nav>
        </aside>

        {/* 主内容区 */}
        <main className="flex-1 overflow-auto">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
