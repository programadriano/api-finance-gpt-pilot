const express = require('express');
const axios = require('axios');
const { authMiddleware } = require('../middlewares/authMiddleware'); // Importing the JWT authentication middleware
require('dotenv').config(); // Ensure environment variables are loaded
const router = express.Router();

router.get('/search', async (req, res) => { // Applying JWT authentication middleware
  try {
    const symbol = req.query.symbol;
    if (!symbol) {
      return res.status(400).send('Stock symbol is required');
    }

    const apiKey = process.env.ALPHA_VANTAGE_API_KEY; // INPUT_REQUIRED {insert your Alpha Vantage API key here}
    if (!apiKey) {
      return res.status(500).send('Alpha Vantage API key is not configured');
    }

    const url = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${apiKey}`;
    const response = await axios.get(url);

    if (response.data && response.data["Global Quote"]) {
      const data = response.data["Global Quote"];
      const formattedResponse = {
        symbol: data["01. symbol"],
        open: data["02. open"],
        high: data["03. high"],
        low: data["04. low"],
        price: data["05. price"],
        volume: data["06. volume"],
        latestTradingDay: data["07. latest trading day"],
        previousClose: data["08. previous close"],
        change: data["09. change"],
        changePercent: data["10. change percent"],
      };
      res.json(formattedResponse);
    } else {
      res.status(404).send('Stock information not found');
    }
  } catch (error) {
    console.error('Error fetching stock information:', error.message);
    console.error(error.stack);
    res.status(500).send('Error fetching stock information');
  }
});

module.exports = router;