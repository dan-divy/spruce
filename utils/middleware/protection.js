// Middleware functions
module.exports = {
  isAuthenticated : (req, res, next) => {
    // TODO for later passport implementation
    /*if (!req.isAuthenticated()) {
      // thow error res.status(403).
      return;
    }*/
    if (!req.session._id || !req.session.user) {
      res.render('auth/login', {
        title: req.app.conf.name ,
        error: "You must login to proceed."
      });
      return;
    }
    next();
  }
};