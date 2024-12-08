const fs = require('fs'); // برای ذخیره لیست سیاه در فایل (در صورت نیاز)
const path = require('path');

// کلید محرمانه
const SECRET_KEY = '9A(12m@!10E)!6s^6O^'; // کلید خودتان را جایگزین کنید

// محل ذخیره لیست سیاه توکن‌ها
const BLACKLIST_FILE = path.join(__dirname, 'blacklist.json');

// بارگذاری لیست سیاه از فایل (اگر وجود دارد)
let blacklistedTokens = [];
if (fs.existsSync(BLACKLIST_FILE)) {
    blacklistedTokens = JSON.parse(fs.readFileSync(BLACKLIST_FILE));
}

// افزودن توکن به لیست سیاه
function invalidateToken(token) {
    if (!blacklistedTokens.includes(token)) {
        blacklistedTokens.push(token); // اضافه کردن توکن به لیست
        fs.writeFileSync(BLACKLIST_FILE, JSON.stringify(blacklistedTokens, null, 2)); // ذخیره در فایل
        console.log('Token has been invalidated:', token);
    } else {
        console.log('Token is already invalidated.');
    }
}

// بررسی اعتبار توکن
function isTokenInvalidated(token) {
    return blacklistedTokens.includes(token);
}

// ورودی از ترمینال
const token = process.argv[2]; // دریافت آرگومان از خط فرمان
if (!token) {
    console.error('Please provide a token to invalidate.');
    process.exit(1);
}

if (isTokenInvalidated(token)) {
    console.log('Token is already blacklisted.');
} else {
    invalidateToken(token);
    console.log('Token successfully added to the blacklist.');
}
