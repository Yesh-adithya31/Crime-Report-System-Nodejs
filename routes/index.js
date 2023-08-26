let express = require('express');
let router = express.Router();
var connection = require('../config/db');
const bcrypt = require('bcrypt');

//////////////////////// ADMIN LOGIN PAGE //////////////////////////
router.get('/', function(req, res, next) {
  res.render('Login/login', {
    title: 'CRIME REPORTING | Login',
    data: '',
    status: ''
  });
});

/////////////////////////////////////////////////// LOGIN API //////////////////////////////////////////
/* POST: Login */
router.post('/signIn', function(req, res, next) {
  let email = req.body.txt_email;
  let password = req.body.txt_password;
  if (email && password) {
    connection.query("SELECT * FROM admin WHERE email = ? ", [email],async function(error, result, fields) {
      const comparison = await bcrypt.compare(password, result[0].pwd)

      if(!error){
        if (result.length > 0) {
          if(comparison){
            req.session.loggedin = true;
            req.session.user = result[0];
            res.end('{"message" : "Logged In Successfully.", "status" : 200 }');
          }
          else{
            res.end('{"message" : "Email and password does not match!!!", "status" : 500 }');
          }

        } else {
          res.end('{"message" : "Email does not exist!!!", "status" : 500 }');
        }			
      }
      else{
        res.end('{"message" : '+ error +', "status" : 500 }');
      }
    });
  } else {
    res.end('{"message" : "Please enter Email and Password!", "status" : 500 }');
  }
});
/////////////////////////////////////////////////// LOGOUT API //////////////////////////////////////////
/* GET: Login */
router.get('/logout', function(req, res, next) {

  if(req.session.user){
      req.session.destroy();
      res.redirect('/');
  }else{
      res.redirect('/');
  }

});

/////////////////////////////////////////////////// DASHBOARD API //////////////////////////////////////////
/* POST: User Count for dashboard. */
router.post('/getUserCount', function (req, res) {
  if (req.session.loggedin) {
    connection.query('SELECT COUNT(*) FROM user WHERE isDeleted = 0', function (err, row) {
      if (err) {
        res.end('{"message" : "Internal Server Error!!", "status" : 500 }');
      } else {
        res.send(JSON.stringify(row[0]));
      }
    })
  } else {
    res.redirect('/');
  }
})
/* POST: Crime Count for dashboard. */
router.post('/getCrimeCount', function (req, res) {
  if (req.session.loggedin) {
    connection.query('SELECT COUNT(*) FROM crime WHERE isDeleted = 0', function (err, row) {
      if (err) {
        res.end('{"message" : "Internal Server Error!!", "status" : 500 }');
      } else {
        res.send(JSON.stringify(row[0]));
      }
    })
  } else {
    res.redirect('/');
  }
})

///////////////////////////////////////////////////  USERS API /////////////////////////////////////////////
/* POST: User DETAILS LIST. */
router.post('/getAllUsers', function (req, res) {
  if (req.session.loggedin) {
    connection.query(`
      SELECT * FROM user WHERE isDeleted = 0
    `, function (err, row) {
      if (err) {
        res.end('{"message" : "Internal Server Error!!", "status" : 500 }');
      } else {
        res.send(row);
      }
    })
  } else {
    res.redirect('/');
  }
})
router.post('/getUsers', function (req, res) {
  if (req.session.loggedin) {
    connection.query(`
      SELECT
      u.user_id AS userID,
      u.nic AS NIC,
      u.first_name AS Fname,
      u.last_name AS Lname,
      u.email AS email,
      COUNT(cn.news_id) AS total_crimes,
      SUM(cn.fake_count) AS total_fake_crimes,
      SUM(cn.true_count) AS total_true_crimes
    FROM
      user u
    JOIN
      crime c ON u.user_id = c.uploader_id
    JOIN
      crime_news cn ON c.crime_id = cn.crime_id
    WHERE
      u.isDeleted = 0
    GROUP BY
      u.user_id;
    `, function (err, row) {
      if (err) {
        res.end('{"message" : "Internal Server Error!!", "status" : 500 }');
      } else {
        res.send(row);
      }
    })
  } else {
    res.redirect('/');
  }
})
/* DELETE: User DETAILS LIST. */
router.delete('/deleteUser', function (req, res) {
  if (req.session.loggedin) {
    const userID = req.body.ID;
    console.log(userID)
    connection.query("UPDATE user SET isDeleted = ? WHERE user_id = ?", [1, userID], function (err, result) {
      if (err) {
        res.end('{"message" : "Internal Server Error!!", "status" : 500 }');
      } else {
        res.end('{"message" : "Selected User Details Deleted Successfully!!!", "status" : 200 }');
      }
    })
  } else {
    res.redirect('/');
  }
})

///////////////////////////////////////////////////  CRIME API /////////////////////////////////////////////
/* POST: CRIME DETAILS LIST. */
router.post('/getCrimedetails', function (req, res) {
  if (req.session.loggedin) {
    connection.query('SELECT * FROM crime INNER JOIN crime_news ON  crime.crime_id = crime_news.crime_id INNER JOIN user ON crime.uploader_id = user.user_id  INNER JOIN police_station ON crime.station_id = police_station.station_id INNER JOIN media ON crime.crime_id = media.crime_id WHERE crime.isDeleted = 0  ORDER BY crime.crime_id ASC', function (err, row) {
      if (err) {
        res.end('{"message" : "Internal Server Error!!", "status" : 500 }');
      } else {
        res.send(row);
      }
    })
  } else {
    res.redirect('/');
  }
})

router.post('/deleteCrime', function (req, res) {
  if (req.session.loggedin) {
    const crimeID = req.body.ID;
    connection.query("UPDATE crime SET isDeleted = ? WHERE crime_id = ?", [1, crimeID], function (err, result) {
      if (err) {
        res.end('{"message" : "Internal Server Error!!", "status" : 500 }');
      } else {
        res.end('{"message" : "Selected Crime Details Deleted Successfully!!!", "status" : 200 }');
      }
    })
  } else {
    res.redirect('/');
  }
})

module.exports = router;
