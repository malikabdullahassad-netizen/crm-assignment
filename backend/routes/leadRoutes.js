const express = require('express');
const {
  createLead,
  getLeads,
  getLeadReport,
  updateLead,
  deleteLead,
} = require('../controllers/leadController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.route('/').post(protect, createLead).get(protect, getLeads);
router.route('/report').get(protect, getLeadReport);
router.route('/:id').put(protect, updateLead).delete(protect, deleteLead);

module.exports = router;
