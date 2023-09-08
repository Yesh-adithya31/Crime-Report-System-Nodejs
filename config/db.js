var mysql = require('mysql')
var connection;

   connection = mysql.createConnection({
    host: 'sql12.freemysqlhosting.net',
    user: 'sql12645186',
    password: 'RrX355KHgZ',
    database: 'sql12645186',
    port: 3306
    })
    connection.connect(function(err){
        if(!err){
            console.log("Database Connected Suceess!!!");
        }else{
            console.log("Error in Database Connected.: "+ err.message);
        }
    })



module.exports = connection;