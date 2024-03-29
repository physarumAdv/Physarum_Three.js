const http = require("http");
const urlapi = require("url");
const fs = require("fs");
const path = require("path");
const { exec } = require("child_process");
const fsExtra = require("fs-extra");

const nStatic = require("node-static");

const filePath = path.join(__dirname, "physarum.html");
let libsFileServer = new nStatic.Server(path.join(__dirname, "/lib"));
let scriptsFileServer = new nStatic.Server(path.join(__dirname, "/scripts"));

if (!fs.existsSync("lib/movies")){
    fs.mkdirSync("lib/movies");
}
fsExtra.emptyDirSync("lib/movies");

if (!fs.existsSync("lib/renders")){
    fs.mkdirSync("lib/renders");
}
fsExtra.emptyDirSync("lib/renders");


let Data = [], Poly = [], Movie = [];
let NewFrame = false, NewPoly = false;
let RenderInd = 0, FrameIds = [], Status = [];

function index(req, res) {
    fs.readFile(filePath, {encoding: "utf-8"}, function(err, data) {
        if (!err) {
            res.writeHead(200, {"Content-Type": "text/html"});
            res.end(data);
        } else {
            console.log(err);
        }
    });
}

function addFrame(req, res) {
    res.writeHead(200, {"Content-Type": "text/json"});

    let body = "";
    req.on("data", function (chunk) {
        body += chunk.toString();
    });

    req.on("end", function() {
        Data = JSON.parse(body);
        res.end(JSON.stringify({"ok": true}));
    });

    Movie.push(Data);
    fs.writeFile("lib/saves/default.json", JSON.stringify(Movie), "utf8", function (err) {
        if (err) {
            return console.log(err);
        }
    });

    NewFrame = true;
}

function getFrame(req, res) {
    res.writeHead(200, {"Content-Type": "text/json"});
    res.end(JSON.stringify(Data));
    NewFrame = false;
}

function getId(req, res) { 
    res.writeHead(200, {"Content-Type": "text/json"});
    res.end(JSON.stringify({"id": RenderInd, "ok": true}));
    FrameIds.push(0);
    Status.push(false);
    RenderInd += 1;
}

function addRender(req, res) {
    res.writeHead(200, {"Content-Type": "text/json"});

    let body = "";
    req.on("data", function (chunk) {
        body += chunk.toString();
    });

    req.on("end", function() {
        let Data = JSON.parse(body);
        res.end(JSON.stringify({"ok": true}));

        if (Data["update"]) {
            let task = "ffmpeg -framerate 1/0.015 -pattern_type glob -i 'lib/renders/" + Data["user"] + "_*.png' -r 30 lib/movies/" + Data["user"] + ".mp4";
            console.log(task);
            exec(task, (error, stdout, stderr) => {
                if (error) {
                    console.log(`error: ${error.message}`);
                    return;
                }
                if (stderr) {
                    console.log(`stderr: ${stderr}`);
                    Status[Data["user"]] = true;
                    return;
                }
                console.log(`stdout: ${stdout}`);
            });
        } else {
            let base64Data = Data["img"].replace(/^data:image\/png;base64,/, "");
            let num = FrameIds[Data["user"]].toString();
            while (num.length < 5) {
                num = "0" + num;
            }

            let output_filename = "lib/renders/" + Data["user"] + "_" + num + ".png"
            fs.writeFile(output_filename, base64Data, "base64", function(err) {
                if (err) {
                    return console.log(err);
                }
            });
            FrameIds[Data["user"]]++;
        }
    });
}

function addPoly(req, res) {
    res.writeHead(200, {"Content-Type": "text/json"});

    let body = "";
    req.on("data", function (chunk) {
        body += chunk.toString();
    });

    req.on("end", function() {
        Poly = JSON.parse(body);
        res.end(JSON.stringify({"ok": true}));
    });

    NewPoly = true;
}

function getPoly(req, res) {
    res.writeHead(200, {"Content-Type": "text/json"});
    res.end(JSON.stringify(Poly));
    NewPoly = false;
}

function getPolyStatus(req, res) {
    res.writeHead(200, {"Content-Type": "text/json"});
    res.end(JSON.stringify({"done": true, "status": NewPoly}));
}

function getRenderStatus(req, res) {
    res.writeHead(200, {"Content-Type": "text/json"});
    res.end(JSON.stringify({"done": true, "status": Status, "frames": FrameIds}));
}

function getStatus(req, res) {
    res.writeHead(200, {"Content-Type": "text/json"});
    res.end(JSON.stringify({"done": true, "status": NewFrame}));
}

function error404(req, res) {
    res.writeHead(404, {"Content-Type": "text/html"});
    res.end("404 Not Found :(");
}

function main(req, res) {
    let url = urlapi.parse(req.url);

    let pathname = url.pathname;

    switch(true) {
        case pathname === "/":
            index(req, res);
            break;
        case pathname === "/add_frame":
            addFrame(req, res);
            break;
        case pathname === "/get_frame":
            getFrame(req, res);
            break;
        case pathname === "/get_status":
            getStatus(req, res);
            break;
        case pathname === "/add_poly":
            addPoly(req, res);
            break;
        case pathname === "/get_poly":
            getPoly(req, res);
            break;
        case pathname === "/get_poly_status":
            getPolyStatus(req, res);
            break;
        case pathname === "/add_render":
            addRender(req, res);
            break;
        case pathname === "/get_id":
            getId(req, res);
            break;
        case pathname === "/get_render_status":
            getRenderStatus(req, res);
            break;
        case pathname.startsWith("/lib/"):
            req.url = req.url.replace("/lib", "/");
            libsFileServer.serve(req, res);
            break;
        case pathname.startsWith("/scripts/"):
            req.url = req.url.replace("/scripts", "/");
            scriptsFileServer.serve(req, res);
            break;
        default:
            error404(req, res);
            break;
    }
}

let config = JSON.parse(fs.readFileSync("config.json"));
let app = http.createServer(main);
app.listen(config["port"]);
console.log("Listening on " + config["port"]);
