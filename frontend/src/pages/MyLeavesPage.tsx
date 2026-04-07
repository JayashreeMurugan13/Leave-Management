import { useEffect, useState } from 'react';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { CalendarHeart, Plus, X, AlertTriangle } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { AnimatePresence, motion } from 'framer-motion';
import axios from 'axios';

const LEAVE_TYPES = ['CL', 'SL', 'EL'];

function ApprovalChain({ leave }: { leave: any }) {
  const isEscalated = leave.reason?.includes('HOD_ESCALATED');
  const role: string = leave.user?.role || 'STUDENT';

  const fullChain: string[] =
    role === 'HOD'       ? ['PRINCIPAL'] :
    role === 'PROFESSOR' ? (isEscalated ? ['PRINCIPAL'] : ['HOD', 'PRINCIPAL']) :
    isEscalated          ? ['PROFESSOR', 'PRINCIPAL'] : ['PROFESSOR', 'HOD', 'PRINCIPAL'];

  const approvedRoles = leave.approvals?.map((a: any) => a.approver.role) || [];

  return (
    <div className="flex items-center gap-1 flex-wrap mt-1">
      {fullChain.map((r, i) => {
        const done = approvedRoles.includes(r);
        const isCurrent = leave.currentApproverRole === r && leave.status === 'PENDING';
        return (
          <span key={r} className="flex items-center gap-1">
            {i > 0 && <span className="text-gray-300 text-xs">→</span>}
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
              done      ? 'bg-green-100 text-green-700' :
              isCurrent ? 'bg-yellow-100 text-yellow-700 animate-pulse' :
                          'bg-gray-100 text-gray-400'
            }`}>
              {done ? '✔' : isCurrent ? '⏳' : '○'} {r}
            </span>
          </span>
        );
      })}
      {isEscalated && (
        <span className="ml-1 inline-flex items-center gap-1 text-xs text-amber-600 font-medium">
          <AlertTriangle size={10} /> HOD absent
        </span>
      )}
    </div>
  );
}

export const MyLeavesPage = () => {
  const { user } = useAuthStore();
  const [leaves, setLeaves]       = useState<any[]>([]);
  const [hodAbsent, setHodAbsent] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm]           = useState({ startDate: '', endDate: '', type: 'CL', reason: '' });
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg]             = useState('');

  const fetchData = async () => {
    const [l, s] = await Promise.all([
      axios.get('/api/leaves/my',    { withCredentials: true }),
      axios.get('/api/leaves/stats', { withCredentials: true }),
    ]);
    setLeaves(l.data.data.leaves);
    setHodAbsent(s.data.data.hodAbsent);
  };

  useEffect(() => { fetchData(); }, []);

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setMsg('');
    try {
      const res = await axios.post('/api/leaves/apply', form, { withCredentials: true });
      setMsg(res.data.message);
      await fetchData();
      setTimeout(() => { setShowModal(false); setMsg(''); setForm({ startDate: '', endDate: '', type: 'CL', reason: '' }); }, 2000);
    } catch (err: any) {
      setMsg(err.response?.data?.message || 'Failed to apply.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="mb-8 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">My Leaves</h1>
          <p className="text-gray-500 mt-1">Your leave history and current applications.</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2">
          <Plus size={18} /> New Leave Request
        </button>
      </div>

      {hodAbsent && user?.role !== 'PRINCIPAL' && (
        <div className="mb-6 flex items-center gap-3 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl px-4 py-3 text-sm font-medium">
          <AlertTriangle size={16} className="shrink-0" />
          HOD is currently on leave. Your new request will go directly to the Principal.
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-200 bg-gray-50/50">
          <h3 className="font-semibold text-gray-900">Leave History</h3>
        </div>
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-white">
            <tr>
              {['Leave Type', 'Date Range', 'Reason', 'Approval Chain', 'Status', 'Applied On'].map((h) => (
                <th key={h} className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {leaves.length === 0 && (
              <tr><td colSpan={6} className="px-6 py-8 text-sm text-gray-400 text-center">No leaves applied yet.</td></tr>
            )}
            {leaves.map((leave) => (
              <tr key={leave.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded bg-gray-100 flex items-center justify-center text-gray-500">
                      <CalendarHeart size={14} />
                    </div>
                    <span className="text-sm font-medium text-gray-900">{leave.leaveType}</span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(leave.startDate).toLocaleDateString()} – {new Date(leave.endDate).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                  {leave.reason?.replace(' [HOD_ESCALATED]', '')}
                </td>
                <td className="px-6 py-4">
                  <ApprovalChain leave={{ ...leave, user: { role: user?.role } }} />
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                    leave.status === 'APPROVED' ? 'bg-green-100 text-green-700' :
                    leave.status === 'REJECTED' ? 'bg-red-100 text-red-600' :
                    'bg-amber-100 text-amber-700'
                  }`}>{leave.status}</span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(leave.createdAt).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Apply Leave Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6"
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-gray-900">Apply for Leave</h3>
                <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
              </div>

              {hodAbsent && user?.role !== 'PRINCIPAL' && (
                <div className="mb-4 flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-700 rounded-lg px-3 py-2 text-xs font-medium">
                  <AlertTriangle size={13} />
                  {user?.role === 'HOD'
                    ? 'Your leave request will go directly to the Principal.'
                    : 'HOD is on leave — your request will be escalated to the Principal.'}
                </div>
              )}

              {/* Show normal flow when HOD is present */}
              {!hodAbsent && user?.role !== 'PRINCIPAL' && (
                <div className="mb-4 bg-blue-50 border border-blue-100 text-blue-700 rounded-lg px-3 py-2 text-xs font-medium">
                  {user?.role === 'HOD'     && '📋 Your request will go to → Principal'}
                  {user?.role === 'PROFESSOR' && '📋 Your request will go to → HOD → Principal'}
                  {user?.role === 'STUDENT'   && '📋 Your request will go to → Professor → HOD → Principal'}
                </div>
              )}

              <form onSubmit={handleApply} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Start Date</label>
                    <input type="date" required className="input-field text-sm"
                      value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">End Date</label>
                    <input type="date" required className="input-field text-sm"
                      value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Leave Type</label>
                  <select className="input-field text-sm" value={form.type}
                    onChange={(e) => setForm({ ...form, type: e.target.value })}>
                    {LEAVE_TYPES.map((t) => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Reason</label>
                  <textarea required rows={3} className="input-field text-sm resize-none"
                    value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} />
                </div>
                {msg && (
                  <p className={`text-sm font-medium ${msg.toLowerCase().includes('fail') || msg.toLowerCase().includes('error') ? 'text-red-600' : 'text-green-600'}`}>
                    {msg}
                  </p>
                )}
                <button type="submit" disabled={submitting} className="w-full btn-primary">
                  {submitting ? 'Submitting...' : 'Submit Request'}
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </DashboardLayout>
  );
};
