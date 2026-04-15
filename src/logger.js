const fs = require('node:fs');
const path = require('node:path');

const LOG_PATH = path.resolve(process.cwd(), 'logs', 'bot.log');

// Ensure logs directory exists
const logDir = path.dirname(LOG_PATH);
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

// Use a write stream for non-blocking async writes (large-bot pattern).
// appendFileSync blocks the event loop on every call; a stream buffers writes.
const logStream = fs.createWriteStream(LOG_PATH, { flags: 'a' });

function write(level, message, meta) {
  const line = JSON.stringify({ timestamp: new Date().toISOString(), level, message, meta }) + '\n';
  logStream.write(line);
  console[level === 'error' ? 'error' : 'log'](message, meta || '');
}

module.exports = {
  info: (message, meta) => write('info', message, meta),
  warn: (message, meta) => write('warn', message, meta),
  error: (message, meta) => write('error', message, meta)
};
