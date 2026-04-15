const fs = require('node:fs');
const path = require('node:path');

const LOG_PATH = path.resolve(process.cwd(), 'logs', 'bot.log');
const MAX_LOG_SIZE = 10 * 1024 * 1024; // 10 MB — prevents unbounded disk growth
const MAX_ROTATED_FILES = 3;

// Ensure logs directory exists
const logDir = path.dirname(LOG_PATH);
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

// Use a write stream for non-blocking async writes (large-bot pattern).
// appendFileSync blocks the event loop on every call; a stream buffers writes.
let logStream = fs.createWriteStream(LOG_PATH, { flags: 'a' });
let currentLogSize = 0;

// Track current log size on startup
try {
  const stats = fs.statSync(LOG_PATH);
  currentLogSize = stats.size;
} catch {
  currentLogSize = 0;
}

function rotateIfNeeded() {
  if (currentLogSize < MAX_LOG_SIZE) return;

  logStream.end();

  // Rotate existing files: bot.2.log -> bot.3.log (dropped), bot.1.log -> bot.2.log, bot.log -> bot.1.log
  for (let i = MAX_ROTATED_FILES; i >= 1; i--) {
    const src = i === 1 ? LOG_PATH : `${LOG_PATH}.${i - 1}`;
    const dest = `${LOG_PATH}.${i}`;
    try {
      if (fs.existsSync(src)) {
        fs.renameSync(src, dest);
      }
    } catch {
      // Rotation failure is non-fatal
    }
  }

  currentLogSize = 0;
  logStream = fs.createWriteStream(LOG_PATH, { flags: 'a' });
}

function write(level, message, meta) {
  const line = JSON.stringify({ timestamp: new Date().toISOString(), level, message, meta }) + '\n';
  currentLogSize += Buffer.byteLength(line);
  logStream.write(line);
  console[level === 'error' ? 'error' : 'log'](message, meta || '');
  rotateIfNeeded();
}

module.exports = {
  info: (message, meta) => write('info', message, meta),
  warn: (message, meta) => write('warn', message, meta),
  error: (message, meta) => write('error', message, meta)
};
