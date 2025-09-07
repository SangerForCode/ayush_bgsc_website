const rateLimit = require("express-rate-limit");

// Create different rate limiters for different endpoints
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    success: false,
    message: "Too many requests from this IP, please try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const createLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 create requests per windowMs
  message: {
    success: false,
    message: "Too many create requests from this IP, please try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const eventsLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 30, // Limit each IP to 30 score event requests per minute
  message: {
    success: false,
    message: "Too many score events from this IP, please try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = {
  generalLimiter,
  createLimiter,
  eventsLimiter,
};
