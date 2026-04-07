import { useEffect, useState } from 'react';
import { useAuthStore } from '../../store/useAuthStore';
import { motion } from 'framer-motion';
import { AlertTriangle, CheckCircle2, XCircle, Clock, CalendarOff, X } from 'lucide-react';
import axios from 'axios';

export const ProfessorDashboard = () => {
  const { user } = useAuthStore();
  const [stats, setStats] = useState<any>(null);
  const [leaves, setLeaves] = useState<any[]>([]);
  const [actionMsg, setActionMsg] = useState('');
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [leaveForm, setLeaveForm] = useState({ startDate: '', endDate: '', reason: '' });
  const [leaveMsg, setLeaveMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchData = async () => {
    const [s, l] = await Promise.all([
      axios.get('/api/leaves/stats', { withCredentials: true }),
      axios.get('/api/leaves/pending', { withCredentials: true }),
    ]);
    setStats(s.data.data);
    setLeaves(l.data.data.leaves);
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

  const handleMarkLeave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setLeaveMsg('');
    try {
      await axios.post('/api/leaves/mark-leave', leaveForm, { withCredentials: true });
      setLeaveMsg('✅ Leave marked. Student requests will auto-forward to HOD during your absence.');
      setTimeout(() => { setShowLeaveModal(false); setLeaveMsg(''); setLeaveForm({ startDate: '', endDate: '', reason: '' }); }, 2500);
    } catch (err: any) {
      setLeaveMsg(err.response?.data?.message || 'Failed to mark leave.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      {stats?.hodAbsent && (
        <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl px-4 py-3 text-sm font-medium">
          <AlertTriangle size={16} className="shrink-0" />
          HOD is currently on leave. Approved student requests will escalate directly to Principal.
        </div>
      )}

      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-extrabold text-brand-900 tracking-tight">Professor Overview</h2>
          <p className="text-gray-500 mt-1">Hello, {user?.name}. You have {stats?.pending ?? '—'} pending actions.</p>
        </div>
        <button onClick={() => setShowLeaveModal(true)}
          className="flex items-center gap-2 px-4 py-2 text-sm font-semibold bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors">
          <CalendarOff size={16} /> Mark My Leave
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: 'Pending Requests', value: stats?.pending ?? '—', color: 'bg-yellow-100 text-yellow-600', icon: <Clock size={22} /> },
          { label: 'Total Approved', value: stats?.totalApproved ?? '—', color: 'bg-green-100 text-green-600', icon: <CheckCircle2 size={22} /> },
          { label: 'Total Rejected', value: stats?.totalRejected ?? '—', color: 'bg-red-100 text-red-500', icon: <XCircle size={22} /> },
        ].map((s) => (
          <div key={s.label} className="bg-white/70 backdrop-blur-md rounded-2xl shadow-sm border border-gray-100 p-6 flex items-center gap-4">
            <div className={`h-12 w-12 rounded-full ${s.color} flex items-center justify-center shrink-0`}>{s.icon}</div>
            <div>
              <p className="text-2xl font-extrabold text-gray-900">{s.value}</p>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {actionMsg && (
        <div className="bg-green-50 border border-green-200 text-green-700 rounded-xl px-4 py-3 text-sm font-medium">
          {actionMsg}
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="font-bold text-gray-800">Student Leave Requests</h3>
        </div>
        {leaves.length === 0 ? (
          <p className="px-6 py-8 text-sm text-gray-400">No pending requests.</p>
        ) : (
          <table className="min-w-full divide-y divide-gray-100">
            <thead className="bg-gray-50">
              <tr>
                {['Student', 'Type', 'Dates', 'Reason', 'Actions'].map((h) => (
                  <th key={h} className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {leaves.map((leave) => (
                <tr key={leave.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <p className="text-sm font-bold text-gray-900">{leave.user.name}</p>
                    <p className="text-xs text-gray-400">{leave.user.department}</p>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700 font-medium">{leave.leaveType}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {new Date(leave.startDate).toLocaleDateString()} – {new Date(leave.endDate).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                    {leave.reason?.replace(' [HOD_ESCALATED]', '')}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      {leave.canAct ? (
                        <>
                          <button
                            onClick={() => handleAction(leave.id, 'approve')}
                            className="px-3 py-1.5 text-xs font-semibold bg-green-50 text-green-700 hover:bg-green-600 hover:text-white rounded-lg transition-colors"
                          >Approve</button>
                          <button
                            onClick={() => handleAction(leave.id, 'reject')}
                            className="px-3 py-1.5 text-xs font-semibold bg-red-50 text-red-600 hover:bg-red-600 hover:text-white rounded-lg transition-colors"
                          >Reject</button>
                        </>
                      ) : (
                        <span className="text-xs text-gray-400 italic">Awaiting {leave.currentApproverRole}</span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Mark My Leave Modal */}
      {showLeaveModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-900">Mark My Leave</h3>
              <button onClick={() => setShowLeaveModal(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            <p className="text-sm text-gray-500 mb-4">Student requests will automatically forward to HOD during your absence.</p>
            <form onSubmit={handleMarkLeave} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Start Date</label>
                <input type="date" required className="input-field text-sm"
                  value={leaveForm.startDate} onChange={(e) => setLeaveForm({ ...leaveForm, startDate: e.target.value })} />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">End Date</label>
                <input type="date" required className="input-field text-sm"
                  value={leaveForm.endDate} onChange={(e) => setLeaveForm({ ...leaveForm, endDate: e.target.value })} />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Reason (optional)</label>
                <input type="text" className="input-field text-sm" placeholder="e.g. Personal"
                  value={leaveForm.reason} onChange={(e) => setLeaveForm({ ...leaveForm, reason: e.target.value })} />
              </div>
              {leaveMsg && (
                <p className={`text-sm font-medium ${leaveMsg.startsWith('✅') ? 'text-green-600' : 'text-red-600'}`}>{leaveMsg}</p>
              )}
              <button type="submit" disabled={submitting}
                className={`w-full py-2 rounded-lg text-sm font-semibold text-white ${submitting ? 'bg-gray-400' : 'bg-amber-500 hover:bg-amber-600'}`}>
                {submitting ? 'Marking...' : 'Confirm Leave'}
              </button>
            </form>
          </div>
        </div>
      )}
    </motion.div>
  );
};
