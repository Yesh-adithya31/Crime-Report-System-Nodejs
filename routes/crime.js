let express = require('express');
let router = express.Router();
var connection = require('../config/db');
const bcrypt = require('bcrypt');
let multer = require('multer');
let fs = require('fs');

const Storage = multer.diskStorage({

    destination: function (req, file, callback) {
        callback(null, "./public/images/crime");
    },

    filename: function (req, file, callback) {
        callback(null, file.fieldname + "_" + Date.now() + "_" + file.originalname);
    }
});

const upload = multer({
    storage: Storage,
    limits: {
      fileSize: 100 * 1024 * 1024 // 10MB (adjust as needed)
    }
}).single("crime_file");

//////////////////////// CRIME PUBLIC PAGE //////////////////////////
router.get('/', function (req, res, next) {
  if(req.session.user) {
    res.render('Crime/crime', {
        title: 'CRIME REPORTING SYSTEM',
        data: req.session.userLoggedin,
        status: '',
        profile: req.session.user
      });
    }else{
      res.render('Crime/crime', {
        title: 'CRIME REPORTING SYSTEM',
        data: false,
        status: ''
      });
    }
});
//////////////////////// CRIME UPLOADS PAGE //////////////////////////
router.get('/uploads', function (req, res, next) {
    if(req.session.user){
        res.render('Crime/uploads', {
        title: 'CRIME REPORTING | REGISTER',
        data: req.session.userLoggedin,
        status: '',
        profile: req.session.user
        });
    }else{
        res.render('Crime/crimelogin', {
        data: 'Please login!.',
        title: 'CRIME REPORTING | LOGIN',
        status: ''
        });
  }

});
//////////////////////// CRIME NEWS PAGE //////////////////////////
router.get('/news', function (req, res, next) {
    res.render('Crime/crimeview', {
    title: 'CRIME REPORTING | Crime News',
    data: req.session.userLoggedin,
    status: '',
    profile: req.session.user
    });
});
//////////////////////// CRIME LOGIN PAGE //////////////////////////
router.get('/login', function (req, res, next) {

    res.render('Crime/crimelogin', {
        title: 'CRIME REPORTING | LOGIN',
        data: '',
        status: ''
      });
});
//////////////////////// CRIME REGISTER PAGE //////////////////////////
router.get('/signup', function (req, res, next) {

    res.render('Crime/crimeregister', {
        title: 'CRIME REPORTING | REGISTER',
        data: '',
        status: ''
      });
});
///////////////////////////////////////////////////  SIGNUP API /////////////////////////////////////////////
router.post('/signIn', function(req, res, next) {
    let email = req.body.txt_email;
    let password = req.body.txt_password;
    if (email && password) {
      connection.query("SELECT * FROM user WHERE email = ? ", [email],async function(error, result, fields) {
        const comparison = await bcrypt.compare(password, result[0].password)
  
        if(!error){
          if (result.length > 0) {
            if(comparison){
              if(result[0].isDeleted == 0){
                req.session.userLoggedin = true;
                req.session.user = result[0];
                res.end('{"message" : "Logged In Successfully.", "status" : 200 }');
              }else{
                res.end('{"message" : "Your Account has been Removed.You cannot logged again!!!", "status" : 500 }');
              }
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
///////////////////////////////////////////////////  SIGNOUT API /////////////////////////////////////////////
router.get('/signout', function(req, res, next) {
    req.session.destroy();
    res.redirect('/crime');
});
///////////////////////////////////////////////////  CREATE ACCOUNT API /////////////////////////////////////////////
router.post('/createAccount',async function (req, res) {
  const password = req.body.txt_password;
  const encryptedPassword = await bcrypt.hash(password, 10)
  const userAcc = {
    first_name: req.body.txt_first_name,
    last_name: req.body.txt_last_name,
    email: req.body.txt_email,
    password: encryptedPassword,
    nic: req.body.txt_nic,
    isDeleted: 0,
  }

  connection.query("SELECT * FROM user WHERE email = ? ", [userAcc.email],async function(error, result, fields) {
    if (result.length > 0) {
      res.end('{"message" : "Email is already exist!!!", "status" : 500 }');
    }else{
      connection.query("INSERT INTO user SET?", userAcc, function (err, result) {
        if (err) {
          res.end('{"message" : "Internal Server Error!!", "status" : 500 }');
        } else {
          req.session.userLoggedin = true;
          req.session.user = result[0];
          res.end('{"message" : "New User created Successfully...", "status" : 200 }');
        }
      })
    }
  });
});
///////////////////////////////////////////////////  CRIME DATA UPLOAD API /////////////////////////////////////////////
const executeQuery = (query, values) => {
  return new Promise((resolve, reject) => {
    connection.query(query, values, (err, result) => {
      if (err) {
        reject(err);
      } else {
        resolve(result);
      }
    });
  });
};
router.post('/uploadCrime', function (req, res) {
  if (req.session.user) {
    upload(req, res, function (err) {
        if (err) {
            console.log('Error: ' + err)
            res.end('{"message" : "Crime media is not uploaded.!", "status" : 500}');
        }
        const queryCrime = 'INSERT INTO crime SET?';
        const queryCrimeNews = 'INSERT INTO crime_news SET?';
        const queryMedia = 'INSERT INTO media SET?';

        const crimeData = {
          uploader_id: req.session.user.user_id,
          crime_type: req.body.txt_crimetype,
          district_id: req.body.txt_district_name,
          station_id: req.body.txt_police_name,
          isDeleted: 0
        }
        connection.query(queryCrime, crimeData, function (err, result) {
          if (err) {
            res.end('{"message" : "Internal Server Error!!", "status" : 500 }');
          } else {
            const crimeID = result.insertId;
            const crimeNewsData = {
              headline: req.body.txt_headline,
              description: req.body.txt_description,
              fake_count: 0,
              true_count: 0,
              crime_id: crimeID
            }
    
            const crimeMediaData = {
              crime_id: crimeID,
              file_name: req.file.filename,
              isDeleted: 0
            }

            Promise.all([
              executeQuery(queryCrimeNews, crimeNewsData),
              executeQuery(queryMedia, crimeMediaData)
            ])
              .then((results) => {
                // console.log('Query 1 result:', results[0]);
                // console.log('Query 2 result:', results[1]);
                res.end('{"message" : "Crime details uploaded Successfully...", "status" : 200 }');
            
              })
              .catch((err) => {
                console.error('Error executing queries: ', err);
                res.end('{"message" : '+err+', "status" : 500 }');
                fs.unlink('./public/images/crime/' + req.file.filename, function (err) {
                  if (err) return console.log(err);
                  console.log('file deleted successfully');
              });
              });
          }
        })

    });
  } else {
    res.send("/crime/login")
  }
});  
///////////////////////////////////////////////////  CRIME DETAILS API /////////////////////////////////////////////
router.post('/getCrimedetails', function (req, res) {
    connection.query('SELECT * FROM crime INNER JOIN crime_news ON crime.crime_id = crime_news.crime_id INNER JOIN police_station ON crime.station_id = police_station.station_id INNER JOIN district ON crime.district_id = district.district_id INNER JOIN province ON district.province_id = province.province_id WHERE crime.isDeleted = 0  ORDER BY crime.crime_id ASC', function (err, row) {
      if (err) {
        res.end('{"message" : "Internal Server Error!!", "status" : 500 }');
      } else {
        const jsonContent = JSON.stringify(row);
        res.end('{"message" : '+jsonContent+' , "status" : 200}');
      }
    })
})
///////////////////////////////////////////////////  CRIME VOTE API /////////////////////////////////////////////
router.post('/vote', function (req, res) {
  let news_id = req.body.ID;
  
  connection.query('SELECT * FROM crime_news WHERE news_id = ?',[news_id], function (err, row2) {
    if (err) {
      res.end('{"message" : "Internal Server Error!!", "status" : 500 }');
    } else {
      const voteData = {
        user_id: req.session.user.user_id,
        news_id: req.body.ID,
        vote_value: 1
      }
      const queryVote = 'INSERT INTO votes SET?';
      const queryTrueCount = 'UPDATE crime_news SET true_count = ? WHERE news_id = ?'

      let countIN = row2[0].true_count;
      countIN++;
      console.log("COUNT INC:"+countIN);
      Promise.all([
        executeQuery(queryVote, voteData),
        executeQuery(queryTrueCount, [countIN, row2[0].news_id])
      ])
      .then((results) => {
        res.end('{"message" : "New Two Query Success", "status" : 200 }');
      })
      .catch((err) => {
        console.error('Error executing queries: ', err);
        res.end('{"message" : '+err+', "status" : 500 }');
      });
      
    }
  })
})
router.post('/fakeVote', function (req, res) {
  let news_id = req.body.ID;
  
  connection.query('SELECT * FROM crime_news WHERE news_id = ?',[news_id], function (err, row2) {
    if (err) {
      res.end('{"message" : "Internal Server Error!!", "status" : 500 }');
    } else {
      const voteData = {
        user_id: req.session.user.user_id,
        news_id: req.body.ID,
        vote_value: 1
      }
      const queryVote = 'INSERT INTO votes SET?';
      const queryTrueCount = 'UPDATE crime_news SET fake_count = ? WHERE news_id = ?'

      let countIN = row2[0].fake_count;
      countIN++;
      Promise.all([
        executeQuery(queryVote, voteData),
        executeQuery(queryTrueCount, [countIN, row2[0].news_id])
      ])
      .then((results) => {
        res.end('{"message" : "New Two Query Success", "status" : 200 }');
      })
      .catch((err) => {
        console.error('Error executing queries: ', err);
        res.end('{"message" : '+err+', "status" : 500 }');
      });
      
    }
  })
})
///////////////////////////////////////////////////  PROVINCE API /////////////////////////////////////////////
router.get('/get-provinces', function (req, res) {
  connection.query('SELECT * FROM province', function (err, row) {
    if (err) {
      res.end('{"message" : "Internal Server Error!!", "status" : 500 }');
    } else {
      res.send(row);
    }
  })
})
///////////////////////////////////////////////////  DISTRICT API /////////////////////////////////////////////
router.get('/get-district', function (req, res) {
    const provinceID = req.query.provinceID;
    connection.query('SELECT * FROM district WHERE province_id = ?', [provinceID], function (err, row) {
      if (err) {
        res.end('{"message" : "Internal Server Error!!", "status" : 500 }');
      } else {
        res.send(row);
      }
    })
})
///////////////////////////////////////////////////  POLICE STATION API /////////////////////////////////////////////
router.get('/get-policeStation', function (req, res) {
  const districtID = req.query.districtID;
  connection.query('SELECT * FROM police_station WHERE district_id = ?', [districtID], function (err, row) {
    if (err) {
      res.end('{"message" : "Internal Server Error!!", "status" : 500 }');
    } else {
      res.send(row);
    }
  })
})

module.exports = router;