// Load environment variables
require("dotenv").config();
const mongoose = require("mongoose");
const express = require("express");
const session = require("express-session");
const MongoStore = require('connect-mongo');
const authRoutes = require("./routes/authRoutes");
const stockRoutes = require('./routes/stockRoutes');
const portfolioRoutes = require('./routes/portfolioRoutes'); // Added line for portfolioRoutes
const Portfolio = require('./models/Portfolio'); // Added for dashboard functionality

if (!process.env.DATABASE_URL || !process.env.SESSION_SECRET) {
  console.error("Error: config environment variables not set. Please create/edit .env configuration file.");
  process.exit(-1);
}

const app = express();
const port = process.env.PORT || 3000;

// Middleware to parse request bodies
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Setting the templating engine to EJS
app.set("view engine", "ejs");

// Serve static files
app.use(express.static("public"));

// Database connection
mongoose
  .connect(process.env.DATABASE_URL)
  .then(() => {
    console.log("Database connected successfully");
  })
  .catch((err) => {
    console.error(`Database connection error: ${err.message}`);
    console.error(err.stack);
    process.exit(1);
  });

// Session configuration with connect-mongo
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({ mongoUrl: process.env.DATABASE_URL }),
  }),
);

app.on("error", (error) => {
  console.error(`Server error: ${error.message}`);
  console.error(error.stack);
});

// Logging session creation and destruction
app.use((req, res, next) => {
  const sess = req.session;
  // Make session available to all views
  res.locals.session = sess;
  if (!sess.views) {
    sess.views = 1;
    console.log("Session created at: ", new Date().toISOString());
  } else {
    sess.views++;
    console.log(
      `Session accessed again at: ${new Date().toISOString()}, Views: ${sess.views}, User ID: ${sess.userId || '(unauthenticated)'}`,
    );
  }
  next();
});

// Authentication Routes
app.use(authRoutes);

// Stock Routes
app.use('/stock', stockRoutes);

// Portfolio Routes - Added line for using portfolioRoutes
app.use('/portfolio', portfolioRoutes);

// Dashboard route - Added for displaying user's portfolio performance and suggestions
app.get('/dashboard', async (req, res, next) => {
  if (!req.session || !req.session.userId) {
    return res.redirect('/auth/login');
  }

  try {
    const portfolio = await Portfolio.findOne({ owner: req.session.userId })
      .populate({
        path: 'stocks.stock',
        model: 'Stock'
      });

    if (!portfolio) {
      return res.status(404).render('error', { message: 'Portfolio not found.' });
    }

    // Placeholder for actual data fetching logic
    const performanceData = { totalValue: 10000, totalReturn: 500, annualizedReturn: 5 }; // Placeholder, replace with actual data fetching logic
    const suggestions = ['Consider diversifying your portfolio.', 'Invest more in technology sector.']; // Placeholder, replace with actual suggestions fetching logic

    res.render('dashboard', { performanceData, suggestions });

  } catch (error) {
    console.error(`Error fetching data for dashboard: ${error.message}`);
    console.error(error.stack);
    return next(error); // Pass errors to the error handler
  }
});

// Root path response
app.get("/", (req, res) => {
  res.render("index");
});

// If no routes handled the request, it's a 404
app.use((req, res, next) => {
  res.status(404).send("Page not found.");
});

// Error handling
app.use((err, req, res, next) => {
  console.error(`Unhandled application error: ${err.message}`);
  console.error(err.stack);
  res.status(500).send("There was an error serving your request.");
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});