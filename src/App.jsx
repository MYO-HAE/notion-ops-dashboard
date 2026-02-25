import { useState, useEffect } from 'react'
import './index.css'

// Database IDs from notion-ids.json
const DB_IDS = {
  tasks: '2fced264-4bae-817c-9b81-f39008167d85',
  leads: '2fced264-4bae-816d-86ea-f69fc6cfc918',
  grants: '2fced264-4bae-81a8-af4b-f57359a7d868',
}

// Mock data for when Notion token is not available
const MOCK_DATA = {
  tasks: [
    { id: '1', title: 'Review Q1 Grant Applications', priority: 'P0', status: 'In Progress', dueDate: '2026-02-20', overdue: true },
    { id: '2', title: 'Update Investor Deck', priority: 'P0', status: 'Not Started', dueDate: '2026-02-28', overdue: false },
    { id: '3', title: 'Follow up with Alice Corp', priority: 'P1', status: 'Done', dueDate: '2026-02-25', overdue: false },
    { id: '4', title: 'Schedule team standup', priority: 'P1', status: 'In Progress', dueDate: '2026-02-15', overdue: true },
    { id: '5', title: 'Clean up Notion database', priority: 'P1', status: 'Not Started', dueDate: '2026-02-18', overdue: true },
    { id: '6', title: 'Research competitor analysis', priority: 'P2', status: 'Not Started', dueDate: '2026-03-01', overdue: false },
    { id: '7', title: 'Update documentation', priority: 'P2', status: 'Done', dueDate: '2026-02-25', overdue: false },
    { id: '8', title: 'Fix dashboard bug', priority: 'P1', status: 'Done', dueDate: '2026-02-25', overdue: false },
    { id: '9', title: 'Call potential partner', priority: 'P1', status: 'In Progress', dueDate: '2026-02-16', overdue: true },
    { id: '10', title: 'Prepare monthly report', priority: 'P1', status: 'Not Started', dueDate: '2026-02-19', overdue: true },
  ],
  leads: [
    { id: '1', title: 'Alice Corporation', status: 'Contacted', company: 'Alice Corp', value: 50000 },
    { id: '2', title: '', status: 'New', company: 'Unknown', value: 0, untitled: true },
    { id: '3', title: 'Bob Industries', status: 'Qualified', company: 'Bob Industries', value: 75000 },
    { id: '4', title: '', status: 'Contacted', company: 'Unknown', value: 0, untitled: true },
    { id: '5', title: 'Charlie Ventures', status: 'Negotiation', company: 'Charlie Ventures', value: 120000 },
  ],
  grants: [
    { id: '1', title: 'NSF SBIR Phase I', status: 'Submitted', amount: 275000, deadline: '2026-03-15' },
    { id: '2', title: '', status: 'Draft', amount: 0, deadline: '2026-04-01', untitled: true },
    { id: '3', title: 'DOE Clean Energy Grant', status: 'In Review', amount: 500000, deadline: '2026-02-28' },
    { id: '4', title: 'NIH R01 Research', status: 'Awarded', amount: 1500000, deadline: '2026-01-15' },
    { id: '5', title: '', status: 'Draft', amount: 0, deadline: '2026-05-01', untitled: true },
  ],
}

const cardClass = "bg-white/10 backdrop-blur-lg rounded-xl border border-white/20 p-6 shadow-xl";
const getBadgeClass = (priority) => {
  const base = "px-3 py-1 rounded-full text-xs font-semibold border ";
  switch(priority) {
    case 'P0': return base + "bg-red-500/20 text-red-300 border-red-500/30";
    case 'P1': return base + "bg-orange-500/20 text-orange-300 border-orange-500/30";
    case 'P2': return base + "bg-blue-500/20 text-blue-300 border-blue-500/30";
    default: return base + "bg-gray-500/20 text-gray-300 border-gray-500/30";
  }
};

function App() {
  const [data, setData] = useState({ tasks: [], leads: [], grants: [] })
  const [loading, setLoading] = useState(true)
  const [lastRefresh, setLastRefresh] = useState(new Date())
  const [usingMockData, setUsingMockData] = useState(false)
  const [error, setError] = useState(null)
  const [countdown, setCountdown] = useState(60)

  const fetchNotionData = async () => {
    const token = import.meta.env.VITE_NOTION_TOKEN
    
    if (!token) {
      console.log('No Notion token found, using mock data')
      setData(MOCK_DATA)
      setUsingMockData(true)
      setLoading(false)
      setLastRefresh(new Date())
      setCountdown(60)
      return
    }

    try {
      setLoading(true)
      setError(null)

      const headers = {
        'Authorization': `Bearer ${token}`,
        'Notion-Version': '2022-06-28',
        'Content-Type': 'application/json',
      }

      const [tasksRes, leadsRes, grantsRes] = await Promise.all([
        fetch(`https://api.notion.com/v1/databases/${DB_IDS.tasks}/query`, { method: 'POST', headers, body: JSON.stringify({ page_size: 100 }) }),
        fetch(`https://api.notion.com/v1/databases/${DB_IDS.leads}/query`, { method: 'POST', headers, body: JSON.stringify({ page_size: 100 }) }),
        fetch(`https://api.notion.com/v1/databases/${DB_IDS.grants}/query`, { method: 'POST', headers, body: JSON.stringify({ page_size: 100 }) }),
      ])

      const [tasksData, leadsData, grantsData] = await Promise.all([
        tasksRes.json(), leadsRes.json(), grantsRes.json(),
      ])

      const tasks = tasksData.results?.map(task => {
        const props = task.properties
        const title = props.Name?.title?.[0]?.text?.content || 'Untitled'
        const priority = props.Priority?.select?.name || 'P2'
        const status = props.Status?.select?.name || 'Not Started'
        const dueDate = props['Due Date']?.date?.start
        const isOverdue = dueDate && new Date(dueDate) < new Date() && status !== 'Done'
        return { id: task.id, title, priority, status, dueDate, overdue: isOverdue }
      }) || []

      const leads = leadsData.results?.map(lead => {
        const props = lead.properties
        const title = props.Name?.title?.[0]?.text?.content || ''
        const status = props.Status?.select?.name || 'New'
        const company = props.Company?.rich_text?.[0]?.text?.content || 'Unknown'
        const value = props.Value?.number || 0
        return { id: lead.id, title, status, company, value, untitled: !title }
      }) || []

      const grants = grantsData.results?.map(grant => {
        const props = grant.properties
        const title = props.Name?.title?.[0]?.text?.content || ''
        const status = props.Status?.select?.name || 'Draft'
        const amount = props.Amount?.number || 0
        const deadline = props.Deadline?.date?.start
        return { id: grant.id, title, status, amount, deadline, untitled: !title }
      }) || []

      setData({ tasks, leads, grants })
      setUsingMockData(false)
      setLastRefresh(new Date())
      setCountdown(60)
    } catch (err) {
      console.error('Error fetching Notion data:', err)
      setError('Failed to fetch Notion data. Using mock data.')
      setData(MOCK_DATA)
      setUsingMockData(true)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchNotionData()
    const interval = setInterval(fetchNotionData, 60000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown(prev => prev > 0 ? prev - 1 : 60)
    }, 1000)
    return () => clearInterval(timer)
  }, [lastRefresh])

  const taskStats = {
    total: data.tasks.length,
    p0: data.tasks.filter(t => t.priority === 'P0').length,
    p1: data.tasks.filter(t => t.priority === 'P1').length,
    p2: data.tasks.filter(t => t.priority === 'P2').length,
    overdue: data.tasks.filter(t => t.overdue).length,
    done: data.tasks.filter(t => t.status === 'Done').length,
  }

  const overdueTasks = data.tasks.filter(t => t.overdue).sort((a, b) => {
    if (a.priority === 'P0' && b.priority !== 'P0') return -1
    if (b.priority === 'P0' && a.priority !== 'P0') return 1
    return new Date(a.dueDate) - new Date(b.dueDate)
  })

  const untitledLeads = data.leads.filter(l => l.untitled)
  const untitledGrants = data.grants.filter(g => g.untitled)

  const leadsByStatus = data.leads.reduce((acc, lead) => {
    acc[lead.status] = (acc[lead.status] || 0) + 1
    return acc
  }, {})

  const grantsByStatus = data.grants.reduce((acc, grant) => {
    acc[grant.status] = (acc[grant.status] || 0) + 1
    return acc
  }, {})

  const totalPipeline = data.leads.reduce((sum, l) => sum + (l.value || 0), 0)
  const totalGrants = data.grants.reduce((sum, g) => sum + (g.amount || 0), 0)

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading Ops HQ data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-7xl mx-auto mb-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              Ops HQ Dashboard
            </h1>
            <p className="text-gray-400 mt-1">Real-time overview of Tasks, Leads, and Grants</p>
          </div>
          <div className="flex items-center gap-4 flex-wrap">
            {usingMockData && (
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-yellow-500/20 text-yellow-300 border border-yellow-500/30">
                Mock Data
              </span>
            )}
            <span className="text-sm text-gray-500">
              Refresh in: {countdown}s
            </span>
            <span className="text-sm text-gray-500">
              {lastRefresh.toLocaleTimeString()}
            </span>
            <button 
              onClick={fetchNotionData}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm font-medium"
            >
              Refresh Now
            </button>
          </div>
        </div>
        {error && (
          <div className="mt-4 p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-300">
            {error}
          </div>
        )}
      </div>

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className={cardClass}>
            <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
              <span className="w-2 h-2 bg-blue-400 rounded-full"></span>
              Task Overview
            </h2>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-white/5 rounded-lg p-4 text-center">
                <div className="text-3xl font-bold text-white">{taskStats.total}</div>
                <div className="text-sm text-gray-400">Total Tasks</div>
              </div>
              <div className="bg-red-500/10 rounded-lg p-4 text-center">
                <div className="text-3xl font-bold text-red-400">{taskStats.p0}</div>
                <div className="text-sm text-gray-400">P0 Critical</div>
              </div>
              <div className="bg-orange-500/10 rounded-lg p-4 text-center">
                <div className="text-3xl font-bold text-orange-400">{taskStats.p1}</div>
                <div className="text-sm text-gray-400">P1 High</div>
              </div>
              <div className="bg-green-500/10 rounded-lg p-4 text-center">
                <div className="text-3xl font-bold text-green-400">{taskStats.done}</div>
                <div className="text-sm text-gray-400">Completed</div>
              </div>
            </div>

            {overdueTasks.length > 0 && (
              <div className="mt-6">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-red-400">⚠️</span>
                  <h3 className="text-lg font-medium text-red-300">
                    Overdue Tasks ({overdueTasks.length})
                  </h3>
                </div>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {overdueTasks.map(task => (
                    <div 
                      key={task.id} 
                      className="flex items-center justify-between p-3 bg-red-500/10 border border-red-500/20 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <span className={getBadgeClass(task.priority)}>{task.priority}</span>
                        <span className="text-sm">{task.title}</span>
                      </div>
                      <span className="text-xs text-red-400">
                        Due: {new Date(task.dueDate).toLocaleDateString()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {(untitledLeads.length > 0 || untitledGrants.length > 0) && (
            <div className={`${cardClass} border-yellow-500/30`}>
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <span className="text-yellow-400">🔍</span>
                Data Quality Alerts
              </h2>
              
              {untitledLeads.length > 0 && (
                <div className="mb-4">
                  <h3 className="text-sm font-medium text-yellow-300 mb-2">
                    Untitled Leads ({untitledLeads.length})
                  </h3>
                  <div className="space-y-2">
                    {untitledLeads.map(lead => (
                      <div key={lead.id} className="flex items-center justify-between p-2 bg-yellow-500/10 rounded text-sm">
                        <span className="text-gray-400 italic">Untitled entry</span>
                        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-gray-500/20 text-gray-300">{lead.status}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {untitledGrants.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-yellow-300 mb-2">
                    Untitled Grants ({untitledGrants.length})
                  </h3>
                  <div className="space-y-2">
                    {untitledGrants.map(grant => (
                      <div key={grant.id} className="flex items-center justify-between p-2 bg-yellow-500/10 rounded text-sm">
                        <span className="text-gray-400 italic">Untitled entry</span>
                        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-gray-500/20 text-gray-300">{grant.status}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className={cardClass}>
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <span className="w-2 h-2 bg-green-400 rounded-full"></span>
              Leads Pipeline
            </h2>
            
            <div className="text-center mb-6">
              <div className="text-4xl font-bold text-green-400">
                ${(totalPipeline / 1000).toFixed(0)}k
              </div>
              <div className="text-sm text-gray-400">Total Pipeline Value</div>
            </div>

            <div className="space-y-2">
              {Object.entries(leadsByStatus).map(([status, count]) => (
                <div key={status} className="flex items-center justify-between p-2 bg-white/5 rounded">
                  <span className="text-sm">{status}</span>
                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/20 text-blue-300">{count}</span>
                </div>
              ))}
            </div>

            <div className="mt-4 pt-4 border-t border-white/10">
              <div className="text-sm text-gray-400">
                Total Leads: <span className="text-white font-semibold">{data.leads.length}</span>
              </div>
            </div>
          </div>

          <div className={cardClass}>
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <span className="w-2 h-2 bg-purple-400 rounded-full"></span>
              Grants Tracker
            </h2>
            
            <div className="text-center mb-6">
              <div className="text-4xl font-bold text-purple-400">
                ${(totalGrants / 1000000).toFixed(2)}M
              </div>
              <div className="text-sm text-gray-400">Total Grant Value</div>
            </div>

            <div className="space-y-2">
              {Object.entries(grantsByStatus).map(([status, count]) => (
                <div key={status} className="flex items-center justify-between p-2 bg-white/5 rounded">
                  <span className="text-sm">{status}</span>
                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-purple-500/20 text-purple-300">{count}</span>
                </div>
              ))}
            </div>

            <div className="mt-4 pt-4 border-t border-white/10">
              <div className="text-sm text-gray-400">
                Total Grants: <span className="text-white font-semibold">{data.grants.length}</span>
              </div>
            </div>
          </div>

          <div className={cardClass}>
            <h2 className="text-lg font-semibold mb-4">Quick Links</h2>
            <div className="space-y-2">
              <a 
                href="https://www.notion.so/s7yle/Ops-HQ-2fced2644bae8073b1a3ebc327ab67ee"
                target="_blank"
                rel="noopener noreferrer"
                className="block p-3 bg-white/5 hover:bg-white/10 rounded-lg transition-colors text-sm"
              >
                📋 Open Ops HQ in Notion →
              </a>
              <div className="text-xs text-gray-500 mt-2">
                Auto-refreshes every 60 seconds
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default App
