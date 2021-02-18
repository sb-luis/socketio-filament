module.exports = function authorise(req, res, next) {
  if (req.isAuthenticated()) {
    next();
  } else {
    res.redirect('/');
  }
}