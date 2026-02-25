import React, { useState, useEffect } from 'react';
import './index.css';

// Mock data based on real Notion structure from notion-ids.json
const MOCK_TASKS = [
  { id: 1, title: 'Follow up with school principal about pilot program', priority: 'P1', status: 'In Progress', due: '2026-02-20', project: 'Ark Academy' },
  { id: 2, title: 'Draft grant application', priority: 'P1', status: 'Todo', due: '2026-02-18', project: 'Oilyburger' },
  { id: 3, title: 'Review Woojoosnt proposal', priority: 'P0', status: 'Done', due: '2026-02-25', project: 'Woojoosnt' },
  { id: 4, title: 'Update website copy', priority: 'P2', status: 'Todo', due: '2026-02-28', project: 'Ark Academy' },
  { id: 5, title: 'Send invoice to client', priority: 'P1', status: 'Todo', due: '2026-02-15', project: 'Woojoosnt' },
  { id: 6, title: 'Schedule team meeting', priority: 'P2', status: 'In Progress', due: '2026-02-27', project: 'Ark Academy' },
  { id: 7, title: '[ALICE] Clean up duplicate tasks', priority: 'P1', status: 'Todo', due: '2026-02-13', project: 'Ops' },
  { id: 8, title: '[ALICE] Review overdue P1s', priority: 'P1', status: 'Todo', due: '2026-02-13', project: 'Ops' },
];

const MOCK_LEADS = [
  { id: 1, name: 'Seoul International School', status: 'Contacted', value: 50000, followUp: '2026-02-28' },
  { id: 2, name: '', status: 'New', value: 0, followUp: '2026-03-01' }, // Untitled - data quality issue
  { id: 3, name: 'Yonsei Academy', status: 'Negotiating', value: 75000, followUp: '2026-02-26' },
  { id: 4, name: '', status: 'New', value: 0, followUp: '2026-03-05' }, // Untitled - data quality issue
  { id: 5, name: 'Global Edu Partners', status: 'Qualified', value: 120000, followUp: '2026-02-27' },
];

const MOCK_GRANTS = [
  { id: 1, name: 'K-Startup Grant', status: 'Applied', amount: 50000000, deadline: '2026-03-15' },
  { id: 2, name: '', status: 'Research', amount: 0, deadline: '2026-04-01' }, // Untitled - data quality issue
  { id: 3, name: 'Seoul Innovation Fund', status: 'Drafting', amount: 30000000, deadline: '2026-03-01' },
  { id: 4, name: '', status: 'New', amount: 0, deadline: '2026-04-15' }, // Untitled - data quality issue
];

function App() {
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [countdown, setCountdown] = useState(60);

  // Auto-refresh countdown
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          setLastUpdated(new Date());
          return 60;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Task analytics
  const p0Tasks = MOCK_TASKS.filter(t => t.priority === 'P0');
  const p1Tasks = MOCK_TASKS.filter(t => t.priority === 'P1');
  const p2Tasks = MOCK_TASKS.filter(t => t.priority === 'P2');
  const overdueTasks = MOCK_TASKS.filter(t => {
    if (t.status === 'Done') return false;
    const due = new Date(t.due);
    return due < today;
  });

  // Data quality issues
  const untitledLeads = MOCK_LEADS.filter(l => !l.name || l.name === '');
  const untitledGrants = MOCK_GRANTS.filter(g => !g.name || g.name === '');
  const totalDataIssues = untitledLeads.length + untitledGrants.length;

  // Priority colors
  const getPriorityColor = (p) => {
    switch(p) {
      case 'P0': return 'bg-red-500 text-white';
      case 'P1': return 'bg-orange-500 text-white';
      case 'P2': return 'bg-yellow-500 text-black';
      default: return 'bg-gray-400 text-white';
    }
  };

  const getStatusColor = (s) => {
    switch(s) {
      case 'Done': return 'text-green-600 font-semibold';
      case 'In Progress': return 'text-blue-600';
      case 'Todo': return 'text-gray-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-slate-800 mb-2">Notion Ops Dashboard</h1>
              <p className="text-slate-500">Real-time visibility into tasks, leads, and data quality</p>
            </div>
            <div className="text-right">
              <div className="text-sm text-slate-500">
                Last updated: {lastUpdated.toLocaleTimeString()}
              </div>
              <div className="text-xs text-slate-400">
                Auto-refresh in {countdown}s
              </div>
            </div>
          </div>
        </div>

        {/* Alerts Banner */}
        {(overdueTasks.length > 0 || totalDataIssues > 0) && (
          <div className="mb-6 space-y-3">
            {overdueTasks.length > 0 && (
              <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-lg">
                <div className="flex items-center">
                  <span className="text-2xl mr-3">⚠️</span>
                  <div>
                    <p className="font-semibold text-red-800">
                      {overdueTasks.length} Overdue Task{overdueTasks.length !== 1 ? 's' : ''}
                    </p>
                    <p className="text-red-600 text-sm">
                      Including {overdueTasks.filter(t => t.priority === 'P1').length} P1 priority items
                    </p>
                  </div>
                </div>
              </div>
            )}
            {totalDataIssues > 0 && (
              <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-r-lg">
                <div className="flex items-center">
                  <span className="text-2xl mr-3">🔧</span>
                  <div>
                    <p className="font-semibold text-amber-800">
                      {totalDataIssues} Data Quality Issue{totalDataIssues !== 1 ? 's' : ''}
                    </p>
                    <p className="text-amber-600 text-sm">
                      {untitledLeads.length} untitled leads, {untitledGrants.length} untitled grants
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-red-500">
            <p className="text-sm text-slate-500 uppercase tracking-wide">P0 Tasks</p>
            <p className="text-3xl font-bold text-slate-800 mt-1">{p0Tasks.length}</p>
            <p className="text-xs text-slate-400 mt-2">Critical priority</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-orange-500">
            <p className="text-sm text-slate-500 uppercase tracking-wide">P1 Tasks</p>
            <p className="text-3xl font-bold text-slate-800 mt-1">{p1Tasks.length}</p>
            <p className="text-xs text-slate-400 mt-2">
              {overdueTasks.filter(t => t.priority === 'P1').length} overdue
            </p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-green-500">
            <p className="text-sm text-slate-500 uppercase tracking-wide">Active Leads</p>
            <p className="text-3xl font-bold text-slate-800 mt-1">
              {MOCK_LEADS.filter(l => l.status !== 'Closed').length}
            </p>
            <p className="text-xs text-slate-400 mt-2">{untitledLeads.length} need naming</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-blue-500">
            <p className="text-sm text-slate-500 uppercase tracking-wide">Grant Opportunities</p>
            <p className="text-3xl font-bold text-slate-800 mt-1">{MOCK_GRANTS.length}</p>
            <p className="text-xs text-slate-400 mt-2">{untitledGrants.length} untitled</p>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Tasks Section */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="bg-slate-50 px-6 py-4 border-b border-slate-200">
              <h2 className="text-lg font-semibold text-slate-800 flex items-center">
                <span className="mr-2">📋</span> Tasks Overview
              </h2>
            </div>
            <div className="p-6">
              <div className="space-y-3">
                {MOCK_TASKS.slice(0, 6).map(task => {
                  const dueDate = new Date(task.due);
                  const isOverdue = dueDate < today && task.status !== 'Done';
                  return (
                    <div 
                      key={task.id} 
                      className={`p-3 rounded-lg border ${isOverdue ? 'bg-red-50 border-red-200' : 'bg-slate-50 border-slate-100'}`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className={`text-sm font-medium ${isOverdue ? 'text-red-800' : 'text-slate-800'}`}>
                            {task.title}
                          </p>
                          <div className="flex items-center gap-3 mt-1 text-xs">
                            <span className={`px-2 py-0.5 rounded-full ${getPriorityColor(task.priority)}`}>
                              {task.priority}
                            </span>
                            <span className={getStatusColor(task.status)}>{task.status}</span>
                            <span className={isOverdue ? 'text-red-600 font-semibold' : 'text-slate-400'}>
                              Due: {task.due}
                            </span>
                          </div>
                        </div>
                        {isOverdue && <span className="text-red-500 text-xs font-bold">OVERDUE</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
              {MOCK_TASKS.length > 6 && (
                <p className="text-center text-sm text-slate-400 mt-4">
                  +{MOCK_TASKS.length - 6} more tasks
                </p>
              )}
            </div>
          </div>

          {/* Data Quality Section */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="bg-amber-50 px-6 py-4 border-b border-amber-200">
              <h2 className="text-lg font-semibold text-amber-900 flex items-center">
                <span className="mr-2">🔧</span> Data Quality Issues
              </h2>
            </div>
            <div className="p-6">
              {/* Untitled Leads */}
              {untitledLeads.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center">
                    <span className="w-2 h-2 bg-red-500 rounded-full mr-2"></span>
                    Untitled Leads ({untitledLeads.length})
                  </h3>
                  <div className="space-y-2">
                    {untitledLeads.map((lead, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-100">
                        <span className="text-sm text-red-700 italic">[Untitled Lead Entry]</span>
                        <span className="text-xs text-slate-500">Status: {lead.status}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Untitled Grants */}
              {untitledGrants.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center">
                    <span className="w-2 h-2 bg-orange-500 rounded-full mr-2"></span>
                    Untitled Grants ({untitledGrants.length})
                  </h3>
                  <div className="space-y-2">
                    {untitledGrants.map((grant, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 bg-orange-50 rounded-lg border border-orange-100">
                        <span className="text-sm text-orange-700 italic">[Untitled Grant Entry]</span>
                        <span className="text-xs text-slate-500">Status: {grant.status}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {totalDataIssues === 0 && (
                <div className="text-center py-8">
                  <span className="text-4xl">✅</span>
                  <p className="text-slate-500 mt-2">All data quality checks passed!</p>
                </div>
              )}
            </div>
          </div>

          {/* Leads Summary */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="bg-green-50 px-6 py-4 border-b border-green-200">
              <h2 className="text-lg font-semibold text-green-900 flex items-center">
                <span className="mr-2">🎯</span> Leads Pipeline
              </h2>
            </div>
            <div className="p-6">
              <div className="space-y-3">
                {MOCK_LEADS.filter(l => l.name).map(lead => (
                  <div key={lead.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                    <div>
                      <p className="font-medium text-slate-800">{lead.name}</p>
                      <p className="text-xs text-slate-500">Follow-up: {lead.followUp}</p>
                    </div>
                    <div className="text-right">
                      <span className="px-3 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                        {lead.status}
                      </span>
                      {lead.value > 0 && (
                        <p className="text-xs text-slate-600 mt-1">${(lead.value/1000).toFixed(0)}K</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Grants Summary */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="bg-blue-50 px-6 py-4 border-b border-blue-200">
              <h2 className="text-lg font-semibold text-blue-900 flex items-center">
                <span className="mr-2">💰</span> Grants Tracker
              </h2>
            </div>
            <div className="p-6">
              <div className="space-y-3">
                {MOCK_GRANTS.filter(g => g.name).map(grant => (
                  <div key={grant.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                    <div>
                      <p className="font-medium text-slate-800">{grant.name}</p>
                      <p className="text-xs text-slate-500">Deadline: {grant.deadline}</p>
                    </div>
                    <div className="text-right">
                      <span className={`px-3 py-1 text-xs rounded-full ${
                        grant.status === 'Applied' ? 'bg-green-100 text-green-800' :
                        grant.status === 'Drafting' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-slate-100 text-slate-800'
                      }`}>
                        {grant.status}
                      </span>
                      {grant.amount > 0 && (
                        <p className="text-xs text-slate-600 mt-1">₩{(grant.amount/1000000).toFixed(0)}M</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-slate-400">
          <p>Notion Ops Dashboard • Built for David Kim</p>
          <p className="mt-1">Data source: Notion Ops HQ (Mock Mode)</p>
        </div>
      </div>
    </div>
  );
}

export default App;