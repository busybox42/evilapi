const express = require('express');
const router = express.Router();
const speedTestService = require('../../services/speedTestService');

router.get('/download', speedTestService.downloadTest);
router.post('/upload', speedTestService.uploadTest);

module.exports = router;
