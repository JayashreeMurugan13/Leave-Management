import { useEffect, useState } from 'react';
import { useAuthStore } from '../../store/useAuthStore';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, FileCheck, AlertTriangle, Plus, X, CheckCircle2, Clock } from 'lucide-react';
import axios from 'axios';

const LEAVE_TYPES = ['CL', 'SL', 'EL'];

function ApprovalChain({ leave }: { leave: any }) {
  const isEscalated = leave.reason?.includes('HOD_ESCALATED');
  const applicantRole: string = leave.user?.role || 'STUDENT';

  const fullChain: string[] =
    applicantRole === 'HOD' ? ['PRINCIPAL'] :
    applicantRole === 'PROFESSOR' ? (isEscalated ? ['PRINCIPAL'] : ['HOD', 'PRINCIPAL']) :
    isEscalated ? ['PROFESSOR', 'PRINCIPAL'] : ['PROFESSOR', 'HOD'];

  const approvedRoles = leave.approvals?.map((a: any) => a.approver.role) || [];

  return (
    <div className="mt-2">
      <div className="flex items-center gap-1 flex-wrap">
        {fullChain.map((role, i) => {
          const done = approvedRoles.includes(role);
          const isCurrent = leave.currentApproverRole === role;
          return (
            <span key={role} className="flex items-center gap-1">
              {i > 0 && <span className="text-gray-400 text-xs">→</span>}
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                done ? 'bg-green-100 text-green-700' :
                isCurrent ? 'bg-yellow-100 text-yellow-700 animate-pulse' :
                'bg-gray-100 text-gray-500'
              }`}>
                {done ? '✔' : isCurrent ? '⏳' : '○'} {role}
              </span>
            </span>
          );
        })}
      </div>
      {isEscalated && (
        <span className="mt-1 inline-flex items-center gap-1 text-xs text-amber-600 font-medium">
          <AlertTriangle size={11} /> HOD unavailable – escalated to Principal
        </span>
      )}
    </div>
  );
}

export const StudentDashboard = () => {
  const { user } = useAuthStore();
  const [stats, setStats] = useState<any>(null);
  const [leaves, setLeaves] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ startDate: '', endDate: '', type: 'CL', reason: '' });
  const [submitting, setSubmitting] = useState(false);
  const [applyMsg, setApplyMsg] = useState('');

  const fetchData = async () => {
    const [s, l] = await Promise.all([
      axios.get('/api/leaves/stats', { withCredentials: true }),
      axios.get('/api/leaves/my', { withCredentials: true }),
    ]);
    setStats(s.data.data);
    setLeaves(l.data.data.leaves);
  };

  useEffect(() => { fetchData(); }, []);

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setApplyMsg('');
    try {
      const res = await axios.post('/api/leaves/apply', form, { withCredentials: true });
      setApplyMsg(res.data.message);
      await fetchData();
      setTimeout(() => { setShowModal(false); setApplyMsg(''); }, 2000);
    } catch (err: any) {
      setApplyMsg(err.response?.data?.message || 'Failed to apply.');
    } finally {
      setSubmitting(false);
    }
  };

  const currentYear = new Date().getFullYear();
  const trendData = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'].map((m, i) => ({
    name: m,
    count: leaves
      .filter((l) => {
        const d = new Date(l.createdAt);
        return d.getFullYear() === currentYear && d.getMonth() === i && l.status === 'APPROVED';
      })
      .reduce((sum: number, l: any) => {
        const days = Math.ceil(Math.abs(new Date(l.endDate).getTime() - new Date(l.startDate).getTime()) / (1000 * 60 * 60 * 24)) + 1;
        return sum + days;
      }, 0),
  }));

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      {stats?.hodAbsent && (
        <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl px-4 py-3 text-sm font-medium">
          <AlertTriangle size={16} className="shrink-0" />
          HOD is currently on leave. Any new request will be escalated directly to the Principal.
        </div>
      )}

      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-extrabold text-brand-900 tracking-tight">Student Dashboard</h2>
          <p className="text-gray-500 mt-1">Welcome back, {user?.name}.</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus size={16} /> Apply for Leave
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: 'Leave Balance', value: stats?.leaveBalance ?? user?.leaveBalance ?? '—', color: 'bg-green-100 text-green-600', icon: <CheckCircle2 size={20} /> },
          { label: 'Pending', value: stats?.myPending ?? '—', color: 'bg-yellow-100 text-yellow-600', icon: <AlertCircle size={20} /> },
          { label: 'Approved', value: stats?.myApproved ?? '—', color: 'bg-primary-100 text-primary-600', icon: <FileCheck size={20} /> },
          { label: 'Rejected', value: stats?.myRejected ?? '—', color: 'bg-red-100 text-red-500', icon: <X size={20} /> },
        ].map((s) => (
          <div key={s.label} className="bg-white/70 backdrop-blur-md rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col items-center">
            <div className={`h-12 w-12 rounded-full ${s.color} flex items-center justify-center mb-3`}>
              {s.icon}
            </div>
            <span className="font-bold text-xl text-gray-900">{s.value}</span>
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wide mt-1">{s.label}</span>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h3 className="font-bold text-gray-800 mb-6">Approved Leave Days (This Year)</h3>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip cursor={{ fill: '#f3f4f6' }} />
                <Bar dataKey="count" fill="#4f46e5" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h3 className="font-bold text-gray-800 mb-4">Recent Applications</h3>
          <div className="space-y-4 max-h-64 overflow-y-auto pr-1">
            {leaves.length === 0 && <p className="text-sm text-gray-400">No leaves applied yet.</p>}
            {leaves.slice(0, 5).map((leave) => (
              <div key={leave.id} className="border-l-2 border-primary-200 pl-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-gray-900">{leave.leaveType} — {leave.reason?.replace(' [HOD_ESCALATED]', '')}</span>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                    leave.status === 'APPROVED' ? 'bg-green-100 text-green-700' :
                    leave.status === 'REJECTED' ? 'bg-red-100 text-red-600' :
                    'bg-yellow-100 text-yellow-700'
                  }`}>{leave.status}</span>
                </div>
                <p className="text-xs text-gray-400 mt-0.5">
                  {new Date(leave.startDate).toLocaleDateString()} – {new Date(leave.endDate).toLocaleDateString()}
                </p>
                <ApprovalChain leave={leave} />
              </div>
            ))}
          </div>
        </div>
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

              {stats?.hodAbsent && (
                <div className="mb-4 flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-700 rounded-lg px-3 py-2 text-xs font-medium">
                  <AlertTriangle size={13} /> HOD is on leave — your request will go directly to Principal.
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
                {applyMsg && (
                  <p className={`text-sm font-medium ${applyMsg.includes('failed') || applyMsg.includes('Failed') ? 'text-red-600' : 'text-green-600'}`}>
                    {applyMsg}
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
    </motion.div>
  );
};
