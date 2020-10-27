var express = require("express");
var bodyParser = require("body-parser");
var sql = require('mssql');
var app = express(); 
var cors = require('cors');
const bcrypt = require('bcrypt');
app.use(bodyParser.json()); 

app.use(cors());
var urlencodedParser = bodyParser.urlencoded({ extended: false });
app.use(function (req, res, next) {
    //Enabling CORS 
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "GET,HEAD,OPTIONS,POST,PUT");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, contentType,Content-Type, Accept, Authorization");
    next();
});

var server = app.listen(process.env.port || 8080, function(){
var port = server.address().port;
    console.log("App now running on port", port);
});


var dbConfig ={
user:'cricwebsite',
password:'cric2020!',
server:'localhost',
database: 'cricketdb',
options:{
instanceName: 'SQLExpress',
encrypt: true,
enableArithAbort: true
}
};

var executeQuery = function(res, query){             
     sql.connect(dbConfig, function (err) {
         if (err) {   
                     console.log("Error while connecting database :- " + err);
                     res.send(err);
                  }
                  else {
                         // create Request object
                         var request = new sql.Request();
                         // query to the database
                        request.query(query, function (err, res) {
                           if (err){
                                      console.log("Error while querying database :- " + err);
                                      
                                   }
                            else {
                                console.log(res.recordset);
					
                                }
                        });
					}
    });           
}


app.get("/players", function(req , res){
                var query = "select * from [cricketdb].[dbo].[Players]";
                executeQuery (res, query);
});

app.post("/registerUsers",urlencodedParser,async(req,res) => {
		try{
			
			const salt = await bcrypt.genSalt();
			const hashedPassword = await bcrypt.hash(req.body.password, salt);	
			
			sql.connect(dbConfig, function (err) {
				if (err) {   
				res.send(err)
				console.log("Error while connecting database :- " + err);        
				}
				else{
					var email = req.body.email;
					var phoneNumber = req.body.phoneNumber;
					var request = new sql.Request();					
							
					var query1="Select * from [cricketdb].[dbo].[Users] where [User_Email_Id] ='"+email+"'";
					var query2="Select * from [cricketdb].[dbo].[Users] where [User_Phone_Number] ='"+phoneNumber+"'";
					
					
					
					request.query(query1, function(err,result){						
						if(result.recordset[0] != null){
							console.log("There is a user already") //Prints out in the node console
							res.status(401).send('Email Id is already registerd');
        
						}
						else {
							request.query(query2, function(err,result){
								if(result.recordset[0] != null && result.recordset[0].User_Phone_Number != ''){
									console.log("There is a user already") //Prints out in the node console
									res.status(401).send('Phone Number is already registerd'); //Does not sent this message to the broswer
			
								}
								else {
									console.log('1234')	
									var  parameters = [
										{name:'first_name',sqltype: sql.VarChar, value: req.body.firstName},
										{name:'last_name',sqltype: sql.VarChar,value: req.body.lastName},
										{name:'phone_number',sqltype: sql.VarChar,value: req.body.phoneNumber},
										{name:'email_id',sqltype: sql.VarChar,value: req.body.email},
										{name:'password',sqltype: sql.VarChar,value:hashedPassword}
									];

									parameters.forEach(function(p) {
										request.input(p.name, p.sqltype, p.value);
									});
												
												
									request.query('INSERT INTO [cricketdb].[dbo].[Users](User_First_Name,User_Last_Name,User_Phone_Number,User_Email_Id,Password) VALUES(@first_name,@last_name,@phone_number,@email_id,@password)', function (err, result) {
										if(result){
											console.log("result")
											console.log(result);	
											res.json(req.body)	
										}	
									})
											
								}			
							})
						}
					})
				}
			})
		}
		catch (e) {
        console.log('error occured') //Prints out the error message in the node console
        res.status(400).send("error occured") //Sends a complex error object without the error message
		}	

	
});

app.get("/getMatches", function(req,res){
	var query = "SELECT * from FROM [cricketdb].[dbo].[Match]";
	executeQuery(res,query)
	
});

app.post("/loginUser",urlencodedParser,function(req,res){
	
		sql.connect(dbConfig, function(err){
			
        var request = new sql.Request();
			if(err){
				console.log("error while connecting to database",+err);
				res.send(err);
			}
			else{
				
				var password = req.body.password;
				var email = req.body.username;
				
				
				var query="Select * from [cricketdb].[dbo].[Users] where [User_Email_Id] ='"+email+"'";                           
				 
				request.query(query, async function(err,result){
					var resPassword = result.recordset[0].Password;
					console.log(resPassword);
					try{
						if(err){
							res.status(401).send('Error occured while connecting to database. Please try again.');
						}
						else{
							if(result.recordset.length > 0){
								
								var comparison = await bcrypt.compare(password, resPassword )
								console.log(comparison);
								if(comparison){
									console.log("correct answer")
									res.json(result.recordset[0]);
								}
								else{
									console.log("not match")
									res.status(401).send('email and password does not match');		
								
								}
							}
							else{
								console.log("email not exist")
								res.status(401).send("email does not exist");
								
							}
						}
					}
					catch(err){
						res.send(err);
					}
					
				});

			}
		})
	
});



app.post('/changePassword',async function(req,res){
	try{
		console.log(req.body.email);
		const salt =  await bcrypt.genSalt();
		const hashedNewPassword =  await bcrypt.hash(req.body.newPassword, salt);
		sql.connect(dbConfig, function (err) {
			if (err) {   
				res.send(err)
				console.log("Error while connecting database :- " + err);        
			}
			else{
				var email = req.body.email;
				var currentPassword = req.body.currentPassword
				var request = new sql.Request();
				var query1 = "UPDATE [dbo].[Users] SET [Password] = '"+hashedNewPassword+"' where [User_Email_Id] ='"+email+"' and [Password]='"+currentPassword+"'" ;
				var query2 = "Select * from [cricketdb].[dbo].[Users] where [User_Email_Id] ='"+email+"'";  
				request.query(query1, async function(err,result1){
					console.log(result1.rowsAffected);
					if(result1.rowsAffected != null){
						request.query(query2, function (err, result2) {
							if(result2){
								res.json(result2.recordset[0]);								
							}
							else{
								res.status(401).send('error occured');
							}
						})
					}
					else{
						console.log("No records found with given email id") //Prints out in the node console
						res.status(401).send('Please enter correct current Password');
					}					
							
       									
				})				
			}
		})
	}
	catch(error){
		console.log(error)
		res.send(error)
	}
})



