import * as THREE from "../lib/three.module.js";

import { OrbitControls } from "../lib/OrbitControls.js";
import { ConvexGeometry } from '../lib/ConvexGeometry.js';


/**
 * Sends a request to the url and returns parsed response
 * 
 * @param The url of a server for request
 * @returns Server response as parsed json object
 */
function httpGet(Url) {
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.open("GET", Url, false); // false for synchronous request
    xmlHttp.send(null);
    return JSON.parse(xmlHttp.responseText);
}


function fileGet(file_name) {
    var rawFile = new XMLHttpRequest();
    var allText = "";
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
    var stats = new Stats();
    stats.setMode(0); // 0: fps, 1: ms

    // Align top-left
    stats.domElement.style.position = "absolute";
    stats.domElement.style.left = "0px";
    stats.domElement.style.top = "0px";
    document.body.appendChild( stats.dom );
    return stats;
}


function refreshArrayOfPoints(fizzyText, arrayOfPoints) {
    for (var i = 0; i < arrayOfPoints.length; ++i) {
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
    var color = new THREE.Color("rgb(" + Math.round(fizzyText.color[0]) + "," + Math.round(fizzyText.color[1]) + "," + Math.round(fizzyText.color[2]) + ")");
    var geometry = new THREE.SphereGeometry(window.default_size, 10, 10);
    var material = new THREE.MeshBasicMaterial({color: color, wireframe: false});

    for (var i = 0; i < frame["x"].length; ++i) {
        if (i < arrayOfPoints.length) {
            arrayOfPoints[i].position.x = frame["x"][i] * 2;
            arrayOfPoints[i].position.y = frame["y"][i] * 2;
            arrayOfPoints[i].position.z = frame["z"][i] * 2;
        } else {
            var point = new THREE.Mesh(geometry, material);
            point.scale.set(fizzyText.pointWidth, fizzyText.pointWidth, fizzyText.pointWidth);
            // if (fizzyText.randomColor) {
            //     var color = new THREE.Color(0xffffff);
            //     color.setHex(Math.random() * 0xffffff);
            //     console.log(color);
            //     point.material.color = color;
            // }

            point.name = "point";
            scene.add(point);
            arrayOfPoints.push(point);
            
            arrayOfPoints[i].position.x = frame["x"][i] * 2;
            arrayOfPoints[i].position.y = frame["y"][i] * 2;
            arrayOfPoints[i].position.z = frame["z"][i] * 2;
        }
    }
    for (var j = frame["x"].length; j < arrayOfPoints.length; ++j) {
        scene.remove(arrayOfPoints[j]);
    }
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
        for (var vert of data['vertices']) {
            verticesOfCube.push(new THREE.Vector3(vert[0], vert[1], vert[2]))
        }
    }

    var geometry = new ConvexGeometry(verticesOfCube);
    var material = new THREE.MeshPhongMaterial({color: 0x0066CC});
    var mesh = new THREE.Mesh(geometry, material);
    mesh.name = "poly";

    scene.add(mesh);

    // var geometry = new ConvexGeometry(verticesOfCube);
    // var material = new THREE.MeshPhongMaterial({color: 0xFFFFFF, wireframe: true});
    // var mesh = new THREE.Mesh(geometry, material);
    // mesh.scale.set(1.001, 1.001, 1.001);
    // mesh.name = "wire";
    // scene.add(mesh);
}


function init() {
    var scene = new THREE.Scene();
    var camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

    var renderer = new THREE.WebGLRenderer({antialias: true});
    renderer.setSize(window.innerWidth, window.innerHeight);

    document.body.appendChild(renderer.domElement);
    var controls = new OrbitControls(camera, renderer.domElement);
    // controls.autoRotate = true;
    // controls.autoRotateSpeed = 3;

    window.addEventListener("resize", function () {
        var width = window.innerWidth;
        var height = window.innerHeight;
        renderer.setSize(width, height);
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
    });

    addPolyhedron(scene, undefined);

    // light
    var directionalLight = new THREE.DirectionalLight(0xFFFFFF, 1);
    directionalLight.position.set(6, 8, 8);
    scene.add(directionalLight);

    directionalLight = new THREE.DirectionalLight(0xFFFFFF, 1);
    directionalLight.position.set(-6, -8, -8);
    scene.add(directionalLight);

    var ambientLight = new THREE.AmbientLight(0xFFFFFF, 0.7);
    scene.add(ambientLight);

    camera.position.set(-1.8322212388906485, 1.8319968391289672, -2.6643576380942604);

    camera.rotation.y = 3.14;
    camera.rotation.x = 0.6;

    return [scene, renderer, camera, controls]
}




window.onload = function() {
    const FizzyText = function () {
        this.num_particles = 0;
        this.color = [255, 255, 0]; // RGB array
        this.randomColor = false
        this.pointWidth = 1;

        this.time = 0;
        this.mode = "offline";

        this.drawCube = true;
        this.play = true;
        this.turnOn = false;
        this.currentSave = fileGet("/lib/saves/names.json")["default_name"];

        this.reset_defaults = function () {
            for (var i = 0; i < gui.__controllers.length; i++) {
                gui.__controllers[i].setValue(gui.__controllers[i].initialValue);
            }
        };

        this.restart = function () {
            if (fizzyText.mode === "online") {
                return 0;
            }

            FrameId = 2;
            speed = 1;
            fizzyText.play = true;
            arrayOfPoints = [];

            // clear scene from points
            while (scene.getObjectByName("point") !== undefined) {
                var selectedObject = scene.getObjectByName("point");
                scene.remove(selectedObject);
            }
        };
    };

    var FrameId = 1, speed = 1, arrayOfPoints = [], data;
    window.default_size = 0.007;

    var allSaves = fileGet("/lib/saves/names.json")["names"];
    var stats = initStats(Stats);

    // Dat Gui controls setup
    var fizzyText = new FizzyText();
    var gui = new dat.GUI({
        load: JSON,
        preset: "Flow"
    });

    gui.remember(fizzyText);
    gui.add(fizzyText, "num_particles").name("Particles").listen();
    var particles_color = gui.addColor(fizzyText, "color").name("Color");
    var size = gui.add(fizzyText, "pointWidth", 0.1, 2).name("Point width");
    // var random_colors = gui.add(fizzyText, "randomColor").name("Random Color");
    var mode_chooser = gui.add(fizzyText, "mode", ["offline", "online"]).name("Mode");
    gui.add(fizzyText, "reset_defaults").name("Reset defaults");

    var playback = gui.addFolder("Playback");
    var pcontrol = playback.add(fizzyText, "play").name("Play").listen();
    playback.add(fizzyText, "restart").name("Restart");
    var chooser = playback.add(fizzyText, "currentSave", allSaves).name("Choose save");

    playback.open();


    mode_chooser.onChange(function(value) {
        if (value === "offline") { data = fileGet("lib/saves/" + fizzyText.currentSave + ".json"); }
        FrameId = 2;
        fizzyText.play = true;
        while (scene.getObjectByName("point") !== undefined) {
            scene.remove(scene.getObjectByName("point"));
        }
        scene.remove(scene.getObjectByName("poly"));
        scene.remove(scene.getObjectByName("wire"));

        if (value === "online") {
            var obj = httpGet("/get_poly");
            if (obj.length === 0) {
                console.log('no data');
            } else {
                addPolyhedron(scene, httpGet("/get_poly"));
            }
        } else {
            addPolyhedron(scene, undefined);
        }

        arrayOfPoints = [];

    });

    chooser.onChange(function(value) {
        if (fizzyText.mode === "online") {
            return 0;
        }
        FrameId = 2;
        fizzyText.play = true;
        while (scene.getObjectByName("point") !== undefined) {
            var selectedObject = scene.getObjectByName("point");
            scene.remove(selectedObject);
        }
        arrayOfPoints = [];

        data = fileGet("lib/saves/" + fizzyText.currentSave + ".json");
    });

    size.onChange(function(value) {
        refreshArrayOfPoints(fizzyText, arrayOfPoints);
    });

    particles_color.onChange(function(value) {
        fizzyText.color[0] = value[0];
        fizzyText.color[1] = value[1];
        fizzyText.color[2] = value[2];
        refreshArrayOfPoints(fizzyText, arrayOfPoints);
    });




    var tmp = init();
    var scene = tmp[0];
    var renderer = tmp[1];
    var camera = tmp[2];
    var controls = tmp[3];

    // run game loop (update, render, repeat)
    data = fileGet("/lib/saves/" + fizzyText.currentSave + ".json");
    var GameLoop = function() {
        requestAnimationFrame(GameLoop);
        stats.begin();
        controls.update();

        if (fizzyText.mode === "offline") {
            var trigger = {"status": true};
        } else {
            var trigger = httpGet("/get_status");
            data = httpGet("/get_frame");
        }

        if (httpGet("/get_poly_status")['status'] && fizzyText.mode === "online") {
            while (scene.getObjectByName("point") !== undefined) {
                var selectedObject = scene.getObjectByName("point");
                scene.remove(selectedObject);
            }
            scene.remove(scene.getObjectByName("poly"));
            scene.remove(scene.getObjectByName("wire"));
            arrayOfPoints = [];

            addPolyhedron(scene, httpGet("/get_poly"));
        }

        if (FrameId === 2 && fizzyText.mode === "offline") {
            speed = 1;
            fizzyText.play = true;
            arrayOfPoints = [];
            while (scene.getObjectByName("point") !== undefined) {
                var selectedObject = scene.getObjectByName("point");
                scene.remove(selectedObject);
            }
        }

        if (FrameId === data.length - 1) {
            speed = -1;
        }

        if (fizzyText.play && FrameId !== 0 && fizzyText.mode === "offline") {
            FrameId += speed;
        }

        if (trigger["status"] && data.length - 1 !== FrameId) {
            if (fizzyText.mode === "offline") {
                fizzyText.num_particles = data[FrameId]["x"].length;
                renderPoints(data[FrameId], scene, fizzyText, arrayOfPoints);
            } else {
                fizzyText.num_particles = data["x"].length;
                renderPoints(data, scene, fizzyText, arrayOfPoints);
            }
        }

        renderer.render(scene, camera); 
        stats.end();
    };
    GameLoop(scene);
};
