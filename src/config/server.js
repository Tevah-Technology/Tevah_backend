const express =
  require('express');

const cors =
  require('cors');

const env =
  require('./config/env');

const portfolioRoutes =
  require('./routes/portfolio.routes');

const dropboxRoutes =
  require('./routes/dropbox.routes');

const app =
  express();

// ============================================================
// MIDDLEWARE
// ============================================================

app.use(
  cors({
    origin: true,
    credentials: false,
  }),
);

app.use(
  express.json(),
);

app.use(
  express.urlencoded({
    extended: true,
  }),
);

// ============================================================
// HEALTH
// ============================================================

app.get(
  '/',
  (req, res) => {
    res.json({
      success: true,
      message:
        'Theva Backend is running',
    });
  },
);

app.get(
  '/health',
  (req, res) => {
    res.json({
      success: true,
      status: 'healthy',
    });
  },
);

// ============================================================
// ROUTES
// ============================================================

app.use(
  '/api/portfolio',
  portfolioRoutes,
);

app.use(
  '/api/dropbox',
  dropboxRoutes,
);

// ============================================================
// 404
// ============================================================

app.use(
  (req, res) => {
    res.status(404).json({
      success: false,
      message:
        'Route not found',
      path: req.originalUrl,
    });
  },
);

// ============================================================
// ERROR HANDLER
// ============================================================

app.use(
  (error, req, res, next) => {
    console.error(
      'SERVER ERROR:',
      error,
    );

    res.status(500).json({
      success: false,
      message:
        'Internal server error',
    });
  },
);

// ============================================================
// START SERVER
// ============================================================

app.listen(
  env.port,
  () => {
    console.log('');
    console.log(
      '====================================',
    );
    console.log(
      '        THEVA BACKEND',
    );
    console.log(
      '====================================',
    );
    console.log(
      `Server: http://localhost:${env.port}`,
    );
    console.log(
      `Portfolio: http://localhost:${env.port}/api/portfolio`,
    );
    console.log(
      `Health: http://localhost:${env.port}/health`,
    );
    console.log(
      '====================================',
    );
    console.log('');
  },
);