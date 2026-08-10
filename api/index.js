// Vercel serverless entry point
const backend = require("../backend/index.js");

module.exports = backend.handler || backend;
module.exports.default = module.exports;