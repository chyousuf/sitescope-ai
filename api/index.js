let app;
let initError = null;

try {
  app = require('../server/index');
} catch (err) {
  console.error('Failed to initialize SiteScope AI server:', err);
  initError = err;
}

module.exports = (req, res) => {
  if (initError) {
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    return res.end(JSON.stringify({
      error: 'SiteScope AI Serverless Initialization Error',
      message: initError.message,
      stack: initError.stack
    }));
  }
  return app(req, res);
};
