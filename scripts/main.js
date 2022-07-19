import * as THREE from "../lib/three.module.js";

import { OrbitControls } from "../lib/OrbitControls.js";
import { ConvexGeometry } from '../lib/ConvexGeometry.js';
import { OBJLoader } from '../lib/OBJLoader.js';
import { FlyControls } from '../lib/FlyControls.js';


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
function renderPoints(frame, scene, fizzyText, arrayOfPoints) {
    let color = new THREE.Color("rgb(" + Math.round(fizzyText.color[0]) + "," + Math.round(fizzyText.color[1]) + "," + Math.round(fizzyText.color[2]) + ")");
    let geometry = new THREE.SphereGeometry(window.default_size, 10, 10);
    let material = new THREE.MeshBasicMaterial({color: color, wireframe: false});

    for (let i = 0; i < frame["x"].length; ++i) {
        if (i < arrayOfPoints.length) {
            arrayOfPoints[i].position.x = frame["x"][i] * 2;
            arrayOfPoints[i].position.y = frame["y"][i] * 2;
            arrayOfPoints[i].position.z = frame["z"][i] * 2;
        } else {
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
}


function addPolyhedron(scene, data) {
    if (data == undefined) {
        var verticesOfCube = [
            // Default cube
            new THREE.Vector3(-1,-1,-1,),
            new THREE.Vector3(1,-1,-1),
            new THREE.Vector3(1, 1,-1),
            new THREE.Vector3(-1, 1,-1),
            new THREE.Vector3(-1,-1, 1),
            new THREE.Vector3(1,-1, 1),
            new THREE.Vector3(1, 1, 1),
            new THREE.Vector3(-1, 1, 1)
        ];
    } else {
        var verticesOfCube = [];
        for (let vert of data) {
            verticesOfCube.push(new THREE.Vector3(vert[0], vert[1], vert[2]))
        }
    }

    let geometry = new ConvexGeometry(verticesOfCube);
    let material = new THREE.MeshPhongMaterial({color: 0x0066CC});
    let mesh = new THREE.Mesh(geometry, material);
    mesh.name = "poly";

    scene.add(mesh);
}


function init() {
    let scene = new THREE.Scene();
    let camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

    let renderer = new THREE.WebGLRenderer({antialias: true, preserveDrawingBuffer: true});
    renderer.setSize(window.innerWidth, window.innerHeight);

    document.body.appendChild(renderer.domElement);
    let orbitControls = new OrbitControls(camera, renderer.domElement);
    orbitControls.enableKeys = false;
    orbitControls.autoRotateSpeed = 3;

    window.addEventListener("resize", function () {
        let width = window.innerWidth;
        let height = window.innerHeight;
        renderer.setSize(width, height);
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
    });

    addPolyhedron(scene, undefined);

    // const loader = new OBJLoader();
    // loader.load(
    //     // resource URL
    //     'lib/models/sphere.obj',
    //     // called when resource is loaded
    //     function ( object ) {
    //         scene.add( object );
    //     },
    //     // called when loading is in progresses
    //     function ( xhr ) {
    //         console.log( ( xhr.loaded / xhr.total * 100 ) + '% loaded' );
    //     },
    //     // called when loading has errors
    //     function ( error ) {
    //         console.log( 'An error happened' );
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

    return [scene, renderer, camera, orbitControls]
}




window.onload = function() {
    const FizzyText = function () {
        this.num_particles = 0;
        this.color = [255, 255, 0]; // RGB array
        this.pointWidth = 1;
        this.rotate = false;

        this.time = 0.0;
        this.mode = "offline";
        this.speedMode = "1.00";
        this.name = "Paul Artushkov";

        this.dorender = false;
        this.controls_switch = "OrbitControls"

        this.drawCube = true;
        this.play = true;
        this.turnOn = false;

        if (!FilesMissing) {
            let json_dictionary = fileGet("/lib/saves/names.json", false);
            this.currentSave = json_dictionary["default_name"];
        } else {
            this.currentSave = "None";
        }

        this.reset_defaults = function () {
            for (let i = 0; i < gui.__controllers.length; i++) {
                gui.__controllers[i].setValue(gui.__controllers[i].initialValue);
            }
        };

        this.restart = function () {
            if (fizzyText.mode === "online") {
                return 0;
            }

            FrameId = 2;
            direction = 1;
            fizzyText.play = true;
            arrayOfPoints = [];

            // clear scene from points
            while (scene.getObjectByName("point") !== undefined) {
                let selectedObject = scene.getObjectByName("point");
                scene.remove(selectedObject);
            }
        };
    };

    let FrameId = 1, direction = 1, arrayOfPoints = [], data, FilesMissing = false, userId, newFrame = true;
    window.default_size = 0.007;

    try {
        var allSaves = fileGet("/lib/saves/names.json", false)["names"];
    } catch (error) {
        console.log('You have no growth saves in the lib/saves/');
        FilesMissing = true;
    }

    let stats = initStats(Stats);

    // Dat Gui controls setup
    let fizzyText = new FizzyText();
    let gui = new dat.GUI({
        load: JSON,
        preset: "Flow",
        width: 300
    });

    gui.add(fizzyText, "num_particles").name("Particles").listen();
    let particles_color = gui.addColor(fizzyText, "color").name("Color");
    let controls_size = gui.add(fizzyText, "pointWidth", 0.1, 2).name("Point width");
    let controls_mode_chooser = gui.add(fizzyText, "mode", ["offline", "online"]).name("Mode");
    gui.add(fizzyText, "reset_defaults").name("Reset defaults");

    let playback = gui.addFolder("Playback");
    playback.add(fizzyText, "play").name("Play (Space Bar)").listen();
    playback.add(fizzyText, "restart").name("Restart");
    playback.add(fizzyText, "speedMode", ["0.25", "0.5", "0.75", "1.00", "1.25", "1.5", "1.75", "2.00", "5.00", "10.0"]).name("Playback Speed");
  
    let controls_timeline = playback.add(fizzyText, "time", 0, 1).step(0.01).name("Timeline").listen();
    let controls_chooser = playback.add(fizzyText, "currentSave", allSaves).name("Choose save");
    playback.open();

    let render_folder = gui.addFolder("Render");
    let controls_rotate = render_folder.add(fizzyText, "rotate").name("Autorotate");
    let controls_render = render_folder.add(fizzyText, "dorender").name("Start render");
    
    // let author = gui.add(fizzyText, "name").name("Made by:");
    // author.domElement.style.pointerEvents = "none";


    let download = function() {
        while (!httpGet("/get_render_status")["status"][userId]) {
            console.log("Working");
        }
        console.log("Done!");

        let url = "lib/movies/" + userId + ".mp4";
        let a = document.createElement('a');
        a.href = url;
        a.download = url.split('/').pop();
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);

        let elmnt = document.getElementById("preloader");
        elmnt.remove();
    }


    controls_render.onChange(function(value) {
        if (value === false) {
            let node = document.createElement("div");
            node.setAttribute("id", "preloader");
            document.body.appendChild(node);

            let div = document.createElement("div");
            div.setAttribute("id", "loader");

            let element = document.getElementById("preloader");
            element.appendChild(div);

            httpSend("/add_render", {"img": "", "user": userId, "update": true});

            setTimeout(download, 100);
        } else {
            userId = httpGet("/get_id")["id"];
        }
    });

    controls_rotate.onChange(function(value) {
        orbitControls.autoRotate = value;
    });

    controls_timeline.onChange(function(value) {
        FrameId = (data.length) * (value);
    });

    controls_mode_chooser.onChange(function(value) {
        if (value === "offline") { data = fileGet("lib/saves/" + fizzyText.currentSave + ".json", FilesMissing); }
        FrameId = 2;
        fizzyText.play = true;
        while (scene.getObjectByName("point") !== undefined) {
            scene.remove(scene.getObjectByName("point"));
        }
        scene.remove(scene.getObjectByName("poly"));

        if (value === "online") {
	    playback.close();
            let obj = httpGet("/get_poly");
            if (obj.length === 0) {
                console.log('No Polyhedron data. Run simulator process or contact admins.');
            } else {
                addPolyhedron(scene, httpGet("/get_poly"));
            }
        } else {
	    playback.open();
            addPolyhedron(scene, undefined);
        }

        arrayOfPoints = [];

    });

    let loadSave = function() {
        if (fizzyText.mode === "online") {
            return 0;
        }
        FrameId = 2;
        fizzyText.play = true;
        while (scene.getObjectByName("point") !== undefined) {
            let selectedObject = scene.getObjectByName("point");
            scene.remove(selectedObject);
        }
        arrayOfPoints = [];

        data = fileGet("lib/saves/" + fizzyText.currentSave + ".json", FilesMissing);

        let elmnt = document.getElementById("preloader");
        elmnt.remove();
    }

    controls_chooser.onChange(function(value) {
        let node = document.createElement("div");
        node.setAttribute("id", "preloader");
        document.body.appendChild(node);

        let div = document.createElement("div");
        div.setAttribute("id", "loader");

        let element = document.getElementById("preloader");
        element.appendChild(div);

        setTimeout(loadSave, 100);
    });

    controls_size.onChange(function(value) {
        refreshArrayOfPoints(fizzyText, arrayOfPoints);
    });

    particles_color.onChange(function(value) {
        fizzyText.color[0] = value[0];
        fizzyText.color[1] = value[1];
        fizzyText.color[2] = value[2];
        refreshArrayOfPoints(fizzyText, arrayOfPoints);
    });


    document.addEventListener("keydown", onDocumentKeyDown, false);
    function onDocumentKeyDown(event) {
        let keyCode = event.which;
        if (keyCode === 32) { // Space
            fizzyText.play = !fizzyText.play;
        } else if (keyCode === 39 && FrameId < data.length) { // Right arrow
            FrameId += 5;
            fizzyText.time = (FrameId + 1) / data.length;
        } else if (keyCode === 37) { // Left arrow
            FrameId = Math.max(1, FrameId - 5);
            fizzyText.time = (FrameId + 1) / data.length;
            return false;
        }
    }

    let tmp = init();
    let scene = tmp[0];
    let renderer = tmp[1];
    let camera = tmp[2];
    let orbitControls = tmp[3];

    // run game loop (update, render, repeat)

    data = fileGet("/lib/saves/" + fizzyText.currentSave + ".json", FilesMissing);

    let GameLoop = function() {
        requestAnimationFrame(GameLoop);
        stats.begin();
        orbitControls.update();

        if (fizzyText.mode === "online") {

            let status = httpGet("/get_status")["status"];
            data = httpGet("/get_frame");
            if (status && data.length !== 0) {
                // New frame received from simulator
                fizzyText.num_particles = data["x"].length;
                renderPoints(data, scene, fizzyText, arrayOfPoints);
            }

            if (status) {
                console.log("done");
                // newFrame = true;
                while (scene.getObjectByName("point") !== undefined) {
                    let selectedObject = scene.getObjectByName("point");
                    scene.remove(selectedObject);
                }
                scene.remove(scene.getObjectByName("poly"));
                arrayOfPoints = [];

                addPolyhedron(scene, httpGet("/get_poly"));
            }

        } else {

            if (Math.round(FrameId) < 1) {
                direction = 1;
                fizzyText.play = true;
                arrayOfPoints = [];
                while (scene.getObjectByName("point") !== undefined) {
                    let selectedObject = scene.getObjectByName("point");
                    scene.remove(selectedObject);
                }
            }
            if (FrameId >= data.length - 1) {
                direction = -1;
            }

            if (fizzyText.play) {
                FrameId += direction * parseFloat(fizzyText.speedMode);
                fizzyText.time = (FrameId + 1) / data.length;
            }

            if (data.length - 1 > Math.round(FrameId) && Math.round(FrameId) >= 1) {
                fizzyText.num_particles = data[Math.round(FrameId)]["x"].length;
                renderPoints(data[Math.round(FrameId)], scene, fizzyText, arrayOfPoints);
            }
        }

        renderer.render(scene, camera);

        if (fizzyText.dorender && fizzyText.play && newFrame) {
            let image = renderer.domElement.toDataURL("image/png", 1);
            httpSend("/add_render", {"img": image, "user": userId, "update": false});
            // newFrame = false;
        }

        stats.end();
    };
    GameLoop(scene);
};
