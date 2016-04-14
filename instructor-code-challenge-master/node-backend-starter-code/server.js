var express = require('express');
var app = express();
var fs = require('fs');
var path = require('path');
var bodyParser = require('body-parser');
var request = require('request');
var querystring = require('querystring');
var jsonfile = require('jsonfile');

app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use('/', express.static(path.join(__dirname, 'public')));

var dataFilePath = path.join(__dirname, "data.json");

// ============================================================
// general utilites

// maps f over ar, removing all instances of false
function keep(ar, f){
    return ar.map(f).filter(function(x){return !(x === false);});
}

function isString(x){
    return typeof x === 'string' || x instanceof String;
}

function isBlankString(x){
    return isString(x) && /^\s*$/.test(x);
}

// ============================================================

// scans incoming spec for recognized keys (title, year and page)
// and converts into a URL query for omdb
function requestURL(spec){
    var conversion = {title: function(v){return 's=' + v;},
		      year: function(v){return 'y=' + v;},
		      page: function(v){return 'page=' + v;}};
    var keystr = function(k){
	var v = spec[k];
	if(v === undefined || isBlankString(v)){
	    return false;
	}else{
	    return conversion[k](v);
	}
    };
    return 'http://www.omdbapi.com/?' + keep(Object.keys(conversion),keystr).join('&');
}

// requests movie data from omdb as per the query specified by
// reqspec. We want ALL the results, so this keeps calling omdb
// recursively until it has every matching result in their database,
// using the totalResults key omdb's API provides; this process can
// take a minute.
function getMovieData (building, reqspec, finish){
    request(
	requestURL(reqspec), // req.body, that is
	function(err, resp, body){
	    var body2 = JSON.parse(body);
	    var totalResults = parseInt(body2.totalResults);
	    var building2 = building.concat(body2.Search);
	    if(building2.length < totalResults){
		reqspec.page = Math.floor(building2.length / 10) + 1; // gross mutation
		getMovieData(building2, reqspec, finish);
	    }else{
		finish(building2);
	    }
	});
}

// just a convenience for sending json back to the client. easy to get wrong.
function sendJSON(res, data){
    res.setHeader('Content-Type', 'application/json');
    res.send(data);
}

// given a title, append it to our data file on disk.
// a better version would also handle deduplication
function addToFavorites(title){
    console.log('adding something to favorites! title = ' + title);
    var favs = jsonfile.readFileSync(dataFilePath);
    favs.push(title);
    jsonfile.writeFileSync(dataFilePath, favs);
}

// ============================================================
// routing

// routing for detail query
app.post('/details', function(req, res){
    request('http://www.omdbapi.com/?i=' + req.body.id + '&plot=full',
	    function(err, resp, body){
		var body2 = JSON.parse(body);
		res.setHeader('Content-Type', 'application/json');
		res.send(body2);
	    });
});

// routing for initial search query
app.post('/searching', function(req, res){
    console.log('made it here');
    getMovieData([], req.body, function(results){
	sendJSON(res, results);
    });
});

// routing for access to saved favorites
app.get('/favorites', function(req, res){
    var data = fs.readFileSync('./data.json');
    sendJSON(res, data);
});

// routing for registering new favorites
app.post('/favorite', function(req, res){
    var title = req.body.title;
    addToFavorites(title);
    sendJSON(res, {status:'added'});
});

// ============================================================
// init

function serverStart(){
    var s = app.listen(3000, function(){
	console.log("Listening on port 3000");}); 
    return s;
}

serverStart();
