const express = require('express');
const {
  getContactPersons,
  createContactPerson,
  deleteContactPerson,
} = require('../controllers/contactPersonController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.route('/').get(protect, getContactPersons).post(protect, createContactPerson);
router.route('/:id').delete(protect, deleteContactPerson);

module.exports = router;
