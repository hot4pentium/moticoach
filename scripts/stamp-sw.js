const fs = require('fs');
const file = 'public/firebase-messaging-sw.js';
let src = fs.readFileSync(file, 'utf8');
src = src.replace('STAMP', new Date().toISOString());
fs.writeFileSync(file, src);
console.log('SW stamped:', new Date().toISOString());
