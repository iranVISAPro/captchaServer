const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
const jwt = require('jsonwebtoken');

const app = express();
app.use(cors());
app.use(bodyParser.json());

const SECRET_KEY = 'longLiveHumanity';
let preGeneratedTokens = [];

const dbURI = process.env.MONGO_URI || 'mongodb+srv://iranvisa9667:Frozan123@iranvisapro.hieme5l.mongodb.net/?retryWrites=true&w=majority&appName=iranVISAPro';
mongoose.connect(dbURI)
    .then(() => console.log('Connected to MongoDB'))
    .catch((err) => console.error('Error connecting to MongoDB:', err));

// تابع ساخت مدل برای هر کاربر
function getCaptchaModel(username) {
    const schema = new mongoose.Schema({
        captcha_value: { type: String, unique: true },
        user_input: { type: String, required: true },
        username: { type: String, required: true },
        created_at: { type: Date, default: Date.now }
    });

    schema.index({ created_at: 1 }, { expireAfterSeconds: 3600 });

    schema.pre('save', function (next) {
        if (this.user_input) {
            this.user_input = this.user_input.toUpperCase();
        }
        next();
    });

    return mongoose.models[username] || mongoose.model(username, schema, username);
}

// Middleware احراز هویت
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    if (!authHeader) return res.status(403).json({ message: 'No token provided' });

    const token = authHeader.split(' ')[1];
    if (!token) return res.status(403).json({ message: 'Invalid token format' });

    jwt.verify(token, SECRET_KEY, (err, user) => {
        if (err) return res.status(403).json({ message: 'Invalid or expired token', error: err.message });
        req.user = user;
        next();
    });
};

// ذخیره کپچا
app.post('/save-captcha', authenticateToken, async (req, res) => {
    const { captcha_value, user_input } = req.body;
    const username = req.user.username;

    const Captcha = getCaptchaModel(username);

    try {
        const existingCaptcha = await Captcha.findOne({ captcha_value });
        if (existingCaptcha) {
            return res.status(409).json({ message: 'کپچا قبلاً ذخیره شده است' });
        }

        const newCaptchaData = new Captcha({
            captcha_value,
            user_input,
            username,
            created_at: new Date()
        });

        await newCaptchaData.save();
        res.status(200).json({ message: 'Data saved to MongoDB' });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(409).json({ message: 'کپچا قبلاً ذخیره شده است' });
        }
        res.status(500).json({ message: 'Error saving data', error });
    }
});

// گرفتن جدیدترین کپچا
app.get('/get-newest-captcha', authenticateToken, async (req, res) => {
    const currentUser = req.user.username;
    const CaptchaModel = getCaptchaModel(currentUser);

    try {
        const userCaptcha = await CaptchaModel.findOne().sort({ created_at: -1 });
        if (userCaptcha) {
            await CaptchaModel.deleteOne({ _id: userCaptcha._id });
            return res.status(200).json(userCaptcha);
        }

        // فقط user1 می‌تواند از دیگران استفاده کند
        if (currentUser === 'user1') {
            const otherUsers = ['user2', 'user3', 'user4', 'user5', 'user6', 'user7', 'user8', 'user9', 'user10'];
            for (const username of otherUsers) {
                const OtherModel = getCaptchaModel(username);
                const otherCaptcha = await OtherModel.findOne().sort({ created_at: -1 });
                if (otherCaptcha) {
                    await OtherModel.deleteOne({ _id: otherCaptcha._id });
                    return res.status(200).json(otherCaptcha);
                }
            }
        }

        res.status(404).json({ message: 'No captcha data found' });
    } catch (error) {
        console.error('Error fetching or deleting captcha:', error);
        res.status(500).json({ message: 'Error fetching or deleting captcha', error });
    }
});

// تولید توکن
app.get('/generate-tokens', (req, res) => {
    const usernames = ['user1', 'user2', 'user3', 'user4', 'user5', 'user6', 'user7', 'user8', 'user9', 'user10'];
    preGeneratedTokens = usernames.map(username => {
        return jwt.sign({ username }, SECRET_KEY, { expiresIn: '30d' });
    });

    res.json({ tokens: preGeneratedTokens });
});

// بررسی توکن
app.post('/verify-token', (req, res) => {
    const authHeader = req.headers['authorization'];
    if (!authHeader) return res.status(403).json({ message: 'No token provided' });

    const token = authHeader.split(' ')[1];
    if (!token) return res.status(403).json({ message: 'Invalid token format' });

    jwt.verify(token, SECRET_KEY, (err, user) => {
        if (err) return res.status(403).json({ message: 'Invalid or expired token', error: err.message });
        res.json({ message: 'Token is valid', user });
    });
});

// راه‌اندازی سرور
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
