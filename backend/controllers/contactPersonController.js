const ContactPerson = require('../models/ContactPerson');

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const getContactPersons = async (req, res) => {
  const contactPersons = await ContactPerson.find({ user: req.user._id }).sort({ name: 1 });
  return res.json(contactPersons);
};

const createContactPerson = async (req, res) => {
  const name = req.body.name?.trim();

  if (!name) {
    return res.status(400).json({ message: 'Please provide a contact person name' });
  }

  const existingPerson = await ContactPerson.findOne({
    user: req.user._id,
    name: new RegExp(`^${escapeRegex(name)}$`, 'i'),
  });

  if (existingPerson) {
    return res.status(400).json({ message: 'Contact person already exists' });
  }

  const contactPerson = await ContactPerson.create({
    user: req.user._id,
    name,
  });
  return res.status(201).json(contactPerson);
};

const deleteContactPerson = async (req, res) => {
  const contactPerson = await ContactPerson.findOne({ _id: req.params.id, user: req.user._id });

  if (!contactPerson) {
    return res.status(404).json({ message: 'Contact person not found' });
  }

  await contactPerson.deleteOne();
  return res.json({ message: 'Contact person removed' });
};

module.exports = {
  getContactPersons,
  createContactPerson,
  deleteContactPerson,
};
