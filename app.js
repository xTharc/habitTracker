//-----------------------------requirements-------------------------------------
//jshint esversion:6
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const socket = require("socket.io");
const _ = require("lodash");
const session = require('express-session');
const passport = require('passport');
var passportLocalMongoose = require("passport-local-mongoose");
var pjax    = require('express-pjax');

const app = express();
const ejsLint = require('ejs-lint');
app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));
app.use(pjax());

// important place above mongo connection and after use passport
app.use(session({
  secret: "ourLittleSecret.",
  resave: false,
  saveUninitialized: false,
  cookie:{_expires : (15 * 60 * 1000)}, // time im ms == 15min
}));

app.use(passport.initialize());
app.use(passport.session());


mongoose.connect("mongodb://localhost:27017/habitDB", {useNewUrlParser: true});
mongoose.set("useCreateIndex",true);
// ----------------------------------MONGODB SCHEMAS AND MODULES----------------
function daysInMonth (month, year) {
    return new Date(year, month, 0).getDate();
}

const userSchema = new mongoose.Schema ({
  user: String,
  password: String
});
userSchema.plugin(passportLocalMongoose);

const User = new mongoose.model("User", userSchema);



// Red Je pomemben !!
passport.use(User.createStrategy());

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

const userLayouts = {
  habitName: [String],
  habitType: [String],
  accountID: String
};
const userLay = mongoose.model ("userLay", userLayouts);
const userDatas = {
  inputDate: [String],
  forDay: Object,
  habitName: userLayouts.habitName,
  habitData: [String],
  accountID: String,
  Notes: String

};

const userData = mongoose.model ("userData", userDatas);
// Global Time Variables :


var date;
var day;
var month;
var nextMonth;
var year;
var daysinThisMonth;
var daysinNextMonth;
timeUpdate();

function timeUpdate() {
 date = new Date();
console.log("Date ="+ date);
 day = date.getDate();
 month = date.getMonth() + 1 ;
nextMonth = month + 1 ;
 year = date.getFullYear();
 daysinThisMonth = daysInMonth(month, year);

if (nextMonth>12)
{
  year = + 1;
 nextMonth = 1;
  console.log("Pass");
}
 daysinNextMonth = daysInMonth(nextMonth, year);


console.log(day,month,year,daysinThisMonth,daysinNextMonth);
}

setInterval(timeUpdate, 60000);

//-------------------------------------OUR APP----------------------------------
var foundLayout ="";
var foundUserData="";
var checker = 1;
var todaysDate = {
  day: day,
  month: month,
  year: year
};
var greenLight = 0;
var adding;

app.get("/", function(req,res){
  if (req.isAuthenticated()){
    res.redirect("/home");
  } else {
    res.render("home",{});
  }
});

app.post("/login", function(req,res){
  const user = new User({
    username: req.body.username,
    password: req.body.password
  });
  req.login(user, function (err){
    if(err){
      console.log(err);
    } else {
      passport.authenticate("local")(req, res, function(){
        res.redirect("/home");
      });
    }
  })

});

app.get("/register", function(req,res){

res.render("register");
});

app.post("/register", function(req,res){
  User.register({username: req.body.username}, req.body.password, function(err, user){
    console.log("i get here tho ?")
    if(err){
      console.log("i in error");
      console.log(err);
    } else {
        console.log("i in no error guuud stuff");
      passport.authenticate("local")(req,res, function(){
        res.redirect("/home");
      });
    }
  });
});

app.get("/logout", function(req,res){
  req.logout();
  greenLight = 0;
res.redirect("/");
});

app.get("/home", function(req,res){

if (req.isAuthenticated()){

console.log(req.user.id);
  userLay.findOne({accountID:req.user.id}, function(err, foundLayouts){
  if (err){
    console.log(err);
  } else {
    if (foundLayouts) {


    userData.find({accountID:req.user.id, 'forDay.month': month}, function(err, foundData){
      if(err){
        console.log("Erro in userFoundData"+err);
      } else {
        if(foundData){
          foundUserData = foundData;
          console.log(foundData);
        }
        else {
          console.log("NO DATA FOUND for today");
          foundUserData = "";
        }
      }

    });

      foundLayout = foundLayouts;
      greenLight = 1;
      // console.log("foundLayouts = " + foundLayout);
      console.log("what did i get ? -"+foundLayout);

    } else {
      foundLayout = "";
      greenLight = 1;
      console.log("Ne jebe pol posto");
    }
  }
console.log(foundLayout);
});
}
else {
  res.redirect("/");
}

if (greenLight == 1){
  res.render("index",{day: day,dinThisMonth: daysinThisMonth,dinNextMonth:daysinNextMonth,foundLayout: foundLayout, foundUserData:foundUserData, adder: ""});

}
else {
  res.redirect("/");
}

});

app.post("/postData", function(req,res){
var adder;
var gotDay = {
  day: parseInt(req.body.habitDate),
  month: month,
  year: year
}
  userData.findOne({accountID:req.user.id, forDay:gotDay}, function(err, foundSmtn){
  if (err){
    console.log(err);
  } else {
    if (foundSmtn) {
      adding = {
        habitName: req.body.habitName,
        habitData: req.body.habitData,
        accountID: req.user.id,
        inputDate: date,
        forDay: gotDay
      };
      var foundCheck = 0;
      console.log("REEQ BODY NAME Is"+adding.habitName);
      console.log(foundSmtn.habitName+" I Succesfuly located an existing data document");
      for (var i=0;i < foundSmtn.habitName.length; i++){
          if (req.body.habitName ==foundSmtn.habitName[i]){
            console.log(parseInt(req.body.habitDate)+"-----------------------------------------------------------!!1");
            var newTData = "habitData."+i;
            var newTInput = "inputDate."+i;
            userData.updateOne( {accountID:req.user.id,forDay:gotDay},{"$set":{[newTData]: req.body.habitData, [newTInput]: date}},function(err, doc) {
              if (err){
                console.log(err+" this is why its failing");
              }
            });
            foundCheck = 1;
            break;
          }
      }
    if (foundCheck == 0){
      console.log("I NEVER MADE IT TO THE PROBER PLACE")
    userData.updateOne( {accountID:req.user.id,forDay:gotDay},{"$push":{habitName: req.body.habitName, habitData: req.body.habitData, inputDate: date}},function(err, doc) {});
};
    } else {
      adding = {
        habitName: req.body.habitName,
        habitData: req.body.habitData,
        accountID: req.user.id,
        inputDate: date,
        forDay: gotDay
      };

      var adder = new userData({
        habitName: req.body.habitName,
        habitData: req.body.habitData,
        accountID: req.user.id,
        inputDate: date,
        forDay: gotDay
      });
      adder.save();
    }
  }

  });


console.log("TESTing  ->"+req.body.habitName+"  is" +req.body.habitData);
greenLight = 0;
// res.redirect("/FetchData");
//res.renderPjax("index" ,{day: day,dinThisMonth: daysinThisMonth,dinNextMonth:daysinNextMonth,foundLayout: foundLayout, foundUserData:foundUserData, adder: ""});
 res.status(201);
 res.json({});
});


app.post("/home", function(req,res){
  var adding = req.body.habit;
  console.log(adding);

userLay.findOne({accountID:req.user.id}, function(err, foundLayouts){
if (err){
  console.log(err);
} else {
  if (foundLayouts) {

    userLay.updateMany( {accountID:req.user.id},{"$push":{habitName: adding[0], habitType: adding[1] }},function(err, doc) {});

  } else {
     adder = new userLay({
      habitName: adding[0],
      habitType: adding[1],
      accountID: req.user.id
    });
    adder.save();
  }
}
});


  greenLight = 0;
  res.redirect("/home");
});
// app.get("/login", function(req,res){
// res.render("home");
// });

app.get("/FetchData",  function (req, res) {

  // Return the data
  console.log(adding);
  res.json({
    adder: adding
  });
});








//------------------------------------------------------------------------------
var server1 = app.listen(3000, function() {
  console.log("Server started on port 3000");
});
//SOCKET SETUP
var io = socket(server1);

io.on('connection', function(socket){
  console.log('made socket connection');
});
