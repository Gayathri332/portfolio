const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/portfolio';

// On Vercel, this module can be re-invoked on a "warm" Lambda without the
// process restarting, so we cache the connection on `global` rather than a
// plain module-level variable (which would still work, but `global` is the
// documented-safe pattern since it survives some edge cases module caching
// doesn't, e.g. bundler duplication).
let cached = global._mongooseConn;
if (!cached) cached = global._mongooseConn = { conn: null, promise: null };

async function connectDB() {
  if (cached.conn) return cached.conn;
  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI, {
      maxPoolSize: 5,
      serverSelectionTimeoutMS: 8000,
      bufferCommands: false,
    });
  }
  cached.conn = await cached.promise;
  return cached.conn;
}

module.exports = connectDB;
