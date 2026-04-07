import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, XCircle, Clock, AlertTriangle, Crown, Info } from 'lucide-react';
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import api from '../../lib/api';

const ROLE_BADGE: Record<string, string> = {
  STUDENT:   'bg-sky-100 text-sky-700',
  PROFESSOR: 'bg-emerald-100 text-emerald-700',
  HOD:       'bg-amber-100 text-amber-700',
};

export const PrincipalDashboard = () => {
  const [stats, setStats]     = useState<any>(null);
  const [allLeaves, setAllLeaves] = useState<any[]>([]);
  const [pending, setPending] = useState<any[]>([]);
  const [actionMsg, setActionMsg] = useState('');
  const [deptFilter, setDeptFilter] = useState('ALL');

  const fetchData = async () => {
    const [s, a, p] = await Promise.all([
      api.get('/api/leaves/stats',   { withCredentials: true }),
      api.get('/api/leaves/all',     { withCredentials: true }),
      api.get('/api/leaves/pending', { withCredentials: true }),
    ]);
    setStats(s.data.data);
    setAllLeaves(a.data.data.leaves);
    setPending(p.data.data.leaves);
  };

  useEffect(() => { fetchData(); }, []);

  const handleAction = async (id: string, action: 'approve' | 'reject') => {
    try {
      await api.put(`/api/leaves/${id}/${action}`, {}, { withCredentials: true });
      setActionMsg(`Leave ${action}d successfully.`);
      await fetchData();
      setTimeout(() => setActionMsg(''), 3000);
    } catch (err: any) {
      setActionMsg(err.response?.data?.message || 'Action failed.');
    }
  };

  // All unique departments
  const departments = ['ALL', ...Array.from(new Set(allLeaves.map((l) => l.user?.department).filter(Boolean)))];

  const filteredAll = deptFilter === 'ALL' ? allLeaves : allLeaves.filter((l) => l.user?.department === deptFilter);

  // Stats by department
  const deptStats = departments.filter((d) => d !== 'ALL').map((dept) => {
    const dLeaves = allLeaves.filter((l) => l.user?.department === dept);
    return {
      dept,
      pending:  dLeaves.filter((l) => l.status === 'PENDING').length,
      approved: dLeaves.filter((l) => l.status === 'APPROVED').length,
      rejected: dLeaves.filter((l) => l.status === 'REJECTED').length,
    };
  });

  const escalated = pending.filter((l) => l.reason?.includes('HOD_ESCALATED'));
  const hodLeaves  = pending.filter((l) => l.user?.role === 'HOD');
  const myPending  = pending.filter((l) => l.canAct);

  const trendData = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'].map((m, i) => ({
    month: m,
    requests: allLeaves.filter((l) => new Date(l.createdAt).getMonth() === i).length,
  }));

  const LeaveTable = ({ rows, title, badge }: { rows: any[]; title: string; badge?: string }) => (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-3">
        <h3 className="font-bold text-gray-800">{title}</h3>
        {badge && <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">{badge}</span>}
      </div>
      {rows.length === 0 ? (
        <p className="px-6 py-6 text-sm text-gray-400">No requests.</p>
      ) : (
        <table className="min-w-full divide-y divide-gray-100">
          <thead className="bg-gray-50">
            <tr>
              {['Applicant', 'Role', 'Dept', 'Type', 'Dates', 'Reason', 'Status', 'Actions'].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rows.map((leave) => {
              const isEscalated = leave.reason?.includes('HOD_ESCALATED');
              const canAct = leave.canAct ?? (leave.currentApproverRole === 'PRINCIPAL' && leave.status === 'PENDING');
              return (
                <tr key={leave.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <p className="text-sm font-bold text-gray-900">{leave.user?.name}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${ROLE_BADGE[leave.user?.role] ?? 'bg-gray-100 text-gray-600'}`}>
                      {leave.user?.role}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500">{leave.user?.department}</td>
                  <td className="px-4 py-3 text-sm font-medium text-gray-700">{leave.leaveType}</td>
                  <td className="px-4 py-3 text-sm text-gray-500 whitespace-nowrap">
                    {new Date(leave.startDate).toLocaleDateString()} – {new Date(leave.endDate).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500 max-w-[120px]">
                    <p className="truncate">{leave.reason?.replace(' [HOD_ESCALATED]', '')}</p>
                    {isEscalated && (
                      <span className="text-xs text-amber-600 flex items-center gap-1">
                        <AlertTriangle size={10} /> HOD absent
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                      leave.status === 'APPROVED' ? 'bg-green-100 text-green-700' :
                      leave.status === 'REJECTED' ? 'bg-red-100 text-red-600' :
                      'bg-yellow-100 text-yellow-700'
                    }`}>{leave.status}</span>
                    {leave.status === 'PENDING' && leave.currentApproverRole && !canAct && (
                      <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
                        <Info size={10} /> Awaiting {leave.currentApproverRole}
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {canAct ? (
                      <div className="flex gap-2">
                        <button onClick={() => handleAction(leave.id, 'approve')}
                          className="px-3 py-1.5 text-xs font-semibold bg-green-50 text-green-700 hover:bg-green-600 hover:text-white rounded-lg transition-colors">
                          Approve
                        </button>
                        <button onClick={() => handleAction(leave.id, 'reject')}
                          className="px-3 py-1.5 text-xs font-semibold bg-red-50 text-red-600 hover:bg-red-600 hover:text-white rounded-lg transition-colors">
                          Reject
                        </button>
                      </div>
                    ) : (
                      <span className="text-xs text-gray-300">—</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center">
          <Crown size={20} />
        </div>
        <div>
          <h2 className="text-3xl font-extrabold text-brand-900 tracking-tight">Principal Command Center</h2>
          <p className="text-gray-500 mt-0.5">Full institution-wide leave visibility and control.</p>
        </div>
      </div>

      {stats?.hodAbsent && (
        <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl px-4 py-3 text-sm font-medium">
          <AlertTriangle size={16} className="shrink-0" />
          HOD is currently on approved leave. Escalated requests are routed directly to you.
        </div>
      )}

      {/* Global Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: 'Pending My Action', value: myPending.length,          color: 'text-yellow-600', icon: <Clock size={22} /> },
          { label: 'Escalated',         value: escalated.length,          color: 'text-amber-600',  icon: <AlertTriangle size={22} /> },
          { label: 'Total Approved',    value: stats?.totalApproved ?? '—', color: 'text-green-600', icon: <CheckCircle2 size={22} /> },
          { label: 'Total Rejected',    value: stats?.totalRejected ?? '—', color: 'text-red-500',   icon: <XCircle size={22} /> },
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

      {/* Department-wise Stats */}
      {deptStats.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h3 className="font-bold text-gray-800 mb-4">Department-wise Summary</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {deptStats.map((d) => (
              <div key={d.dept} className="border border-gray-100 rounded-xl p-4">
                <p className="text-sm font-bold text-gray-800 mb-2">{d.dept}</p>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between"><span className="text-yellow-600">Pending</span><span className="font-bold">{d.pending}</span></div>
                  <div className="flex justify-between"><span className="text-green-600">Approved</span><span className="font-bold">{d.approved}</span></div>
                  <div className="flex justify-between"><span className="text-red-500">Rejected</span><span className="font-bold">{d.rejected}</span></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {actionMsg && (
        <div className={`border rounded-xl px-4 py-3 text-sm font-medium ${actionMsg.includes('failed') || actionMsg.includes('permission') ? 'bg-red-50 border-red-200 text-red-700' : 'bg-green-50 border-green-200 text-green-700'}`}>
          {actionMsg}
        </div>
      )}

      {/* Escalated — most urgent */}
      {escalated.length > 0 && <LeaveTable rows={escalated} title="⚠ Escalated Requests (HOD Absent)" badge="Urgent" />}

      {/* HOD leaves */}
      {hodLeaves.length > 0 && <LeaveTable rows={hodLeaves} title="HOD Leave Requests" />}

      {/* All leaves with dept filter */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-bold text-gray-800">All Leaves (Institution-wide)</h3>
          <select className="input-field text-sm w-40" value={deptFilter} onChange={(e) => setDeptFilter(e.target.value)}>
            {departments.map((d) => <option key={d}>{d}</option>)}
          </select>
        </div>
        {filteredAll.length === 0 ? (
          <p className="px-6 py-6 text-sm text-gray-400">No leaves found.</p>
        ) : (
          <table className="min-w-full divide-y divide-gray-100">
            <thead className="bg-gray-50">
              <tr>
                {['Applicant', 'Role', 'Dept', 'Type', 'Dates', 'Reason', 'Status', 'Actions'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredAll.map((leave) => {
                const isEscalated = leave.reason?.includes('HOD_ESCALATED');
                const canAct = leave.status === 'PENDING' && leave.currentApproverRole === 'PRINCIPAL';
                return (
                  <tr key={leave.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-sm font-bold text-gray-900">{leave.user?.name}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${ROLE_BADGE[leave.user?.role] ?? 'bg-gray-100 text-gray-600'}`}>
                        {leave.user?.role}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500">{leave.user?.department}</td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-700">{leave.leaveType}</td>
                    <td className="px-4 py-3 text-sm text-gray-500 whitespace-nowrap">
                      {new Date(leave.startDate).toLocaleDateString()} – {new Date(leave.endDate).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500 max-w-[120px]">
                      <p className="truncate">{leave.reason?.replace(' [HOD_ESCALATED]', '')}</p>
                      {isEscalated && <span className="text-xs text-amber-600">⚠ HOD absent</span>}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                        leave.status === 'APPROVED' ? 'bg-green-100 text-green-700' :
                        leave.status === 'REJECTED' ? 'bg-red-100 text-red-600' :
                        'bg-yellow-100 text-yellow-700'
                      }`}>{leave.status}</span>
                      {leave.status === 'PENDING' && leave.currentApproverRole !== 'PRINCIPAL' && (
                        <p className="text-xs text-gray-400 mt-0.5">Awaiting {leave.currentApproverRole}</p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {canAct ? (
                        <div className="flex gap-2">
                          <button onClick={() => handleAction(leave.id, 'approve')}
                            className="px-3 py-1.5 text-xs font-semibold bg-green-50 text-green-700 hover:bg-green-600 hover:text-white rounded-lg transition-colors">
                            Approve
                          </button>
                          <button onClick={() => handleAction(leave.id, 'reject')}
                            className="px-3 py-1.5 text-xs font-semibold bg-red-50 text-red-600 hover:bg-red-600 hover:text-white rounded-lg transition-colors">
                            Reject
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-300">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Trend Chart */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h3 className="font-bold text-gray-800 mb-6">University-Wide Leave Trend</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={trendData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorPrincipal" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#4f46e5" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="month" axisLine={false} tickLine={false} />
              <YAxis axisLine={false} tickLine={false} allowDecimals={false} />
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <Tooltip />
              <Area type="monotone" dataKey="requests" stroke="#4f46e5" fillOpacity={1} fill="url(#colorPrincipal)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </motion.div>
  );
};
