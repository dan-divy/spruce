const Analytics = require("../models/analytics")
const idCreation = require("apikeygen").apikey
module.exports = function(req, res, next) {
    const date = new Date().toISOString().split('T')[0];
    if(req.session.today && req.session.today == date) {
        return next();
    }
    Analytics.findOne({name: "visitors"}, function(err, res) {
        if(err || !res) {
            res = new Analytics({name: "visitors", stats: {}});
        }
        let stats = res.stats;
        let today = stats[date];
        if(today) {
            today.amount++
        } else {
            today = {
                amount: 1
            };
        }
        stats[date] = today
        res.stats = stats;
        res = new Analytics(res);
        req.session.today = date;
        res.save(function() {
            next();
        });
    })
}