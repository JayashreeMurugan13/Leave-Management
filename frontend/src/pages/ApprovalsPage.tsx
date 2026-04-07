import { useEffect, useState } from 'react';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { Check, X } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import axios from 'axios';

export const ApprovalsPage = () => {
  const { user } = useAuthStore();
  const [leaves, setLeaves] = useState<any[]>([]);
  const [actionMsg, setActionMsg] = useState('');

  const fetchLeaves = async () => {
    const res = await axios.get('/api/leaves/pending', { withCredentials: true });
    setLeaves(res.data.data.leaves);
  };

  useEffect(() => { fetchLeaves(); }, []);

  const handleAction = async (id: string, action: 'approve' | 'reject') => {
    try {
      await axios.put(`/api/leaves/${id}/${action}`, {}, { withCredentials: true });
      setActionMsg(`Leave ${action}d successfully.`);
      await fetchLeaves();
      setTimeout(() => setActionMsg(''), 3000);
    } catch (err: any) {
      setActionMsg(err.response?.data?.message || 'Action failed.');
    }
  };

  if (user?.role === 'STUDENT') {
    return (
      <DashboardLayout>
        <div className="bg-red-50 border border-red-200 text-red-700 p-6 rounded-xl">
          You are not authorized to view this page.
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Pending Approvals</h1>
        <p className="text-gray-500 mt-1">Review leave applications routed to you.</p>
      </div>

      {actionMsg && (
        <div className="mb-4 bg-green-50 border border-green-200 text-green-700 rounded-xl px-4 py-3 text-sm font-medium">
          {actionMsg}
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {leaves.length === 0 ? (
          <p className="px-6 py-10 text-sm text-gray-400">No pending requests.</p>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {['Applicant', 'Role', 'Leave Details', 'Reason', 'Actions'].map((h) => (
                  <th key={h} className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {leaves.map((leave) => (
                <tr key={leave.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <p className="text-sm font-bold text-gray-900">{leave.user.name}</p>
                    <p className="text-xs text-gray-400">{leave.user.department}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                      leave.user.role === 'STUDENT'   ? 'bg-sky-100 text-sky-700' :
                      leave.user.role === 'PROFESSOR' ? 'bg-emerald-100 text-emerald-700' :
                      'bg-amber-100 text-amber-700'
                    }`}>{leave.user.role}</span>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm font-medium text-gray-900">{leave.leaveType}</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {new Date(leave.startDate).toLocaleDateString()} – {new Date(leave.endDate).toLocaleDateString()}
                    </p>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                    {leave.reason?.replace(' [HOD_ESCALATED]', '')}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleAction(leave.id, 'approve')}
                        className="p-1.5 text-green-600 hover:text-white bg-green-50 hover:bg-green-600 rounded transition-colors"
                        title="Approve"
                      >
                        <Check size={18} />
                      </button>
                      <button
                        onClick={() => handleAction(leave.id, 'reject')}
                        className="p-1.5 text-red-600 hover:text-white bg-red-50 hover:bg-red-600 rounded transition-colors"
                        title="Reject"
                      >
                        <X size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </DashboardLayout>
  );
};
