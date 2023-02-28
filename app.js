const express = require('express');
const path = require('path');
const app = express();
require('dotenv').config();

//In case of uncaught exceptions
process.on('uncaughtException', (err) => {
  console.log('ERROR: uncaught exception');
  console.log(err.name, err.message);
});

const connectDB = require('./config/connect');
const products = require('./router/productsRoute');
const users = require('./router/usersRoute');
const bookings = require('./router/paymentRoute');
const globalAppErrorHandler = require('./controllers/errorController');

const port = process.env.PORT || 3001;

//View engine setup
app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));

//Body parser
app.use(express.json());

app.use('/api/v1/products', products);
app.use('/api/v1/users', users);
app.use('/api/v1/booking', bookings);

app.use(globalAppErrorHandler);

//This ensures that the server starts only after connection to the database
const start = async () => {
  try {
    //Connect to the database
    await connectDB(process.env.MONGO_URI);
    //Start the server
    app.listen(port, () => console.log(`Server started on port ${port}`));
  } catch (error) {
    console.log(error);
  }
};

start();

process.on('unhandledRejecion', (err) => {
  console.log(err.name, err.message);
});
