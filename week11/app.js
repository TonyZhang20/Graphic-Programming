'use strict'

		/*
		Name - Xinyuan Zhang
		Partner - Miguel Tayag
		submission is not the same 
		*/

var gl;

var appInput = new Input();
var time = new Time();
var camera = new OrbitCamera(appInput);

var sphereGeometryList = []; // this will be created after loading from a file
var groundGeometry = null;   // this will be procedurally created

var projectionMatrix = new Matrix4();

// the shader that will be used by each piece of geometry (they could each use their own shader but in this case it will be the same)
var textureShaderProgram;

// auto start the app when the html page is ready
window.onload = window['initializeAndStartRendering'];

// we need to asynchronously fetch files from the "server" (your local hard drive)
// all of this is stored in memory on the CPU side and must be fed to the GPU
var loadedAssets = {
    textureTextVS: null, textureTextFS: null, // our textured shader code text
    sphereJSON: null,                         // the raw JSON for our sphere model
    uvGridImage: null,                         // a basic test image
    testImage: null
};

// -------------------------------------------------------------------------
function initializeAndStartRendering() {
    initGL();
    loadAssets(function() {
        createShaders(loadedAssets);
        createScene();

        updateAndRender();
    });
}

// -------------------------------------------------------------------------
function initGL(canvas) {
    var canvas = document.getElementById("webgl-canvas");

    try {
        gl = canvas.getContext("webgl", { alpha: false });
        gl.canvasWidth = canvas.width;
        gl.canvasHeight = canvas.height;

        // todo #7
        // todo enable depth test (z-buffering)
        gl.enable(gl.DEPTH_TEST);
        // todo enable backface culling
        gl.enable(gl.CULL_FACE);
    } catch (e) {}

    if (!gl) {
        alert("Could not initialise WebGL, sorry :-(");
    }
}

// -------------------------------------------------------------------------
function loadAssets(onLoadedCB) {
    // a list of data to fetch from the "server" (our hard drive)
    var filePromises = [
        fetch('./shaders/unlit.textured.vs.glsl').then((response) => { return response.text(); }),
        fetch('./shaders/unlit.textured.fs.glsl').then((response) => { return response.text(); }),
        fetch('./data/sphere.json').then((response) => { return response.json(); }),
        loadImage('./data/uvgrid.png'),
        loadImage('./data/test.jpg')
    ];

    // once all files are downloaded, this promise function will execute
    Promise.all(filePromises).then(function(values) {
        // Assign loaded data to our named variables
        loadedAssets.textureTextVS = values[0]; // from 1st fetch
        loadedAssets.textureTextFS = values[1]; // from 2nd fetch
        loadedAssets.sphereJSON = values[2];    // from 3rd fetch
        loadedAssets.uvGridImage = values[3];   // from loadImage
        loadedAssets.testImage = values[4];
    }).catch(function(error) {
        console.error(error.message);
    }).finally(function() {
        onLoadedCB();
    });
}

// -------------------------------------------------------------------------
function createShaders(loadedAssets) {
    textureShaderProgram = createCompiledAndLinkedShaderProgram(loadedAssets.textureTextVS, loadedAssets.textureTextFS);

    textureShaderProgram.attributes = {
        vertexPositionAttribute: gl.getAttribLocation(textureShaderProgram, "aVertexPosition"),
        vertexTexcoordsAttribute: gl.getAttribLocation(textureShaderProgram, "aTexcoords")
    };

    textureShaderProgram.uniforms = {
        worldMatrixUniform: gl.getUniformLocation(textureShaderProgram, "uWorldMatrix"),
        viewMatrixUniform: gl.getUniformLocation(textureShaderProgram, "uViewMatrix"),
        projectionMatrixUniform: gl.getUniformLocation(textureShaderProgram, "uProjectionMatrix"),
        textureUniform: gl.getUniformLocation(textureShaderProgram, "uTexture"),
        mytextureUniform: gl.getUniformLocation(textureShaderProgram, "uMyTexture"),
        alphaUniform: gl.getUniformLocation(textureShaderProgram, "uAlpha"),
        timeUniform: gl.getUniformLocation(textureShaderProgram, "uTime"),
    };
}

// -------------------------------------------------------------------------
function createScene() {
    groundGeometry = new WebGLGeometryQuad(gl, textureShaderProgram);
    groundGeometry.create(loadedAssets.uvGridImage, loadedAssets.testImage);

    // make it bigger
    var scale = new Matrix4().makeScale(10.0, 10.0, 10.0);

    // compensate for the model being flipped on its side
    var rotation = new Matrix4().makeRotationX(-90);

    groundGeometry.worldMatrix.multiply(rotation).multiply(scale);

    for (var i = 0; i < 3; ++i) {
        var sphereGeometry = new WebGLGeometryJSON(gl, textureShaderProgram);
        sphereGeometry.create(loadedAssets.sphereJSON, loadedAssets.uvGridImage, loadedAssets.testImage);

        // Scale it down so that the diameter is 3 (model is at 100x scale)
        var scale = new Matrix4().makeScale(0.03, 0.03, 0.03);

        // raise it by the radius to make it sit on the ground
        var translation = new Matrix4().makeTranslation(0, 1.5, -5 + i * 5);

        sphereGeometry.worldMatrix.makeIdentity();
        sphereGeometry.worldMatrix.multiply(translation).multiply(scale);

        sphereGeometry.alpha = 0.2 + 0.8 * (i / 2);
        
        sphereGeometryList.push(sphereGeometry);
    }
}

// -------------------------------------------------------------------------
function updateAndRender() {
    requestAnimationFrame(updateAndRender);

    var aspectRatio = gl.canvasWidth / gl.canvasHeight;

    time.update();
    camera.update(time.deltaTime, time.secondsElapsedSinceStart);

    // specify what portion of the canvas we want to draw to (all of it, full width and height)
    gl.viewport(0, 0, gl.canvasWidth, gl.canvasHeight);

    // this is a new frame so let's clear out whatever happened last frame
    gl.clearColor(0.707, 0.707, 1, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    projectionMatrix.makePerspective(45, aspectRatio, 0.1, 1000);

    groundGeometry.render(camera, projectionMatrix, textureShaderProgram);

    // todo #8
    //   1. enable blending
    gl.enable(gl.BLEND);
    //   2. set blend mode source to gl.SRC_ALPHA and destination to gl.ONE_MINUS_SRC_ALPHA
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA); 
    // todo #10 apply the painter's algorithm
    var tempPositionList = [];
    var cameraPosition = camera.getPosition();
    for (var i = sphereGeometryList.length - 1; i >= 0; --i) 
    {
        tempPositionList.push(cameraPosition.clone().subtract(sphereGeometryList[i].getPosition()).clone().length() );
    }

    const Spheres = [
        {name: sphereGeometryList[0], length: tempPositionList[0]},
        {name: sphereGeometryList[1], length: tempPositionList[1]},
        {name: sphereGeometryList[2], length: tempPositionList[2]}
    ]
    
    const Closest = Spheres.sort(function(a,b)
    {
        return a.length - b.length;
    });

    // todo #6
    // uncomment when directed by guide
    for (var i = 0; i < Closest.length; i++) {
        Closest[i].name.render(camera, projectionMatrix, textureShaderProgram);
    }
    
    // todo - disable blending
    gl.disable(gl.BLEND);
}

// EOF 00100001-10
