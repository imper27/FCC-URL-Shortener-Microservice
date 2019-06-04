'use strict';

var express = require('express');
var mongo = require('mongodb');
var mongoose = require('mongoose');

var cors = require('cors');
var dns = require('dns');

var app = express();

// Basic Configuration 
var port = process.env.PORT || 3000;

/** this project needs a db !! **/ 
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true });

let db = mongoose.connection;

app.use(cors());

/** this project needs to parse POST bodies **/
// you should mount the body-parser here
var bodyParser = require('body-parser');

app.use(bodyParser.urlencoded({extended: false}));

app.use('/public', express.static(process.cwd() + '/public'));

app.get('/', function(req, res){
  res.sendFile(process.cwd() + '/views/index.html');
});

const Schema = mongoose.Schema;
const urlSchema = new Schema({
  short: Number,
  long: String
});

let ShortUrl = mongoose.model('ShortUrl', urlSchema);

app.post('/api/shorturl/new', (request, response) => {
  let url = request.body.url;
  let index1 = url.indexOf('/');
  let host = url;
  if (index1 != -1) {
    host = host.substring(index1 + 2);
  };
  
  let index2 = host.indexOf('/');
  if (index2 != -1) {
    host = host.substring(0, index2);
  }
  
  console.log(host);
  dns.lookup(host, (error, address) => {
    if (error) {
      console.log(error);
      response.json({"error": "invalid URL"});
    } else {
      ShortUrl.countDocuments({}, (error, count) => {
        if (error) {
          response.json({sorry: 'Please try back later'});
        } else {
          let position = count + 1;
          let shortened = new ShortUrl({short: position, long: url});
          shortened.save((error, shortData) => {
            if (error) {
              console.log(error);
              response.json({problem: 'sorry'});
            } else {
              response.json({"original_url": url, "short_url": position});
            }
          }); //save
        } 
      }); //ShortUrl.countDocuments
    }
  }); //dns.lookup
}); //app.post


app.get('/api/shorturl/:urlNumber', (request, response) => {
    let urlNumber = request.params.urlNumber;
    ShortUrl.findOne({short: urlNumber}, 'long', function(error, url) {
      if (error) {
         console.log(error.message);
        response.json({error: 'sorry'});
      } else {
        console.log(url.long);
        response.redirect(url.long);
      }
    });
});
  
// your first API endpoint... 
app.get("/api/hello", function (req, res) {
  res.json({greeting: 'hello API'});
});



app.listen(port, function () {
  console.log('Node.js listening ...');
});