const fs = require('node:fs');
const path = require('node:path');

const LOG_PATH = path.resolve(process.cwd(), 'logs', 'bot.log');

function write(level, message, meta) {
  const line = JSON.stringify({ timestamp: new Date().toISOString(), level, message, meta }) + '\n';
  fs.appendFileSync(LOG_PATH, line);
  console[level === 'error' ? 'error' : 'log'](message, meta || '');
}

module.exports = {
  info: (message, meta) => write('info', message, meta),
  warn: (message, meta) => write('warn', message, meta),
  error: (message, meta) => write('error', message, meta)
};
