const jwt = require('jsonwebtoken');

const SECRET_KEY = '9A(12m@!10E)!6s^6P^'; // کلید مخفی باید درست باشد
const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6InVzZXI4Iiwicm9sZSI6ImFkbWluIiwiaWF0IjoxNzM0NzgwNzA2LCJleHAiOjE3MzczNzI3MDZ9.exIylv34fZfuibk_5SrmaI-P1ooRpPF5Xax8DclBh5k';

try {
    const decoded = jwt.verify(token, SECRET_KEY);
    console.log('Token is valid:', decoded);
} catch (err) {
    console.error('Token verification failed:', err.message);
}