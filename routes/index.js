var express = require('express');
var router = express.Router();
var Transaction = require('../models/Transaction');

router.get('/', async function(req, res, next) {
  try {
    const user = req.user || null;
    const transactions = user ? 
      await Transaction.find({ user: user._id }).sort({ date: -1 }) :
      await Transaction.find().sort({ date: -1 });

    res.render('index', {
      title: 'Budget App',
      transactions: transactions,
      user: user
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
