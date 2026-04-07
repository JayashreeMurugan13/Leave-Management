import { ArrowRight, ShieldCheck, Layers } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const LandingPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-white flex flex-col font-sans">
      {/* Navbar */}
      <nav className="h-20 flex items-center justify-between px-10 border-b border-gray-100 bg-white/80 backdrop-blur-md fixed top-0 w-full z-50">
        <div className="font-bold text-2xl tracking-tight text-brand-900 flex items-center gap-2">
          <div className="w-8 h-8 bg-primary-600 rounded flex items-center justify-center text-white">
            <Layers size={18} />
          </div>
          NexusLeave
        </div>
        <div>
          <button 
            onClick={() => navigate('/login')}
            className="text-gray-600 hover:text-brand-900 font-medium px-4 py-2 transition-colors mr-2"
          >
            Portal Login
          </button>
          <button 
            onClick={() => navigate('/login')}
            className="btn-primary"
          >
            Get Started
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="flex-1 mt-20 flex flex-col">
        <section className="px-10 py-24 flex-1 flex flex-col items-center justify-center text-center max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary-50 text-primary-700 rounded-full text-sm font-semibold tracking-wide mb-8 border border-primary-100">
            <ShieldCheck size={16} /> Enterprise Grade Architecture
          </div>
          <h1 className="text-5xl md:text-7xl font-extrabold text-brand-900 leading-tight tracking-tight mb-8">
            The Modern Standard for <span className="text-primary-600">Institutional Leave</span> Management.
          </h1>
          <p className="text-xl text-gray-500 mb-10 max-w-2xl leading-relaxed">
            A strictly professional, secure, and hierarchy-driven leave approval system designed for modern universities and enterprise colleges.
          </p>
          <div className="flex gap-4">
            <button 
              onClick={() => navigate('/login')}
              className="px-8 py-3.5 bg-brand-900 text-white rounded font-medium text-lg hover:bg-brand-800 transition-colors shadow-lg flex items-center gap-2"
            >
              Access Portal <ArrowRight size={20} />
            </button>
          </div>
        </section>

        {/* Features Minimalist */}
        <section className="bg-brand-50 border-t border-brand-100 py-20 px-10">
          <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-12">
            <div>
              <div className="w-12 h-12 bg-white rounded shadow-sm flex items-center justify-center text-primary-600 mb-6 font-bold">1</div>
              <h3 className="text-xl font-bold text-brand-900 mb-3">Hierarchical Approvals</h3>
              <p className="text-gray-600 leading-relaxed">Multi-level authorization workflows connecting Students, Professors, HODs, and Principals seamlessly.</p>
            </div>
            <div>
              <div className="w-12 h-12 bg-white rounded shadow-sm flex items-center justify-center text-primary-600 mb-6 font-bold">2</div>
              <h3 className="text-xl font-bold text-brand-900 mb-3">Smart Policy Engine</h3>
              <p className="text-gray-600 leading-relaxed">Automated checks against exam schedules, events, and department overlap to prevent critical shortages.</p>
            </div>
            <div>
              <div className="w-12 h-12 bg-white rounded shadow-sm flex items-center justify-center text-primary-600 mb-6 font-bold">3</div>
              <h3 className="text-xl font-bold text-brand-900 mb-3">Audit Ready</h3>
              <p className="text-gray-600 leading-relaxed">Comprehensive tracking with granular role-based access control and immutable transaction logs.</p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};
