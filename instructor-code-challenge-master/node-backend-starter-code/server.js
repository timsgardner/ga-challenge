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

var lastReq = 'nothing yet';
var hits = 0;
//var reqso = 'http://www.omdbapi.com/?s=Batman';

var omdblog;

function keep(ar, f){
    return ar.map(f).filter(function(x){return !(x === false);});
}

function isString(x){
    return typeof x === 'string' || x instanceof String;
}

function isBlankString(x){
    return isString(x) && /^\s*$/.test(x);
}

function requestURL(spec){
    var keystr = function(k){
	var v = spec[k];
	if(isBlankString(v)){
	    return false;
	}
	switch (k) {
	case 'title':
	    return 's=' + v;
	case 'year':
	    return 'y=' + v;
	case 'page':
	    return 'page=' + v;
	default:
	    return false;
	}
    };

    return 'http://www.omdbapi.com/?'
	+ keep(Object.keys(spec), keystr).join('&');
}

function getMovieData (building, reqspec, finish){
    request(
	requestURL(reqspec), // req.body, that is
	function(err, resp, body){
	    var body2 = JSON.parse(body);
	    var totalResults = parseInt(body2.totalResults);
	    var building2 = building.concat(body2.Search);
	    if(building2.length < totalResults){
		reqspec.page = Math.floor(building2.length / 10) + 1; // gross mutation
		console.log('building2.length: ' + building2.length);
		console.log('asking for page ' + reqspec.page);
		getMovieData(building2, reqspec, finish);
	    }else{
		console.log('totalResults: ' + totalResults);
		console.log('building2.length: ' + building2.length);
		finish(building2);
	    }
	});
}

var detailResult;

var detailLog;

app.post('/details', function(req, res){
    console.log('req.body:' + req.body);
    detailLog = req;
    request('http://www.omdbapi.com/?i=' + req.body.id + '&plot=full',
	    function(err, resp, body){
		var body2 = JSON.parse(body);
		res.setHeader('Content-Type', 'application/json');
		detailResult = body2;
		console.log('sending detail result');
		res.send(body2);
	    });
});

app.post('/searching', function(req, res){
    console.log('made it here');
    getMovieData([], req.body, function(results){
	res.setHeader('Content-Type', 'application/json');
	res.send(results);
    });
});

var dataFilePath = 'data.json';

app.get('/favorites', function(req, res){
  var data = fs.readFileSync('./data.json');
  res.setHeader('Content-Type', 'application/json');
  res.send(data);
});

function addToFavorites(title){
    console.log('adding something to favorites! title = ' + title);
    var favs = jsonfile.readFileSync(dataFilePath);
    favs.push(title);
    jsonfile.writeFileSync(dataFilePath, favs);
}

var favoriteReq;

app.post('/favorite', function(req, res){
    favoriteReq = req;
    var title = req.body.title;
    console.log('received favorite: ' +  title);
    addToFavorites(title);
    res.setHeader('Content-Type', 'application/json');
    res.send({status:'added'});
});

function dirname(){
    return __dirname;
}

function serverStart(){
    var s = app.listen(3000, function(){
	console.log("Listening on port 3000");}); 
    return s;
}

module.exports.dirname = dirname;
module.exports.hits = function(){return hits;};
module.exports.lastReq = function(){return lastReq;};
module.exports.serverStart = serverStart;
module.exports.omdblog = function(){return omdblog;};
module.exports.detailLog = function(){return detailLog;};
module.exports.detailResult = function(){return detailResult;};
