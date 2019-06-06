var express = require('express');
var app = express();
var jquery = require('jquery');
var fs = require('fs');
var http = require("http");
var mysql = require("mysql");
var credentials = require("./credentials");
var qs = require("querystring");
var session = require('express-session');
var io = require('socket.io')(http);

var handlebars = require('express-handlebars')
.create({ defaultLayout:'main'});
app.engine('handlebars', handlebars.engine);
app.set('view engine', 'handlebars');

app.use(express.static(__dirname + '/public'));

app.use('/css', express.static('css'));

app.use('/images', express.static('images'));

app.use('/js', express.static('js'));

app.use('/fonts', express.static('fonts'));

app.use('/pdf', express.static(__dirname + '/pathToPDF'));

app.set ('port', process.env.PORT || 3000);

//app.set('views', __dirname + '/views');

app.use(require('cookie-parser')(credentials.cookieSecret));
app.use(require('body-parser').urlencoded({ extended: true }));
app.use(require('express-session')({
  resave: false,
  saveUninitialized: false,
  secret: credentials.cookieSecret
}));

app.use(function( req, res, next) {
  console.log(req.url);
  next();
})

var con = mysql.createConnection({
  host: '134.209.74.146',
  user: 'alex',
  password: 'Pittsburgh',
  database: 'DND',
  multipleStatements: true,
  dateStrings: true
});

con.connect(function (err) {
  if (!err)
  console.log("Connection made with the database")
  else
  console.log("DB connection failed \n Error:" + JSON.stringify(err, undefined, 2));
});


app.listen(app.get('port'), function(){
  console.log( 'Express started on http://localhost: ' +
  app.get('port') + '; press Ctrl-C to terminate.');
});



app.get('/', function(req, res) {
  var today = new Date();
  var date = today.getFullYear()+'-'+(today.getMonth()+2)+'-'+(today.getDate());
  var dateAfter = today.getFullYear()+'-'+(today.getMonth()+1)+'-'+(today.getDate());
  var dateBefore = ( "'" + date + "'" );
  var dateAfter = ( "'" + dateAfter + "'" );
  console.log(dateBefore);
  console.log(dateAfter);
  console.log(date);
  var query = 'select eventId, eventName, DATE(eventDate) as eventDate, eventCreatedOn, TIME_FORMAT(eventTimeStart, "%h %i %s %p") AS eventTimeStart, TIME_FORMAT(eventTimeEnd, "%h %i %s %p") AS eventTimeEnd, eventDescription, eventLocation, eventCreator  from eventInfo where DATE(eventDate) <= ' +  dateBefore  +  ' ;'
  console.log(query);
  con.query(query, function(error, results, fields){
    if(error) throw error;

    res.render('home', {
      title: "Dungeons Wiki",
      results: results
    });
    console.log(results);
  });
});

app.get('/campaigns', function(req, res) {
  res.render('campaigns',{
    title: "Campaigns"
  });
});

app.get('/campaigndirectory', function(req, res) {
  var query = 'select campaignID, campaignName, DATE(campaignCreationDate) as campaignCreationDate, campaignStory from campaignInfo;'
  con.query(query, function(error, results, fields){
    if(error) throw error;
    res.render('campaigndirectory',{
      title: "Campaigns",
      results: results
    });
    console.log(results);
  });
});

app.get('/campaignhistory', function(req, res) {
  var tmp = req.query.ID;
  console.log(tmp);
  var query = 'select campaignID, campaignName, DATE(campaignCreationDate) as campaignCreationDate, campaignStory from campaignInfo where campaignID = ' + tmp + ' ;'
  con.query(query, function(error, results, fields){
    if(error) throw error;
    res.render('campaignhistory',{
      title: "Campaigns",
      results: results,
      campaignCreationDate: results[0].campaignCreationDate,
      campaignName: results[0].campaignName,
      campaignStory: results[0].campaignStory
    });
    console.log(results);
  });
});

app.get('/eventinfo', function(req, res){
  var tmp = req.query.ID;
  var query ='select eventId, eventName, DATE(eventDate) as eventDate, DATE(eventCreatedOn) as eventCreatedOn, TIME_FORMAT(eventTimeStart, "%h %i %s %p") AS eventTimeStart, TIME_FORMAT(eventTimeEnd, "%h %i %s %p") AS eventTimeEnd, eventDescription, eventLocation, eventCreator  from eventInfo where eventId = ' +  tmp + ' ;'
  con.query(query, function(error, results, fields){
    if(error) throw error;
    res.render('eventinfo', {
      title: "event info",
      results: results,
      eventName: results[0].eventName,
      eventDate: results[0].eventDate,
      eventCreatedOn: results[0].eventCreatedOn,
      eventTimeStart:results[0].eventTimeStart,
      eventTimeEnd: results[0].eventTimeEnd,
      eventDescription: results[0].eventDescription,
      eventLocation: results[0].eventLocation,
      eventCreator: results[0].eventCreator
    });
  });

});

app.get('/characters', function(req, res){
  var query = 'select * from characterInfo;'
  con.query(query, function(error, results, fields){
    if(error) throw error;
    res.render('characters', {
      title: "Characters",
      results: results
    })
    console.log(results);
  })
});

app.get('/download', function(req, res){
  var query = 'select characterName from characterInfo where characterId = ' +  req.query.ID + ' ;'
  con.query(query, function(error, results, fields){
    if(error) throw error;
    res.download(__dirname + '/pdf/'+ results[0].characterName +'.pdf', results[0].characterName +'.pdf', {
      title: "Characters",
      results: results
    })
    console.log(results);
  })
});

app.get('/downloadblank', function(req, res){

    res.download(__dirname + '/pdf/blankcharacter.pdf', 'blankcharacter.pdf');

});

app.get('/createEvent', function(req, res){
  res.render('createEvent');
});

app.post('/createEvent', function(req, res){
  var injson = {
    "eventID": null,
    "eventDate": req.body.datepicker,
    "eventName": req.body.EventName,
    "EventDescription": req.body.EventDescription,
    "EventLocation": req.body.EventLocation,
    "Name": req.body.Name,
    "eventTimeStart": req.body.startTime,
    "eventTimeEnd": req.body.endTime
  }

  var today = new Date();
  var date = today.getFullYear()+'-'+(today.getMonth()+1)+'-'+today.getDate();
  var time = today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds();
  var dateTime = date+' '+time;
  var eventTimeStart = req.body.datepicker+' '+req.body.startTime;
  var eventTimeEnd = req.body.datepicker+' '+req.body.endTime;
  console.log(injson);
  console.log(dateTime)

  con.query("INSERT INTO eventInfo (eventName,eventDate,eventCreatedOn,EventTimeStart, eventTimeEnd, eventDescription, eventLocation, eventCreator) VALUES ('" + req.body.EventName + "', '" + req.body.datepicker+ "', '" + dateTime + "', '" + eventTimeStart + "', '" + eventTimeEnd + "', '" +  req.body.EventDescription + "',  '" + req.body.EventLocation + "',  '" + req.body.Name + "' );",injson, function(err, rows, fields) {

    // build json result object
    var outjson = {};
    if (err) {
      // query failed
      console.log(err);
      outjson.success = false;
      outjson.message = "Query failed: " + err;
    }
    else {
      // query successful
      outjson.success = true;
      outjson.message = "Query successful!";
      console.log(rows);
    }

    res.redirect('/');
  });
});

app.get('/createcharacter', function(req, res){
  res.render('createcharacter', {
    title: "Create your character"
  })
})
