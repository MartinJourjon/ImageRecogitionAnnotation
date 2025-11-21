var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var cors = require('cors');
require('dotenv').config();

// Import API routes
var authRouter = require('./routes/auth');
var annotationsRouter = require('./routes/annotations');
var annotatorsRouter = require('./routes/annotators');

// Import and start cron jobs
var { startLeaderboardCron } = require('./services/leaderboardCron');
startLeaderboardCron();

// Legacy routes (keep for backward compatibility if needed)
var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');

var app = express();

// CORS configuration
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// API routes
app.use('/api/auth', authRouter);
app.use('/api/annotations', annotationsRouter);
app.use('/api/annotators', annotatorsRouter);

// Legacy routes
app.use('/', indexRouter);
app.use('/users', usersRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);

  // Return JSON for API routes
  if (req.path.startsWith('/api/')) {
    return res.json({ error: err.message });
  }

  res.render('error');
});

module.exports = app;
