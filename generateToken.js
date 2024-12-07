const jwt = require('jsonwebtoken');

// کلید محرمانه خود را در اینجا قرار دهید یا از process.env استفاده کنید
const SECRET_KEY = '9A(12m@!10E)!6s^6O^'; // اینجا کلید خودتان را بگذارید

// تابع تولید توکن
function generateToken(username) {
    const payload = { username }; // فقط نام کاربری در payload
    const token = jwt.sign(payload, SECRET_KEY, { expiresIn: '30d' }); // توکن برای 30 روز معتبر است
    return token;
}

// مسیر برای تولید توکن
app.post('/generate-token', (req, res) => {
    const { username } = req.body;

    if (!username) {
        return res.status(400).json({ message: 'Username is required.' });
    }

    const token = generateToken(username);
    res.json({ token });
});
