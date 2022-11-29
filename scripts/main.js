import * as THREE from "../lib/three.module.js";

import { OrbitControls } from "../lib/OrbitControls.js";
import { ConvexGeometry } from "../lib/ConvexGeometry.js";
import { OBJLoader } from "../lib/OBJLoader.js";
import { FlyControls } from "../lib/FlyControls.js";


let scene, orbitControls, camera, renderer, gui, polyLoaded = false;

/**
 * Sends a request to the url and returns parsed response
 *
 * @param The url of a server for request
 * @returns Server response as parsed json object
 */
function httpGet(Url) {
    let xmlHttp = new XMLHttpRequest();
    xmlHttp.open("GET", Url, false); // false for synchronous request
    xmlHttp.send(null);
    return JSON.parse(xmlHttp.responseText);
}


function httpSend(Url, body) {
    let xmlHttp = new XMLHttpRequest();
    xmlHttp.open("POST", Url, false); // false for synchronous request
    xmlHttp.setRequestHeader("Content-Type", "text/json");
    xmlHttp.send(JSON.stringify(body));
}


function fileGet(file_name, missing_files) {
    if (missing_files) {
        return [];
    }
    let rawFile = new XMLHttpRequest();
    let allText = "";
    rawFile.open("GET", file_name, false);
    rawFile.onreadystatechange = function () {
        if(rawFile.readyState === 4) {
            if(rawFile.status === 200 || rawFile.status === 0) {
                allText = rawFile.responseText;
            }
        }
    };
    rawFile.send(null);
    return JSON.parse(allText);
}


function initStats(Stats) {
    let stats = new Stats();
    stats.setMode(0); // 0: fps, 1: ms

    // Align top-left
    stats.domElement.style.position = "absolute";
    stats.domElement.style.left = "0px";
    stats.domElement.style.top = "0px";
    document.body.appendChild( stats.dom );
    return stats;
}


function refreshArrayOfPoints(fizzyText, arrayOfPoints) {
    for (let i = 0; i < arrayOfPoints.length; ++i) {
        arrayOfPoints[i].material.color.r = fizzyText.color[0] / 255;
        arrayOfPoints[i].material.color.g = fizzyText.color[1] / 255;
        arrayOfPoints[i].material.color.b = fizzyText.color[2] / 255;

        arrayOfPoints[i].scale.set(fizzyText.pointWidth, fizzyText.pointWidth, fizzyText.pointWidth);
    }
}


/*
 *Given points coordinates (frame) scene, and RGB color, adds all particles to a scene
 */
function renderPoints(frame, fizzyText, arrayOfPoints) {
    let color = new THREE.Color("rgb(" + Math.round(fizzyText.color[0]) + "," + Math.round(fizzyText.color[1]) + "," + Math.round(fizzyText.color[2]) + ")");
    let geometry = new THREE.SphereGeometry(window.default_size, 10, 10);
    let material = new THREE.MeshBasicMaterial({color, wireframe: false});

    for (let i = 0; i < frame["x"].length; ++i) {
        if (i < arrayOfPoints.length) {
            arrayOfPoints[i].position.x = frame["x"][i] * 2;
            arrayOfPoints[i].position.y = frame["y"][i] * 2;
            arrayOfPoints[i].position.z = frame["z"][i] * 2;
        } else {
            // Create new point
            let point = new THREE.Mesh(geometry, material);
            point.scale.set(fizzyText.pointWidth, fizzyText.pointWidth, fizzyText.pointWidth);

            point.name = "point";
            scene.add(point);
            arrayOfPoints.push(point);

            arrayOfPoints[i].position.x = frame["x"][i] * 2;
            arrayOfPoints[i].position.y = frame["y"][i] * 2;
            arrayOfPoints[i].position.z = frame["z"][i] * 2;
        }
    }
    for (let j = frame["x"].length; j < arrayOfPoints.length; ++j) {
        scene.remove(arrayOfPoints[j]);
    }
    arrayOfPoints.splice(frame["x"].length, arrayOfPoints.length);

    return arrayOfPoints;
}


function addPolyhedron(scene, data) {
    let verticesOfCube = [];
    if (data !== undefined) {
        polyLoaded = true;

        for (let vert of data) {
            verticesOfCube.push(new THREE.Vector3(vert[0], vert[1], vert[2]))
        }

        let geometry = new ConvexGeometry(verticesOfCube);
        let material = new THREE.MeshPhongMaterial({color: 0x0066CC});
        let mesh = new THREE.Mesh(geometry, material);
        mesh.name = "poly";

        scene.add(mesh);
    } else {
        polyLoaded = false;
    }
}


function removePointsFromScene() {
    while (scene.getObjectByName("point") !== undefined) {
        scene.remove(scene.getObjectByName("point"));
    }
}


function init() {
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

    renderer = new THREE.WebGLRenderer({antialias: true, preserveDrawingBuffer: true});
    renderer.setSize(window.innerWidth, window.innerHeight);

    document.body.appendChild(renderer.domElement);
    orbitControls = new OrbitControls(camera, renderer.domElement);
    orbitControls.enableKeys = false;
    orbitControls.autoRotateSpeed = 3;

    window.addEventListener("resize", function () {
        let width = window.innerWidth;
        let height = window.innerHeight;
        renderer.setSize(width, height);
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
    });

    addPolyhedron(scene, [[-1,-1,-1], [1,-1,-1], [1, 1,-1], [-1, 1,-1], [-1,-1, 1],
        [1,-1, 1], [1, 1, 1], [-1, 1, 1]]);

    // const loader = new OBJLoader();
    // loader.load(
    //     // resource URL
    //     "lib/models/sphere.obj",
    //     // called when resource is loaded
    //     function ( object ) {
    //         scene.add( object );
    //     },
    //     // called when loading is in progresses
    //     function ( xhr ) {
    //         console.log( ( xhr.loaded / xhr.total * 100 ) + "% loaded" );
    //     },
    //     // called when loading has errors
    //     function ( error ) {
    //         console.log( "An error happened" );
    //     }
    // );

    // light
    let directionalLight = new THREE.DirectionalLight(0xFFFFFF, 1);
    directionalLight.position.set(6, 8, 8);
    scene.add(directionalLight);

    directionalLight = new THREE.DirectionalLight(0xFFFFFF, 1);
    directionalLight.position.set(-6, -8, -8);
    scene.add(directionalLight);

    directionalLight = new THREE.DirectionalLight(0xFFFFFF, 0.2);
    directionalLight.position.set(-6, -8, 8);
    scene.add(directionalLight);

    directionalLight = new THREE.DirectionalLight(0xFFFFFF, 0.2);
    directionalLight.position.set(6, 8, -8);
    scene.add(directionalLight);
    

    let ambientLight = new THREE.AmbientLight(0xFFFFFF, 0.2);
    scene.add(ambientLight);

    camera.position.set(-1.83222123889, 1.83199683912, -2.66435763809);

    camera.rotation.y = 3.14;
    camera.rotation.x = 0.6;
}


function process_online(playback, fizzyText) {
    let status = httpGet("/get_status")["status"];
    playback.data = httpGet("/get_frame");
    if (status && playback.data.length !== 0) {
        // New frame received from simulator
        fizzyText.numParticles = playback.data["x"].length;
        playback.arrayOfPoints = renderPoints(playback.data, fizzyText, playback.arrayOfPoints);
    }

    if (status) {
        playback.newFrame = true;

        if (!polyLoaded) {
            addPolyhedron(scene, httpGet("/get_poly")) ;
        }
    }

    return playback;
}


function process_offline(playback, fizzyText) {
    if (Math.round(playback.frameId) < 1) {
        playback.direction = 1;
        fizzyText.play = true;
        playback.arrayOfPoints = [];
        removePointsFromScene()
    }
    if (playback.frameId >= playback.data.length - 1) {
        playback.direction = -1;
    }

    if (fizzyText.play) {
        playback.frameId += playback.direction * parseFloat(fizzyText.speedMode);
        fizzyText.time = (playback.frameId + 1) / playback.data.length;
    }

    if (playback.data.length - 1 > Math.round(playback.frameId) && Math.round(playback.frameId) >= 1) {
        fizzyText.numParticles = playback.data[Math.round(playback.frameId)]["x"].length;
        playback.arrayOfPoints = renderPoints(playback.data[Math.round(playback.frameId)], fizzyText, playback.arrayOfPoints);
    }

    return playback;
}


window.onload = function() {
    const FizzyText = function () {
        this.numParticles = 0;
        this.color = [255, 255, 0]; // RGB array
        this.pointWidth = 1;
        this.rotate = false;

        this.time = 0.0;
        this.mode = "offline";
        this.speedMode = "1.00";
        this.name = "Paul Artushkov";

        this.dorender = false;
        this.controlsSwitch = "OrbitControls";

        this.drawCube = true;
        this.play = true;
        this.turnOn = false;

        if (!playback.filesMissing) {
            let jsonDictionary = fileGet("/lib/saves/names.json", false);
            this.currentSave = jsonDictionary["default_name"];
        } else {
            this.currentSave = "None";
        }

        this.reset_defaults = function() {
            for (let i = 0; i < gui.__controllers.length; i++) {
                gui.__controllers[i].setValue(gui.__controllers[i].initialValue);
            }
            speed_drop_down.setValue("1.00");
        };

        this.restart = function() {
            if (fizzyText.mode === "online") {
                return 0;
            }

            playback.frameId = 2;
            playback.direction = 1;
            fizzyText.play = true;
            playback.arrayOfPoints = [];

            // clear scene from points
            removePointsFromScene();
        };
    };

    class PlaybackInfo {
        constructor() {
            this.frameId = 1;
            this.direction = 1;
            this.arrayOfPoints = [];
            this.data;
            this.filesMissing = false;
            this.userId;
            this.newFrame = true;
        }
    }
    let playback = new PlaybackInfo();
    window.default_size = 0.007;

    let allSaves;
    try {
        allSaves = fileGet("/lib/saves/names.json", false)["names"];
    } catch (error) {
        console.log("You have no growth saves in the lib/saves/");
        playback.filesMissing = true;
    }

    let stats = initStats(Stats);

    // Dat Gui controls setup
    let fizzyText = new FizzyText();
    gui = new dat.GUI({
        load: JSON,
        preset: "Flow",
        width: 300
    });

    let particleNumber = gui.add(fizzyText, "numParticles").name("Particles").listen();
    particleNumber.domElement.style.pointerEvents = "none";

    let particlesColor = gui.addColor(fizzyText, "color").name("Color");
    let controlsSize = gui.add(fizzyText, "pointWidth", 0.1, 2).name("Point width");
    let controlsModeChooser = gui.add(fizzyText, "mode", ["offline", "online"]).name("Mode");
    gui.add(fizzyText, "reset_defaults").name("Reset defaults");

    let playback_folder = gui.addFolder("Playback");
    playback_folder.add(fizzyText, "play").name("Play (Space Bar)").listen();
    playback_folder.add(fizzyText, "restart").name("Restart");
    let speed_drop_down = playback_folder.add(fizzyText, "speedMode", ["0.25", "0.5", "0.75", "1.00", "1.25", "1.5", "1.75", "2.00", "5.00", "10.0"]).name("Playback Speed");
  
    let controlsTimeline = playback_folder.add(fizzyText, "time", 0, 1).step(0.01).name("Timeline").listen();
    let controlsChooser = playback_folder.add(fizzyText, "currentSave", allSaves).name("Choose save");
    playback_folder.open();

    let renderFolder = gui.addFolder("Render");
    let controlsRotate = renderFolder.add(fizzyText, "rotate").name("Autorotate");
    let controlsRender = renderFolder.add(fizzyText, "dorender").name("Start render");


    let download = function() {
        while (!httpGet("/get_render_status")["status"][parseInt(playback.userId, 10)]) {
            console.log("Working");
        }
        console.log("Done!");

        let url = "lib/movies/" + playback.userId + ".mp4";
        let a = document.createElement("a");
        a.href = url;
        a.download = url.split("/").pop();
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);

        let elmnt = document.getElementById("preloader");
        elmnt.remove();
    };


    controlsRender.onChange(function(value) {
        if (value === false) {
            let node = document.createElement("div");
            node.setAttribute("id", "preloader");
            document.body.appendChild(node);

            let div = document.createElement("div");
            div.setAttribute("id", "loader");

            let element = document.getElementById("preloader");
            element.appendChild(div);

            httpSend("/add_render", {"img": "", "user": playback.userId, "update": true});

            setTimeout(download, 100);
        } else {
            playback.userId = httpGet("/get_id")["id"];
        }
    });

    controlsRotate.onChange(function(value) {
        orbitControls.autoRotate = value;
    });

    controlsTimeline.onChange(function(value) {
        playback.frameId = (playback.data.length) * (value);
    });

    controlsModeChooser.onChange(function(value) {
        if (value === "offline") {
            playback.data = fileGet("lib/saves/" + fizzyText.currentSave + ".json", playback.filesMissing);
        }
        playback.frameId = 2;
        fizzyText.play = true;
        polyLoaded = false;
        removePointsFromScene()
        scene.remove(scene.getObjectByName("poly"));

        if (value === "online") {
            playback_folder.close();
            let obj = httpGet("/get_poly");
            if (obj.length === 0) {
                console.log("No Polyhedron data. Run simulator process or contact admins.");
            } else {
                addPolyhedron(scene, httpGet("/get_poly"));
            }
        } else {
            playback_folder.open();
            addPolyhedron(scene, [[-1,-1,-1], [1,-1,-1], [1, 1,-1], [-1, 1,-1], [-1,-1, 1],
                [1,-1, 1], [1, 1, 1], [-1, 1, 1]]);
        }

        playback.arrayOfPoints = [];

    });

    let loadSave = function() {
        if (fizzyText.mode === "online") {
            return 0;
        }
        playback.frameId = 2;
        fizzyText.play = true;
        removePointsFromScene()
        playback.arrayOfPoints = [];

        playback.data = fileGet("lib/saves/" + fizzyText.currentSave + ".json", playback.filesMissing);

        let elmnt = document.getElementById("preloader");
        elmnt.remove();
    };

    controlsChooser.onChange(function(value) {
        let node = document.createElement("div");
        node.setAttribute("id", "preloader");
        document.body.appendChild(node);

        let div = document.createElement("div");
        div.setAttribute("id", "loader");

        let element = document.getElementById("preloader");
        element.appendChild(div);

        setTimeout(loadSave, 100);
    });

    controlsSize.onChange(function(value) {
        refreshArrayOfPoints(fizzyText, playback.arrayOfPoints);
    });

    particlesColor.onChange(function(value) {
        fizzyText.color[0] = value[0];
        fizzyText.color[1] = value[1];
        fizzyText.color[2] = value[2];
        refreshArrayOfPoints(fizzyText, playback.arrayOfPoints);
    });


    document.addEventListener("keydown", onDocumentKeyDown, false);
    function onDocumentKeyDown(event) {
        let keyCode = event.which;
        if (keyCode === 32) { // Space
            fizzyText.play = !fizzyText.play;
        } else if (keyCode === 39 && playback.frameId < playback.data.length) { // Right arrow
            playback.frameId += 5;
            fizzyText.time = (playback.frameId + 1) / playback.data.length;
        } else if (keyCode === 37) { // Left arrow
            playback.frameId = Math.max(1, playback.frameId - 5);
            fizzyText.time = (playback.frameId + 1) / playback.data.length;
            return false;
        }
    }

    init();

    playback.data = fileGet("/lib/saves/" + fizzyText.currentSave + ".json", playback.filesMissing);

    // Run game loop (update, render, repeat)
    let GameLoop = function() {
        requestAnimationFrame(GameLoop);
        stats.begin();
        orbitControls.update();

        if (fizzyText.mode === "online") {
            playback = process_online(playback, fizzyText);
        } else {
            playback = process_offline(playback, fizzyText);
        }

        renderer.render(scene, camera);

        if ((fizzyText.mode === "offline" && fizzyText.dorender && fizzyText.play)
            || (fizzyText.mode === "online" && fizzyText.dorender && playback.newFrame)) {
            // Capture currect screen and send to server
            let image = renderer.domElement.toDataURL("image/png", 1);
            httpSend("/add_render", {"img": image, "user": playback.userId, "update": false});
            playback.newFrame = false;
        }

        stats.end();
    };
    GameLoop(scene);
};
