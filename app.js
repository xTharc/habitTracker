//-----------------------------requirements-------------------------------------
//jshint esversion:6
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const socket = require("socket.io");
const _ = require("lodash");
const app = express();
const ejsLint = require('ejs-lint');
app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

mongoose.connect("mongodb://localhost:27017/habitDB", {useNewUrlParser: true});
// ----------------------------------MONGODB SCHEMAS AND MODULES----------------
function daysInMonth (month, year) {
    return new Date(year, month, 0).getDate();
}


const userLayouts = {
  habitName: [String],
  habitType: [String]
};
const userData = {
  inputDate: String,
  habitName: String,
  habitData: String

};
const userLay = mongoose.model ("userLay", userLayouts);

const date = new Date();
const day =date.getDate();
var month = date.getMonth() + 1 ;
var nextMonth = month + 1 ;
var year = date.getFullYear();
const daysinThisMonth = daysInMonth(month, year);
if (nextMonth>12)
{
  year = + 1;
 nextMonth = 1;
  console.log("Pass");
}
const daysinNextMonth = daysInMonth(nextMonth, year);


console.log(day,month,year,daysinThisMonth,daysinNextMonth);

//-------------------------------------OUR APP----------------------------------
var foundLayout;
var foundLayoutnames=[];
var checker = 1;
app.get("/", function(req,res){

  userLay.find({}, function(err, foundLayouts){
  if (err){
    console.log(err);
  } else {
    if (foundLayouts) {
      foundLayout = foundLayouts;
      // console.log("foundLayouts = " + foundLayout);
      console.log(foundLayout.length);
      var dolzina = foundLayout.length;
      for (var i=0;i< dolzina ;i++){
      foundLayoutnames[i] = foundLayout[i].habitName;
      console.log(foundLayoutnames[i]);
      };
      // console.log(foundLayoutnames.length);
    } else {
      console.log("Ne jebe pol posto");
    }
  }
  res.render("home",{day: day,dinThisMonth: daysinThisMonth,dinNextMonth:daysinNextMonth,foundLayout: foundLayout});

});
console.log(foundLayoutnames);


});

app.post("/test", function(req,res){


console.log("TESTing  ->"+req.body.habitName+"  is" +req.body.habitData);


});


app.post("/", function(req,res){
  var adding = req.body.habit;
  console.log(adding);

  var adder = new userLay({
    habitName: adding[0],
    habitType: adding[1]
  });
  adder.save();

  res.redirect("/");
});
app.get("/login", function(req,res){
res.render("home");
});
app.get("/register", function(req,res){
res.render("home");
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
