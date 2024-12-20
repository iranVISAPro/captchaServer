const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
const jwt = require('jsonwebtoken'); // برای ایجاد و بررسی توکن

const app = express();
app.use(cors()); // فعال‌سازی CORS
app.use(bodyParser.json()); // برای دریافت داده‌ها به صورت JSON

// کلید محرمانه برای امضای توکن‌ها
const SECRET_KEY = '9A(12m@!10E)!6s^6O^';

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
    captcha_value: { type: String, unique: true }, // ایجاد ایندکس یکتا برای captcha_value
    user_input: { type: String, required: true },
    created_at: { type: Date, default: Date.now }
});

// Middleware برای تبدیل user_input به حروف بزرگ قبل از ذخیره
captchaSchema.pre('save', function(next) {
    if (this.user_input) {
        // تبدیل user_input به حروف بزرگ
        this.user_input = this.user_input.toUpperCase();
    }
    next(); // ادامه فرآیند ذخیره‌سازی
});

// ایجاد TTL index به‌صورت دستی برای حذف رکوردها پس از 2 ساعت (7200 ثانیه)
captchaSchema.index({ created_at: 1 }, { expireAfterSeconds: 7200 });

const Captcha = mongoose.model('Captcha', captchaSchema, 'captchas');

// Middleware برای اعتبارسنجی توکن
const authenticateToken = (req, res, next) => {
    const token = req.headers['authorization']; // دریافت توکن از هدر Authorization

    if (!token) {
        console.log('No token provided');
        return res.status(403).json({ message: 'Access denied. No token provided.' });
    }

    // اعتبارسنجی توکن
    jwt.verify(token, SECRET_KEY, (err, user) => {
        if (err) {
            console.log('Token verification failed:', err);
            return res.status(403).json({ message: 'Invalid or expired token.' });
        }
        req.user = user; // ذخیره اطلاعات کاربر در شیء درخواست
        next(); // ادامه فرآیند
    });
};

// مسیر POST برای ذخیره داده‌ها در MongoDB
app.post('/save-captcha', authenticateToken, async (req, res) => {
    const { captcha_value, user_input } = req.body;

    try {
        // بررسی وجود captcha_value در دیتابیس قبل از ذخیره
        const existingCaptcha = await Captcha.findOne({ captcha_value });

        if (existingCaptcha) {
            return res.status(409).json({ message: 'کپچا قبلاً ذخیره شده است' }); // ارسال پیام در صورت تکراری بودن
        }

        const newCaptchaData = new Captcha({
            captcha_value,
            user_input,
            created_at: new Date()
        });

        await newCaptchaData.save();
        res.status(200).json({ message: 'Data saved to MongoDB' });
    } catch (error) {
        if (error.code === 11000) { // این خطا مربوط به duplicate key است
            return res.status(409).json({ message: 'کپچا قبلاً ذخیره شده است' });
        }
        res.status(500).json({ message: 'Error saving data', error });
    }
});

// مسیر GET برای دریافت آخرین کپچا
app.get('/get-latest-captcha', authenticateToken, async (req, res) => {
    try {
        const latestCaptcha = await Captcha.findOne().sort({ created_at: -1 });
        
        if (latestCaptcha) {
            res.status(200).json(latestCaptcha);
        } else {
            res.status(404).json({ message: 'No captcha data found' });
        }
    } catch (error) {
        console.error('Error fetching captcha:', error);
        res.status(500).json({ message: 'Error fetching captcha data', error });
    }
});

// مسیر GET برای دریافت قدیمی‌ترین کپچا و حذف آن از دیتابیس
app.get('/get-oldest-captcha', authenticateToken, async (req, res) => {
    try {
        const oldestCaptcha = await Captcha.findOne().sort({ created_at: 1 });

        if (oldestCaptcha) {
            await Captcha.deleteOne({ _id: oldestCaptcha._id });
            res.status(200).json(oldestCaptcha);
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
    
    preGeneratedTokens = usernames.map(username => {
        return jwt.sign({ username }, SECRET_KEY, { expiresIn: '30d' }); // توکن معتبر برای 30 روز
    });

    res.json({ tokens: preGeneratedTokens });
});

// مسیر برای مشاهده توکن‌های تولید شده
app.get('/get-tokens', (req, res) => {
    if (preGeneratedTokens.length === 0) {
        return res.status(404).json({ message: 'No pre-generated tokens found' });
    }
    res.json({ tokens: preGeneratedTokens });
});

// مسیر برای بررسی توکن
app.post('/verify-token', authenticateToken, (req, res) => {
    // اگر به اینجا رسیدیم، یعنی توکن معتبر است
    console.log('Token is valid:', req.user); // چاپ اطلاعات کاربر برای دیباگ

    res.json({ message: 'Token is valid' }); // ارسال پیام به کلاینت مبنی بر معتبر بودن توکن
});

// راه‌اندازی سرور در پورت مشخص شده از Render
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
