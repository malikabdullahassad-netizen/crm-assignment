import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import LeadForm from '../components/LeadForm';
import Navbar from '../components/Navbar';
import LeadTable from '../components/LeadTable';
import API from '../api/axios';
import './Dashboard.css';

type LeadStatus = 'new' | 'contacted' | 'converted';

interface Lead {
  _id: string;
  name: string;
  email: string;
  phone: string;
  status: LeadStatus;
  assignedTo: string;
  createdAt: string;
}

type LeadDraft = Omit<Lead, '_id' | 'createdAt'>;

interface ContactPerson {
  _id: string;
  name: string;
}

interface LeadReport {
  generatedAt: string;
  filters: {
    status: string;
    search: string;
    assignedTo: string;
    from: string | null;
    to: string | null;
  };
  summary: {
    total: number;
    new: number;
    contacted: number;
    converted: number;
    conversionRate: number;
  };
  byAssignee: Array<{
    assignedTo: string;
    total: number;
    converted: number;
  }>;
  leads: Lead[];
}

const EMPTY_REPORT_FILTERS = {
  status: 'all',
  search: '',
  assignedTo: 'all',
  from: '',
  to: '',
};

const formatStatus = (status: string) => {
  if (status === 'all') {
    return 'All statuses';
  }

  return status.charAt(0).toUpperCase() + status.slice(1);
};

const formatDateTime = (date: string) =>
  new Intl.DateTimeFormat('en', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(date));

const escapeCsvCell = (value: string | number | null | undefined) => {
  const stringValue = value === null || value === undefined ? '' : String(value);

  if (/[",\n]/.test(stringValue)) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }

  return stringValue;
};

const buildReportCsv = (report: LeadReport, user: { name: string; email: string } | null) => {
  const rows: Array<Array<string | number | null | undefined>> = [
    ['CRM Lead Report'],
    [],
    ['Report Details', 'User Name', 'User Email', 'Generated At'],
    [
      '',
      user?.name || 'Unknown',
      user?.email || 'Unknown',
      formatDateTime(report.generatedAt),
    ],
    [],
    ['Filters', 'Status Filter', 'Search Filter', 'Assigned To Filter', 'From Date', 'To Date'],
    [
      '',
      formatStatus(report.filters.status),
      report.filters.search || 'None',
      report.filters.assignedTo === 'all' ? 'All' : report.filters.assignedTo,
      report.filters.from || 'Any',
      report.filters.to || 'Any',
    ],
    [],
    ['Summary', 'Total Leads', 'New Leads', 'Contacted Leads', 'Converted Leads', 'Conversion Rate'],
    [
      '',
      report.summary.total,
      report.summary.new,
      report.summary.contacted,
      report.summary.converted,
      `${report.summary.conversionRate}%`,
    ],
    [],
    ['Top Assignees'],
    ['Assigned To', 'Total Leads', 'Converted Leads'],
    ...report.byAssignee.map((assignee) => [assignee.assignedTo, assignee.total, assignee.converted]),
    [],
    ['Leads'],
    ['Name', 'Email', 'Phone', 'Assigned To', 'Status', 'Created At'],
    ...report.leads.map((lead) => [
      lead.name,
      lead.email,
      lead.phone,
      lead.assignedTo,
      formatStatus(lead.status),
      formatDateTime(lead.createdAt),
    ]),
  ];

  return rows.map((row) => row.map(escapeCsvCell).join(',')).join('\n');
};

export default function Dashboard() {
  const { user } = useAuth();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [contactPersons, setContactPersons] = useState<ContactPerson[]>([]);
  const [newContactPerson, setNewContactPerson] = useState('');
  const [contactPersonError, setContactPersonError] = useState('');
  const [report, setReport] = useState<LeadReport | null>(null);
  const [reportFilters, setReportFilters] = useState(EMPTY_REPORT_FILTERS);
  const [generatingReport, setGeneratingReport] = useState(false);
  const [reportError, setReportError] = useState('');

  const stats = useMemo(() => {
    const total = leads.length;
    const newCount = leads.filter((lead) => lead.status === 'new').length;
    const contactedCount = leads.filter((lead) => lead.status === 'contacted').length;
    const convertedCount = leads.filter((lead) => lead.status === 'converted').length;

    return { total, newCount, contactedCount, convertedCount };
  }, [leads]);

  const assigneeNames = useMemo(() => {
    const names = new Set<string>();

    contactPersons.forEach((person) => names.add(person.name));
    leads.forEach((lead) => {
      if (lead.assignedTo && lead.assignedTo !== 'Unassigned') {
        names.add(lead.assignedTo);
      }
    });

    return Array.from(names).sort((first, second) => first.localeCompare(second));
  }, [contactPersons, leads]);

  const isReportFiltered = useMemo(
    () =>
      reportFilters.status !== 'all' ||
      reportFilters.search.trim() !== '' ||
      reportFilters.assignedTo !== 'all' ||
      Boolean(reportFilters.from) ||
      Boolean(reportFilters.to),
    [reportFilters],
  );

  const fetchLeads = async () => {
    try {
      const response = await API.get('/leads', {
        params: { page, limit: 10, status: statusFilter, search },
      });
      setLeads(response.data.leads);
      setTotalPages(response.data.totalPages || 1);
    } catch (error) {
      console.error('Failed to fetch leads', error);
    }
  };

  const fetchContactPersons = async () => {
    try {
      const response = await API.get<ContactPerson[]>('/contact-persons');
      setContactPersons(response.data);
    } catch (error) {
      console.error('Failed to fetch contact persons', error);
    }
  };

  useEffect(() => {
    fetchContactPersons();
  }, []);

  useEffect(() => {
    fetchLeads();
  }, [page, statusFilter]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setPage(1);
      fetchLeads();
    }, 300);

    return () => clearTimeout(timeout);
  }, [search]);

  const handleAddLead = async (lead: { name: string; email: string; phone: string; status: string; assignedTo: string }) => {
    await API.post('/leads', lead);
    setReport(null);
    setPage(1);
    fetchLeads();
  };

  const handleDeleteLead = async (id: string) => {
    await API.delete(`/leads/${id}`);
    setReport(null);
    fetchLeads();
  };

  const handleStatusChange = async (id: string, status: string) => {
    await API.put(`/leads/${id}`, { status });
    setReport(null);
    fetchLeads();
  };

  const handleAssignChange = async (id: string, assignedTo: string) => {
    await API.put(`/leads/${id}`, { assignedTo });
    setReport(null);
    fetchLeads();
  };

  const handleUpdateLead = async (id: string, lead: LeadDraft) => {
    await API.put(`/leads/${id}`, lead);
    setReport(null);
    fetchLeads();
  };

  const handleAddContactPerson = async (event: React.FormEvent) => {
    event.preventDefault();
    setContactPersonError('');

    try {
      const response = await API.post<ContactPerson>('/contact-persons', {
        name: newContactPerson,
      });
      setContactPersons((current) => [...current, response.data].sort((first, second) => first.name.localeCompare(second.name)));
      setNewContactPerson('');
    } catch (error) {
      console.error('Failed to add contact person', error);
      setContactPersonError('Unable to add this person.');
    }
  };

  const handleDeleteContactPerson = async (id: string) => {
    await API.delete(`/contact-persons/${id}`);
    setContactPersons((current) => current.filter((person) => person._id !== id));
  };

  const updateReportFilter = (key: keyof typeof reportFilters, value: string) => {
    setReportFilters((current) => ({ ...current, [key]: value }));
  };

  const handleResetReportFilters = () => {
    setReportFilters(EMPTY_REPORT_FILTERS);
    setReport(null);
    setReportError('');
  };

  const handleGenerateReport = async () => {
    if (reportFilters.from && reportFilters.to && reportFilters.from > reportFilters.to) {
      setReportError('From date cannot be after to date.');
      return;
    }

    setGeneratingReport(true);
    setReportError('');

    try {
      const response = await API.get<LeadReport>('/leads/report', {
        params: {
          status: reportFilters.status,
          search: reportFilters.search || undefined,
          assignedTo: reportFilters.assignedTo === 'all' ? undefined : reportFilters.assignedTo,
          from: reportFilters.from || undefined,
          to: reportFilters.to || undefined,
        },
      });
      setReport(response.data);
    } catch (error) {
      console.error('Failed to generate report', error);
      setReportError('Unable to generate report right now.');
    } finally {
      setGeneratingReport(false);
    }
  };

  const handleDownloadReport = () => {
    if (!report) {
      return;
    }

    const csv = buildReportCsv(report, user);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const date = new Date(report.generatedAt).toISOString().slice(0, 10);

    link.href = url;
    link.download = `lead-report-${date}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="dashboard-shell">
      <Navbar />

      <main className="dashboard-main">
        <header className="dashboard-header">
          <div>
            <h1>Leads Dashboard</h1>
            <p>Welcome back{user?.name ? `, ${user.name}` : ''}. Here's what's happening with your pipeline.</p>
          </div>
        </header>

        <section className="stats-grid">
          <div className="stat-card card">
            <span>Total Leads</span>
            <strong>{stats.total}</strong>
          </div>
          <div className="stat-card card">
            <span>New</span>
            <strong>{stats.newCount}</strong>
          </div>
          <div className="stat-card card">
            <span>Contacted</span>
            <strong>{stats.contactedCount}</strong>
          </div>
          <div className="stat-card card">
            <span>Converted</span>
            <strong>{stats.convertedCount}</strong>
          </div>
        </section>

        <section className="dashboard-grid">
          <div className="dashboard-grid-main">
            <div className="card leads-card">
              <div className="leads-toolbar">
                <div className="search-field">
                  <svg className="search-icon" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                    <circle cx="9" cy="9" r="6.5" stroke="currentColor" strokeWidth="1.5" />
                    <path d="M17 17L13.5 13.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                  <input
                    type="text"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search leads by name, email, or phone..."
                    aria-label="Search leads"
                  />
                </div>
                <select
                  value={statusFilter}
                  onChange={(event) => setStatusFilter(event.target.value)}
                  aria-label="Filter leads by status"
                >
                  <option value="all">All statuses</option>
                  <option value="new">New</option>
                  <option value="contacted">Contacted</option>
                  <option value="converted">Converted</option>
                </select>
                <span className="leads-count">{stats.total} lead{stats.total === 1 ? '' : 's'}</span>
              </div>

              <LeadTable
                leads={leads}
                assignees={assigneeNames}
                onDelete={handleDeleteLead}
                onUpdateLead={handleUpdateLead}
                onStatusChange={handleStatusChange}
                onAssignChange={handleAssignChange}
              />

              <div className="pagination">
                <button type="button" disabled={page === 1} onClick={() => setPage((current) => Math.max(1, current - 1))}>
                  Previous
                </button>
                <span>
                  Page {page} of {totalPages}
                </span>
                <button type="button" disabled={page >= totalPages} onClick={() => setPage((current) => current + 1)}>
                  Next
                </button>
              </div>
            </div>
          </div>

          <aside className="dashboard-grid-side">
            <LeadForm onAdd={handleAddLead} assignees={assigneeNames} />

            <div className="card contact-person-card">
              <h3>Contact Persons</h3>
              <form className="contact-person-form" onSubmit={handleAddContactPerson}>
                <input
                  type="text"
                  value={newContactPerson}
                  onChange={(event) => setNewContactPerson(event.target.value)}
                  placeholder="Person name"
                  required
                />
                <button type="submit" disabled={!newContactPerson.trim()}>
                  Add
                </button>
              </form>
              {contactPersonError && <div className="error-message">{contactPersonError}</div>}
              <div className="contact-person-list">
                {contactPersons.length === 0 ? (
                  <p className="empty-hint">No contact persons added.</p>
                ) : (
                  contactPersons.map((person) => (
                    <div className="contact-person-item" key={person._id}>
                      <span>{person.name}</span>
                      <button type="button" onClick={() => handleDeleteContactPerson(person._id)}>
                        Remove
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </aside>
        </section>

        <section className="card report-card">
          <div className="report-header">
            <div>
              <h3>Lead Report</h3>
              <p>
                {report
                  ? `Generated ${formatDateTime(report.generatedAt)}`
                  : 'Configure filters below and generate a report.'}
              </p>
            </div>
            <div className="report-actions">
              <button type="button" className="report-button" onClick={handleGenerateReport} disabled={generatingReport}>
                {generatingReport ? 'Generating...' : report ? 'Regenerate Report' : 'Generate Report'}
              </button>
              <button type="button" className="secondary-button" onClick={handleDownloadReport} disabled={!report}>
                Download CSV
              </button>
            </div>
          </div>

          <div className="report-filter-grid">
            <label className="field">
              <span>Status</span>
              <select
                value={reportFilters.status}
                onChange={(event) => updateReportFilter('status', event.target.value)}
              >
                <option value="all">All statuses</option>
                <option value="new">New</option>
                <option value="contacted">Contacted</option>
                <option value="converted">Converted</option>
              </select>
            </label>

            <label className="field">
              <span>Assigned To</span>
              <select
                value={reportFilters.assignedTo}
                onChange={(event) => updateReportFilter('assignedTo', event.target.value)}
              >
                <option value="all">Everyone</option>
                {assigneeNames.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </select>
            </label>

            <label className="field">
              <span>Search</span>
              <input
                type="text"
                value={reportFilters.search}
                onChange={(event) => updateReportFilter('search', event.target.value)}
                placeholder="Name, email, phone..."
              />
            </label>

            <label className="field">
              <span>From Date</span>
              <input
                type="date"
                value={reportFilters.from}
                onChange={(event) => updateReportFilter('from', event.target.value)}
              />
            </label>

            <label className="field">
              <span>To Date</span>
              <input
                type="date"
                value={reportFilters.to}
                onChange={(event) => updateReportFilter('to', event.target.value)}
              />
            </label>

            <button
              type="button"
              className="ghost-button reset-filters-button"
              onClick={handleResetReportFilters}
              disabled={!isReportFiltered && !report}
            >
              Reset filters
            </button>
          </div>

          {reportError && <div className="error-message">{reportError}</div>}

          {report ? (
            <>
              <div className="report-summary-grid">
                <div className="report-metric">
                  <span>Total</span>
                  <strong>{report.summary.total}</strong>
                </div>
                <div className="report-metric">
                  <span>New</span>
                  <strong>{report.summary.new}</strong>
                </div>
                <div className="report-metric">
                  <span>Contacted</span>
                  <strong>{report.summary.contacted}</strong>
                </div>
                <div className="report-metric">
                  <span>Converted</span>
                  <strong>{report.summary.converted}</strong>
                </div>
                <div className="report-metric">
                  <span>Rate</span>
                  <strong>{report.summary.conversionRate}%</strong>
                </div>
              </div>

              <div className="report-details-grid">
                <div className="report-detail-block">
                  <h4>Applied Filters</h4>
                  <p>Status: {formatStatus(report.filters.status)}</p>
                  <p>Assigned To: {report.filters.assignedTo === 'all' ? 'Everyone' : report.filters.assignedTo}</p>
                  <p>Search: {report.filters.search || 'None'}</p>
                  <p>From: {report.filters.from || 'Any date'}</p>
                  <p>To: {report.filters.to || 'Any date'}</p>
                </div>
                <div className="report-detail-block">
                  <h4>Top Assignees</h4>
                  {report.byAssignee.length === 0 ? (
                    <p className="empty-hint">No assignment data.</p>
                  ) : (
                    <ul className="assignee-list">
                      {report.byAssignee.map((assignee) => (
                        <li key={assignee.assignedTo}>
                          <span>{assignee.assignedTo}</span>
                          <strong>
                            {assignee.total} total / {assignee.converted} converted
                          </strong>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="report-placeholder">No report generated yet.</div>
          )}
        </section>
      </main>
    </div>
  );
}