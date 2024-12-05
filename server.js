const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
app.use(cors()); // فعال‌سازی CORS
app.use(bodyParser.json()); // برای دریافت داده‌ها به صورت JSON

// اتصال به MongoDB (رشته اتصال MongoDB Atlas)
const dbURI = process.env.DATABASE_URL || 'mongodb+srv://sunshineonlineservices:Lovely%20alone@cluster0.mongodb.net/captchaDB?retryWrites=true&w=majority';
mongoose.connect(dbURI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => {
        console.log('Connected to MongoDB');
    })
    .catch((err) => {
        console.error('Error connecting to MongoDB:', err);
    });

// ایجاد اسکیمای داده
const captchaSchema = new mongoose.Schema({
    captcha_value: String,
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

// مسیر POST برای ذخیره داده‌ها در MongoDB
app.post('/save-captcha', async (req, res) => {
    const { captcha_value, user_input } = req.body;

    const newCaptchaData = new Captcha({
        captcha_value,
        user_input,
        created_at: new Date()
    });

    try {
        await newCaptchaData.save();
        res.status(200).json({ message: 'Data saved to MongoDB' });
    } catch (error) {
        res.status(500).json({ message: 'Error saving data', error });
    }
});

// مسیر GET برای دریافت آخرین کپچا
app.get('/get-latest-captcha', async (req, res) => {
    try {
        // پیدا کردن آخرین سند بر اساس تاریخ ایجاد (به صورت نزولی)
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
app.get('/get-oldest-captcha', async (req, res) => {
    try {
        // پیدا کردن قدیمی‌ترین کپچا بر اساس تاریخ ایجاد (به صورت صعودی)
        const oldestCaptcha = await Captcha.findOne().sort({ created_at: 1 });

        if (oldestCaptcha) {
            // حذف کپچا پس از دریافت آن
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

// راه‌اندازی سرور در پورت مشخص شده از Render
const PORT = process.env.PORT || 5000;  // استفاده از پورت Render یا 5000 به‌طور پیش‌فرض
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
