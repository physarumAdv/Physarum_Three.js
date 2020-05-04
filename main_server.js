const http = require('http');
const urlapi = require('url');
const fs = require('fs');
const path = require('path');
const filePath = path.join(__dirname, 'physarum_ThreeJS.html');

var Data = []

function index(req, res) {
    fs.readFile(filePath, {encoding: 'utf-8'}, function(err, data){
        if (!err) {
            res.writeHead(200, {'Content-Type': 'text/html'});
            console.log(data);
            console.log(data);
            res.end(data);
        } else {
            console.log(err);
        }
    });
}

function addFrame(req, res) {
    res.writeHead(200, {'Content-Type': 'text/json'});

    var body = "";
    req.on("data", function (chunk) {
        body += chunk.toString();
    });

    req.on('end', function() {
        console.log(body);
        Data = JSON.parse(body);
        res.end(JSON.stringify({'ok': true}));
    });
}

function getFrame(req, res) {
    res.writeHead(200, {'Content-Type': 'text/json'});
    res.end(JSON.stringify(Data));
}

function error404(req, res) {
    res.writeHead(404, {'Content-Type': 'text/html'});
    res.end("404 Not Found :(");
}

function main(req, res) {
    var url = urlapi.parse(req.url);

    switch(url.pathname) {
        case '/':
            index(req, res);
            break;
        case '/add_frame':
            addFrame(req, res);
            break;
        case '/get_frame':
            getFrame(req, res);
            break;
        default:
            error404(req, res);
            break;
    }
}

app = http.createServer(main);
app.listen(8080);
console.log("Listening on 8080");
