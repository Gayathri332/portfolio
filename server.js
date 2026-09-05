// Local dev / traditional-hosting entry point. Not used on Vercel — see
// api/index.js for that. Keeping this means `npm run dev` / `npm start`
// still work exactly as before for local development.
require('dotenv').config();
const app = require('./app');
const connectDB = require('./lib/db');

const PORT = process.env.PORT || 5000;

connectDB()
  .then(() => {
    console.log('Connected to MongoDB');
    app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
  })
  .catch((err) => {
    console.error('MongoDB connection failed:', err.message);
    console.error('The site will not start until MONGODB_URI in .env is reachable.');
    process.exit(1);
  });
