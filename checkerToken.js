const jwt = require('jsonwebtoken');

// کلید محرمانه برای امضای توکن‌ها
const SECRET_KEY = '9A(12m@!10E)!6s^6P^';

// اطلاعاتی که می‌خواهید در توکن ذخیره کنید (مثلاً نام کاربری)
const payload = {
    username: 'user8', // نام کاربری
    role: 'admin',     // نقش کاربر
};

// مدت زمان اعتبار توکن
const options = {
    expiresIn: '30d',   // توکن بعد از 1 ساعت منقضی می‌شود
};

// تولید توکن
const token = jwt.sign(payload, SECRET_KEY, options);

// چاپ توکن در کنسول
console.log('Generated Token:', token);