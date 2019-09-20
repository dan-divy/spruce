const Analytics = require("../models/analytics");
const idCreation = require("apikeygen").apikey;
module.exports = function(req, res, next) {
  const date = new Date().toISOString().split("T")[0];
  if (req.session.today && req.session.today == date) {
    return next();
  }
  Analytics.findOne({ name: "visitors" }, function(err, res) {
    if (err || !res) {
      res = new Analytics({ name: "visitors", stats: [] });
    }
    let stats = res.stats;
    let today = stats.find(x => x && x.date == date);
    let index = stats.indexOf(today);
    if (today) {
      today.amount++;
    } else {
      today = {
        amount: 1,
        date
      };
    }
    stats[index >= 0 ? index : 0] = today;
    console.log(stats);
    res.stats = stats;
    console.log(res);
    res = new Analytics(res);
    req.session.today = date;
    console.log(res);
    res.save(function() {
      next();
    });
  });
};
