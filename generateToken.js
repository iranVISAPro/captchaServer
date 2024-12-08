const jwt = require('jsonwebtoken');

// کلید محرمانه خود را در اینجا قرار دهید یا از process.env استفاده کنید
const SECRET_KEY = '9A(12m@!10E)!6s^6O^'; // اینجا کلید خودتان را بگذارید

// تابع تولید توکن
function generateToken(username) {
    const payload = { username }; // اطلاعاتی که در توکن ذخیره می‌شود
    const token = jwt.sign(payload, SECRET_KEY, { expiresIn: '30d' }); // توکن برای 30 روز معتبر است
    return token;
}

// مثال: تولید توکن برای یک کاربر
const username = 'user10'; // نام کاربری را تغییر دهید
const token = generateToken(username);
console.log(`Generated token for ${username}:`);
console.log(token);
