var express = require('express');
var router = express.Router();
var passport = require('passport');
var bcrypt = require('bcryptjs');
var User = require('../models/User');

router.get('/register', (req, res) => {
  res.render('users/register', { title: 'Register' });
});

router.post('/register', (req, res) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    return res.render('users/register', { title: 'Register', error: 'Username, email, and password are required!' });
  }

  User.findOne({ email }).then(user => {
    if (user) {
      return res.render('users/register', { title: 'Register', error: 'User with this email already exists!' });
    }

    bcrypt.hash(password, 10, (err, hashedPassword) => {
      if (err) return res.render('users/register', { title: 'Register', error: 'Error hashing password!' });

      User.create({ username, email, password: hashedPassword })
        .then(() => {
          res.redirect('/users/login');
        })
        .catch(err => {
          return res.render('users/register', { title: 'Register', error: 'Error creating user!' });
        });
    });
  }).catch(err => {
    console.log(err);
    return res.render('users/register', { title: 'Register', error: 'Something went wrong!' });
  });
});

router.get('/login', (req, res) => {
  res.render('users/login', { title: 'Login' });
});

router.post('/login', (req, res, next) => {
  passport.authenticate('local', (err, user, info) => {
    if (err) {
      return next(err);
    }
    if (!user) {
      return res.render('users/login', {
        title: 'Login',
        error: 'Invalid username or password'
      });
    }
    req.logIn(user, (err) => {
      if (err) {
        return next(err);
      }
      return res.redirect('/');
    });
  })(req, res, next);
});

router.get('/github', passport.authenticate('github', { scope: ['user:email'] }));
router.get(
  '/github/callback',
  passport.authenticate('github', { failureRedirect: '/users/login' }),
  (req, res) => {
    res.redirect('/');
  }
);

router.get('/logout', (req, res) => {
  req.logout((err) => {
    if (err) return next(err);
    res.redirect('/users/login');
  });
});

module.exports = router;
