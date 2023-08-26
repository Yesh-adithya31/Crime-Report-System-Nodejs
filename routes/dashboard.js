let express = require('express');
let router = express.Router();

//////////////////////// DASHBOARD PAGE //////////////////////////
router.get('/', function(req, res, next) {

    if(req.session.user) {
        res.render('Template/template', {
            Page_Content: 'Dashboard',
            title: 'CRIME REPORTING | Dashboard',
            profile: req.session.user
        });
    }else{
        res.redirect('/');
    }
});
//////////////////////// USERS LIST PAGE //////////////////////////
router.get('/userView', function (req, res) {
  if (req.session.user) {

    res.render('Template/template', {
        Page_Content: 'User',
        title: 'CRIME REPORTING | User Details',
        profile: req.session.user
    });

  } else {
    res.redirect('/');
  }
});
//////////////////////// PUBLIC CRIME LIST PAGE //////////////////////////
router.get('/publicCrime', function (req, res) {
    if (req.session.user) {
        res.render('Template/template', {
            Page_Content: 'PublicCrime',
            title: 'CRIME REPORTING | Public Crimes View',
            profile: req.session.user
        });
  
    } else {
        res.redirect('/');
    }
});
//////////////////////// CRIMES LIST PAGE //////////////////////////
router.get('/crime', function (req, res) {
if (req.session.user) {
    res.render('Template/template', {
        Page_Content: 'Crime',
        title: 'CRIME REPORTING | Logs View',
        profile: req.session.user
    });

} else {
    res.redirect('/');
}
});

//////////////////////// PUBLIC CRIME LIST PAGE //////////////////////////
router.get('/police-view', function (req, res) {
    if (req.session.user) {
        res.render('Template/template', {
            Page_Content: 'PoliceView',
            title: 'CRIME REPORTING | Police View',
            profile: req.session.user
        });
  
    } else {
        res.redirect('/');
    }
});

module.exports = router;
