import app from '../src/app';

// Dual export: Supports both Vercel ESM loader and CommonJS require() bridge
// @ts-ignore
module.exports = app;
// @ts-ignore
module.exports.default = app;

export default app;

