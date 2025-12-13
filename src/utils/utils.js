const fs = require('fs');
const { flag } = require('country-emoji');

const Utils = {
  getUnixTimestamp() {
    return Math.floor(Date.now() / 1000);
  },
  
  getMTimeUnix(filepath) {
    try {
      return Math.floor(fs.statSync(filepath).mtime.getTime() / 1000);
    } catch (err) {
      return Math.floor(Date.now() / 1000);
    }
  },
  
  formatTime(seconds) {
    const hours = seconds / 3600;
    return `${hours.toFixed(1)} h`;
  },
  
  timeAgo(ts, full = false) {
    const s = Math.floor(Date.now() / 1000) - ts;
    const uFull = [
      ['year', 365.25 * 24 * 60 * 60],
      ['month', 30 * 24 * 60 * 60],
      ['day', 86400],
      ['hour', 3600],
      ['minute', 60],
      ['second', 1]
    ];
    const uShort = [
      ['y', 365.25 * 24 * 60 * 60],
      ['d', 86400],
      ['h', 3600],
      ['m', 60],
      ['s', 1]
    ];
    const units = full ? uFull : uShort;
    for (const [name, sec] of units) {
      const v = Math.floor(s / sec);
      if (v) {
        return v + ' ' + (full ? name : (name.length > 1 ? name[0] : name)) + (v > 1 && full ? 's' : '') + ' ago';
      }
    }
    return 'just now';
  },
  
  bytesToSize(bytes) {
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    
    if (bytes === 0) return '0 B';
    
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    const size = parseFloat((bytes / Math.pow(1024, i)).toFixed(2));
    
    return `${size} ${sizes[i]}`;
  },
  
  formatUptime(uptime, ms = false) {
    if (ms) uptime = Math.floor(uptime / 1000);
    
    const d = Math.floor(uptime / (3600 * 24));
    const h = String(Math.floor((uptime % (3600 * 24)) / 3600)).padStart(2, '0');
    const m = String(Math.floor((uptime % 3600) / 60)).padStart(2, '0');
    const s = String(uptime % 60).padStart(2, '0');
    
    if (d > 1) return `${d}d ${h}:${m}:${s}`;
    return `${h}:${m}:${s}`;
  },
  
  getEmojiByCountry(country) {
    return flag(country) || '';
  }
};

module.exports = Utils;