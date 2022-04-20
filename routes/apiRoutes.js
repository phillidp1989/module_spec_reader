const router = require('express').Router();
const fileGeneratorController = require('../controllers/fileGenerator.js');
const clearFilesController = require('../controllers/clearFiles.js');

router.get('/data', fileGeneratorController);
router.get('/clear', clearFilesController);

module.exports = router;