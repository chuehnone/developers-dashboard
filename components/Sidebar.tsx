
import React from 'react';
import {
  LayoutDashboard,
  Users,
  Settings,
  GitPullRequest,
  BarChart3,
  Sparkles
} from 'lucide-react';

interface SidebarProps {
  currentView: string;
  onNavigate: (view: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentView, onNavigate }) => {
  return (
    <div className="w-16 md:w-64 flex-shrink-0 bg-slate-900 border-r border-slate-800 h-screen flex flex-col sticky top-0">
      <div className="h-16 flex items-center justify-center md:justify-start md:px-6 border-b border-slate-800">
        <div className="bg-blue-600 p-1.5 rounded-lg mr-0 md:mr-3">
          <BarChart3 className="w-6 h-6 text-white" />
        </div>
        <span className="font-bold text-xl hidden md:block text-slate-100">DevPulse</span>
      </div>

      <nav className="flex-1 py-6 space-y-2 px-2 md:px-4">
        <NavItem
          icon={<LayoutDashboard size={20} />}
          label="Overview"
          active={currentView === 'overview'}
          onClick={() => onNavigate('overview')}
        />
        <NavItem
          icon={<Users size={20} />}
          label="Team Members"
          active={currentView === 'members'}
          onClick={() => onNavigate('members')}
        />
        <NavItem
          icon={<GitPullRequest size={20} />}
          label="GitHub Metrics"
          active={currentView === 'github'}
          onClick={() => onNavigate('github')}
        />
        <NavItem
          icon={<Sparkles size={20} />}
          label="Copilot Usage"
          active={currentView === 'copilot'}
          onClick={() => onNavigate('copilot')}
        />
      </nav>

      <div className="p-4 border-t border-slate-800">
        <NavItem icon={<Settings size={20} />} label="Settings" onClick={() => {}} />
      </div>
    </div>
  );
};

interface NavItemProps {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  onClick: () => void;
}

const NavItem: React.FC<NavItemProps> = ({ icon, label, active, onClick }) => {
  return (
    <button 
      onClick={onClick}
      className={`
        w-full flex items-center justify-center md:justify-start px-2 md:px-4 py-3 rounded-lg transition-colors
        ${active 
          ? 'bg-blue-600/10 text-blue-500 border border-blue-600/20' 
          : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'}
      `}
    >
      {icon}
      <span className="ml-3 hidden md:block font-medium">{label}</span>
    </button>
  );
};
