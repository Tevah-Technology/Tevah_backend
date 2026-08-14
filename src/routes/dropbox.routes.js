const express = require('express');

const {
  getAccountInfo,
  listFolder,
} = require('../services/dropbox.service');

const env =
  require('../config/env');

const router =
  express.Router();

/**
 * GET /api/dropbox/account
 */
router.get(
  '/account',
  async (req, res) => {
    try {
      const account =
        await getAccountInfo();

      res.json({
        success: true,
        data: account,
      });
    } catch (error) {
      console.error(
        'Dropbox account error:',
        error,
      );

      res.status(500).json({
        success: false,
        message:
          'Failed to connect to Dropbox',
        error: error.message,
      });
    }
  },
);

/**
 * GET /api/dropbox/files
 */
router.get(
  '/files',
  async (req, res) => {
    try {
      const path =
        req.query.path ||
        env.dropbox.portfolioPath;

      const files =
        await listFolder(path);

      res.json({
        success: true,
        path,
        count: files.length,
        data: files,
      });
    } catch (error) {
      console.error(
        'Dropbox files error:',
        error,
      );

      res.status(500).json({
        success: false,
        message:
          'Failed to list Dropbox files',
        error: error.message,
      });
    }
  },
);

module.exports = router;