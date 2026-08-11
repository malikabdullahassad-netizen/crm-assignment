// LeadForm.tsx
import { useState } from 'react';

interface LeadFormProps {
  onAdd: (lead: { name: string; email: string; phone: string; status: string; assignedTo: string }) => Promise<void>;
  assignees: string[];
}

const initialState = {
  name: '',
  email: '',
  phone: '',
  status: 'new',
  assignedTo: 'Unassigned',
};

export default function LeadForm({ onAdd, assignees }: LeadFormProps) {
  const [form, setForm] = useState(initialState);
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    await onAdd(form);
    setForm(initialState);
    setSubmitting(false);
  };

  return (
    <form onSubmit={handleSubmit} className="lead-form card">
      <h3>Add new lead</h3>
      <div className="form-grid">
        <input name="name" value={form.name} onChange={handleChange} placeholder="Full name" required />
        <input name="email" type="email" value={form.email} onChange={handleChange} placeholder="Email" required />
        <input name="phone" value={form.phone} onChange={handleChange} placeholder="Phone" required />
        <select name="status" value={form.status} onChange={handleChange}>
          <option value="new">New</option>
          <option value="contacted">Contacted</option>
          <option value="converted">Converted</option>
        </select>
        <select name="assignedTo" value={form.assignedTo} onChange={handleChange}>
          <option value="Unassigned">Unassigned</option>
          {assignees.map((assignee) => (
            <option key={assignee} value={assignee}>
              {assignee}
            </option>
          ))}
        </select>
      </div>
      <button type="submit" className="submit-button" disabled={submitting}>
        {submitting ? 'Saving...' : 'Add lead'}
      </button>
    </form>
  );
}