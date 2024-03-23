const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const portfolioSchema = new Schema({
  owner: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  stocks: [{ stock: { type: Schema.Types.ObjectId, ref: 'Stock' }, quantity: Number }]
});

portfolioSchema.methods.addStock = async function(stockId, quantity) {
  const stockIndex = this.stocks.findIndex(item => item.stock.toString() === stockId.toString());

  if (stockIndex > -1) {
    // If stock already exists, update the quantity
    this.stocks[stockIndex].quantity += quantity;
  } else {
    // Add new stock with quantity
    this.stocks.push({ stock: stockId, quantity });
  }

  await this.save().catch(err => {
    console.error('Error saving portfolio after adding stock:', err.message);
    console.error(err.stack);
  });
};

portfolioSchema.methods.removeStock = async function(stockId) {
  this.stocks = this.stocks.filter(item => item.stock.toString() !== stockId.toString());
  await this.save().catch(err => {
    console.error('Error saving portfolio after removing stock:', err.message);
    console.error(err.stack);
  });
};

portfolioSchema.methods.calculateTotalValue = async function() {
  await this.populate('stocks.stock').catch(err => {
    console.error('Error populating stocks in portfolio:', err.message);
    console.error(err.stack);
  });
  return this.stocks.reduce((acc, {stock, quantity}) => acc + (stock.currentPrice * quantity), 0);
};

const Portfolio = mongoose.model('Portfolio', portfolioSchema);

module.exports = Portfolio;