"use strict";

var http = require('http');
var url = require('url');
var fs = require('fs');

/*
var net = require('net');

var server = net.createServer(function(socket) {
	socket.write('Echo server\r\n');
	socket.pipe(socket);
});

server.listen(1337, '127.0.0.1');
*/

/*
http.createServer(function (req, res) {
	var millis = Date.now();
	res.writeHead(200, {'Content-Type': 'text/html'});
	res.end('Hello World after reboot two! ' + millis);
}).listen(8080);
*/

var fileData = {};

fileData['/'] = {
	"path": "index.html",
	"contentType": 'text/html'
}

fileData['/client.js'] = {
	"path": "client.js",
	"contentType": 'text/html'
}

fileData['/jquery.js'] = {
	"path": "jquery.js",
	"contentType": 'text/html'
}

fileData['/favicon.ico'] = {
	"path": "favicon.ico",
	"contentType": 'image/x-icon'
}

//console.log(fileData);

var rootFilePromises = [];

for(var key in fileData)
{ 
	var p = new Promise(function(resolve, reject)
	{
		var url = key;
		var filePath = fileData[url].path;
	
		//console.log('url',url,filePath);
	
		fs.readFile(filePath, function(err, data) {
		
				fileData[url].data = data;
				resolve();
				//console.log('resolved',url);
		});
	});
	
	rootFilePromises.push(p);
}


Promise.all(rootFilePromises).then(function(values) {
	console.log("root files cached");
	for (var url in fileData)
	{
		console.log('\t',fileData[url].path,url,fileData[url].contentType,fileData[url].data.length);
	}
});



fs.readdir("img", (err, files) => {
  files.forEach(file => {
    if (file.endsWith(".png"))
    {
    	console.log("img",file);
    	
    	var filePath = 'img/'+file;
    	fs.readFile(filePath, function(err, data) {

			var url = '/' + filePath;
			fileData[url] = {
				"data": data,
				"contentType": 'image',
				"path": filePath
			};
			
			console.log(filePath);
		});   	
    }
    else
    {
    	console.log("img!",file);
    }
  });
});





var map1hash = 1;

var map1units;

fs.readFile('map1/units.json', function(err, data) {
	console.log("units.json");
	var obj = JSON.parse(data);
	console.log(obj);
	map1units = obj;
	
	setTimeout(function()
	{
		endTurn();
	}, 1000);

});

// P Plains
// W Water
// M Mountains
// F Forest
// R Roads
// S Swamp

var map1terrain;

fs.readFile('map1/terrain.json', function(err, data) {
	console.log("terrain.json");
	var obj = JSON.parse(data);
	//console.log(obj);
	map1terrain = obj;
	
	var r = 0;
	map1terrain.Map.forEach(function(row)
	{
		var c = 0;
		var sb = "";
		row.forEach(function(el)
		{
			sb += el;
		});
		console.log(sb);
	});
	
});


function moveunit(query)
{
	console.log(query);
	console.log(map1units);
	
	try
	{
		var id = parseInt(query.id);
		
		var x = parseInt(query.x);
		var y = parseInt(query.y);
		
		
		if (Math.abs(map1units.Units[id].location[0] - x)>1 || Math.abs(map1units.Units[id].location[1] - y)>1)
		{
			throw "Invalid movement";
		}
		
		var moveTile = map1terrain.Map[y][x];
		console.log('moveTile',moveTile);
		
		var mmm = map1units.Units[id].moveMatrix[moveTile] || Infinity;
		console.log('mmm',mmm);
		
		var cost = Math.hypot(map1units.Units[id].location[0] - x,map1units.Units[id].location[1] - y)*mmm;
		
		if ((map1units.Units[id].actionPoints||0) < cost)
		{
			throw "not enough action points";
		}
		

		var location = [x,y];

		map1units.Units[id].location = location;
		map1units.Units[id].actionPoints -= cost;
	}
	catch(err)
	{
		console.trace(err);
	}
	
	map1hash++;
	console.log('map1hash',map1hash);
}

function endTurn(query)
{
	console.log(query);
	
	map1units.Units.forEach(function(unit)
	{
		unit.actionPoints = (unit.actionPoints||0) + unit.baseActionPoints;
		
		if (unit.actionPoints>unit.baseActionPoints*2)
		{
			unit.actionPoints=unit.baseActionPoints*2;
		}
		
	});
	
	map1hash++;
	console.log('map1hash',map1hash);
}


function attack(query)
{
	console.log(query);
}


function dothething(request, response) {

	var milliseconds = (new Date).getTime();

	var q = url.parse(request.url, true);
	var qpn = q.pathname;
	
	
	response.requestTime = milliseconds;
	response.endLog = function()
	{
		var milliseconds = (new Date).getTime();
		this.end();
		
		var delta = milliseconds-this.requestTime;
		if (delta > 30)
		{
			console.log(milliseconds-this.requestTime+'ms', qpn, request.connection.remoteAddress);
		}
	};
	

	if (qpn!="/map1/hash")
	{
		console.log(q.pathname,request.connection.remoteAddress);
	}

	var makeSimpleFS = function(path,contentType)
	{
		fs.readFile(path, function(err, data) {
			response.writeHead(200, {'Content-Type': contentType});
			response.write(data);
			response.endLog();
		});
	}

	switch(qpn) {
		case "/":
			makeSimpleFS('index.html','text/html');
			break;
			
		case "/client.js":
		case "/jquery.js":
			makeSimpleFS(qpn.substr(1),'text/html');
			break;
			
		case "/img/selector.png":
		case "/img/blueTank.png":
		case "/img/blueSoldier.png":
		case "/img/redSoldier.png":
		case "/img/greenSoldier.png":
		case "/img/blackSoldier.png":
		case "/img/whiteSoldier.png":
		case "/img/water.png":
		case "/img/plains.png":
		case "/img/error.png":
		case "/img/road.png":
		case "/img/mountain.png":
		case "/img/forest.png":
		case "/img/swamp.png":
			makeSimpleFS(qpn.substr(1),'image');
			break;

		case "/favicon.ico":
			// icons are stupid
			makeSimpleFS(qpn.substr(1),'image/x-icon');
			break;

		case "/map1/terrain":
			response.writeHead(200, {'Content-Type': 'application/json'});
			response.write(JSON.stringify(map1terrain));
			response.endLog();
			break;

		case "/map1/units":
			response.writeHead(200, {'Content-Type': 'application/json'});
			response.write(JSON.stringify(map1units));
			response.endLog();
			break;
			
		case "/map1/moveunit":
			moveunit(q.query);
			response.endLog();
			break;
			
		case "/map1/endturn":
			endTurn(q.query);
			response.endLog();
			break;
			
		case "/map1/attack":
			attack(q.query);
			response.endLog();
			break;
			
		case "/map1/hash":
			response.writeHead(200, {'Content-Type': 'application/json'});
			response.write(JSON.stringify(map1hash));
			response.endLog();
			break;

		default:
			console.log("UNKNOWN QUERY PATHNAME");
			console.log(q.pathname);
			response.endLog();
	}	
}


http.createServer(dothething).listen(8080);

console.log("end of hello.js");

