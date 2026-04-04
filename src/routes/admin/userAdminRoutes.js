const express = require('express');
const router = express.Router();
const userAdminController = require('../../controllers/admin/userAdminController');
const { protect, requireAdmin } = require('../../middleware/auth');

router.use(protect, requireAdmin);

router.get('/', userAdminController.getAllUsers);
router.patch('/:id/toggle-status', userAdminController.toggleUserStatus);

module.exports = router;