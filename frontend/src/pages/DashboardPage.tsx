import { useAuthStore } from '../store/useAuthStore';
import { StudentDashboard } from './dashboards/StudentDashboard';
import { ProfessorDashboard } from './dashboards/ProfessorDashboard';
import { HodDashboard } from './dashboards/HodDashboard';
import { PrincipalDashboard } from './dashboards/PrincipalDashboard';

export const DashboardPage = () => {
  const { user } = useAuthStore();

  if (user?.role === 'PRINCIPAL') return <PrincipalDashboard />;
  if (user?.role === 'HOD') return <HodDashboard />;
  if (user?.role === 'PROFESSOR') return <ProfessorDashboard />;
  
  return <StudentDashboard />;
};
