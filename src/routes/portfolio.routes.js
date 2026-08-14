const express = require('express');

const {
  getPortfolio,
} = require('../services/dropbox.service');

const router =
  express.Router();

/**
 * GET /api/portfolio
 */
router.get(
  '/',
  async (req, res) => {
    try {
      const portfolio =
        await getPortfolio();

      res.json({
        success: true,
        count: portfolio.length,
        data: portfolio,
      });
    } catch (error) {
      console.error(
        'Portfolio error:',
        error,
      );

      res.status(500).json({
        success: false,
        message:
          'Failed to load portfolio',
        error:
          process.env.NODE_ENV ===
          'development'
            ? error.message
            : undefined,
      });
    }
  },
);

module.exports = router;