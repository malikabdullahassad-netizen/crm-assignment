const Lead = require('../models/Lead');

const validStatuses = ['new', 'contacted', 'converted'];

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const buildLeadFilter = ({ status = 'all', search = '', from, to, userId } = {}) => {
  const filter = {
    user: userId,
  };

  if (status !== 'all') {
    filter.status = status;
  }

  if (search) {
    const safeSearch = escapeRegex(String(search));
    filter.$or = [
      { name: { $regex: safeSearch, $options: 'i' } },
      { email: { $regex: safeSearch, $options: 'i' } },
      { phone: { $regex: safeSearch, $options: 'i' } },
      { assignedTo: { $regex: safeSearch, $options: 'i' } },
    ];
  }

  if (from || to) {
    filter.createdAt = {};

    if (from) {
      filter.createdAt.$gte = new Date(from);
    }

    if (to) {
      const endDate = new Date(to);
      endDate.setHours(23, 59, 59, 999);
      filter.createdAt.$lte = endDate;
    }
  }

  return filter;
};

const createLead = async (req, res) => {
  const { name, email, phone, status, assignedTo } = req.body;

  if (!name || !email || !phone) {
    return res.status(400).json({ message: 'Please provide name, email and phone' });
  }

  if (status && !validStatuses.includes(status)) {
    return res.status(400).json({ message: 'Invalid lead status' });
  }

  const lead = await Lead.create({
    user: req.user._id,
    name: name.trim(),
    email: email.trim(),
    phone: phone.trim(),
    status: status || 'new',
    assignedTo: assignedTo?.trim() || 'Unassigned',
  });

  return res.status(201).json(lead);
};

const getLeads = async (req, res) => {
  const { page = 1, limit = 10, status = 'all', search = '', from, to } = req.query;
  const filter = buildLeadFilter({ status, search, from, to, userId: req.user._id });

  const total = await Lead.countDocuments(filter);
  const leads = await Lead.find(filter)
    .sort({ createdAt: -1 })
    .limit(Number(limit))
    .skip((Number(page) - 1) * Number(limit));

  return res.json({
    leads,
    page: Number(page),
    totalPages: Math.max(1, Math.ceil(total / Number(limit))),
    total,
  });
};

const getLeadReport = async (req, res) => {
  const { status = 'all', search = '', from, to } = req.query;
  const filter = buildLeadFilter({ status, search, from, to, userId: req.user._id });

  const [leads, statusBreakdown, assigneeBreakdown] = await Promise.all([
    Lead.find(filter).sort({ createdAt: -1 }).select('name email phone status assignedTo createdAt'),
    Lead.aggregate([
      { $match: filter },
      { $group: { _id: '$status', total: { $sum: 1 } } },
    ]),
    Lead.aggregate([
      { $match: filter },
      {
        $group: {
          _id: '$assignedTo',
          total: { $sum: 1 },
          converted: {
            $sum: {
              $cond: [{ $eq: ['$status', 'converted'] }, 1, 0],
            },
          },
        },
      },
      { $sort: { total: -1, _id: 1 } },
      { $limit: 10 },
    ]),
  ]);

  const statusCounts = statusBreakdown.reduce(
    (counts, item) => ({
      ...counts,
      [item._id]: item.total,
    }),
    { new: 0, contacted: 0, converted: 0 }
  );
  const total = leads.length;
  const conversionRate = total > 0 ? Number(((statusCounts.converted / total) * 100).toFixed(1)) : 0;

  return res.json({
    generatedAt: new Date().toISOString(),
    filters: {
      status,
      search,
      from: from || null,
      to: to || null,
    },
    summary: {
      total,
      new: statusCounts.new,
      contacted: statusCounts.contacted,
      converted: statusCounts.converted,
      conversionRate,
    },
    byAssignee: assigneeBreakdown.map((item) => ({
      assignedTo: item._id || 'Unassigned',
      total: item.total,
      converted: item.converted,
    })),
    leads,
  });
};

const updateLead = async (req, res) => {
  const { id } = req.params;

  const lead = await Lead.findOne({ _id: id, user: req.user._id });

  if (!lead) {
    return res.status(404).json({ message: 'Lead not found' });
  }

  const { name, email, phone, status, assignedTo } = req.body;

  if (status && !validStatuses.includes(status)) {
    return res.status(400).json({ message: 'Invalid lead status' });
  }

  if (Object.prototype.hasOwnProperty.call(req.body, 'name')) {
    if (!name?.trim()) {
      return res.status(400).json({ message: 'Lead name is required' });
    }

    lead.name = name.trim();
  }

  if (Object.prototype.hasOwnProperty.call(req.body, 'email')) {
    if (!email?.trim()) {
      return res.status(400).json({ message: 'Lead email is required' });
    }

    lead.email = email.trim();
  }

  if (Object.prototype.hasOwnProperty.call(req.body, 'phone')) {
    if (!phone?.trim()) {
      return res.status(400).json({ message: 'Lead phone is required' });
    }

    lead.phone = phone.trim();
  }

  if (status) {
    lead.status = status;
  }

  if (Object.prototype.hasOwnProperty.call(req.body, 'assignedTo')) {
    lead.assignedTo = assignedTo?.trim() || 'Unassigned';
  }

  const updatedLead = await lead.save();
  return res.json(updatedLead);
};

const deleteLead = async (req, res) => {
  const { id } = req.params;
  const lead = await Lead.findOne({ _id: id, user: req.user._id });

  if (!lead) {
    return res.status(404).json({ message: 'Lead not found' });
  }

  await lead.deleteOne();
  return res.json({ message: 'Lead removed' });
};

module.exports = {
  createLead,
  getLeads,
  getLeadReport,
  updateLead,
  deleteLead,
};
