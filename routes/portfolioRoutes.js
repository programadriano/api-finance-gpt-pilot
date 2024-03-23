const express = require('express');
const router = express.Router();
const axios = require('axios');
const moment = require('moment');
const { authMiddleware } = require('../middlewares/authMiddleware'); // Changed from isAuthenticated to authMiddleware
const User = require('../models/User');
const Stock = require('../models/Stock');
const Portfolio = require('../models/Portfolio');

// Helper function to fetch stock price from Alpha Vantage
async function fetchStockPrice(symbol) {
  console.log(`Fetching stock price for symbol: ${symbol}`);
  try {
    const response = await axios.get(`https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${process.env.ALPHA_VANTAGE_API_KEY}`);

    if (response.data && response.data["Global Quote"] && response.data["Global Quote"]["05. price"]) {

      return response.data["Global Quote"]["05. price"];
    } else {
      console.error(`Failed to fetch price for symbol: ${symbol}`);
      throw new Error(`Failed to fetch price for symbol: ${symbol}`);
    }
  } catch (error) {
    console.error('Error fetching stock price:', error.message);
    console.error(error.stack);
    throw error;
  }
}

// POST method to add a stock to the portfolio
router.post('/', async (req, res) => {
  try {
    const { symbol, quantity, currentPrice } = req.body;

    // const currentPrice = await fetchStockPrice(symbol);
    const stock = await Stock.findOneAndUpdate({ symbol }, { symbol, name: symbol, currentPrice }, { upsert: true, new: true });
    let portfolio = await Portfolio.findOne({ owner: req.session.userId }); // Changed from req.session.userId to req.user.userId
    if (!portfolio) {
      portfolio = new Portfolio({ owner: req.session.userId, stocks: [] }); // Changed from req.session.userId to req.user.userId
    }
    await portfolio.addStock(stock._id, quantity);
    console.log(`Stock ${symbol} added to portfolio for user ${req.session.userId}`); // Changed from req.session.userId to req.user.userId
    res.status(200).send('Stock added to portfolio');
  } catch (error) {
    console.error(`Error adding stock to portfolio: ${error.message}`);
    console.error(error.stack);
    res.status(500).send(error.message);
  }
});

// DELETE method to remove a stock from the portfolio
router.delete('/', async (req, res) => {
  try {
    const { symbol } = req.body;
    const stock = await Stock.findOne({ symbol });
    if (!stock) {
      console.log(`Stock ${symbol} not found for deletion.`);
      return res.status(404).send('Stock not found');
    }
    const portfolio = await Portfolio.findOne({ owner: req.user.userId }); // Changed from req.session.userId to req.user.userId
    await portfolio.removeStock(stock._id);
    console.log(`Stock ${symbol} removed from portfolio for user ${req.user.userId}`); // Changed from req.session.userId to req.user.userId
    res.status(200).send('Stock removed from portfolio');
  } catch (error) {
    console.error(`Error removing stock from portfolio: ${error.message}`);
    console.error(error.stack);
    res.status(500).send(error.message);
  }
});

// GET method to calculate and return the performance of the user's portfolio
router.get('/performance', async (req, res) => {
  try {
    const portfolio = await Portfolio.findOne({ owner: req.session.userId }).populate({ // Changed from req.session.userId to req.user.userId
      path: 'stocks.stock',
      model: 'Stock'
    });

    if (!portfolio) {
      return res.status(404).send('Portfolio not found');
    }

    let portfolioValue = 0;
    let totalReturn = 0;
    const oneYearAgo = moment().subtract(1, 'years').format('YYYY-MM-DD');

    for (const item of portfolio.stocks) {
      const stock = item.stock;
      const quantity = item.quantity;
      const symbol = stock.symbol;

      // Fetch historical data from one year ago to today
      const response = await axios.get(`https://www.alphavantage.co/query?function=TIME_SERIES_DAILY_ADJUSTED&symbol=${symbol}&outputsize=full&apikey=${process.env.ALPHA_VANTAGE_API_KEY}`);

      if (response.data && response.data['Time Series (Daily)'] && response.data['Time Series (Daily)'][oneYearAgo]) {
        const oneYearAgoPrice = parseFloat(response.data['Time Series (Daily)'][oneYearAgo]['4. close']);
        const currentPrice = stock.currentPrice;
        const stockReturn = ((currentPrice - oneYearAgoPrice) / oneYearAgoPrice) * 100;

        // Calculate total portfolio value and total return
        portfolioValue += currentPrice * quantity;
        totalReturn += stockReturn * quantity;
      }
    }

    const annualizedReturn = ((totalReturn / portfolioValue) * 100).toFixed(2);
    const responsePayload = {
      totalValue: portfolioValue.toFixed(2),
      totalReturn: totalReturn.toFixed(2),
      annualizedReturn
      // Volatility can be calculated similarly by fetching more historical data points and calculating the standard deviation of returns
    };

    res.json(responsePayload);
  } catch (error) {
    console.error(`Error fetching portfolio performance: ${error.message}`);
    console.error(error.stack);
    res.status(500).send(error.message);
  }
});

// Endpoint to get portfolio optimization suggestions
router.get('/suggestions', async (req, res) => {
  try {
    const portfolio = await Portfolio.findOne({ owner: req.session.userId }) // Changed from req.session.userId to req.user.userId
      .populate({
        path: 'stocks.stock',
        model: 'Stock'
      });

    if (!portfolio) {
      return res.status(404).send('Portfolio not found');
    }

    // Initialize a map to count stock occurrences by sector
    const sectorCounts = {};
    portfolio.stocks.forEach(({ stock }) => {
      sectorCounts[stock.sector] = (sectorCounts[stock.sector] || 0) + 1;
    });

    // Determine the total number of stocks in the portfolio
    const totalStocks = portfolio.stocks.length;
    const suggestions = [];

    // Check for diversification and balance
    if (totalStocks < 10) {
      suggestions.push('Consider diversifying your portfolio by adding more stocks. Aim for at least 10 different stocks.');
    }

    Object.entries(sectorCounts).forEach(([sector, count]) => {
      const sectorPercentage = (count / totalStocks) * 100;
      if (sectorPercentage > 20) {
        suggestions.push(`Reduce concentration in ${sector} sector to below 20% of your portfolio for better diversification.`);
      }
    });

    if (suggestions.length === 0) {
      suggestions.push('Your portfolio is well-diversified. No immediate adjustments recommended.');
    }

    res.json({ suggestions });
  } catch (error) {
    console.error(`Error generating portfolio suggestions: ${error.message}`);
    console.error(error.stack);
    res.status(500).send(error.message);
  }
});

module.exports = router;