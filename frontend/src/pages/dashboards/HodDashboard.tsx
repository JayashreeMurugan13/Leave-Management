import { useEffect, useState } from 'react';
import { useAuthStore } from '../../store/useAuthStore';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, XCircle, Clock, AlertTriangle, CalendarX, Plus, X, Trash2, Info } from 'lucide-react';
import api from '../../lib/api';

const EVENT_TYPES = ['EXAM', 'RESTRICTED', 'HOLIDAY', 'EVENT'];
const EVENT_BADGE: Record<string, string> = {
  EXAM: 'bg-red-100 text-red-700', RESTRICTED: 'bg-orange-100 text-orange-700',
  HOLIDAY: 'bg-green-100 text-green-700', EVENT: 'bg-blue-100 text-blue-700',
};

export const HodDashboard = () => {
  const { user } = useAuthStore();
  const [stats, setStats]   = useState<any>(null);
  const [leaves, setLeaves] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [actionMsg, setActionMsg] = useState('');
  const [showEventModal, setShowEventModal] = useState(false);
  const [eventForm, setEventForm] = useState({ title: '', date: '', type: 'EXAM' });
  const [eventMsg, setEventMsg]   = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchData = async () => {
    const [s, l, e] = await Promise.all([
      api.get('/api/leaves/stats',   { withCredentials: true }),
      api.get('/api/leaves/pending', { withCredentials: true }),
      api.get('/api/events',         { withCredentials: true }),
    ]);
    setStats(s.data.data);
    setLeaves(l.data.data.leaves);
    setEvents(e.data.data.events);
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

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true); setEventMsg('');
    try {
      const res = await api.post('/api/events', eventForm, { withCredentials: true });
      const { cancelledCount } = res.data.data;
      setEventMsg(cancelledCount > 0 ? `✅ Event created. ${cancelledCount} leave(s) auto-cancelled.` : '✅ Event created.');
      await fetchData();
      setTimeout(() => { setShowEventModal(false); setEventMsg(''); setEventForm({ title: '', date: '', type: 'EXAM' }); }, 2500);
    } catch (err: any) {
      setEventMsg(err.response?.data?.message || 'Failed.');
    } finally { setSubmitting(false); }
  };

  const handleDeleteEvent = async (id: string) => {
    await api.delete(`/api/events/${id}`, { withCredentials: true });
    await fetchData();
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div>
        <h2 className="text-3xl font-extrabold text-brand-900 tracking-tight">HOD Dashboard</h2>
        <p className="text-gray-500 mt-1">Department: {user?.department}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: 'Pending Approvals', value: stats?.pending      ?? '—', color: 'bg-yellow-100 text-yellow-600', icon: <Clock size={22} /> },
          { label: 'Total Approved',    value: stats?.totalApproved ?? '—', color: 'bg-green-100 text-green-600',  icon: <CheckCircle2 size={22} /> },
          { label: 'Total Rejected',    value: stats?.totalRejected ?? '—', color: 'bg-red-100 text-red-500',      icon: <XCircle size={22} /> },
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
        <div className={`border rounded-xl px-4 py-3 text-sm font-medium ${actionMsg.includes('failed') || actionMsg.includes('permission') ? 'bg-red-50 border-red-200 text-red-700' : 'bg-green-50 border-green-200 text-green-700'}`}>
          {actionMsg}
        </div>
      )}

      {/* All Pending Leaves */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="font-bold text-gray-800">All Pending Leave Requests</h3>
          <p className="text-xs text-gray-400 mt-0.5">Shows student & professor leaves. If professor is on leave during student's leave dates, you can act directly.</p>
        </div>
        {leaves.length === 0 ? (
          <p className="px-6 py-8 text-sm text-gray-400">No pending requests.</p>
        ) : (
          <table className="min-w-full divide-y divide-gray-100">
            <thead className="bg-gray-50">
              <tr>
                {['Applicant', 'Role', 'Type', 'Dates', 'Reason', 'Status', 'Actions'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {leaves.map((leave) => {
                const isEscalated = leave.reason?.includes('HOD_ESCALATED');
                return (
                  <tr key={leave.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-4">
                      <p className="text-sm font-bold text-gray-900">{leave.user.name}</p>
                      <p className="text-xs text-gray-400">{leave.user.department}</p>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                        leave.user.role === 'PROFESSOR' ? 'bg-emerald-100 text-emerald-700' : 'bg-sky-100 text-sky-700'
                      }`}>{leave.user.role}</span>
                    </td>
                    <td className="px-4 py-4 text-sm font-medium text-gray-700">{leave.leaveType}</td>
                    <td className="px-4 py-4 text-sm text-gray-500 whitespace-nowrap">
                      {new Date(leave.startDate).toLocaleDateString()} – {new Date(leave.endDate).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-500 max-w-[150px] truncate">
                      {leave.reason?.replace(' [HOD_ESCALATED]', '')}
                    </td>
                    <td className="px-4 py-4">
                      {leave.canAct ? (
                        leave.currentApproverRole !== user?.role ? (
                          <span className="text-xs font-semibold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full flex items-center gap-1 w-fit">
                            <AlertTriangle size={10} /> Prof absent – act now
                          </span>
                        ) : (
                          <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full w-fit">Your turn</span>
                        )
                      ) : (
                        <span className="text-xs text-gray-400 flex items-center gap-1">
                          <Info size={11} /> Awaiting {leave.currentApproverRole}
                        </span>
                      )}
                      {isEscalated && (
                        <span className="text-xs text-amber-600 flex items-center gap-1 mt-0.5">
                          <AlertTriangle size={10} /> Escalated
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      {leave.canAct ? (
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

      {/* Events Panel */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CalendarX size={18} className="text-red-500" />
            <h3 className="font-bold text-gray-800">Exam & Event Calendar</h3>
          </div>
          <button onClick={() => setShowEventModal(true)}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold bg-brand-900 text-white rounded-lg hover:bg-brand-800 transition-colors">
            <Plus size={15} /> Add Event
          </button>
        </div>
        <div className="p-6">
          {events.length === 0 ? <p className="text-sm text-gray-400">No events scheduled.</p> : (
            <div className="space-y-3">
              {events.map((ev) => (
                <div key={ev.id} className="flex items-center justify-between p-3 rounded-xl border border-gray-100 bg-gray-50">
                  <div className="flex items-center gap-3">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${EVENT_BADGE[ev.type] ?? 'bg-gray-100 text-gray-600'}`}>{ev.type}</span>
                    <span className="text-sm font-semibold text-gray-800">{ev.title}</span>
                    <span className="text-xs text-gray-400">{new Date(ev.date).toLocaleDateString()}</span>
                  </div>
                  <button onClick={() => handleDeleteEvent(ev.id)} className="text-gray-300 hover:text-red-500 transition-colors"><Trash2 size={16} /></button>
                </div>
              ))}
            </div>
          )}
          <p className="mt-4 text-xs text-gray-400 flex items-center gap-1">
            <AlertTriangle size={11} /> EXAM or RESTRICTED events auto-cancel all overlapping leaves.
          </p>
        </div>
      </div>

      {/* Add Event Modal */}
      <AnimatePresence>
        {showEventModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-gray-900">Add Exam / Event</h3>
                <button onClick={() => setShowEventModal(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
              </div>
              <div className="mb-4 bg-red-50 border border-red-100 text-red-700 rounded-lg px-3 py-2 text-xs font-medium">
                ⚠ EXAM or RESTRICTED events will automatically cancel all overlapping leaves.
              </div>
              <form onSubmit={handleCreateEvent} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Event Title</label>
                  <input type="text" required className="input-field text-sm" placeholder="e.g. Mid Semester Exam"
                    value={eventForm.title} onChange={(e) => setEventForm({ ...eventForm, title: e.target.value })} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Date</label>
                  <input type="date" required className="input-field text-sm"
                    value={eventForm.date} onChange={(e) => setEventForm({ ...eventForm, date: e.target.value })} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Type</label>
                  <select className="input-field text-sm" value={eventForm.type}
                    onChange={(e) => setEventForm({ ...eventForm, type: e.target.value })}>
                    {EVENT_TYPES.map((t) => <option key={t}>{t}</option>)}
                  </select>
                </div>
                {eventMsg && <p className={`text-sm font-medium ${eventMsg.startsWith('✅') ? 'text-green-600' : 'text-red-600'}`}>{eventMsg}</p>}
                <button type="submit" disabled={submitting} className="w-full btn-primary">
                  {submitting ? 'Creating...' : 'Create Event'}
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
