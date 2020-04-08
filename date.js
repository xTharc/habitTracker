//jshint esversion:6





exports.getDate =  function() {  // če uporabiš oklepaje dejansko zaženeš funkcijo, če ne jo prenašaš

var today = new Date();

var options = {
  weekday: "long",
  day: "numeric",
  month: "long",
};

return today.toLocaleDateString("en-US", options);
};



exports.getDay = function (){
var today = new Date();

var options = {
  weekday: "long",

};

return today.toLocaleDateString("en-US", options);
};
