/**
 * Keep-Alive Script for Render Free Plan
 * Render Free Plan sleeps after 15 minutes of inactivity
 * This script pings the backend every 10 minutes to keep it awake
 * 
 * CÁCH SỬ DỤNG:
 * 1. Đổi BACKEND_URL thành URL backend của bạn
 * 2. Deploy script này lên một service khác (hoặc chạy local)
 * 3. Hoặc dùng UptimeRobot.com (khuyến nghị hơn)
 */

const https = require('https');

// THAY ĐỔI URL NÀY
const BACKEND_URL = 'https://hsvqnu-backend.onrender.com/api/health';

function ping() {
  const startTime = Date.now();
  
  https.get(BACKEND_URL, (res) => {
    const duration = Date.now() - startTime;
    const timestamp = new Date().toISOString();
    
    if (res.statusCode === 200) {
      console.log(`✅ Ping OK: ${res.statusCode} | ${duration}ms | ${timestamp}`);
    } else {
      console.log(`⚠️  Ping Warning: ${res.statusCode} | ${duration}ms | ${timestamp}`);
    }
  }).on('error', (err) => {
    const timestamp = new Date().toISOString();
    console.error(`❌ Ping Error: ${err.message} | ${timestamp}`);
  });
}

// Ping ngay lập tức khi start
ping();

// Ping mỗi 10 phút
const INTERVAL = 10 * 60 * 1000; // 10 minutes
setInterval(ping, INTERVAL);

console.log(`🚀 Keep-Alive started for ${BACKEND_URL}`);
console.log(`⏰ Pinging every ${INTERVAL / 1000 / 60} minutes`);
