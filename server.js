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

// اتصال به MongoDB
const dbURI = 'mongodb+srv://sunshineonlineservices:Lovely%20alone@iranvisa.4iu1j.mongodb.net/captchaDB?retryWrites=true&w=majority&appName=iranVISA';
mongoose.connect(dbURI)
    .then(() => console.log('Connected to MongoDB'))
    .catch((err) => console.error('Error connecting to MongoDB:', err));

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
    const token = authHeader.split(' ')[1];
    if (!token) {
        return res.status(403).json({ message: 'Invalid token format' });
    }

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
    try {
        const existingCaptcha = await Captcha.findOne({ captcha_value });
        if (existingCaptcha) {
            return res.status(409).json({ message: 'کپچا قبلاً ذخیره شده است' });
        }
        const newCaptchaData = new Captcha({ captcha_value, user_input, created_at: new Date() });
        await newCaptchaData.save();
        res.status(200).json({ message: 'Data saved to MongoDB' });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(409).json({ message: 'کپچا قبلاً ذخیره شده است' });
        }
        res.status(500).json({ message: 'Error saving data', error });
    }
});

// مسیر GET برای دریافت جدیدترین کپچا و حذف آن از دیتابیس
app.get('/get-newest-captcha', authenticateToken, async (req, res) => {
    try {
        const newestCaptcha = await Captcha.findOne().sort({ created_at: -1 });
        if (newestCaptcha) {
            await Captcha.deleteOne({ _id: newestCaptcha._id });
            res.status(200).json(newestCaptcha);
        } else {
            res.status(404).json({ message: 'No captcha data found' });
        }
    } catch (error) {
        console.error('Error fetching or deleting captcha:', error);
        res.status(500).json({ message: 'Error fetching or deleting captcha', error });
    }
});

// مسیر GET برای دریافت جدیدترین کپچا
app.get('/get-oldest-captcha', authenticateToken, async (req, res) => {
    try {
        const newestCaptcha = await Captcha.findOne().sort({ created_at: -1 });
        if (newestCaptcha) {
            await Captcha.deleteOne({ _id: newestCaptcha._id });
            res.status(200).json(newestCaptcha);
        } else {
            res.status(404).json({ message: 'No captcha data found' });
        }
    } catch (error) {
        console.error('Error fetching or deleting captcha:', error);
        res.status(500).json({ message: 'Error fetching or deleting captcha', error });
    }
});

// مسیر برای تولید توکن‌های پیشاپیش
app.get('/generate-tokens', (req, res) => {
    const usernames = ['user1', 'user2', 'user3', 'user4', 'user5', 'user6', 'user7', 'user8', 'user9', 'user10'];
    preGeneratedTokens = usernames.map(username => jwt.sign({ username }, SECRET_KEY, { expiresIn: '30d' }));
    res.json({ tokens: preGeneratedTokens });
});

// مسیر برای بررسی توکن
app.post('/verify-token', (req, res) => {
    const authHeader = req.headers['authorization'];
    if (!authHeader) {
        return res.status(403).json({ message: 'No token provided' });
    }
    const token = authHeader.split(' ')[1];
    if (!token) {
        return res.status(403).json({ message: 'Invalid token format' });
    }
    jwt.verify(token, SECRET_KEY, (err, user) => {
        if (err) {
            return res.status(403).json({ message: 'Invalid or expired token', error: err.message });
        }
        res.json({ message: 'Token is valid', user });
    });
});

// راه‌اندازی سرور
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
