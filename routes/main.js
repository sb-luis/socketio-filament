const express = require('express');
const router = express.Router();

const authorise = require('../middleware/authorise'); //Custom middleware for authorising requests.

router.get('/', (req, res) => {
  if (req.isAuthenticated()) {
    res.redirect('/app'); //If we´re alreday logged in, we get redirected to our account automatically.
  } else {
    res.render('home');
  }
});

router.get('/app', authorise, (req, res) => {
  res.render('app');
});

//Export Router
module.exports = router;
