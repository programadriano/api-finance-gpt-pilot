# api-finance

api-finance is a RESTful API designed to assist users, including individual investors, financial analysts, and fintech startups, in managing stock portfolios. It provides real-time financial data, tracks stock performance, and offers portfolio optimization suggestions to enhance investment strategies.

## Overview

The api-finance project utilizes Node.js with the Express framework for the backend, MongoDB as the database, and Mongoose ORM for database schema management. EJS is used for server-rendered UI components, with Bootstrap and vanilla JavaScript for frontend styling and interactions. The architecture encompasses modules for user authentication, data integration with Alpha Vantage for market data, portfolio management, and optimization suggestions.

## Features

- **User Authentication**: Secure access with JWT.
- **Real-Time Financial Data**: Integration with Alpha Vantage API.
- **Stock Performance Tracking**: Monitor individual and overall portfolio performance.
- **Portfolio Optimization Suggestions**: Recommendations for portfolio adjustments based on best practices.

## Getting started

### Requirements

- Node.js
- MongoDB
- An Alpha Vantage API key

### Quickstart

1. Clone the repository.
2. Install dependencies with `npm install`.
3. Copy `.env.example` to `.env` and fill in your details (MongoDB URL, session secret, and Alpha Vantage API key).
4. Start the server with `npm start`.
5. Access the API through `http://localhost:3000` or the configured port.

### License

Copyright (c) 2024.