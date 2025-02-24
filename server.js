const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
const jwt = require('jsonwebtoken');

const app = express();

// فعال‌سازی CORS
app.use(cors());

// برای دریافت داده‌ها به صورت JSON
app.use(bodyParser.json());

// کلید محرمانه برای امضای توکن‌ها
const SECRET_KEY = 'SunshineOnlineServices';

// آرایه برای ذخیره توکن‌های تولید شده
let preGeneratedTokens = [];

// اتصال به MongoDB (رشته اتصال MongoDB Atlas)
const dbURI = 'mongodb+srv://sunshineonlineservices:Lovely%20alone@iranvisa.4iu1j.mongodb.net/captchaDB?retryWrites=true&w=majority&appName=iranVISA';
mongoose.connect(dbURI)
    .then(() => {
        console.log('Connected to MongoDB');
    })
    .catch((err) => {
        console.error('Error connecting to MongoDB:', err);
    });

// ایجاد اسکیمای داده
const captchaSchema = new mongoose.Schema({
    captcha_value: { type: String, unique: true },
    user_input: { type: String, required: true },
    created_at: { type: Date, default: Date.now }
});

// Middleware برای تبدیل user_input به حروف بزرگ قبل از ذخیره
captchaSchema.pre('save', function (next) {
    if (this.user_input) {
        this.user_input = this.user_input.toUpperCase();
    }
    next();
});

// ایجاد TTL index برای حذف رکوردها پس از 15 دقیقه
captchaSchema.index({ created_at: 1 }, { expireAfterSeconds: 3600 });

const Captcha = mongoose.model('Captcha', captchaSchema, 'captchas');

// Middleware برای اعتبارسنجی توکن
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    if (!authHeader) {
        return res.status(403).json({ message: 'No token provided' });
    }

    const token = authHeader.split(' ')[1]; // اینجا توجه کنید که "Bearer" حذف می‌شود و فقط توکن باقی می‌ماند
    if (!token) {
        return res.status(403).json({ message: 'Invalid token format' });
    }

    console.log('Token received:', token);  // اضافه کردن لاگ برای نمایش توکن دریافتی

    jwt.verify(token, SECRET_KEY, (err, user) => {
        if (err) {
            return res.status(403).json({ message: 'Invalid or expired token', error: err.message });
        }
        req.user = user;
        next();
    });
};

// مسیر POST برای ذخیره داده‌ها در MongoDB
app.post('/save-captcha', authenticateToken, async (req, res) => {
    const { captcha_value, user_input } = req.body;

    // چاپ داده‌های ورودی برای بررسی
    console.log('Received Captcha:', captcha_value, user_input);

    try {
        // بررسی اینکه آیا این کپچا قبلاً ذخیره شده است یا خیر
        const existingCaptcha = await Captcha.findOne({ captcha_value });

        if (existingCaptcha) {
            console.log('Captcha already exists:', captcha_value);  // چاپ وقتی کپچا موجود باشد
            return res.status(409).json({ message: 'کپچا قبلاً ذخیره شده است' });
        }

        // ایجاد یک شی جدید برای ذخیره داده‌ها
        const newCaptchaData = new Captcha({
            captcha_value,
            user_input,
            created_at: new Date()
        });

        // ذخیره کپچا جدید در دیتابیس
        await newCaptchaData.save();
        console.log('Captcha saved successfully');  // چاپ موفقیت آمیز بودن ذخیره داده‌ها

        res.status(200).json({ message: 'Data saved to MongoDB' });
    } catch (error) {
        // چاپ خطاها
        console.error('Error saving captcha:', error);

        // ارسال خطای 500 در صورت بروز مشکل
        res.status(500).json({ message: 'Error saving data', error });
    }
});

// راه‌اندازی سرور
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
