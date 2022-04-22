'use strict'

var gl;

var appInput = new Input();
var time = new Time();
var camera = new OrbitCamera(appInput);

var sphereGeometry = null; // this will be created after loading from a file
var groundGeometry = null;
var barrelGeometry = null;
var sphereLightGeometry = null;

var projectionMatrix = new Matrix4();
var lightPosition = new Vector3(4, 1.5, 0);
var lightSphere = new Vector3(0, 0, 0);

// the shader that will be used by each piece of geometry (they could each use their own shader but in this case it will be the same)
var phongShaderProgram;
var barebonesShadersProgram;

// auto start the app when the html page is ready
window.onload = window['initializeAndStartRendering'];

// we need to asynchronously fetch files from the "server" (your local hard drive)
var loadedAssets = {
    phongTextVS: null, phongTextFS: null,
    sphereJSON: null,
    marbleImage: null,
    crackedMudImage: null,
    barrelImage: null,
};

var loadedNewAssets = {
    phongTextVS: null, phongTextFS: null,
    sphereJSON: null,
};


// -------------------------------------------------------------------------
function initializeAndStartRendering() {
    initGL();
    loadAssets(function() {
        createShaders(loadedAssets);
        createNewShaders(loadedNewAssets);

        createScene();

        updateAndRender();
    });
}

// -------------------------------------------------------------------------
function initGL(canvas) {
    var canvas = document.getElementById("webgl-canvas");

    try {
        gl = canvas.getContext("webgl");
        gl.canvasWidth = canvas.width;
        gl.canvasHeight = canvas.height;

        gl.enable(gl.DEPTH_TEST);
    } catch (e) {}

    if (!gl) {
        alert("Could not initialise WebGL, sorry :-(");
    }
}

// -------------------------------------------------------------------------
function loadAssets(onLoadedCB) {
    var filePromises = [
        fetch('./shaders/phong.vs.glsl').then((response) => { return response.text(); }),
        fetch('./shaders/phong.pointlit.fs.glsl').then((response) => { return response.text(); }),
        fetch('./data/sphere.json').then((response) => { return response.json(); }),
        loadImage('./data/marble.jpg'),
        loadImage('./data/crackedMud.png'),
        loadImage('./data/barrel.png'),
        fetch('./data/barrel.json').then((response) => { return response.json(); }),
        fetch('./shaders/flat.color.vs.glsl').then((response) => { return response.text(); }),
        fetch('./shaders/flat.color.fs.glsl').then((response) => { return response.text(); })
    ];

    Promise.all(filePromises).then(function(values) {
        // Assign loaded data to our named variables
        loadedAssets.phongTextVS = values[0];
        loadedAssets.phongTextFS = values[1];
        loadedAssets.sphereJSON = values[2];
        loadedAssets.marbleImage = values[3];
        loadedAssets.crackedMudImage = values[4];
        loadedAssets.barrelImage = values[5];
        loadedAssets.barrelJSON = values[6];
        loadedNewAssets.phongTextVS = values[7];
        loadedNewAssets.phongTextFS = values[8];
        loadedNewAssets.sphereJSON = values[2];
    }).catch(function(error) {
        console.error(error.message);
    }).finally(function() {
        onLoadedCB();
    });
}

// -------------------------------------------------------------------------
function createShaders(loadedAssets) {
    phongShaderProgram = createCompiledAndLinkedShaderProgram(loadedAssets.phongTextVS, loadedAssets.phongTextFS);

    phongShaderProgram.attributes = {
        vertexPositionAttribute: gl.getAttribLocation(phongShaderProgram, "aVertexPosition"),
        vertexNormalsAttribute: gl.getAttribLocation(phongShaderProgram, "aNormal"),
        vertexTexcoordsAttribute: gl.getAttribLocation(phongShaderProgram, "aTexcoords")
    };

    phongShaderProgram.uniforms = {
        worldMatrixUniform: gl.getUniformLocation(phongShaderProgram, "uWorldMatrix"),
        viewMatrixUniform: gl.getUniformLocation(phongShaderProgram, "uViewMatrix"),
        projectionMatrixUniform: gl.getUniformLocation(phongShaderProgram, "uProjectionMatrix"),
        lightPositionUniform : gl.getUniformLocation(phongShaderProgram, "uLightPosition"),
        cameraPositionUniform: gl.getUniformLocation(phongShaderProgram, "uCameraPosition"),
        textureUniform: gl.getUniformLocation(phongShaderProgram, "uTexture"),
    };
}


function createNewShaders(loadedNewAssets)
{
    barebonesShadersProgram = createCompiledAndLinkedShaderProgram(loadedNewAssets.phongTextVS, loadedNewAssets.phongTextFS);

    barebonesShadersProgram.attributes = {
        vertexPositionAttribute: gl.getAttribLocation(barebonesShadersProgram, "aVertexPosition"),
    };

    barebonesShadersProgram.uniforms = {
        worldMatrixUniform: gl.getUniformLocation(barebonesShadersProgram, "uWorldMatrix"),
        viewMatrixUniform: gl.getUniformLocation(barebonesShadersProgram, "uViewMatrix"),
        projectionMatrixUniform: gl.getUniformLocation(barebonesShadersProgram, "uProjectionMatrix"),
    };
}
// -------------------------------------------------------------------------
function createScene() {
    groundGeometry = new WebGLGeometryQuad(gl, phongShaderProgram);
    groundGeometry.create(loadedAssets.crackedMudImage);

    var scale = new Matrix4().makeScale(10.0, 10.0, 10.0);

    // compensate for the model being flipped on its side
    var rotation = new Matrix4().makeRotationX(-90);

    groundGeometry.worldMatrix.makeIdentity();
    groundGeometry.worldMatrix.multiply(rotation).multiply(scale);

    sphereGeometry = new WebGLGeometryJSON(gl, phongShaderProgram);
    sphereGeometry.create(loadedAssets.sphereJSON, loadedAssets.marbleImage);

    // Scaled it down so that the diameter is 3
    var scale = new Matrix4().makeScale(0.03, 0.03, 0.03);

    // raise it by the radius to make it sit on the ground
    var translation = new Matrix4().makeTranslation(0, 1.5, 0);

    
    sphereGeometry.worldMatrix.makeIdentity();
    sphereGeometry.worldMatrix.multiply(translation).multiply(scale);
    
    barrelGeometry = new WebGLGeometryJSON(gl, phongShaderProgram);
    barrelGeometry.create(loadedAssets.barrelJSON, loadedAssets.barrelImage);
    
    scale = new Matrix4().makeScale(0.3,0.3,0.3);
    translation = new Matrix4().makeTranslation(-5,2,-5);
    
    barrelGeometry.worldMatrix.makeIdentity();
    barrelGeometry.worldMatrix.multiply(translation).multiply(scale);

    sphereLightGeometry = new WebGLGeometryJSON(gl);
    sphereLightGeometry.create(loadedNewAssets.sphereJSON);

    scale = new Matrix4().makeScale(0.005, 0.005, 0.005);
    //translation = new Matrix4().makeTranslation(4, 1.5, 0);
    sphereLightGeometry.worldMatrix.makeIdentity();
    sphereLightGeometry.worldMatrix.multiply(scale);

    //scale = new Matrix4().makeScale(10, 10, 10);

}

// -------------------------------------------------------------------------
function updateAndRender() {
    requestAnimationFrame(updateAndRender);

    var aspectRatio = gl.canvasWidth / gl.canvasHeight;

    // todo #10
    // add keyboard controls for changing light direction here

//#region LightControl 

    var lightWorldMatrix = new Matrix4().makeTranslation(lightPosition);
    var RotationMatrix = new Matrix4().makeRotationY(time.deltaTime * -50);
    var AfterTransform = RotationMatrix.clone().multiply(lightWorldMatrix.clone());

    lightPosition = new Vector3(AfterTransform.elements[3], AfterTransform.elements[7], AfterTransform.elements[11]);
    sphereLightGeometry.worldMatrix = AfterTransform;
    
    var scale = new Matrix4().makeScale(0.005, 0.005, 0.005);
    sphereLightGeometry.worldMatrix.multiply(scale);


//#endregion
    
    
    time.update();
    camera.update(time.deltaTime);

    // specify what portion of the canvas we want to draw to (all of it, full width and height)
    gl.viewport(0, 0, gl.canvasWidth, gl.canvasHeight);

    // this is a new frame so let's clear out whatever happened last frame
    gl.clearColor(0.707, 0.707, 1, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    gl.useProgram(phongShaderProgram);
    var uniforms = phongShaderProgram.uniforms;
    var cameraPosition = camera.getPosition();
    gl.uniform3f(uniforms.lightPositionUniform , lightPosition.x, lightPosition.y, lightPosition.z);
    gl.uniform3f(uniforms.cameraPositionUniform, cameraPosition.x, cameraPosition.y, cameraPosition.z);

    projectionMatrix.makePerspective(45, aspectRatio, 0.1, 1000);
    groundGeometry.render(camera, projectionMatrix, phongShaderProgram);
    sphereGeometry.render(camera, projectionMatrix, phongShaderProgram);
    barrelGeometry.render(camera, projectionMatrix, phongShaderProgram);
    sphereLightGeometry.render(camera, projectionMatrix, barebonesShadersProgram);
}

// EOF 00100001-10