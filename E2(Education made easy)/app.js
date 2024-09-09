const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const port = process.env.PORT || 3000;
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const session = require('express-session');
const fs = require("fs");
var XLSV = require("xlsx");
const nodemailer=require('nodemailer');
var alert = require("alert");
const perf = require("execution-time")();
var multer = require("multer");
var path = require("path");
require("dotenv/config");
app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));
app.use(bodyParser.json())
app.use(session({
	secret: 'Your secret key',
	resave: true,
	saveUninitialized: true
}));
var db = mongoose.connect("mongodb://localhost:27017/educationDB", {useNewUrlParser: true, useUnifiedTopology: true});
mongoose.set('useFindAndModify', false);
var name="";
var warnsignlog="";
var timeof="";
const loginSchema = {
 username: String,
 pass: String,
 email: String,
 address: String,
 institution: String,
 plan: String,
 points: Number,
 timeep: Number,
 pet: String,
 verificationstatus: Number
};

const moduleSchema = {
	username: String,
	module: String,
	modulepoints: Number,
	quizresult: Number,
	attempts: Number
};
const loginSchema1 = {
	username: String,
	pass: String,
	email: String,
  address: String,
  institution: String,
  pet: String
};

const counselingSchema = {
	studentusername: String,
	teacherusername: String,
	description: String,
	link: String,
	time: String
}

const doubtsolvingSchema = {
	studentusername: String,
	teacherusername: String,
	doubt: String,
	link: String,
	reply: String
}


const rankingSchema = {
	username: String,
	rankss: Number
}

const imageSchema = {
	username: String,
	img: {
		data: Buffer,
		contentType: String
	}
}

const notificationSchema = {
	notification: String,
	number: Number,
	time: String
}

const Student = mongoose.model("Student",loginSchema);
const Module = mongoose.model("Module",moduleSchema);
const Teacher = mongoose.model("Teacher", loginSchema1);
const Counseling = mongoose.model("Counseling", counselingSchema);
const Ranking = mongoose.model("Ranking", rankingSchema);
const Doubt = mongoose.model("Doubt", doubtsolvingSchema);
const Image = mongoose.model("Image", imageSchema);
const Notification = mongoose.model("Notification", notificationSchema)
app.get("/math", function(req,res){
	if(req.session.username)
	{
	Module.findOne({username: req.session.username , module: "Module1"}, function(err , postm){
		Module.findOne({username: req.session.username , module: "Module2"}, function(err , postmm){

			var progress1 = Math.floor((postm.modulepoints/23)*100);
			var progress2 = Math.floor((postmm.modulepoints/33)*100);
			console.log(progress1);
			console.log(progress2);
			res.render("math", {progress1: progress1 , progress2: progress2});
		});
	});
	}
	else{
		res.send("Not logged in");
	}
});

app.get("/verify", function(req,res){
	res.render("verify");
});

app.post('/verify',function(req,res){
	console.log(req.body.otp);
	console.log(otp);
    if(req.body.otp==otp){
        Student.findOneAndUpdate({email: req.session.em}, {verificationstatus: 1} , function(err , uptim){
			if(!err){
				uptim.save();
				res.redirect("/");
			}
		});
    }
    else{
        res.redirect("verify");
    }
});

app.post('/resend',function(req,res){
    var mailOptions={
        to: res.session.em,
       subject: "Otp for registration is: ",
       html: "<h3>OTP for account verification is </h3>"  + "<h1 style='font-weight:bold;'>" + otp +"</h1>" // html body
     };

     transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            return console.log(error);
        }
        console.log('Message sent: %s', info.messageId);
        console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
        res.render('otp',{msg:"otp has been sent"});
    });

});

var otp = Math.random();
otp = otp * 1000000;
otp = parseInt(otp);
console.log(otp);

let transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    service : 'Gmail',

    auth: {
      user: 'lbsproject123456@gmail.com',
      pass: 'projectlbs123',
    }

});

app.get("/", function(req,res){
	console.log(warnsignlog);
	res.render("home");
});

app.get('/chat', function(req, res){
  res.render("chat");
});

io.on('connection', (socket) => {
  socket.on('chat message', msg => {
    io.emit('chat message', msg);
  });
});


app.get("/profile", function(req,res){
	if(req.session.username)
	{
	Image.find({username: req.session.username}, (err, items) => {
		Student.findOne({username: req.session.username}, function(err , posto){
		res.render("profile", {username: posto.username , email: posto.email ,  plan: posto.plan ,items: items , institution: posto.institution , address: posto.address});
	});
	});
	}
	else{
		res.send("Not log in")
	}
});

app.get("/forgotpass", function(req,res){
	if(req.session.email)
	{
	res.render("forgotpass");
	}
	else{
		res.send("Email not found");
	}
});

app.get("/teacher/forgotpass", function(req,res){
	if(req.session.email)
	{
	res.render("teacherforgotpass");
	}
	else{
		res.send("Email not found");
	}
});



app.get("/forgotpassemail", function(req,res){
	res.render("forgotpassemail");
});

app.get("/teacher/forgotpassemail", function(req,res){
	res.render("teacherforgotpassemail");
});

app.post("/forgotpass", function(req,res){
	var salt = "Xy";
	var hashed = crypto.createHash('md5').update(req.body.pass).digest("hex");
   var passhash = hashed + salt;
   Student.findOneAndUpdate({username: req.body.username , email: req.session.email} , {pass: passhash} , function(err , pos){
	   if(!err){
            pos.save();
            res.redirect("/");
	   }
   });
});

app.post("/teacher/forgotpass", function(req,res){
	var salt = "Xy";
	var hashed = crypto.createHash('md5').update(req.body.pass).digest("hex");
   var passhash = hashed + salt;
   Teacher.findOneAndUpdate({username: req.body.username , email: req.session.email} , {pass: passhash} , function(err , pos){
	   if(!err){
            pos.save();
            res.redirect("/teacher/home");
	   }
   });
});

app.post("/forgotpassemail", function(req,res){
	Student.exists({email: req.body.Email}, function(err , docssee){
		if(docssee === true){
			req.session.email = req.body.Email;
			res.redirect("/forgotpasspet");
		}
		else{
			console.log("Invalid email");
			alert("Invalid email");
			res.redirect("/");
		}
	});
});

app.post("/teacher/forgotpassemail", function(req,res){
	Teacher.exists({email: req.body.Email}, function(err , docssee){
		if(docssee === true){
			req.session.email = req.body.Email;
			res.redirect("/teacher/forgotpasspet");
		}
		else{
			console.log("Invalid email");
			alert("Invalid email");
			res.redirect("/");
		}
	});
});

app.get("/forgotpasspet", function(req,res){
	if(req.session.email)
	{
	res.render("forgotpasspet");
	}
	else{
		res.send("Email not found");
	}
});

app.get("/teacher/forgotpasspet", function(req,res){
	if(req.session.email)
	{
	res.render("forgotpasspet");
	}
	else{
		res.send("Email not found");
	}
});

app.post("/forgotpasspet", function(req,res){
	console.log(req.session.email);
	Student.findOne({email: req.session.email}, function(err , posttss){
		if(posttss.pet === req.body.pet){
			res.redirect("/forgotpass");
		}
		else{
			res.redirect("/");
			alert("Invalid pet");
		}
	});
});

app.post("/teacher/forgotpasspet", function(req,res){
	console.log(req.session.email);
	Teacher.findOne({email: req.session.email}, function(err , posttss){
		if(posttss.pet === req.body.pet){
			res.redirect("/forgotpass");
		}
		else{
			res.redirect("/");
			alert("Invalid pet");
		}
	});
});

app.get("/notification", function(req,res){
	if(req.session.username){
		Notification.find({}, "notification number time", function(err , noti){
		Notification.find ({}, function(err , postno){
			res.render("notification", {notification: noti});
		});
		}).sort('field -number');
	}
	else{
		res.send("Not log in");
	}
});

app.post("/profile", function(req,res){
	var storage = multer.diskStorage({
	destination: (req, file, cb) => {
		cb(null, 'uploads')
	},
	filename: (req, file, cb) => {
		cb(null, file.profile_photo + '-' + Date.now())
	}
});

var uploads = multer({storage: storage});
	var obj = {
		username: req.session.username,
		img: {
			data: fs.readFileSync(path.join(__dirname + '/public/' + req.body.profile_photo)),
			contentType: "image/png"
		}
	}
	Image.findOneAndUpdate({username: req.session.username} , obj, (err , item) => {
		if(err){
			console.log(err);
		}
		else{
			item.save();
			console.log("Updated image");
		}
	});
	console.log(req.session.username);
	Student.findOneAndUpdate({username: req.session.username} , {username: req.body.username , institution: req.body.inst , address: req.body.addr} , function(err , postp){
		if(!err){
			postp.save();
			res.redirect("/profile");
		}
	});
});

app.get("/module4", function(req,res){
	if(req.session.username)
	{
	Module.findOne({username: req.session.username , module: "Module1"}, function(err , poste){
		res.render("module4", {score: poste.quizresult , attm: poste.attempts});
	});
	}
	else{
		res.send("Not log in");
	}
});

app.get("/module7", function(req,res){
	if(req.session.username)
	{
		Module.findOne({username: req.session.username , module: "Module2"}, function(err , poste){
	res.render("module7", {score: poste.quizresult , attm: poste.attempts});
		});
	}
	else{
		res.send("Not log in");
	}
});

app.get("/studentcounseling", function(req , res){
	if(req.session.username)
	{
		if(req.session.plan === "paid")
		{
		Teacher.find({}, function(err , posttea){
		console.log("hh");
		console.log("postea");
	    res.render("studentcounseling", {teachers: posttea});
	    });
		}
	}
	else{
		res.send("Nt log in");
	}
});

app.get("/studentdoubt", function(req , res){
	if(req.session.username)
	{
		if(req.session.plan === "paid")
		{
		Teacher.find({}, function(err , posttea){
		console.log("hh");
		console.log("postea");
	    res.render("studentdoubt", {teachers: posttea});
	    });
		}
	}
	else{
		res.send("Nt log in");
	}
});

app.post("/", function(req,res){
	var m = req.body.signup;
	var m1 = req.body.login;
	if(m === "signup")
	{
		Student.exists({username: req.body.uname , email: req.body.email}, function(err,doce){
			if(doce === true)
			{
				alert("Account already existsplease login");
				res.redirect("/");
			}
			else if(doce === false)
			{
	    var salt = "Xy";
	    var hashed = crypto.createHash('md5').update(req.body.pass).digest("hex");
        var passhash = hashed + salt;
        const login = new Student ({
        username: req.body.uname,
        pass: passhash,
		email: req.body.email,
		address: req.body.addr,
		institution: req.body.insttt,
		plan: req.body.plan,
        points: 1,
		timeep: 0,
		pet: req.body.pet,
		verificationstatus: 0
    });
	const mod1 = new Module ({
        username: req.body.uname,
        module: "Module1",
		modulepoints: 0,
		quizresult: 0,
		attempts: 0
    });
	const mod2 = new Module ({
        username: req.body.uname,
        module: "Module2",
		modulepoints: 0,
		quizresult: 0,
		attempts: 0
    });
	const ran = new Ranking ({
		username: req.body.uname,
		rankss: 0
	});
	const imge = new Image ({
		username: req.body.uname,
		img: {
			data: fs.readFileSync(path.join(__dirname + '/public' + '/profile.png')),
			contentType: "image/png"
		}
	});
    login.save(function(err){
    if (!err){
	   console.log("Success inserted account");
    }
	console.log("Success login");
    });
	mod1.save(function(err){
    if (!err){
	   console.log("Success inserted account");
    }
	console.log("Success mod1");
    });
	mod2.save(function(err){
    if (!err){
	   console.log("Success inserted account");
    }
	console.log("Success mod2");
    });
	ran.save(function(err){
    if (!err){
	   console.log("Success inserted account");
    }
	console.log("Success rank");
    });
	imge.save(function(err){
    if (!err){
	   console.log("Success inserted image");
    }
	console.log("Success rank");
    });
	var mailOptions={
        to: req.body.email,
       subject: "Otp for registration: ",
       html: "<h3>This is a system generated mail. Please do not reply to this email ID. If you have a query or need any clarification you may email us at lbsproject123456@gmail</h3>" +
	   "<br><br>"+
	   "<h3>Welcome, We thank you for Using E2 Online Education system.<br>Your email id update OTP code is : </h3>"  + "<h1 style='font-weight:bold;'>" + otp +"</h1><br><br>"+
	   "<p>*************************** Information******************************<br>"+
	    "For any enquiries or information regarding your transaction with E2(Education made easy), do not<br>"+
		"provide your credit/debit card details by any means to E2(Education made easy). All your queries<br>"+
		"can be replied on the basis of 10 digit E2(Education made easy) Transaction id/ PNR no./User id.<br>"+
		"E2(Education made easy) does not store the credit/debit card information in any form during the transaction.<br>"+
		"**********************************************************************</p>"+
        "<p>In case you require any further assistance, please mail us at <a href="+"lbsproject123456@gmail"+">lbsproject123456@gmail</a>.<br><br><br>"+
		"Warm Regards,<br>"+
		"Customer Care<br>"+
		"E2(Education made easy)<br></p>"		// html body
     };
	req.session.em = req.body.email
	transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            return console.log(error);
        }
        console.log('Message sent: %s', info.messageId);
        console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
		res.redirect("/verify");
    });
	}
	});
	}
	if(m1 === "login")
	{
		var salt = "Xy";
	var hashed = crypto.createHash('md5').update(req.body.pass).digest("hex");
   var passhash = hashed + salt;
	var name = req.body.uname;
	const pass= req.body.pass;
	if(req.body.uname<1 && req.body.pass<1)
	{
		alert("Please enter details");
	}
	Student.exists({username: name , pass: passhash , plan: req.body.planlogin , verificationstatus: 1}, function(err,doc){
		if(err){
			console.log(err);
			console.log("Invalid username or password");
		}
		else{
			if(doc===true){
				req.session.username = req.body.uname;
				req.session.pass = req.body.pass;
				req.session.plan = req.body.planlogin;
				res.redirect("/dashboard");
			}
			else if(doc===false)
			{
					alert("Invalid username or password or enterned invalid plan");
				console.log("Invalid username or password or enterned invalid plan");
				res.redirect("/");
			}
		}
	});
	}
});
app.get("/teacher/home", function(req,res){

	res.render("teacherhome");
});

app.get("/module1quiz", function(req,res){
	if(req.session.username)
	{
	res.render("quiz2");
	}
	else{
		res.send("Not log in");
	}
});

app.get("/module2quiz", function(req,res){
	if(req.session.username)
	{
	res.render("module2");
	}
	else{
		res.send("Not log in");
	}
});

app.get("/timetable", function(req,res){
	if(req.session.username)
	{
		res.render("timetable");
	}
	else{
		res.send("Not log in");
	}
});
app.get("/module1answerquiz", function(req,res){
	if(req.session.username)
	{
        res.render("quiz2answerkey", {question1r: req.session.question1 , question2r: req.session.question2
		, question3r: req.session.question3 , question4r: req.session.question4
		, question5r: req.session.question5 , question6r: req.session.question6
		, question7r: req.session.question7 , question8r: req.session.question8
		, question9r: req.session.question9 , question10r: req.session.question10});
	}
	else{
		res.send("Not log in");
	}
});

app.get("/module1freeanswerquiz", function(req,res){
	if(req.session.username)
	{
        res.render("quiz2freeanswer", {question1r: req.session.question1 , question2r: req.session.question2
		, question3r: req.session.question3 , question4r: req.session.question4
		, question5r: req.session.question5 , question6r: req.session.question6
		, question7r: req.session.question7 , question8r: req.session.question8
		, question9r: req.session.question9 , question10r: req.session.question10});
	}
	else{
		res.send("Not log in");
	}
});

app.get("/module2freeanswerquiz", function(req,res){
	if(req.session.username)
	{
        res.render("module7freeanswer", {question1r: req.session.question1 , question2r: req.session.question2
		, question3r: req.session.question3 , question4r: req.session.question4
		, question5r: req.session.question5 , question6r: req.session.question6
		, question7r: req.session.question7 , question8r: req.session.question8
		, question9r: req.session.question9 , question10r: req.session.question10});
	}
	else{
		res.send("Not log in");
	}
});


app.get("/mathfree", function(req,res){
	if(req.session.username){
		Module.findOne({username: req.session.username , module: "Module1"}, function(err , postm){
		Module.findOne({username: req.session.username , module: "Module2"}, function(err , postmm){

			var progress1 = Math.floor((postm.modulepoints/23)*100);
			var progress2 = Math.floor((postmm.modulepoints/33)*100);
			console.log(progress1);
			console.log(progress2);
			res.render("mathfree", {progress1: progress1 , progress2: progress2});
	});
	});
	}
	else{
		res.send("Not log in");
	}
});

app.get("/module4free", function(req,res){
	if(req.session.username){
		Module.findOne({username: req.session.username , module: "Module1"}, function(err , postse){
			res.render("module4free", {score: postse.quizresult , attm: postse.attempts});
		});
	}
	else{
		res.send("Not log in");
	}
});

app.get("/module7free", function(req,res){
	if(req.session.username){
		Module.findOne({username: req.session.username , module: "Module2"}, function(err , postse){
			res.render("module7free", {score: postse.quizresult , attm: postse.attempts});
		});
	}
	else{
		res.send("Not log in");
	}
});

app.get("/module7answer", function(req,res){
	if(req.session.username){
		res.render("module7answer" , {question1r: req.session.question1 , question2r: req.session.question2
		, question3r: req.session.question3 , question4r: req.session.question4
		, question5r: req.session.question5 , question6r: req.session.question6
		, question7r: req.session.question7 , question8r: req.session.question8
		, question9r: req.session.question9 , question10r: req.session.question10});
	}
	else{
		res.send("Not log in");
	}
});


app.post("/teacher/home", function(req,res){
	var m = req.body.signup;
	var m1 = req.body.login;
	if(m === "signup")
	{
		Teacher.exists({username: req.body.uname , email: req.body.email}, function(err,doce){
			if(doce === true)
			{
				alert("Account already existsplease login");
				res.redirect("/teacher/home");
			}
			else if(doce === false)
			{
	    var salt = "Xy";
	    var hashed = crypto.createHash('md5').update(req.body.pass).digest("hex");
        var passhash = hashed + salt;
        const login1 = new Teacher ({
        username: req.body.uname,
        pass: passhash,
		email: req.body.email,
		address: req.body.addr,
		institution: req.body.insttt,
        pet: req.body.pet
    });
    login1.save(function(err){
    if (!err){
	   console.log("Success inserted account");
    }
	res.redirect("/teacher/home");
    });
	}
	});
	}
	if(m1 === "login")
	{
		var salt = "Xy";
	var hashed = crypto.createHash('md5').update(req.body.pass).digest("hex");
   var passhash = hashed + salt;
	var name = req.body.uname;
	const pass= req.body.pass;
	if(req.body.uname<1 && req.body.pass<1)
	{
		alert("Please enter details");
	}
	Teacher.exists({username: name , pass: passhash}, function(err,doc){
		if(err){
			console.log(err);
			console.log("Invalid username or password");
		}
		else{
			if(doc===true){
				req.session.username1 = req.body.uname;
				req.session.pass1 = req.body.pass;
				res.redirect("/teacher/dashboard");
			}
			else if(doc===false)
			{
					alert("Invalid username or password or enterned invalid plan");
				console.log("Invalid username or password or enterned invalid plan");
				res.redirect("/teacher/home");
			}
		}
	});
	}
});

app.get("/module2freequiz", function(req,res){
	if(req.session.username){
		res.render("module2free");
	}
	else{
		res.send("Not log in");
	}
});

app.get("/module1freequiz", function(req,res){
	if(req.session.username){
		res.render("quiz2free");
	}
	else{
		res.send("Not log in");
	}
});

app.get("/dashboard", function(req,res){
	if(req.session.username)
	{
	perf.start();
	console.log(req.session.plan);
	Student.findOne({username: req.session.username}, function(err , tempe){
		req.session.time = tempe.timeep + timeof;
		Student.findOneAndUpdate({username: req.session.username}, {timeep: req.session.time} , function(err , uptime){
			if(!err){
				uptime.save();
			}
		});
		Student.find({}, "username points", function(err , rank){
		Student.find({}, function(err , stu){
		for(var i=0;i<rank.length;i++)
		{
		Ranking.findOneAndUpdate({username: rank[i].username}, {rankss: i+1} , function(err , rankpo){
			if(!err){
				rankpo.save();
			}
		});
		}
		if(err){
		console.log(err);
	    }
		console.log("Execute first");
		Module.find({username: req.session.username}, function(err , postss){
		Ranking.findOne({username: req.session.username}, function(err,rankpost){
		var s = Math.floor(((req.session.time)/1000) % 60);
		console.log(s);
		var m = Math.floor((req.session.time)/60000 % 60);
		console.log(m);
		var h = Math.floor((req.session.time)/3600000 % 24);
		console.log(h);
	res.render("dashboard", {name: req.session.username , hour: h , second: s , minute: m , modules: postss , ranksss: rankpost.rankss , freepaid: req.session.plan , outoff: rank.length});
	});
	});
	});
	}).sort('field -points');
	});
	}
	else{
		res.send("Not logged in");
	}
});

app.post("/dashboard", function(req,res){
	console.log(req.body.plan);
	if(req.body.plan === "free")
	{
		res.redirect("/mathfree");
	}
	if(req.body.plan === "paid")
	{
		res.redirect("/math");
	}
});

app.post("/module4", function(req,res){
	var values= [];
	console.log(req.body.cbx);
	if(req.body.cbx === "cbx")
	{
		values.push(req.body.cbx);
		  var val = 0;
	    console.log(values);
	    Student.findOne({username: req.session.username}, function(err , post){
		console.log(post.points);
		req.session.value =post.points  + values.length;
	    console.log(values.length);
	    console.log(req.session.value);
	    Student.findOneAndUpdate({username: req.session.username}, {points: req.session.value}, function(err, foundList){
        if (!err){
		  foundList.save();
       }
    });
	});
	Module.findOne({username: req.session.username , module: "Module1"}, function(err , post){
		console.log(post.modulepoints);
		req.session.value1 =post.modulepoints  + values.length;
	    console.log(req.session.value1);
	    Module.findOneAndUpdate({username: req.session.username}, {modulepoints: req.session.value1}, function(err, foundList1){
        if (!err){
		  foundList1.save();
       }
    });
	});
	}
	else{
	for(var i=0;i<req.body.cbx.length;i++)
	{
		values.push(req.body.cbx[i]);

	}
	 var val = 0;
	 console.log(values);
	Student.findOne({username: req.session.username}, function(err , post){
		console.log(post.points);
		req.session.value =post.points  + values.length;
	console.log(values.length);
	console.log(req.session.value);
	Student.findOneAndUpdate({username: req.session.username}, {points: req.session.value}, function(err, foundList){
      if (!err){
		  foundList.save();
      }
    });
	});
	Module.findOne({username: req.session.username , module: "Module1"}, function(err , post){
		console.log(post.modulepoints);
		req.session.value1 =post.modulepoints  + values.length;
	    console.log(req.session.value1);
	    Module.findOneAndUpdate({username: req.session.username}, {modulepoints: req.session.value1}, function(err, foundList1){
        if (!err){
		  foundList1.save();
       }
    });
	});
	}
	res.redirect("/module4");
});

app.post("/module4free", function(req,res){
	var values= [];
	console.log(req.body.cbx);
	if(req.body.cbx === "cbx")
	{
		values.push(req.body.cbx);
		  var val = 0;
	    console.log(values);
	    Student.findOne({username: req.session.username}, function(err , post){
		console.log(post.points);
		req.session.value =post.points  + values.length;
	    console.log(values.length);
	    console.log(req.session.value);
	    Student.findOneAndUpdate({username: req.session.username}, {points: req.session.value}, function(err, foundList){
        if (!err){
		  foundList.save();
       }
    });
	});
	Module.findOne({username: req.session.username , module: "Module1"}, function(err , post){
		console.log(post.modulepoints);
		req.session.value1 =post.modulepoints  + values.length;
	    console.log(req.session.value1);
	    Module.findOneAndUpdate({username: req.session.username}, {modulepoints: req.session.value1}, function(err, foundList1){
        if (!err){
		  foundList1.save();
       }
    });
	});
	}
	else{
	for(var i=0;i<req.body.cbx.length;i++)
	{
		values.push(req.body.cbx[i]);

	}
	 var val = 0;
	 console.log(values);
	Student.findOne({username: req.session.username}, function(err , post){
		console.log(post.points);
		req.session.value =post.points  + values.length;
	console.log(values.length);
	console.log(req.session.value);
	Student.findOneAndUpdate({username: req.session.username}, {points: req.session.value}, function(err, foundList){
      if (!err){
		  foundList.save();
      }
    });
	});
	Module.findOne({username: req.session.username , module: "Module1"}, function(err , post){
		console.log(post.modulepoints);
		req.session.value1 =post.modulepoints  + values.length;
	    console.log(req.session.value1);
	    Module.findOneAndUpdate({username: req.session.username}, {modulepoints: req.session.value1}, function(err, foundList1){
        if (!err){
		  foundList1.save();
       }
    });
	});
	}
	res.redirect("/module4free");
});

app.post("/module7", function(req,res){
	var values= [];
	console.log(req.body.cbx);
	if(req.body.cbx === "cbx")
	{
		values.push(req.body.cbx);
		  var val = 0;
	    console.log(values);
	    Student.findOne({username: req.session.username}, function(err , post){
		console.log(post.points);
		req.session.value =post.points  + values.length;
	    console.log(values.length);
	    console.log(req.session.value);
	    Student.findOneAndUpdate({username: req.session.username}, {points: req.session.value}, function(err, foundList){
        if (!err){
		  foundList.save();
       }
    });
	});
	Module.findOne({username: req.session.username , module: "Module2"}, function(err , post){
		console.log(post.modulepoints);
		req.session.value1 =post.modulepoints  + values.length;
	    console.log(req.session.value1);
	    Module.findOneAndUpdate({username: req.session.username}, {modulepoints: req.session.value1}, function(err, foundList1){
        if (!err){
		  foundList1.save();
       }
    });
	});
	}
	else{
	for(var i=0;i<req.body.cbx.length;i++)
	{
		values.push(req.body.cbx[i]);

	}
	 var val = 0;
	 console.log(values);
	Student.findOne({username: req.session.username}, function(err , post){
		console.log(post.points);
		req.session.value =post.points  + values.length;
	console.log(values.length);
	console.log(req.session.value);
	Student.findOneAndUpdate({username: req.session.username}, {points: req.session.value}, function(err, foundList){
      if (!err){
		  foundList.save();
      }
    });
	});
	Module.findOne({username: req.session.username , module: "Module2"}, function(err , post){
		console.log(post.modulepoints);
		req.session.value1 =post.modulepoints  + values.length;
	    console.log(req.session.value1);
	    Module.findOneAndUpdate({username: req.session.username}, {modulepoints: req.session.value1}, function(err, foundList1){
        if (!err){
		  foundList1.save();
       }
    });
	});
	}
	res.redirect("/module7");
});

app.post("/module7free", function(req,res){
	var values= [];
	console.log(req.body.cbx);
	if(req.body.cbx === "cbx")
	{
		values.push(req.body.cbx);
		  var val = 0;
	    console.log(values);
	    Student.findOne({username: req.session.username}, function(err , post){
		console.log(post.points);
		req.session.value =post.points  + values.length;
	    console.log(values.length);
	    console.log(req.session.value);
	    Student.findOneAndUpdate({username: req.session.username}, {points: req.session.value}, function(err, foundList){
        if (!err){
		  foundList.save();
       }
    });
	});
	Module.findOne({username: req.session.username , module: "Module2"}, function(err , post){
		console.log(post.modulepoints);
		req.session.value1 =post.modulepoints  + values.length;
	    console.log(req.session.value1);
	    Module.findOneAndUpdate({username: req.session.username}, {modulepoints: req.session.value1}, function(err, foundList1){
        if (!err){
		  foundList1.save();
       }
    });
	});
	}
	else{
	for(var i=0;i<req.body.cbx.length;i++)
	{
		values.push(req.body.cbx[i]);

	}
	 var val = 0;
	 console.log(values);
	Student.findOne({username: req.session.username}, function(err , post){
		console.log(post.points);
		req.session.value =post.points  + values.length;
	console.log(values.length);
	console.log(req.session.value);
	Student.findOneAndUpdate({username: req.session.username}, {points: req.session.value}, function(err, foundList){
      if (!err){
		  foundList.save();
      }
    });
	});
	Module.findOne({username: req.session.username , module: "Module2"}, function(err , post){
		console.log(post.modulepoints);
		req.session.value1 =post.modulepoints  + values.length;
	    console.log(req.session.value1);
	    Module.findOneAndUpdate({username: req.session.username}, {modulepoints: req.session.value1}, function(err, foundList1){
        if (!err){
		  foundList1.save();
       }
    });
	});
	}
	res.redirect("/module7free");
});

app.post("/module1quiz", function(req,res){
	var m = req.body.moduleone;
	var c = 0;
	req.session.question1 = " ";
	req.session.question2 = " ";
	req.session.question3 = " ";
	req.session.question4 = " ";
	req.session.question5 = " ";
	req.session.question6 = " ";
	req.session.question7 = " ";
	req.session.question8 = " ";
	req.session.question9 = " ";
	req.session.question10 = " ";

	var qmodone1 = req.body.question1;
	var qmodone2 = req.body.question2;
	var qmodone3 = req.body.question3;
	var qmodone4 = req.body.question4;
	var qmodone5 = req.body.question5;
	var qmodone6 = req.body.question6;
	var qmodone7 = req.body.question7;
	var qmodone8 = req.body.question8;
	var qmodone9 = req.body.question9;
	var qmodone10 = req.body.question10;
	if(qmodone1 === "25200")
	{
		c++;

	}
	req.session.question1 = qmodone1;
	if(qmodone2 === "209")
	{
		c++;

	}
	req.session.question2 = qmodone2;
	if(qmodone3 === "720")
	{
		c++;

	}
	req.session.question3 = qmodone3;
	if(qmodone4 === "50400")
	{
		c++;

	}
	req.session.question4 = qmodone4;
	if(qmodone5 === "63")
	{
		c++;

	}
	req.session.question5 = qmodone5;
	if(qmodone6 === "120960")
	{
		c++;

	}
	req.session.question6 = qmodone6;
	if(qmodone7 === "11760")
	{
		c++;

	}
	req.session.question7 = qmodone7;
	if(qmodone8 === "720")
	{
		c++;

	}
	req.session.question8 = qmodone8;
	if(qmodone9 === "8")
	{
		c++;

	}
	req.session.question9 = qmodone9;
	if(qmodone10 === "36")
	{
		c++;

	}
	req.session.question10 = qmodone10;
	console.log(c);
	req.session.quizr = c;
	Module.findOne({username: req.session.username , module: m}, function(err , att){
		var attm = att.attempts;
		var attm = attm + 1;
		Module.findOneAndUpdate({username: req.session.username , module: m} , {quizresult: req.session.quizr , attempts: attm}, function(err, foundList){
        if (!err){
		  foundList.save();
        }
     });
	});
	Student.findOne({username: req.session.username}, function(err , post){
		console.log(post.points);
		req.session.value =post.points  + req.session.quizr;
	console.log(req.session.value);
	Student.findOneAndUpdate({username: req.session.username}, {points: req.session.value}, function(err, foundList){
      if (!err){
		  foundList.save();
      }
    });
	});
	Module.findOne({username: req.session.username , module: "Module1"}, function(err , post){
		console.log(post.modulepoints);
		req.session.value2 =post.modulepoints  + req.session.quizr;
	    console.log(req.session.value2);
	    Module.findOneAndUpdate({username: req.session.username}, {modulepoints: req.session.value2}, function(err, foundList2){
        if (!err){
		  foundList2.save();
       }
    });
	});
	res.redirect("/module1answerquiz");
});

app.post("/module1freequiz", function(req,res){
	var m = req.body.moduleone;
	var c = 0;
	req.session.question1 = " ";
	req.session.question2 = " ";
	req.session.question3 = " ";
	req.session.question4 = " ";
	req.session.question5 = " ";
	req.session.question6 = " ";
	req.session.question7 = " ";
	req.session.question8 = " ";
	req.session.question9 = " ";
	req.session.question10 = " ";
	var qmodone1 = req.body.question1;
	var qmodone2 = req.body.question2;
	var qmodone3 = req.body.question3;
	var qmodone4 = req.body.question4;
	var qmodone5 = req.body.question5;
	var qmodone6 = req.body.question6;
	var qmodone7 = req.body.question7;
	var qmodone8 = req.body.question8;
	var qmodone9 = req.body.question9;
	var qmodone10 = req.body.question10;
	if(qmodone1 === "25200")
	{
		c++;

	}
	req.session.question1 = qmodone1;
	if(qmodone2 === "209")
	{
		c++;

	}
	req.session.question2 = qmodone2;
	if(qmodone3 === "720")
	{
		c++;

	}
	req.session.question3 = qmodone3;
	if(qmodone4 === "50400")
	{
		c++;

	}
	req.session.question4 = qmodone4;
	if(qmodone5 === "63")
	{
		c++;

	}
	req.session.question5 = qmodone5;
	if(qmodone6 === "120960")
	{
		c++;

	}
	req.session.question6 = qmodone6;
	if(qmodone7 === "11760")
	{
		c++;

	}
	req.session.question7 = qmodone7;
	if(qmodone8 === "720")
	{
		c++;

	}
	req.session.question8 = qmodone8;
	if(qmodone9 === "8")
	{
		c++;

	}
	req.session.question9 = qmodone9;
	if(qmodone10 === "36")
	{
		c++;

	}
	req.session.question10 = qmodone10;
	console.log(c);
	req.session.quizr = c;
	Module.findOne({username: req.session.username , module: m}, function(err , att){
		var attm = att.attempts;
		var attm = attm + 1;
		Module.findOneAndUpdate({username: req.session.username , module: m} , {quizresult: req.session.quizr , attempts: attm}, function(err, foundList){
        if (!err){
		  foundList.save();
        }
     });
	});
	Student.findOne({username: req.session.username}, function(err , post){
		console.log(post.points);
		req.session.value =post.points  + req.session.quizr;
	console.log(req.session.value);
	Student.findOneAndUpdate({username: req.session.username}, {points: req.session.value}, function(err, foundList){
      if (!err){
		  foundList.save();
      }
    });
	});
	Module.findOne({username: req.session.username , module: "Module1"}, function(err , post){
		console.log(post.modulepoints);
		req.session.value1 =post.modulepoints  + req.session.quizr;
	    console.log(req.session.value1);
	    Module.findOneAndUpdate({username: req.session.username}, {modulepoints: req.session.value1}, function(err, foundList1){
        if (!err){
		  foundList1.save();
       }
    });
	});
	res.redirect("/module1freeanswerquiz");
});

app.post("/module2quiz", function(req,res){
	var m = req.body.moduletwo;
	var c = 0;
	req.session.question1 = " ";
	req.session.question2 = " ";
	req.session.question3 = " ";
	req.session.question4 = " ";
	req.session.question5 = " ";
	req.session.question6 = " ";
	req.session.question7 = " ";
	req.session.question8 = " ";
	req.session.question9 = " ";
	req.session.question10 = " ";
	var qmodone1 = req.body.question1;
	var qmodone2 = req.body.question2;
	var qmodone3 = req.body.question3;
	var qmodone4 = req.body.question4;
	var qmodone5 = req.body.question5;
	var qmodone6 = req.body.question6;
	var qmodone7 = req.body.question7;
	var qmodone8 = req.body.question8;
	var qmodone9 = req.body.question9;
	var qmodone10 = req.body.question10;
	if(qmodone1 === "1/26")
	{
		c++;

	}
	req.session.question1 = qmodone1;
	if(qmodone2 === "2/91")
	{
		c++;

	}
	req.session.question2= qmodone2;
	if(qmodone3 === "13/102")
	{
		c++;

	}
	req.session.question3 = qmodone3;
	if(qmodone4 === "9/52")
	{
		c++;

	}
	req.session.question4 = qmodone4;
	if(qmodone5 === "4/7")
	{
		c++;

	}
	req.session.question5 = qmodone5;
	if(qmodone6 === "3/4")
	{
		c++;

	}
	req.session.question6 = qmodone6;
	if(qmodone7 === "21/46")
	{
		c++;

	}
	req.session.question7 = qmodone7;
	if(qmodone8 === "2/7")
	{
		c++;

	}
	req.session.question8 = qmodone8;
	if(qmodone9 === "1/221")
	{
		c++;

	}
	req.session.question9 = qmodone9;
	if(qmodone10 === "5/12")
	{
		c++;

	}
	req.session.question10 = qmodone10;
	console.log(c);
	req.session.quizr = c;
	Module.findOne({username: req.session.username , module: m}, function(err , att){
		var attm = att.attempts;
		var attm = attm + 1;
		Module.findOneAndUpdate({username: req.session.username , module: m} , {quizresult: req.session.quizr , attempts: attm}, function(err, foundList){
        if (!err){
		  foundList.save();
        }
     });
	});
	Student.findOne({username: req.session.username}, function(err , post){
		console.log(post.points);
		req.session.value =post.points  + req.session.quizr;
	console.log(req.session.value);
	Student.findOneAndUpdate({username: req.session.username}, {points: req.session.value}, function(err, foundList){
      if (!err){
		  foundList.save();
      }
    });
	});
	Module.findOne({username: req.session.username , module: "Module2"}, function(err , post){
		console.log(post.modulepoints);
		req.session.value1 =post.modulepoints  + req.session.quizr;
	    console.log(req.session.value1);
	    Module.findOneAndUpdate({username: req.session.username}, {modulepoints: req.session.value1}, function(err, foundList1){
        if (!err){
		  foundList1.save();
       }
    });
	});
	res.redirect("/module7answer");
});

app.post("/module2freequiz", function(req,res){
	var m = req.body.moduletwo;
	var c = 0;
	req.session.question1 = " ";
	req.session.question2 = " ";
	req.session.question3 = " ";
	req.session.question4 = " ";
	req.session.question5 = " ";
	req.session.question6 = " ";
	req.session.question7 = " ";
	req.session.question8 = " ";
	req.session.question9 = " ";
	req.session.question10 = " ";
	var qmodone1 = req.body.question1;
	var qmodone2 = req.body.question2;
	var qmodone3 = req.body.question3;
	var qmodone4 = req.body.question4;
	var qmodone5 = req.body.question5;
	var qmodone6 = req.body.question6;
	var qmodone7 = req.body.question7;
	var qmodone8 = req.body.question8;
	var qmodone9 = req.body.question9;
	var qmodone10 = req.body.question10;
	if(qmodone1 === "1/26")
	{
		c++;

	}
	req.session.question1 = qmodone1;
	if(qmodone2 === "2/91")
	{
		c++;

	}
	req.session.question2= qmodone2;
	if(qmodone3 === "13/102")
	{
		c++;

	}
	req.session.question3 = qmodone3;
	if(qmodone4 === "9/52")
	{
		c++;

	}
	req.session.question4 = qmodone4;
	if(qmodone5 === "4/7")
	{
		c++;

	}
	req.session.question5 = qmodone5;
	if(qmodone6 === "3/4")
	{
		c++;

	}
	req.session.question6 = qmodone6;
	if(qmodone7 === "21/46")
	{
		c++;

	}
	req.session.question7 = qmodone7;
	if(qmodone8 === "2/7")
	{
		c++;

	}
	req.session.question8 = qmodone8;
	if(qmodone9 === "1/221")
	{
		c++;

	}
	req.session.question9 = qmodone9;
	if(qmodone10 === "5/12")
	{
		c++;

	}
	req.session.question10 = qmodone10;
	console.log(c);
	req.session.quizr = c;
	Module.findOne({username: req.session.username , module: m}, function(err , att){
		var attm = att.attempts;
		var attm = attm + 1;
		Module.findOneAndUpdate({username: req.session.username , module: m} , {quizresult: req.session.quizr , attempts: attm}, function(err, foundList){
        if (!err){
		  foundList.save();
        }
     });
	});
	Student.findOne({username: req.session.username}, function(err , post){
		console.log(post.points);
		req.session.value =post.points  + req.session.quizr;
	console.log(req.session.value);
	Student.findOneAndUpdate({username: req.session.username}, {points: req.session.value}, function(err, foundList){
      if (!err){
		  foundList.save();
      }
    });
	});
	Module.findOne({username: req.session.username , module: "Module2"}, function(err , post){
		console.log(post.modulepoints);
		req.session.value1 =post.modulepoints  + req.session.quizr;
	    console.log(req.session.value1);
	    Module.findOneAndUpdate({username: req.session.username}, {modulepoints: req.session.value1}, function(err, foundList1){
        if (!err){
		  foundList1.save();
       }
    });
	});
	res.redirect("/module2freeanswerquiz");
});

app.get("/logout", function(req,res){
	const results = perf.stop();
	timeof = results.time;
	req.session.destroy();
	res.redirect("/");
});

http.listen(port, () => {
  console.log("Server started at post 3000");
});

app.get("/teacher/dashboard", function(req,res){
	if(req.session.username1){
		Student.find({}, function(err , postsse){
		console.log("hh");
	    res.render("teacherdashboard", {students: postsse});
	    });
	}
	else{
		res.send("Not logged in");
	}
});

app.get("/ttcounseling", function(req,res){
		Counseling.find({}, function(err , posttacoun){
		console.log("hh");
		console.log(posttacoun);
	    res.render("ttcounseling", {counselingsss: posttacoun});
	    });
});

app.get("/doubtall", function(req,res){
		Doubt.find({}, function(err , posttacoun){
		console.log("hh");
		console.log(posttacoun);
	    res.render("doubtall", {counselingsss: posttacoun});
	    });
});

app.get("/teacher/counselling", function(req,res){
	if(req.session.username1)
	{
	Counseling.find({}, function(err , postteacoun){
		console.log("hh");
		console.log(postteacoun);
	    res.render("teachercounseling", {counselingss: postteacoun});
	    });
	}
	else{
		res.send("Not log in");
	}
});

app.get("/teacher/doubt", function(req,res){
	if(req.session.username1)
	{
	Doubt.find({}, function(err , postteacoun){
		console.log("hh");
		console.log(postteacoun);
	    res.render("teacherdoubt", {counselingss: postteacoun});
	    });
	}
	else{
		res.send("Not log in");
	}
});

app.post("/teacher/counselling", function(req,res){
	req.session.username = req.body.studentsub;
	req.session.description = req.body.description;
	console.log(req.body.time);
	var tm = req.body.time;
	var lk= req.body.link;
	console.log("I am"+tm);
	Counseling.findOneAndUpdate({description: req.body.description}, {time: tm , link: lk}, function(err, foundListss){
      if (!err){
		  foundListss.save();
		  console.log("success updated time");
      }
    });
	res.redirect("/ttcounseling");
});

app.post("/teacher/doubt", function(req,res){
	req.session.username = req.body.studentsub;
	req.session.description = req.body.description;
	console.log(req.body.reply);
	var tm = req.body.time;
	var lk= req.body.link;
	console.log("I am"+tm);
	Doubt.findOneAndUpdate({doubt: req.body.description}, {reply: tm , link: lk}, function(err, foundListss){
      if (!err){
		  foundListss.save();
		  console.log("success updated reply");
      }
    });
	res.redirect("/doubtall");
});


app.get("/progress/:postId", function(req, res){
  const requestedPostId = req.params.postId;
  Student.findOne({_id: requestedPostId}, function(err, postsss){
   req.session.username = postsss.username;
   res.redirect("/dashboard");
   });
 });

 app.post("/studentcounseling", function(req,res){
	console.log(req.body.studentsubmit);
	req.session.username1 = req.body.studentsubmit;
	const coun = new Counseling({
	 studentusername: req.session.username,
	 teacherusername: req.body.studentsubmit,
	 description: req.body.description,
	 link: "0",
	 time: "0"
 });
 coun.save(function(err){
	console.log("Success inserted counselling");
 });
 res.redirect("/studentcounseling");
});

 app.post("/studentdoubt", function(req,res){
	console.log(req.body.studentsubmit);
	req.session.username1 = req.body.studentsubmit;
	const coun1 = new Doubt({
	 studentusername: req.session.username,
	 teacherusername: req.body.studentsubmit,
	 doubt: req.body.description,
	 link: 0,
	 reply: "0"
 });
 coun1.save(function(err){
	console.log("Success inserted counselling");
 });
 res.redirect("/studentdoubt");
});
