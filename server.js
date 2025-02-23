const express = require('express');
const nodemailer = require('nodemailer');
const axios = require('axios');
const bcrypt = require('bcrypt');
const cors = require('cors');
const bodyParser = require('body-parser');
const { Pool } = require('pg');
const mongoose = require('mongoose');
const path = require('path');
const qr = require('qr-image');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(bodyParser.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// PostgreSQL Configuration
const pool = new Pool({
    host: "localhost",
    user: "postgres",
    password: "09052006",
    database: "auth",
    port: 5432,
});

// MongoDB Configuration
mongoose.connect('mongodb://127.0.0.1:27017/blogDB')
    .then(() => console.log('✅ MongoDB Connected'))
    .catch(err => console.log('❌ MongoDB Connection Error:', err));

// API Keys
// API keys (замените на свои)
const OPENWEATHER_API_KEY = '5f435c278f9a947e55f2fc8bba7ef0bb';
const NEWS_API_KEY = '42f4ee8665044a77b3be8b6d9efe1bca';
const EXCHANGE_API_KEY = '809e27574ac1d8e094bc467f'

// Nodemailer Configuration
const transporter = nodemailer.createTransport({
    service: "Outlook",
    auth: {
        user: "230517@astanait.edu.kz",
        pass: "SscdEI3fI7Awt"
    }
});
// MongoDB Blog Schema
const blogSchema = new mongoose.Schema({
    title: { type: String, required: true },
    body: { type: String, required: true },
    author: { type: String, default: 'Anonymous' },
    createdAt: { type: Date, default: Date.now }
});

const Blog = mongoose.model('Blog', blogSchema);

// Routes for Assignment 1 (BMI Calculator)
app.get('/bmi', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'bmi.html'));
});

app.post('/calculate-bmi', (req, res) => {
    const weight = parseFloat(req.body.weight);
    const height = parseFloat(req.body.height);

    if (weight > 0 && height > 0) {
        const bmi = (weight / (height * height)).toFixed(2);
        let category = 'Normal';
        if (bmi < 18.5) category = 'Underweight';
        else if (bmi >= 25 && bmi < 30) category = 'Overweight';
        else if (bmi > 30) category = 'Obese';

        return res.send(`
        <h1>Your BMI: ${bmi}</h1>
        <h2>Your category: ${category}</h2>
        `);
    }
    res.send(`<h1>Invalid Input</h1>`);
});

// QR Code routes
app.get('/qrcode', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'qrcode.html'));
});

app.get('/generate-qr', (req, res) => {
    const { url } = req.query;
    if (!url) return res.status(400).send('URL is required');

    try {
        const qrCode = qr.image(url, { type: 'png' });
        res.type('png');
        qrCode.pipe(res);
    } catch (error) {
        res.status(500).send('Failed to generate QR code');
    }
});


// Routes for Assignment 2 (Email Sender)
app.get('/email', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'email.html'));
});

app.post('/send-email', async (req, res) => {
    try {
        let info = await transporter.sendMail({
            from: "230517@astanait.edu.kz",
            to: "tajtleuovzenis@gmail.com", // Фиксированный получатель
            subject: "Test Email",
            text: "Hello from Node.js using Nodemailer"
        });
        res.json({ message: "Email sent successfully!" });
    } catch (error) {
        res.status(500).json({ message: "Error sending email: " + error.message });
    }
});
const frontend = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Weather API App</title>
    <link rel="stylesheet" href="style.css">
    <style>
        body {
            font-family: Arial, sans-serif;
            background-color: #0f0f0f;
            color: #fff;
            margin: 0;
            padding: 0;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: flex-start;
            min-height: 100vh;
        }
        h1 {
            font-size: 2.5rem;
            margin: 20px 0;
        }
        form {
            display: flex;
            flex-direction: row;
            gap: 10px;
            margin-bottom: 20px;
        }
        input {
            padding: 10px;
            border: none;
            border-radius: 5px;
            font-size: 1rem;
            width: 200px;
        }
        button {
            padding: 10px 20px;
            border: none;
            border-radius: 5px;
            background: #ff7e5f;
            color: white;
            font-size: 1rem;
            cursor: pointer;
            transition: background 0.3s ease;
        }
        button:hover {
            background: #feb47b;
        }
        #weather, #news, #currency, #map {
            background: rgba(255, 255, 255, 0.1);
            border-radius: 10px;
            padding: 20px;
            width: 80%;
            margin-top: 20px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        #map {
            height: 400px;
            width: 80%;
            margin: 20px 0;
            border-radius: 10px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
    </style>
</head>
<body>
    <nav>
        <ul>
            <li><a href="index.html">Home</a></li>
            <li><a href="bmi.html">BMI Calculator</a></li>
            <li><a href="email.html">Email Sender</a></li>
            <li><a href="weather">Weather API</a></li>
            <li><a href="blog.html">Blog</a></li>
            <li><a href="auth.html">Auth</a></li>
            <li><a href="qrcode.html">QR Code</a></li>
        </ul>
    </nav>

    <h1>Weather API App</h1>
    <form id="weather-form">
        <input type="text" id="city" placeholder="Enter city" required>
        <button type="submit">Get Weather</button>
    </form>
    <div id="weather"></div>
    <div id="news"></div>
    <div id="currency"></div>
    <div id="map"></div>
    <script>
        document.getElementById('weather-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const city = document.getElementById('city').value;
    const weatherDiv = document.getElementById('weather');
    const mapDiv = document.getElementById('map');
    const newsDiv = document.getElementById('news');
    const currencyDiv = document.getElementById('currency');

    try {
        const weatherResponse = await fetch(\`/api/weather?city=\${city}\`);
        const weatherData = await weatherResponse.json();

        weatherDiv.innerHTML = \`
            <h2>Weather in \${city}</h2>
            <p>Temperature: \${weatherData.temperature}°C</p>
            <p>Description: \${weatherData.description}</p>
            <p>Feels Like: \${weatherData.feels_like}°C</p>
            <p>Humidity: \${weatherData.humidity}%</p>
            <p>Pressure: \${weatherData.pressure} hPa</p>
            <p>Wind Speed: \${weatherData.wind_speed} m/s</p>
            <p>Country Code: \${weatherData.country_code}</p>
            <p>Rain Volume (last 3 hours): \${weatherData.rain_volume} mm</p>
            <p>Coordinates: [\${weatherData.coordinates.lat}, \${weatherData.coordinates.lon}]</p>
        \`;
        const lat = weatherData.coordinates.lat;
        const lon = weatherData.coordinates.lon;

        const map = new google.maps.Map(mapDiv, {
            center: { lat, lng: lon },
            zoom: 10
        });
        new google.maps.Marker({
            position: { lat, lng: lon },
            map: map
        });

        // Отправляем запрос на получение новостей и курса валют для указанного города
        const extraResponse = await fetch(\`/api/extra?city=\${city}\`);
        const extraData = await extraResponse.json();

        // Отображение новостей
        newsDiv.innerHTML = \`
            <h2>Top News for \${city}</h2>
            <ul>
                \${extraData.news.map(item => \`<li>\${item}</li>\`).join('')}
            </ul>
        \`;

        // Отображение курса валют
        currencyDiv.innerHTML = \`
 <h2>Currency Rates in KZT</h2>
        <ul>
            \${extraData.currencies_in_kzt.map(item => \`<li>\${item.currency}: \${item.inKZT} KZT</li>\`).join('')}
        </ul>
            \`;

    } catch (error) {
        weatherDiv.innerHTML = '<p>Error fetching data. Please try again.</p>';
        newsDiv.innerHTML = '';
        currencyDiv.innerHTML = '';
        mapDiv.innerHTML = '';
    }
});

    </script>
    <script src="https://maps.googleapis.com/maps/api/js?key=AIzaSyAbwcqh-PnZs1xuNWEUzpJuaF7vCuYM1Wk"></script>
</body>
</html>
`;


// Routes
app.get('/weather', (req, res) => {
    res.send(frontend);
});

app.get('/api/weather', async (req, res) => {
    const { city } = req.query;
    if (!city) return res.status(400).json({ error: 'City is required' });

    try {
        const weatherResponse = await axios.get('https://api.openweathermap.org/data/2.5/weather', {
            params: {
                q: city,
                appid: OPENWEATHER_API_KEY,
                units: 'metric'
            }
        });

        const data = weatherResponse.data;
        res.json({
            temperature: data.main.temp,
            description: data.weather[0].description,
            icon: data.weather[0].icon,
            coordinates: {
                lat: data.coord.lat,
                lon: data.coord.lon
            },
            feels_like: data.main.feels_like,
            humidity: data.main.humidity,
            pressure: data.main.pressure,
            wind_speed: data.wind.speed,
            country_code: data.sys.country,
            rain_volume: data.rain?.['3h'] || 0
        });
    } catch (error) {
        res.status(500).json({ error: 'Error fetching weather data' });
    }
});

app.get('/api/extra', async (req, res) => {
    const { city } = req.query; // Получаем название города
    if (!city) return res.status(400).json({ error: 'City is required' });

    try {
        // Получаем новости, фильтруя по ключевому слову (название города)
        const newsResponse = await axios.get('https://newsapi.org/v2/everything', {
            params: {
                q: city, // Используем название города как ключевое слово
                apiKey: NEWS_API_KEY,
                language: 'en',
            }
        });

        // Получаем курсы валют USD → KZT и другие валюты с вашим API-ключом
        const exchangeResponse = await axios.get('https://api.exchangerate-api.com/v4/latest/USD', {
            params: {
                apiKey: EXCHANGE_API_KEY   // Используем ваш ключ
            }
        });
        const rates = exchangeResponse.data.rates;

        // Рассчитываем эквиваленты в KZT для нескольких валют
        const currencies = ['EUR', 'GBP', 'JPY', 'AUD', 'CAD', 'CHF', 'INR']; // Добавляем валюты
        const currencyEquivalents = currencies.map(currency => {
            const rate = rates[currency];
            return {
                currency: currency,
                inKZT: rate ? (rate * rates.KZT).toFixed(2) : 'Data not available'
            };
        });

        // Извлекаем заголовки новостей
        const topNews = newsResponse.data.articles
            .slice(0, 3) // Ограничиваем до 3 новостей
            .map(article => article.title); // Берем только заголовки

        // Формируем ответ
        res.json({
            news: topNews.length ? topNews : ['No news available for this city'],
            currencies_in_kzt: currencyEquivalents
        });
    } catch (error) {
        console.error('Error fetching extra data:', error.message);
        res.status(500).json({ error: 'Error fetching extra data' });
    }
});

// Маршрут для отображения страницы аутентификации
app.get("/auth", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "auth.html"));
});

// Регистрация
app.post("/api/auth/register", async (req, res) => {
    const { username, email, password } = req.body;
    try {
        const { rowCount } = await pool.query("SELECT 1 FROM users WHERE email = $1", [email]);
        if (rowCount) return res.status(400).json({ message: "Email already exists" });

        const hashedPassword = await bcrypt.hash(password, 10);
        await pool.query("INSERT INTO users (username, email, password) VALUES ($1, $2, $3)", [username, email, hashedPassword]);

        res.status(201).json({ message: "User successfully registered" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Вход
app.post("/api/auth/login", async (req, res) => {
    const { email, password } = req.body;
    try {
        const { rows } = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
        if (!rows.length) return res.status(401).json({ message: "Incorrect email" });

        const validPassword = await bcrypt.compare(password, rows[0].password);
        if (!validPassword) return res.status(401).json({ message: "Incorrect password" });

        res.json({ message: "Login successful", username: rows[0].username });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});


app.get('/blog', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'blog.html'));
});
// Routes for Assignment 5 (Blog API)
app.post('/api/blogs', async (req, res) => {
    try {
        const { title, body, author } = req.body;
        if (!title || !body) {
            return res.status(400).json({ message: 'Title and body are required' });
        }
        const newBlog = new Blog({ title, body, author });
        await newBlog.save();
        res.status(201).json(newBlog);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

app.get('/api/blogs', async (req, res) => {
    try {
        const blogs = await Blog.find();
        res.json(blogs);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

app.get('/api/blogs/:id', async (req, res) => {
    try {
        const blog = await Blog.findById(req.params.id);
        if (!blog) return res.status(404).json({ message: 'Blog not found' });
        res.json(blog);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

app.put('/api/blogs/:id', async (req, res) => {
    try {
        const { title, body, author } = req.body;
        const updatedBlog = await Blog.findByIdAndUpdate(
            req.params.id,
            { title, body, author },
            { new: true }
        );
        if (!updatedBlog) return res.status(404).json({ message: 'Blog not found' });
        res.json(updatedBlog);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

app.delete('/api/blogs/:id', async (req, res) => {
    try {
        const deletedBlog = await Blog.findByIdAndDelete(req.params.id);
        if (!deletedBlog) return res.status(404).json({ message: 'Blog not found' });
        res.json({ message: 'Blog deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Home page
app.get('/', (req, res) => {
    res.send(`
        <h1>Web Technologies Assignments</h1>
        <ul>
            <li><a href="/bmi">BMI Calculator</a></li>
            <li><a href="/email">Email Sender</a></li>
            <li><a href="/weather">Weather API</a></li>
            <li><a href="/auth">Authentication</a></li>
            <li><a href="/blogs">Blog API</a></li>
        </ul>
    `);
});

// Initialize database and start server
const PORT = 3000;
app.listen(PORT, async () => {
    console.log(`Server running on http://localhost:${PORT}`);
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                username VARCHAR(50) UNIQUE NOT NULL,
                email VARCHAR(100) UNIQUE NOT NULL,
                password VARCHAR(255) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log("PostgreSQL table is ready");
    } catch (error) {
        console.log("PostgreSQL Error:", error.message);
    }
});