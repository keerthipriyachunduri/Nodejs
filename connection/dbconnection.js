var sql = require('myssql');
var express = require('express');
var app = express();

var config ={
user:'cricwebsite',
password:'cric2020!',
server:'localhost/SQLExpress',
database:'cricketdb'
};

  sql.connect(config, function (err) {
    
        if (err) console.log(err);
        
        var request = new sql.Request();
  
        request.query('select * from User', function (err, recordset) {
            
            if (err) console.log(err)
           
            res.send(recordset);
            
        });
    });
});
