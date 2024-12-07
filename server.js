const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
const jwt = require('jsonwebtoken');

const app = express();
app.use(cors());
app.use(bodyParser.json());

const SECRET_KEY = '9A(12m@!10E)!6s^6O^'; // کلید امضای توکن

// اتصال به دیتابیس MongoDB
const dbURI = 'mongodb+srv://sunshineonlineservices:Lovely%20alone@iranvisa.4iu1j.mongodb.net/captchaDB?retryWrites=true&w=majority&appName=iranVISA';
mongoose.connect(dbURI)
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.error('Error connecting to MongoDB:', err));

// اسکیمای Captcha
const captchaSchema = new mongoose.Schema({
    captcha_value: String,
    user_input: { type: String, required: true },
    created_at: { type: Date, default: Date.now }
});
captchaSchema.index({ created_at: 1 }, { expireAfterSeconds: 7200 });

const Captcha = mongoose.model('Captcha', captchaSchema, 'captchas');

// Middleware برای اعتبارسنجی توکن و Fingerprint
const authenticateToken = (req, res, next) => {
    const token = req.headers['authorization']?.split(' ')[1];
    const { fingerprint } = req.body;

    if (!token || !fingerprint) {
        return res.status(403).json({ message: 'Token and fingerprint are required.' });
    }

    jwt.verify(token, SECRET_KEY, (err, decoded) => {
        if (err || decoded.fingerprint !== fingerprint) {
            return res.status(403).json({ message: 'Invalid token or fingerprint.' });
        }
        req.user = decoded;
        next();
    });
};

// مسیر برای تولید توکن همراه با Fingerprint
app.post('/generate-token', (req, res) => {
    const { username, fingerprint } = req.body;

    if (!username || !fingerprint) {
        return res.status(400).json({ message: 'Username and fingerprint are required.' });
    }

    const token = jwt.sign({ username, fingerprint }, SECRET_KEY, { expiresIn: '30d' });
    res.json({ token });
});

// مسیر برای ذخیره Captcha
app.post('/save-captcha', authenticateToken, async (req, res) => {
    const { captcha_value, user_input } = req.body;

    try {
        const newCaptcha = new Captcha({ captcha_value, user_input });
        await newCaptcha.save();
        res.status(200).json({ message: 'Captcha saved successfully.' });
    } catch (error) {
        res.status(500).json({ message: 'Error saving captcha', error });
    }
});

// مسیر برای دریافت قدیمی‌ترین Captcha و حذف آن
app.get('/get-oldest-captcha', authenticateToken, async (req, res) => {
    try {
        const oldestCaptcha = await Captcha.findOne().sort({ created_at: 1 });
        if (oldestCaptcha) {
            await Captcha.deleteOne({ _id: oldestCaptcha._id });
            res.status(200).json(oldestCaptcha);
        } else {
            res.status(404).json({ message: 'No captcha data found.' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Error fetching or deleting captcha', error });
    }
});

// راه‌اندازی سرور
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
