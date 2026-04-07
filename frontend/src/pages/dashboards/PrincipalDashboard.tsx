import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, XCircle, Clock, AlertTriangle, Crown } from 'lucide-react';
import axios from 'axios';

const ROLE_BADGE: Record<string, string> = {
  STUDENT:   'bg-sky-100 text-sky-700',
  PROFESSOR: 'bg-emerald-100 text-emerald-700',
  HOD:       'bg-amber-100 text-amber-700',
};

const STATUS_BADGE: Record<string, string> = {
  PENDING:  'bg-yellow-100 text-yellow-700',
  APPROVED: 'bg-green-100 text-green-700',
  REJECTED: 'bg-red-100 text-red-600',
};

const SECTION_STYLE: Record<string, { border: string; header: string; badge: string }> = {
  STUDENT:   { border: 'border-sky-200',     header: 'bg-sky-50',     badge: 'bg-sky-100 text-sky-700' },
  PROFESSOR: { border: 'border-emerald-200', header: 'bg-emerald-50', badge: 'bg-emerald-100 text-emerald-700' },
  HOD:       { border: 'border-amber-200',   header: 'bg-amber-50',   badge: 'bg-amber-100 text-amber-700' },
};

export const PrincipalDashboard = () => {
  const [stats, setStats]       = useState<any>(null);
  const [allLeaves, setAllLeaves] = useState<any[]>([]);
  const [pending, setPending]   = useState<any[]>([]);
  const [filter, setFilter]     = useState<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'>('ALL');
  const [actionMsg, setActionMsg] = useState('');

  const fetchData = async () => {
    const [s, all, pend] = await Promise.all([
      axios.get('/api/leaves/stats',   { withCredentials: true }),
      axios.get('/api/leaves/all',     { withCredentials: true }),
      axios.get('/api/leaves/pending', { withCredentials: true }),
    ]);
    setStats(s.data.data);
    setAllLeaves(all.data.data.leaves);
    setPending(pend.data.data.leaves);
  };

  useEffect(() => { fetchData(); }, []);

  const handleAction = async (id: string, action: 'approve' | 'reject') => {
    try {
      await axios.put(`/api/leaves/${id}/${action}`, {}, { withCredentials: true });
      setActionMsg(`Leave ${action}d successfully.`);
      await fetchData();
      setTimeout(() => setActionMsg(''), 3000);
    } catch (err: any) {
      setActionMsg(err.response?.data?.message || 'Action failed.');
    }
  };

  // Group leaves by applicant role then by department
  const groupByDept = (leaves: any[]) => {
    return leaves.reduce((acc: Record<string, any[]>, leave) => {
      const dept = leave.user.department || 'Unknown';
      if (!acc[dept]) acc[dept] = [];
      acc[dept].push(leave);
      return acc;
    }, {});
  };

  const displayed = filter === 'ALL' ? allLeaves : allLeaves.filter((l) => l.status === filter);

  const LeaveTable = ({ leaves, showActions }: { leaves: any[]; showActions: boolean }) => (
    <table className="min-w-full divide-y divide-gray-100">
      <thead className="bg-gray-50">
        <tr>
          {['Applicant', 'Type', 'Dates', 'Reason', 'Status', ...(showActions ? ['Actions'] : [])].map((h) => (
            <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
          ))}
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-100 bg-white">
        {leaves.map((leave) => (
          <tr key={leave.id} className="hover:bg-gray-50 transition-colors">
            <td className="px-4 py-3">
              <p className="text-sm font-bold text-gray-900">{leave.user.name}</p>
              <p className="text-xs text-gray-400">{leave.user.email}</p>
            </td>
            <td className="px-4 py-3 text-sm font-medium text-gray-700">{leave.leaveType}</td>
            <td className="px-4 py-3 text-sm text-gray-500 whitespace-nowrap">
              {new Date(leave.startDate).toLocaleDateString()} – {new Date(leave.endDate).toLocaleDateString()}
            </td>
            <td className="px-4 py-3 text-sm text-gray-500 max-w-xs truncate">
              {leave.reason?.replace(' [HOD_ESCALATED]', '')}
            </td>
            <td className="px-4 py-3">
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS_BADGE[leave.status]}`}>
                {leave.status}
              </span>
            </td>
            {showActions && (
              <td className="px-4 py-3">
                {leave.status === 'PENDING' && (leave.canAct !== false) ? (
                  <div className="flex gap-2">
                    <button onClick={() => handleAction(leave.id, 'approve')}
                      className="px-3 py-1 text-xs font-semibold bg-green-50 text-green-700 hover:bg-green-600 hover:text-white rounded-lg transition-colors">
                      Approve
                    </button>
                    <button onClick={() => handleAction(leave.id, 'reject')}
                      className="px-3 py-1 text-xs font-semibold bg-red-50 text-red-600 hover:bg-red-600 hover:text-white rounded-lg transition-colors">
                      Reject
                    </button>
                  </div>
                ) : leave.status === 'PENDING' ? (
                  <span className="text-xs text-gray-400 italic">Awaiting {leave.currentApproverRole}</span>
                ) : null}
              </td>
            )}
          </tr>
        ))}
      </tbody>
    </table>
  );

  const RoleSection = ({ role, title }: { role: string; title: string }) => {
    const roleLeaves = displayed.filter((l) => l.user.role === role);
    const pendingRoleLeaves = pending.filter((l) => l.user.role === role);
    const style = SECTION_STYLE[role];
    const deptGroups = groupByDept(roleLeaves);
    const pendingDeptGroups = groupByDept(pendingRoleLeaves);
    const allDepts = Array.from(new Set([...Object.keys(deptGroups), ...Object.keys(pendingDeptGroups)]));

    if (allDepts.length === 0) return null;

    return (
      <div className={`rounded-2xl border ${style.border} overflow-hidden`}>
        <div className={`px-6 py-4 ${style.header} border-b ${style.border}`}>
          <h3 className="font-bold text-gray-800 text-lg">{title}</h3>
        </div>
        <div className="divide-y divide-gray-100">
          {allDepts.map((dept) => {
            const deptPending = pendingDeptGroups[dept] || [];
            const deptAll = deptGroups[dept] || [];
            const showPending = deptPending.length > 0;
            const showAll = deptAll.length > 0;

            return (
              <div key={dept} className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <span className={`text-xs font-bold px-3 py-1 rounded-full ${style.badge}`}>
                    {dept}
                  </span>
                  {deptPending.length > 0 && (
                    <span className="text-xs font-semibold text-yellow-600 bg-yellow-50 px-2 py-0.5 rounded-full">
                      {deptPending.length} pending
                    </span>
                  )}
                </div>

                {/* Pending actions first */}
                {showPending && (
                  <div className="mb-3 rounded-xl border border-yellow-100 overflow-hidden">
                    <div className="px-4 py-2 bg-yellow-50 text-xs font-semibold text-yellow-700">
                      ⏳ Awaiting Action
                    </div>
                    <LeaveTable leaves={deptPending} showActions={true} />
                  </div>
                )}

                {/* All records */}
                {showAll && filter !== 'PENDING' && (
                  <div className="rounded-xl border border-gray-100 overflow-hidden">
                    <LeaveTable leaves={deptAll} showActions={false} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center">
          <Crown size={20} />
        </div>
        <div>
          <h2 className="text-3xl font-extrabold text-brand-900 tracking-tight">Principal Dashboard</h2>
          <p className="text-gray-500 mt-0.5">Department-wise leave visibility and control.</p>
        </div>
      </div>

      {stats?.hodAbsent && (
        <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl px-4 py-3 text-sm font-medium">
          <AlertTriangle size={16} className="shrink-0" />
          HOD is currently on approved leave. Escalated requests are routed directly to you.
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: 'Pending',       value: stats?.pending       ?? '—', color: 'text-yellow-600', icon: <Clock size={22} /> },
          { label: 'Escalated',     value: stats?.escalated     ?? '—', color: 'text-amber-600',  icon: <AlertTriangle size={22} /> },
          { label: 'Total Approved', value: stats?.totalApproved ?? '—', color: 'text-green-600', icon: <CheckCircle2 size={22} /> },
          { label: 'Total Rejected', value: stats?.totalRejected ?? '—', color: 'text-red-500',   icon: <XCircle size={22} /> },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex items-center gap-4">
            <div className={`h-12 w-12 rounded-full bg-gray-50 ${s.color} flex items-center justify-center shrink-0`}>{s.icon}</div>
            <div>
              <p className={`text-3xl font-extrabold ${s.color}`}>{s.value}</p>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mt-0.5">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {actionMsg && (
        <div className="bg-green-50 border border-green-200 text-green-700 rounded-xl px-4 py-3 text-sm font-medium">
          {actionMsg}
        </div>
      )}

      {/* Filter */}
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-gray-500">Filter:</span>
        {(['ALL', 'PENDING', 'APPROVED', 'REJECTED'] as const).map((f) => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-3 py-1 text-xs font-semibold rounded-full transition-colors ${
              filter === f ? 'bg-brand-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}>
            {f}
          </button>
        ))}
      </div>

      {/* Separate sections per role */}
      <RoleSection role="STUDENT"   title="🎓 Student Leaves" />
      <RoleSection role="PROFESSOR" title="📚 Professor Leaves" />
      <RoleSection role="HOD"       title="👥 HOD Leaves" />
    </motion.div>
  );
};
