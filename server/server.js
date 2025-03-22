const express = require('express');
const { GoogleGenerativeAI } = require("@google/generative-ai");
const cors = require('cors');
const admin = require('firebase-admin');

const app = express();

app.use(cors({
    origin: 'http://127.0.0.1:5500', // Match your client’s origin
    methods: ['POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type']
}));

app.use(express.json());

// Initialize Firebase Admin SDK
const serviceAccount = require('./ecspro-268aa-firebase-adminsdk-scq2d-b0d7db60f3.json'); // Download from Firebase Console
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://ecspro-268aa-default-rtdb.firebaseio.com/"
});

const db = admin.database();
const genAI = new GoogleGenerativeAI(""); // Replace with your Gemini API key
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

app.post('/api/gemini', async (req, res) => {
    console.log('Request body:', req.body);
    try {
        const { prompt, userId } = req.body;
        if (!prompt || typeof prompt !== 'string' || prompt.trim() === '') {
            return res.status(400).json({ error: 'Valid prompt string is required' });
        }
        if (!userId || typeof userId !== 'string') {
            return res.status(400).json({ error: 'Valid userId string is required' });
        }

        // Fetch user data from Firebase
        const userRef = db.ref(`users/${userId}`);
        const snapshot = await userRef.once('value');
        const userData = snapshot.val() || {};

        // Prepare context for Gemini AI
        let context = `User data from Firebase: ${JSON.stringify(userData, null, 2)}\n\n`;
        context += `Current date: ${new Date().toISOString().split('T')[0]}\n\n`;
        context += `User question: ${prompt}`;

        // Generate response using Gemini AI
        const result = await model.generateContent(context);
        const text = result.response.text();

        res.status(200).json({ text });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Failed to process request', details: error.message });
    }
});

const PORT = 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));