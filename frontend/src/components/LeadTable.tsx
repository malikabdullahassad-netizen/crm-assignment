// LeadTable.tsx
import { useState } from 'react';

interface Lead {
  _id: string;
  name: string;
  email: string;
  phone: string;
  status: 'new' | 'contacted' | 'converted';
  assignedTo: string;
  createdAt: string;
}

type LeadDraft = Omit<Lead, '_id' | 'createdAt'>;

interface LeadTableProps {
  leads: Lead[];
  assignees: string[];
  onDelete: (id: string) => Promise<void>;
  onUpdateLead: (id: string, lead: LeadDraft) => Promise<void>;
  onStatusChange: (id: string, status: string) => Promise<void>;
  onAssignChange: (id: string, assignedTo: string) => Promise<void>;
}

const statusColors: Record<string, string> = {
  new: '#fbbf24',
  contacted: '#60a5fa',
  converted: '#34d399',
};

const getAssigneeOptions = (assignees: string[], currentAssignee: string) => {
  const options = ['Unassigned', ...assignees.filter((assignee) => assignee !== 'Unassigned')];

  if (currentAssignee && !options.includes(currentAssignee)) {
    options.push(currentAssignee);
  }

  return options;
};

export default function LeadTable({
  leads,
  assignees,
  onDelete,
  onUpdateLead,
  onStatusChange,
  onAssignChange,
}: LeadTableProps) {
  const [editingLeadId, setEditingLeadId] = useState<string | null>(null);
  const [draft, setDraft] = useState<LeadDraft | null>(null);
  const [savingLeadId, setSavingLeadId] = useState<string | null>(null);

  const startEdit = (lead: Lead) => {
    setEditingLeadId(lead._id);
    setDraft({
      name: lead.name,
      email: lead.email,
      phone: lead.phone,
      status: lead.status,
      assignedTo: lead.assignedTo || 'Unassigned',
    });
  };

  const cancelEdit = () => {
    setEditingLeadId(null);
    setDraft(null);
  };

  const handleDraftChange = (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = event.target;
    setDraft((current) => (current ? { ...current, [name]: value } : current));
  };

  const saveEdit = async () => {
    if (!editingLeadId || !draft) {
      return;
    }

    setSavingLeadId(editingLeadId);
    await onUpdateLead(editingLeadId, draft);
    setSavingLeadId(null);
    cancelEdit();
  };

  return (
    <div className="card table-card">
      {/* Wrapper enables horizontal scroll as a fallback above the stacked breakpoint */}
      <div className="table-scroll">
        <table className="lead-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Assigned To</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {leads.length === 0 ? (
              <tr>
                <td colSpan={6} className="empty-state">
                  No leads found.
                </td>
              </tr>
            ) : (
              leads.map((lead) => {
                const isEditing = editingLeadId === lead._id;
                const assigneeOptions = getAssigneeOptions(
                  assignees,
                  isEditing ? draft?.assignedTo || '' : lead.assignedTo
                );

                return (
                  <tr key={lead._id}>
                    <td data-label="Name">
                      {isEditing ? (
                        <input
                          className="table-input"
                          name="name"
                          value={draft?.name || ''}
                          onChange={handleDraftChange}
                          required
                        />
                      ) : (
                        lead.name
                      )}
                    </td>
                    <td data-label="Email">
                      {isEditing ? (
                        <input
                          className="table-input"
                          name="email"
                          type="email"
                          value={draft?.email || ''}
                          onChange={handleDraftChange}
                          required
                        />
                      ) : (
                        lead.email
                      )}
                    </td>
                    <td data-label="Phone">
                      {isEditing ? (
                        <input
                          className="table-input"
                          name="phone"
                          value={draft?.phone || ''}
                          onChange={handleDraftChange}
                          required
                        />
                      ) : (
                        lead.phone
                      )}
                    </td>
                    <td data-label="Assigned To">
                      <select
                        name="assignedTo"
                        value={isEditing ? draft?.assignedTo || 'Unassigned' : lead.assignedTo || 'Unassigned'}
                        onChange={(event) => {
                          if (isEditing) {
                            handleDraftChange(event);
                          } else {
                            onAssignChange(lead._id, event.target.value);
                          }
                        }}
                        className="assign-select"
                      >
                        {assigneeOptions.map((assignee) => (
                          <option key={assignee} value={assignee}>
                            {assignee}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td data-label="Status">
                      <select
                        name="status"
                        value={isEditing ? draft?.status || lead.status : lead.status}
                        onChange={(event) => {
                          if (isEditing) {
                            handleDraftChange(event);
                          } else {
                            onStatusChange(lead._id, event.target.value);
                          }
                        }}
                        className="status-select"
                        style={{
                          borderColor:
                            statusColors[isEditing ? draft?.status || lead.status : lead.status] || '#cbd5e1',
                        }}
                      >
                        <option value="new">New</option>
                        <option value="contacted">Contacted</option>
                        <option value="converted">Converted</option>
                      </select>
                    </td>
                    <td data-label="Action">
                      <div className="row-actions">
                        {isEditing ? (
                          <>
                            <button
                              type="button"
                              className="save-button"
                              onClick={saveEdit}
                              disabled={savingLeadId === lead._id}
                            >
                              {savingLeadId === lead._id ? 'Saving...' : 'Save'}
                            </button>
                            <button type="button" className="secondary-button" onClick={cancelEdit}>
                              Cancel
                            </button>
                          </>
                        ) : (
                          <>
                            <button type="button" className="edit-button" onClick={() => startEdit(lead)}>
                              Edit
                            </button>
                            <button type="button" className="delete-button" onClick={() => onDelete(lead._id)}>
                              Delete
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}