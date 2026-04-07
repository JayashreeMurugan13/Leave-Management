import { useAuthStore } from '../store/useAuthStore';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { StudentDashboard } from './dashboards/StudentDashboard';
import { ProfessorDashboard } from './dashboards/ProfessorDashboard';
import { HodDashboard } from './dashboards/HodDashboard';
import { PrincipalDashboard } from './dashboards/PrincipalDashboard';

export const DashboardPage = () => {
  const { user } = useAuthStore();

  const content =
    user?.role === 'PRINCIPAL' ? <PrincipalDashboard /> :
    user?.role === 'HOD'       ? <HodDashboard /> :
    user?.role === 'PROFESSOR' ? <ProfessorDashboard /> :
    <StudentDashboard />;

  return <DashboardLayout>{content}</DashboardLayout>;
};
