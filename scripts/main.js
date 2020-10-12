import * as THREE from "../lib/three.module.js";

import { OrbitControls } from "../lib/OrbitControls.js";
import { GLTFLoader } from "../lib/GLTFLoader.js";
import { RGBELoader } from "../lib/RGBELoader.js";
import { RoughnessMipmapper } from "../lib/RoughnessMipmapper.js";


const FizzyText = function () {
    this.particles = "0";
    this.color = [255, 255, 0]; // RGB array
    this.point_width = 1;

    this.time = 0;
    this.mode = "offline";

    this.draw_cube = true;
    this.play = true;
    this.turn_on = false;
    this.current_save = start_save;

    this.reset_defaults = function () {
        /* Here is the update */
        for (var i = 0; i < window.gui.__controllers.length; i++) {
            window.gui.__controllers[i].setValue(gui.__controllers[i].initialValue);
        }
    };

    this.restart = function () {
        FrameId = 2;
        speed = 1;
        window.text.play = true;
        window.arrayOfPoints = [];

        // clear window.scene from points
        while (window.scene.children.length > 2) {
            var selectedObject = window.scene.getObjectByName("point");
            window.scene.remove(selectedObject);
        }
    };
};


window.onload = function() {
    window.text = new FizzyText();
    window.gui = new dat.GUI({
        load: JSON,
        preset: "Flow"
    });
    window.gui.remember(window.text);
    window.gui.add(window.text, "particles").name("Particles").listen();

    var cl = window.gui.addColor(window.text, "color").name("Color");

    var size = window.gui.add(window.text, "point_width", 0.1, 2).name("Point width");
    var mode_chooser = window.gui.add(window.text, "mode", ["offline", "online"]).name("Mode");
    window.gui.add(window.text, "reset_defaults").name("Reset defaults");   

    var playback = window.gui.addFolder("Playback");
    var pcontrol = playback.add(window.text, "play").name("Play").listen();
    playback.add(window.text, "restart").name("Restart");

    var chooser = playback.add(window.text, "current_save", all_saves).name("Choose save");

    playback.open();


    mode_chooser.onChange(function(value) {
        FrameId = 2;
        window.text.play = true;
        while (window.scene.children.length > 5) {
            var selectedObject = window.scene.getObjectByName("point");
            window.scene.remove(selectedObject);
        }
        window.arrayOfPoints = [];
    });

    chooser.onChange(function(value) {
        FrameId = 2;
        window.text.play = true;
        while (window.scene.children.length > 5) {
            var selectedObject = window.scene.getObjectByName("point");
            window.scene.remove(selectedObject);
        }
        window.arrayOfPoints = [];
        window.data = fileGet("lib/saves/" + window.text.current_save + ".json");
    });

    size.onChange(function(value){
        refresh_points();
    });

    cl.onChange(function(value){
        window.text.color[0] = value[0];
        window.text.color[1] = value[1];
        window.text.color[2] = value[2];
        refresh_points();
    });
};


/**
 * Sends a request to the url and returns parsed response
 * 
 * @param The url of a server for request
 * @returns Server response as parsed json object
 */
function httpGet(theUrl) {
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.open("GET", theUrl, false); // false for synchronous request
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

function refresh_points() {
    var frame = window.data[FrameId];
    for (var i = 0; i < frame["x"].length; ++i) {
        window.arrayOfPoints[i].material.color.r = window.text.color[0] / 255;
        window.arrayOfPoints[i].material.color.g = window.text.color[1] / 255;
        window.arrayOfPoints[i].material.color.b = window.text.color[2] / 255;

        window.arrayOfPoints[i].scale.set(window.text.point_width, window.text.point_width, window.text.point_width);
    }
}

/*
 *Given points coordinates (frame) window.scene, and RGB color, adds all particles to a window.scene
 */
function renderPoints(frame) {
    for (var i = 0; i < frame["x"].length; ++i) {
        if (i < window.arrayOfPoints.length) {
            window.arrayOfPoints[i].position.x = frame["x"][i];
            window.arrayOfPoints[i].position.y = frame["y"][i];
            window.arrayOfPoints[i].position.z = frame["z"][i];
        } else {
            var color = new THREE.Color("rgb(" + Math.round(window.text.color[0]) + "," + Math.round(window.text.color[1]) + "," + Math.round(window.text.color[2]) + ")");
            var geometry = new THREE.SphereGeometry(window.default_size, 10, 10);
            var material = new THREE.MeshBasicMaterial({color: color, wireframe: false});

            var point = new THREE.Mesh(geometry, material);
            point.scale.set(window.text.point_width, window.text.point_width, window.text.point_width);
            point.name = "point";
            window.scene.add(point);
            window.arrayOfPoints.push(point);
            
            window.arrayOfPoints[i].position.x = frame["x"][i];
            window.arrayOfPoints[i].position.y = frame["y"][i];
            window.arrayOfPoints[i].position.z = frame["z"][i];
        }
    }
    for (var j = frame["x"].length; j < window.arrayOfPoints.length; ++j) {
        window.scene.remove(window.arrayOfPoints[j]);
    }
}


function add_textures() {
    var verticesOfCube = [
        -1,-1,-1,    1,-1,-1,    1, 1,-1,    -1, 1,-1,
        -1,-1, 1,    1,-1, 1,    1, 1, 1,    -1, 1, 1,
    ];

    var indicesOfFaces = [
        2,1,0,    0,3,2,
        0,4,7,    7,3,0,
        0,1,5,    5,4,0,
        1,2,6,    6,5,1,
        2,3,7,    7,6,2,
        4,5,6,    6,7,4
    ];

    // create a material, color or image texture
    var geometry = new THREE.PolyhedronGeometry(verticesOfCube, indicesOfFaces, 1 - 0.14, 0);
    var material = new THREE.MeshPhongMaterial({color: 0x0066CC});
    var cube = new THREE.Mesh(geometry, material);
    window.scene.add(cube);


    var geometry = new THREE.PolyhedronGeometry(verticesOfCube, indicesOfFaces, 1.001 - 0.14, 0);
    var material = new THREE.MeshPhongMaterial({color: 0xFFFFFF, wireframe: true});
    var cube = new THREE.Mesh(geometry, material);
    window.scene.add(cube);

    var directionalLight = new THREE.DirectionalLight(0xFFFFFF, 0.5);
    directionalLight.position.x = 6;
    directionalLight.position.y = 8;
    directionalLight.position.z = 8;
    window.scene.add(directionalLight);

    var directionalLight = new THREE.DirectionalLight(0xFFFFFF, 0.5);
    directionalLight.position.x = -6;
    directionalLight.position.y = -8;
    directionalLight.position.z = -8;
    window.scene.add(directionalLight);

    // light
    var ambientLight = new THREE.AmbientLight(0xFFFFFF, 0.8);
    window.scene.add(ambientLight);
}


window.arrayOfPoints = [];
window.default_size = 0.005;
var path = "lib/textures/concrete_texture.jpg";
var cubeMaterials = [
    new THREE.MeshLambertMaterial({map: new THREE.TextureLoader().load(path), side: THREE.DoubleSide}), // RIGHT SIDE
    new THREE.MeshLambertMaterial({map: new THREE.TextureLoader().load(path), side: THREE.DoubleSide}), // LEFT SIDE
    new THREE.MeshLambertMaterial({map: new THREE.TextureLoader().load(path), side: THREE.DoubleSide}), // TOP SIDE
    new THREE.MeshLambertMaterial({map: new THREE.TextureLoader().load(path), side: THREE.DoubleSide}), // BOTTOM SIDE
    new THREE.MeshLambertMaterial({map: new THREE.TextureLoader().load(path), side: THREE.DoubleSide}), // FRONT SIDE
    new THREE.MeshLambertMaterial({map: new THREE.TextureLoader().load(path), side: THREE.DoubleSide})  // BACK SIDE
];

function restart() {
    window.scene = new THREE.Scene();
    window.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    window.stats = initStats();

    window.renderer = new THREE.WebGLRenderer({antialias: true});
    window.renderer.setSize(window.innerWidth, window.innerHeight);

    document.body.appendChild(window.renderer.domElement);
    window.controls = new OrbitControls(window.camera, window.renderer.domElement);
    // window.controls.autoRotate = true;
    // window.controls.autoRotateSpeed = 3;
    var pmremGenerator = new THREE.PMREMGenerator(window.renderer);

    pmremGenerator.compileEquirectangularShader();

    window.addEventListener("resize", function () {
        var width = window.innerWidth;
        var height = window.innerHeight;
        window.renderer.setSize(width, height);
        window.camera.aspect = width / height;
        window.camera.updateProjectionMatrix();
    });


    add_textures();
    window.camera.position.z = -2;
    window.camera.position.y = 1.1;
    window.camera.rotation.y = 3.14;
    window.camera.rotation.x = 0.5;
}
restart();

var FrameId = 1;
var speed = 1;
var start_save = fileGet("/lib/saves/names.json")["default_name"];
var all_saves = fileGet("/lib/saves/names.json")["names"];

window.text = new FizzyText();

// draw scene
var render = function() {
    window.renderer.render(window.scene, window.camera);    
};

// run game loop (update, render, repeat)
window.data = fileGet("/lib/saves/" + window.text.current_save + ".json");
var GameLoop = function() {
    requestAnimationFrame(GameLoop);
    window.stats.begin();
    window.controls.update();

    if (window.text.mode == "offline") {
        var trigger = {"status": true};
    } else {
        var trigger = httpGet("/get_status");
        window.data = httpGet("/get_frame");
    }

    if (FrameId === 2) {
        speed = 1;
        window.text.play = true;
        window.arrayOfPoints = [];
    }

    if (FrameId === window.data.length - 1) {
        speed = -1;
    }

    if (window.text.play && FrameId !== 0) {
        FrameId += speed;
    }

    if (trigger["status"] && window.data.length - 1 !== FrameId) {
        if (window.text.mode == "offline") {
            window.text.particles = window.data[FrameId]["x"].length;
            renderPoints(window.data[FrameId]);
        } else {
            window.text.particles = window.data["x"].length;
            renderPoints(window.data);
        }
    }

    render();
    window.stats.end();
};


GameLoop(window.scene);
function initStats() {
    window.stats = new Stats();
    window.stats.setMode(0); // 0: fps, 1: ms

    // Align top-left
    window.stats.domElement.style.position = "absolute";
    window.stats.domElement.style.left = "0px";
    window.stats.domElement.style.top = "0px";
    document.body.appendChild( stats.dom );
    return stats;
}