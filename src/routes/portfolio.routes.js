const express = require('express');

const {
  getPortfolio,
} = require('../services/dropbox.service');

const router = express.Router();

// ============================================================
// GET PORTFOLIO
// ============================================================

router.get('/', async (req, res) => {
  const startTime = Date.now();

  console.log('');
  console.log('==============================================');
  console.log('GET /api/portfolio');
  console.log('Portfolio request received');
  console.log('==============================================');

  try {
    console.log('Calling getPortfolio()...');

    const projects = await getPortfolio();

    console.log('');
    console.log('Portfolio loaded successfully');
    console.log('Projects:', projects.length);
    console.log(
      'Time:',
      `${Date.now() - startTime} ms`,
    );

    return res.status(200).json({
      success: true,
      count: projects.length,
      data: projects,
    });
  } catch (error) {
    console.error('');
    console.error('==============================================');
    console.error('PORTFOLIO ERROR');
    console.error('==============================================');

    console.error('Message:', error?.message);
    console.error('Name:', error?.name);
    console.error('Stack:', error?.stack);

    if (error?.error) {
      console.error('Dropbox error:', error.error);
    }

    console.error('==============================================');

    return res.status(500).json({
      success: false,
      count: 0,
      data: [],
      message: 'Failed to load portfolio',
      error: error?.message || 'Unknown error',
    });
  }
});

module.exports = router;