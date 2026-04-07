import React from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { LayoutDashboard, CalendarDays, FileCheck, Users, LogOut, Bell, Search } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

export const DashboardLayout = ({ children }: { children: React.ReactNode }) => {
  const { user, logout } = useAuthStore();
  const location = useLocation();

  const baseNav = {
    STUDENT: [
      { name: 'Dashboard', icon: LayoutDashboard, href: '/dashboard' },
      { name: 'Apply Leave', icon: FileCheck, href: '/apply' },
      { name: 'My Leaves', icon: CalendarDays, href: '/my-leaves' }
    ],
    PROFESSOR: [
      { name: 'Dashboard', icon: LayoutDashboard, href: '/dashboard' },
      { name: 'Approvals', icon: FileCheck, href: '/approvals' },
      { name: 'My Leaves', icon: CalendarDays, href: '/my-leaves' },
    ],
    HOD: [
      { name: 'Dashboard', icon: LayoutDashboard, href: '/dashboard' },
      { name: 'Approvals', icon: FileCheck, href: '/approvals' },
      { name: 'My Leaves', icon: CalendarDays, href: '/my-leaves' },
    ],
    PRINCIPAL: [
      { name: 'Dashboard', icon: LayoutDashboard, href: '/dashboard' },
      { name: 'My Leaves', icon: CalendarDays, href: '/my-leaves' },
    ]
  };

  const currentRole = user?.role || 'STUDENT';
  const navigation = baseNav[currentRole].map(item => ({
    ...item,
    current: location.pathname === item.href
  }));

  return (
    <div className="min-h-screen bg-brand-50 flex">
      {/* Sidebar - Classic Dark Slate */}
      <div className="w-64 bg-brand-900 text-white flex flex-col shadow-xl z-10">
        <div className="h-16 flex items-center px-6 font-bold text-xl tracking-tight border-b border-brand-800">
          NexusLeave
        </div>
        <nav className="flex-1 px-4 py-6 space-y-2">
          {navigation.map((item) => (
            <Link
              key={item.name}
              to={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded transition-colors ${
                item.current ? 'bg-primary-600 text-white shadow-sm' : 'text-brand-200 hover:bg-brand-800 hover:text-white'
              }`}
            >
              <item.icon size={20} className={item.current ? 'text-white' : 'text-brand-300'} />
              <span className="font-medium">{item.name}</span>
            </Link>
          ))}
        </nav>
        <div className="p-4 border-t border-brand-800">
          <button 
            onClick={logout}
            className="flex items-center gap-3 px-3 py-2 text-brand-200 hover:text-white w-full hover:bg-brand-800 rounded transition-colors"
          >
            <LogOut size={20} />
            <span className="font-medium">Sign Out</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-8 z-0">
          <div className="flex items-center text-gray-500 max-w-md w-full">
            <Search size={20} className="mr-2" />
            <input 
              type="text" 
              placeholder="Search leaves, employees..." 
              className="border-none focus:ring-0 text-sm w-full outline-none placeholder-gray-400"
            />
          </div>
          <div className="flex items-center gap-6">
            <button className="text-gray-400 hover:text-primary-600 relative transition-colors">
              <Bell size={20} />
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-primary-600 text-[9px] text-white justify-center items-center font-bold">3</span>
              </span>
            </button>
            <div className="flex items-center gap-3 pl-6 border-l border-gray-200">
              <div className="text-right hidden sm:block">
                <div className="text-sm font-bold text-gray-900">{user?.name}</div>
                <div className="text-xs text-gray-500 font-medium uppercase tracking-wide">
                  {user?.role} • {user?.department}
                </div>
              </div>
              <div className="h-10 w-10 rounded-full bg-primary-500 flex items-center justify-center text-white font-bold shadow-md ring-2 ring-primary-100">
                {user?.name?.charAt(0) || 'U'}
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-8">
          <div className="max-w-6xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};
