var mysql = require('mysql')
var connection;

   connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'crimedb',
    port: 3309
    })
    connection.connect(function(err){
        if(!err){
            console.log("Database Connected Suceess!!!");
        }else{
            console.log("Error in Database Connected.: "+ err.message);
        }
    })



module.exports = connection;