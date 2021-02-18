const express = require('express');
const router = express.Router();
const passport = require('passport'); //authentication
const LocalStrategy = require('passport-local').Strategy;

const { validateUser } = require('../models/user');

router.get('/logout', (req, res) => {
  req.logout(); //This function is exposed by passport.
  res.redirect('/');
});

router.post('/login', [
  validateUser,
  passport.authenticate('local', {
    successRedirect: '/app',
    failureRedirect: '/api/auth/failure',
  }),
]);

router.get('/failure', async (req, res) => {
  res.status('400').send('Invalid username or password.');
});

//Export Router
module.exports = router;
