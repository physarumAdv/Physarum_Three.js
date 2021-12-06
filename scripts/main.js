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
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.open("GET", Url, false); // false for synchronous request
    xmlHttp.send(null);
    return JSON.parse(xmlHttp.responseText);
}


function fileGet(file_name, missing_files) {
    if (missing_files) {
        return [];
    }
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
        for (var vert of data) {
            verticesOfCube.push(new THREE.Vector3(vert[0], vert[1], vert[2]))
        }
    }

    var geometry = new ConvexGeometry(verticesOfCube);
    var material = new THREE.MeshPhongMaterial({color: 0x0066CC});
    var mesh = new THREE.Mesh(geometry, material);
    mesh.name = "poly";

    scene.add(mesh);
}


function init() {
    var scene = new THREE.Scene();
    var camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

    var renderer = new THREE.WebGLRenderer({antialias: true});
    renderer.setSize(window.innerWidth, window.innerHeight);

    document.body.appendChild(renderer.domElement);
    var controls = new OrbitControls(camera, renderer.domElement);
    controls.enableKeys = false;
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
    var directionalLight = new THREE.DirectionalLight(0xFFFFFF, 1);
    directionalLight.position.set(6, 8, 8);
    scene.add(directionalLight);

    directionalLight = new THREE.DirectionalLight(0xFFFFFF, 1);
    directionalLight.position.set(-6, -8, -8);
    scene.add(directionalLight);

    var ambientLight = new THREE.AmbientLight(0xFFFFFF, 0.7);
    scene.add(ambientLight);

    camera.position.set(-1.83222123889, 1.83199683912, -2.66435763809);

    camera.rotation.y = 3.14;
    camera.rotation.x = 0.6;

    return [scene, renderer, camera, controls]
}




window.onload = function() {
    const FizzyText = function () {
        this.num_particles = 0;
        this.color = [255, 255, 0]; // RGB array
        this.pointWidth = 1;

        this.time = 0.0;
        this.mode = "offline";
        this.speedMode = "1.00";
        this.name = "Pavel Artushkov";
        this.renderSwitch = false;

        this.drawCube = true;
        this.play = true;
        this.turnOn = false;

        if (!FilesMissing) {
            this.currentSave = fileGet("/lib/saves/names.json", false)["default_name"];
        } else {
            this.currentSave = "None";
        }

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
            direction = 1;
            fizzyText.play = true;
            arrayOfPoints = [];

            // clear scene from points
            while (scene.getObjectByName("point") !== undefined) {
                var selectedObject = scene.getObjectByName("point");
                scene.remove(selectedObject);
            }
        };
    };

    var FrameId = 1, direction = 1, arrayOfPoints = [], data, FilesMissing = false;
    window.default_size = 0.007;

    try {
        var allSaves = fileGet("/lib/saves/names.json", false)["names"];
    } catch (error) {
        console.log('You have no growth saves in the lib/saves/');
        FilesMissing = true;
    }
    var stats = initStats(Stats);

    // Dat Gui controls setup
    var fizzyText = new FizzyText();
    var gui = new dat.GUI({
        load: JSON,
        preset: "Flow",
        width: 300
    });

    gui.add(fizzyText, "num_particles").name("Particles").listen();
    var particles_color = gui.addColor(fizzyText, "color").name("Color");
    var size = gui.add(fizzyText, "pointWidth", 0.1, 2).name("Point width");
    var mode_chooser = gui.add(fizzyText, "mode", ["offline", "online"]).name("Mode");
    gui.add(fizzyText, "reset_defaults").name("Reset defaults");

    var playback = gui.addFolder("Playback");
    playback.add(fizzyText, "play").name("Play").listen();
    playback.add(fizzyText, "restart").name("Restart");
    playback.add(fizzyText, "speedMode", ["0.25", "0.5", "0.75", "1.00", "1.25", "1.5", "1.75", "2.00", "5.00", "10.0"]).name("Playback Speed");
    var timeline = playback.add(fizzyText, "time", 0, 1).step(0.01).name("Timeline").listen();
    var chooser = playback.add(fizzyText, "currentSave", allSaves).name("Choose save");
    var author = gui.add(fizzyText, "name").name("Made by:");
    author.domElement.style.pointerEvents = "none";
    playback.open();

    var renderMode = gui.addFolder("Render mode");
    var rswitch = renderMode.add(fizzyText, "renderSwitch").name("Activate").listen();

    rswitch.onChange(function(value) {
        if (value) {
            controls = new FlyControls(camera, renderer.domElement);
            controls.enableKeys = true;
            controls.movementSpeed = 1000;
            controls.domElement = renderer.domElement;
            controls.rollSpeed = Math.PI / 24;
            controls.autoForward = false;
            controls.dragToLook = false;
        } else {
            controls = new OrbitControls(camera, renderer.domElement);
            controls.enableKeys = false;
        }
    });

    timeline.onChange(function(value) {
        FrameId = (data.length) * (value);
    });

    mode_chooser.onChange(function(value) {
        if (value === "offline") { data = fileGet("lib/saves/" + fizzyText.currentSave + ".json", FilesMissing); }
        FrameId = 2;
        fizzyText.play = true;
        while (scene.getObjectByName("point") !== undefined) {
            scene.remove(scene.getObjectByName("point"));
        }
        scene.remove(scene.getObjectByName("poly"));

        if (value === "online") {
	    playback.close();
            var obj = httpGet("/get_poly");
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

        data = fileGet("lib/saves/" + fizzyText.currentSave + ".json", FilesMissing);
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


    document.addEventListener("keydown", onDocumentKeyDown, false);
    function onDocumentKeyDown(event) {
        var keyCode = event.which;
        if (keyCode == 32) { // Space
            fizzyText.play = !fizzyText.play;
            return false;
        } else if (keyCode == 39 && FrameId < data.length) { // Left arrow
            FrameId += 5;
            fizzyText.time = (FrameId + 1) / data.length;
            return false;
        } else if (keyCode == 37 && FrameId > 6) { // Right arrow
            FrameId -= 5;
            fizzyText.time = (FrameId + 1) / data.length;
            return false;
        }
    };

    var inFormOrLink;
    $('a').on('click', function() { inFormOrLink = true; });
    $('form').on('submit', function() { inFormOrLink = true; });

    $(window).on("beforeunload", function() {
        console.log('hjdskhfakjdshf');
    })


    var tmp = init();
    var scene = tmp[0];
    var renderer = tmp[1];
    var camera = tmp[2];
    var controls = tmp[3];

    // run game loop (update, render, repeat)
    data = fileGet("/lib/saves/" + fizzyText.currentSave + ".json", FilesMissing);
    var GameLoop = function() {
        requestAnimationFrame(GameLoop);
        stats.begin();
        controls.update();
        console.log(controls);

        if (fizzyText.mode === "online") {

            data = httpGet("/get_frame");
            if (httpGet("/get_status")["status"] && data.length !== 0) {
                fizzyText.num_particles = data["x"].length;
                renderPoints(data, scene, fizzyText, arrayOfPoints);
            }

            if (httpGet("/get_poly_status")['status']) {
                while (scene.getObjectByName("point") !== undefined) {
                    var selectedObject = scene.getObjectByName("point");
                    scene.remove(selectedObject);
                }
                scene.remove(scene.getObjectByName("poly"));
                arrayOfPoints = [];

                addPolyhedron(scene, httpGet("/get_poly"));
            }

        } else {

            if (Math.round(FrameId) <= 1) {
                direction = 1;
                fizzyText.play = true;
                arrayOfPoints = [];
                while (scene.getObjectByName("point") !== undefined) {
                    var selectedObject = scene.getObjectByName("point");
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
        stats.end();
    };
    GameLoop(scene);
};
