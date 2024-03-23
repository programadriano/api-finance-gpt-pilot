const mongoose = require('mongoose');
const axios = require('axios');
require('dotenv').config(); // Ensure this is called in your server.js or here if not already.

const stockSchema = new mongoose.Schema({
  symbol: { type: String, unique: true, required: true },
  name: { type: String, required: true },
  sector: { type: String },
  currentPrice: { type: Number }
});

stockSchema.methods.updateCurrentPrice = async function() {
  try {
    const response = await axios.get(`https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${this.symbol}&apikey=${process.env.ALPHA_VANTAGE_API_KEY}`);
    if (response.data && response.data["Global Quote"] && response.data["Global Quote"]["05. price"]) {
      this.currentPrice = parseFloat(response.data["Global Quote"]["05. price"]);
      await this.save();
      console.log(`Updated current price for ${this.symbol} to ${this.currentPrice}`);
    } else {
      console.error('Failed to update price for symbol:', this.symbol);
    }
  } catch (error) {
    console.error('Error updating stock price:', error.message);
    console.error(error.stack);
  }
};

const Stock = mongoose.model('Stock', stockSchema);

module.exports = Stock;