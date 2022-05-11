'use strict'

var gl;
/*
Name - Xinyuan Zhang
*/
var appInput = new Input();
var time = new Time();
var camera = new OrbitCamera(appInput);
var lightCamera = new Camera();

var groundGeometry = null;
var TopGeometry = null;
var frontGeometry = null;
var backGeometry = null;
var leftGeometry = null;
var rightGeometry = null;
var particleProgram = null;

var sunGeometry = null;
var mercuryGeometry = null;
var venusGeometry = null;
var earthGeometry = null; // this will be created after loading from a file
var marsGeometry = null;
var jupiterGeometry = null;
var saturnGeometry = null;
var uranusGeometry = null;
var neptuneGeometry = null;
var moonGeometry = null;
var cloudGeometry = null;
var particleSystemGeometry = null;

var projectionMatrix = new Matrix4();
var shadowProjectionMatrix = new Matrix4();
var lightDirection = new Vector3(1, 0, 0);
var directionToLight = new Vector4(0, 0, 0, 1).normalize();
var lightCameraPosition = new Vector4(0, 0, 0, 1);
// the shader that will be used by each piece of geometry (they could each use their own shader but in this case it will be the same)
var depthWriteProgram;
var phongShaderProgram;
var sunShaderProgram;
var earthShaderProgram;

// auto start the app when the html page is ready
window.onload = window['initializeAndStartRendering'];

var MoonSelf = new Matrix4();
var MoonDegree = 35;

// variables holding references to things we need to render to an offscreen texture
var fbo;
var renderTexture;
var renderBuffer;

var earth = false;
var sun = true;

// we need to asynchronously fetch files from the "server" (your local hard drive)
var loadedAssets = {
    phongTextVS: null, phongTextFS: null,
    sphereJSON: null,
    marbleImage: null,
    crackedMudImage: null,
    mercuryImage: null, venusImage: null, marsImage: null,
    jupiterImage: null, saturnImage: null, uranusImage: null,
    neptuneImage: null, wallsImage: null, moonImage: null,
    unlitColorBillboardVS: null, unlitColorBillboardFS: null,
    particeImage: null
};

var SunAssets = {
    phongTextVS: null, phongTextFS: null,
    sunImage: null,
}

var EarthAssets = {
    earthVs: null, earthFs: null,
    earthImage: null, nightImage: null,
}

var shadowAssets = {
    shadowVs: null, shadowFs: null,
}

var cloudAssets = {
    cloudImage: null
}

var PlantPosition =
{
    Mercury: new Vector3(-12, 0, 0),
    Venus: new Vector3(17, 0, 0),
    Earth: new Vector3(-25, 0, 0),
    Mars: new Vector3(34, 0, 0),
    Jupiter: new Vector3(-50, 0, 0),
    Saturn: new Vector3(61, 0, 0),
    Uranus: new Vector3(-77, 0, 0),
    Neptune: new Vector3(95, 0, 0),
    Moon: new Vector3(),
}

// -------------------------------------------------------------------------
function initializeAndStartRendering() {
    initGL();
    loadAssets(function () {
        createShaders(loadedAssets);
        createSun(SunAssets);
        createScene();
        createFrameBufferResources();

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
    } catch (e) { }

    if (!gl) {
        alert("Could not initialise WebGL, sorry :-(");
    }
}

// -------------------------------------------------------------------------
function loadAssets(onLoadedCB) {
    var filePromises = [
        fetch('./shaders/phong.vs.glsl').then((response) => { return response.text(); }),
        fetch('./shaders/phong.directionlit.fs.glsl').then((response) => { return response.text(); }),
        fetch('./data/sphere.json').then((response) => { return response.json(); }),
        loadImage('./data/Earth.jpg'),
        loadImage('./data/Stars.jpg'),
        loadImage('./data/Mercury.jpg'),
        loadImage('./data/Venus.jpg'),
        loadImage('./data/Mars.jpg'),
        loadImage('./data/Jupiter.jpg'),
        loadImage('./data/Saturn.jpg'),
        loadImage('./data/Uranus.jpg'),
        loadImage('./data/Neptune.jpg'),
        fetch('./shaders/sun.vs.glsl').then((response) => { return response.text(); }),
        fetch('./shaders/sun.fs.glsl').then((response) => { return response.text(); }),
        loadImage('./data/Sun.jpg'),
        loadImage('./data/Stars_milk.jpg'),
        loadImage('./data/Moon.jpg'),
        fetch('./shaders/depth.fs.glsl').then((response) => { return response.text(); }),
        fetch('./shaders/depth.vs.glsl').then((response) => { return response.text(); }),
        loadImage('./data/Cloud.jpg'),
        fetch('./shaders/earth.fs.glsl').then((response) => { return response.text(); }),
        fetch('./shaders/earth.vs.glsl').then((response) => { return response.text(); }),
        loadImage('./data/earth_night.jpg'),
        fetch('./shaders/particle.vs.glsl').then((response) => { return response.text(); }),
        fetch('./shaders/particle.fs.glsl').then((response) => { return response.text(); }),
        loadImage('./data/particle.png'),
    ];

    Promise.all(filePromises).then(function (values) {
        // Assign loaded data to our named variables
        loadedAssets.phongTextVS = values[0];
        loadedAssets.phongTextFS = values[1];
        loadedAssets.sphereJSON = values[2];
        EarthAssets.earthImage = values[3];
        loadedAssets.crackedMudImage = values[4];
        loadedAssets.mercuryImage = values[5];
        loadedAssets.venusImage = values[6];
        loadedAssets.marsImage = values[7];
        loadedAssets.jupiterImage = values[8];
        loadedAssets.saturnImage = values[9];
        loadedAssets.uranusImage = values[10];
        loadedAssets.neptuneImage = values[11];

        SunAssets.phongTextVS = values[12];
        SunAssets.phongTextFS = values[13];
        SunAssets.sunImage = values[14];

        loadedAssets.wallsImage = values[15];
        loadedAssets.moonImage = values[16];

        shadowAssets.shadowFs = values[17];
        shadowAssets.shadowVs = values[18];

        cloudAssets.cloudImage = values[19];

        EarthAssets.earthFs = values[20];
        EarthAssets.earthVs = values[21];
        EarthAssets.nightImage = values[22];

        loadedAssets.unlitColorBillboardVS = values[23];
        loadedAssets.unlitColorBillboardFS = values[24];
        loadedAssets.particeImage = values[25];
    }).catch(function (error) {
        console.error(error.message);
    }).finally(function () {
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
        lightDirectionUniform: gl.getUniformLocation(phongShaderProgram, "uLightDirection"),
        lightVPMatrixUniform: gl.getUniformLocation(phongShaderProgram, "uLightVPMatrix"),
        cameraPositionUniform: gl.getUniformLocation(phongShaderProgram, "uCameraPosition"),
        shadowTextureUniform: gl.getUniformLocation(phongShaderProgram, "uShadowTexture"),
        textureUniform: gl.getUniformLocation(phongShaderProgram, "uTexture"),
        alphaUniform: gl.getUniformLocation(phongShaderProgram, "uAlpha"),
    };

    depthWriteProgram = createCompiledAndLinkedShaderProgram(shadowAssets.shadowVs, shadowAssets.shadowFs);

    depthWriteProgram.attributes = {
        vertexPositionAttribute: gl.getAttribLocation(depthWriteProgram, "aVertexPosition"),
    };

    depthWriteProgram.uniforms = {
        worldMatrixUniform: gl.getUniformLocation(depthWriteProgram, "uWorldMatrix"),
        viewMatrixUniform: gl.getUniformLocation(depthWriteProgram, "uViewMatrix"),
        projectionMatrixUniform: gl.getUniformLocation(depthWriteProgram, "uProjectionMatrix"),
    };

    earthShaderProgram = createCompiledAndLinkedShaderProgram(EarthAssets.earthVs, EarthAssets.earthFs);
    earthShaderProgram.attributes = {
        vertexPositionAttribute: gl.getAttribLocation(earthShaderProgram, "aVertexPosition"),
        vertexNormalsAttribute: gl.getAttribLocation(earthShaderProgram, "aNormal"),
        vertexTexcoordsAttribute: gl.getAttribLocation(earthShaderProgram, "aTexcoords")
    };

    earthShaderProgram.uniforms = {
        worldMatrixUniform: gl.getUniformLocation(earthShaderProgram, "uWorldMatrix"),
        viewMatrixUniform: gl.getUniformLocation(earthShaderProgram, "uViewMatrix"),
        projectionMatrixUniform: gl.getUniformLocation(earthShaderProgram, "uProjectionMatrix"),
        lightDirectionUniform: gl.getUniformLocation(earthShaderProgram, "uLightDirection"),
        lightVPMatrixUniform: gl.getUniformLocation(earthShaderProgram, "uLightVPMatrix"),
        cameraPositionUniform: gl.getUniformLocation(earthShaderProgram, "uCameraPosition"),
        shadowTextureUniform: gl.getUniformLocation(earthShaderProgram, "uShadowTexture"),
        textureUniform: gl.getUniformLocation(earthShaderProgram, "uTexture"),
        alphaUniform: gl.getUniformLocation(earthShaderProgram, "uAlpha"),
        earthPositionUniform: gl.getUniformLocation(earthShaderProgram, "EarthPosition"),
        moonPositionUniform: gl.getUniformLocation(earthShaderProgram, "MoonPosition"),
        earthNightTextureUniform: gl.getUniformLocation(earthShaderProgram, "uNightTexture"),
    };

    particleProgram = createCompiledAndLinkedShaderProgram(loadedAssets.unlitColorBillboardVS, loadedAssets.unlitColorBillboardFS);
    //gl.useProgram(particleProgram, loadedAssets.particeImage);

    particleProgram.attributes = {
        vertexPositionAttribute: gl.getAttribLocation(particleProgram, "aVertexPosition"),
        vertexColorAttribute: gl.getAttribLocation(particleProgram, "aVertexColor"),
    };

    particleProgram.uniforms = {
        worldMatrixUniform: gl.getUniformLocation(particleProgram, "uWorldMatrix"),
        viewMatrixUniform: gl.getUniformLocation(particleProgram, "uViewMatrix"),
        projectionMatrixUniform: gl.getUniformLocation(particleProgram, "uProjectionMatrix"),
        colorUniform: gl.getUniformLocation(particleProgram, "uColor"),
        textureUniform: gl.getUniformLocation(particleProgram, "uTexture"),
    };
}


function createSun(SunAssets) {
    sunShaderProgram = createCompiledAndLinkedShaderProgram(SunAssets.phongTextVS, SunAssets.phongTextFS);

    sunShaderProgram.attributes = {
        vertexPositionAttribute: gl.getAttribLocation(sunShaderProgram, "aVertexPosition"),
        vertexTexcoordsAttribute: gl.getAttribLocation(sunShaderProgram, "aTexcoords")
    };

    sunShaderProgram.uniforms = {
        worldMatrixUniform: gl.getUniformLocation(sunShaderProgram, "uWorldMatrix"),
        viewMatrixUniform: gl.getUniformLocation(sunShaderProgram, "uViewMatrix"),
        projectionMatrixUniform: gl.getUniformLocation(sunShaderProgram, "uProjectionMatrix"),
        textureUniform: gl.getUniformLocation(sunShaderProgram, "uTexture"),
        timeUniform: gl.getUniformLocation(sunShaderProgram, "uTime"),
    };
}

function createFrameBufferResources() {
    var dimension = 2048;
    var width = dimension, height = dimension;

    // This lets WebGL know we want to use these extensions (not default in WebGL1)
    gl.getExtension("OES_texture_float");
    gl.getExtension("OES_texture_float_linear");

    // create and set up the texture that will be rendered into
    renderTexture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, renderTexture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.FLOAT, null);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    // create an alternate frame buffer that we will render depth into (works in conjunction with the texture we just created)
    fbo = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, renderTexture, 0);
    fbo.width = fbo.height = dimension;

    renderBuffer = gl.createRenderbuffer();
    gl.bindRenderbuffer(gl.RENDERBUFFER, renderBuffer);

    gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, width, height);
    gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, renderBuffer);

    gl.bindTexture(gl.TEXTURE_2D, null);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.bindRenderbuffer(gl.RENDERBUFFER, null);

    checkFrameBufferStatus();
}


// -------------------------------------------------------------------------
function createScene() {
    //#region  Ground

    var scale = new Matrix4().makeScale(200.0, 200.0, 200.0);
    // compensate for the model being flipped on its side
    var rotation = new Matrix4().makeRotationX(-90);
    var translation = new Matrix4().makeTranslation(0, -200, 0);

    groundGeometry = new WebGLGeometryQuad(gl, phongShaderProgram);
    groundGeometry.create(loadedAssets.crackedMudImage);
    groundGeometry.worldMatrix.makeIdentity().multiply(translation);
    groundGeometry.worldMatrix.multiply(rotation).multiply(scale);

    translation = new Matrix4().makeTranslation(0, 200, 0);
    rotation = new Matrix4().makeRotationX(90);
    TopGeometry = new WebGLGeometryQuad(gl, phongShaderProgram);
    TopGeometry.create(loadedAssets.crackedMudImage);
    TopGeometry.worldMatrix.makeIdentity().multiply(translation);
    TopGeometry.worldMatrix.multiply(rotation).multiply(scale);

    translation = new Matrix4().makeTranslation(-200, 0, 0);
    rotation = new Matrix4().makeRotationY(90);

    leftGeometry = new WebGLGeometryQuad(gl, phongShaderProgram);
    leftGeometry.create(loadedAssets.crackedMudImage);
    leftGeometry.worldMatrix.makeIdentity().multiply(translation);
    leftGeometry.worldMatrix.multiply(rotation).multiply(scale);

    translation = new Matrix4().makeTranslation(200, 0, 0);
    rotation = new Matrix4().makeRotationY(-90);

    rightGeometry = new WebGLGeometryQuad(gl, phongShaderProgram);
    rightGeometry.create(loadedAssets.crackedMudImage);
    rightGeometry.worldMatrix.makeIdentity().multiply(translation);
    rightGeometry.worldMatrix.multiply(rotation).multiply(scale);

    translation = new Matrix4().makeTranslation(0, 0, -200);
    rotation = new Matrix4().makeRotationY(0);

    frontGeometry = new WebGLGeometryQuad(gl, phongShaderProgram);
    frontGeometry.create(loadedAssets.crackedMudImage);
    frontGeometry.worldMatrix.makeIdentity().multiply(translation);
    frontGeometry.worldMatrix.multiply(rotation).multiply(scale);

    translation = new Matrix4().makeTranslation(0, 0, 200);
    rotation = new Matrix4().makeRotationY(180);

    backGeometry = new WebGLGeometryQuad(gl, phongShaderProgram);
    backGeometry.create(loadedAssets.crackedMudImage);
    backGeometry.worldMatrix.makeIdentity().multiply(translation);
    backGeometry.worldMatrix.multiply(rotation).multiply(scale);
    //#endregion

    //#region Sphere

    earthGeometry = new WebGLGeometryJSON(gl, earthShaderProgram);
    earthGeometry.create(loadedAssets.sphereJSON, EarthAssets.earthImage, 1, EarthAssets.nightImage);

    // Scaled it down so that the diameter is 3

    // raise it by the radius to make it sit on the ground
    scale = new Matrix4().makeScale(0.03, 0.03, 0.03);
    translation = new Matrix4().makeTranslation(PlantPosition.Earth);

    earthGeometry.worldMatrix.makeIdentity();
    earthGeometry.worldMatrix.multiply(translation).multiply(scale);

    //Mercury
    translation = new Matrix4().makeTranslation(PlantPosition.Mercury);
    scale = new Matrix4().makeScale(0.015, 0.015, 0.015);

    mercuryGeometry = new WebGLGeometryJSON(gl, phongShaderProgram);
    mercuryGeometry.create(loadedAssets.sphereJSON, loadedAssets.mercuryImage);

    mercuryGeometry.worldMatrix.makeIdentity();
    mercuryGeometry.worldMatrix.multiply(translation).multiply(scale);

    //Venus
    translation = new Matrix4().makeTranslation(PlantPosition.Venus);
    scale = new Matrix4().makeScale(0.02, 0.02, 0.02);

    venusGeometry = new WebGLGeometryJSON(gl, phongShaderProgram);
    venusGeometry.create(loadedAssets.sphereJSON, loadedAssets.venusImage);

    venusGeometry.worldMatrix.makeIdentity().multiply(translation).multiply(scale);
    //Mars
    translation = new Matrix4().makeTranslation(PlantPosition.Mars);
    scale = new Matrix4().makeScale(0.023, 0.023, 0.023);

    marsGeometry = new WebGLGeometryJSON(gl, phongShaderProgram);
    marsGeometry.create(loadedAssets.sphereJSON, loadedAssets.marsImage);

    marsGeometry.worldMatrix.makeIdentity().multiply(translation).multiply(scale);
    //Jupiter
    translation = new Matrix4().makeTranslation(PlantPosition.Jupiter);
    scale = new Matrix4().makeScale(0.095, 0.095, 0.095);

    jupiterGeometry = new WebGLGeometryJSON(gl, phongShaderProgram);
    jupiterGeometry.create(loadedAssets.sphereJSON, loadedAssets.jupiterImage);

    jupiterGeometry.worldMatrix.makeIdentity().multiply(translation).multiply(scale);

    //Saturn
    translation = new Matrix4().makeTranslation(PlantPosition.Saturn);
    scale = new Matrix4().makeScale(0.065, 0.065, 0.065);

    saturnGeometry = new WebGLGeometryJSON(gl, phongShaderProgram);
    saturnGeometry.create(loadedAssets.sphereJSON, loadedAssets.saturnImage);

    saturnGeometry.worldMatrix.makeIdentity().multiply(translation).multiply(scale);

    //Uranus
    translation = new Matrix4().makeTranslation(PlantPosition.Uranus);
    scale = new Matrix4().makeScale(0.05, 0.05, 0.05);

    uranusGeometry = new WebGLGeometryJSON(gl, phongShaderProgram);
    uranusGeometry.create(loadedAssets.sphereJSON, loadedAssets.uranusImage);

    uranusGeometry.worldMatrix.makeIdentity().multiply(translation).multiply(scale);

    //Neptune
    translation = new Matrix4().makeTranslation(PlantPosition.Neptune);
    scale = new Matrix4().makeScale(0.048, 0.048, 0.048);

    neptuneGeometry = new WebGLGeometryJSON(gl, phongShaderProgram);
    neptuneGeometry.create(loadedAssets.sphereJSON, loadedAssets.neptuneImage);

    neptuneGeometry.worldMatrix.makeIdentity().multiply(translation).multiply(scale);

    //Moon
    translation = new Matrix4().makeTranslation(2, 0, 0);
    scale = new Matrix4().makeScale(0.015, 0.015, 0.015);
    moonGeometry = new WebGLGeometryJSON(gl, phongShaderProgram);
    moonGeometry.create(loadedAssets.sphereJSON, loadedAssets.moonImage);
    moonGeometry.worldMatrix.makeIdentity().multiply(translation).multiply(scale);

    //#endregion

    //#region Sun
    scale = new Matrix4().makeScale(0.2, 0.2, 0.2);
    translation = new Matrix4();

    sunGeometry = new WebGLGeometryJSON(gl, sunShaderProgram);
    sunGeometry.create(loadedAssets.sphereJSON, SunAssets.sunImage);

    sunGeometry.worldMatrix.makeIdentity().multiply(translation).multiply(scale);
    //#endregion

    //#region Cloud
    scale = new Matrix4().makeScale(0.0301, 0.0301, 0.0301);
    translation = new Matrix4().makeTranslation(PlantPosition.Earth);

    cloudGeometry = new WebGLGeometryJSON(gl, phongShaderProgram);
    cloudGeometry.create(loadedAssets.sphereJSON, cloudAssets.cloudImage);
    cloudGeometry.alpha = 0.3;
    cloudGeometry.worldMatrix.makeIdentity().multiply(translation).multiply(scale);
    //#endregion

    particleSystemGeometry = new WebGLGeometryParticles(gl, 1000);
    particleSystemGeometry.create(loadedAssets.particeImage);

    // raise it by the radius to make it sit on the ground
    particleSystemGeometry.worldMatrix.translate(0, 1, 0);
}

// -------------------------------------------------------------------------
function updateAndRender() {
    requestAnimationFrame(updateAndRender);

    var aspectRatio = gl.canvasWidth / gl.canvasHeight;

    if (earth) {
        camera.cameraTarget = PlantPosition.Earth;
    }
    if (sun) {
        camera.cameraTarget = new Vector3();
    }

    // todo #10
    // add keyboard controls for changing light direction here

    //#region LightControl 
    // var lightWorldMatrix = new Matrix4().makeTranslation(lightDirection);
    // if(appInput.a) // Rotation to left
    // {
    //     var RotationMatrix = new Matrix4().makeRotationY(-1.0);
    //     RotationMatrix.multiply(lightWorldMatrix);
    //     lightDirection = new Vector3(RotationMatrix.elements[3], RotationMatrix.elements[7], RotationMatrix.elements[11]);
    // }

    // if(appInput.d) //Rotation to Right
    // {
    //     var RotationMatrix = new Matrix4().makeRotationY(1.0);
    //     RotationMatrix.multiply(lightWorldMatrix);
    //     lightDirection = new Vector3(RotationMatrix.elements[3], RotationMatrix.elements[7], RotationMatrix.elements[11]);
    // }

    // if(appInput.w) // Rotation to forward
    // {
    //     var RotationMatrix = new Matrix4().makeRotationX(-1.0);
    //     RotationMatrix.multiply(lightWorldMatrix);
    //     lightDirection = new Vector3(RotationMatrix.elements[3], RotationMatrix.elements[7], RotationMatrix.elements[11]);
    // }

    // if(appInput.s) //Rotation to backwards
    // {
    //     var RotationMatrix = new Matrix4().makeRotationX(1.0);
    //     RotationMatrix.multiply(lightWorldMatrix);
    //     lightDirection = new Vector3(RotationMatrix.elements[3], RotationMatrix.elements[7], RotationMatrix.elements[11]);
    // }
    //#endregion

    //#region makeRotation
    //Mercury
    var RotationMatrix = new Matrix4().makeRotationY(time.deltaTime * -120);

    var AfterTransform = RotationMatrix.clone().multiply(mercuryGeometry.worldMatrix.clone().multiply(new Matrix4().makeRotationY(time.deltaTime * 100)));

    PlantPosition.Mercury = new Vector3(AfterTransform.elements[3], AfterTransform.elements[7], AfterTransform.elements[11]);
    mercuryGeometry.worldMatrix = AfterTransform;

    //Venus
    RotationMatrix = new Matrix4().makeRotationY(time.deltaTime * -90);
    AfterTransform = RotationMatrix.clone().multiply(venusGeometry.worldMatrix.clone().multiply(new Matrix4().makeRotationY(time.deltaTime * 90)));
    PlantPosition.Venus = new Vector3(AfterTransform.elements[3], AfterTransform.elements[7], AfterTransform.elements[11]);
    venusGeometry.worldMatrix = AfterTransform;

    //Earth
    RotationMatrix = new Matrix4().makeRotationY(time.deltaTime * -80);
    AfterTransform = RotationMatrix.clone().multiply(earthGeometry.worldMatrix.clone().multiply(new Matrix4().makeRotationY(time.deltaTime * -80)));
    PlantPosition.Earth = new Vector3(AfterTransform.elements[3], AfterTransform.elements[7], AfterTransform.elements[11]);
    earthGeometry.worldMatrix = AfterTransform;

    AfterTransform = RotationMatrix.clone().multiply(cloudGeometry.worldMatrix.clone().multiply(new Matrix4().makeRotationY(time.deltaTime * -80)));
    cloudGeometry.worldMatrix = AfterTransform;

    //Moon
    moonGeometry.worldMatrix = new Matrix4();
    MoonSelf = MoonSelf.clone().multiply(new Matrix4().makeRotationY(time.deltaTime * 90));

    RotationMatrix = new Matrix4().makeRotationY(MoonDegree);

    var MoonTransition = new Matrix4().makeTranslation(3, 0, 0);
    var MoonRotation = new Matrix4().makeRotationY(MoonDegree);
    MoonDegree = MoonDegree + time.deltaTime * 120;
    var EarthMatrix = new Matrix4().makeTranslation(PlantPosition.Earth);
    var moonMatrix = EarthMatrix.clone().multiply(MoonRotation.multiply(MoonTransition));
    moonGeometry.worldMatrix = moonMatrix;
    moonGeometry.worldMatrix = moonGeometry.worldMatrix.clone().multiply(new Matrix4().makeScale(0.015, 0.015, 0.015)).multiply(MoonSelf);
    PlantPosition.Moon = new Vector3(moonGeometry.worldMatrix.elements[3], moonGeometry.worldMatrix.elements[7], moonGeometry.worldMatrix.elements[11]);


    //Mars
    RotationMatrix = new Matrix4().makeRotationY(time.deltaTime * -45);
    AfterTransform = RotationMatrix.clone().multiply(marsGeometry.worldMatrix.clone().multiply(new Matrix4().makeRotationY(time.deltaTime * 70)));
    PlantPosition.Mars = new Vector3(AfterTransform.elements[3], AfterTransform.elements[7], AfterTransform.elements[11]);
    marsGeometry.worldMatrix = AfterTransform;

    RotationMatrix = new Matrix4().makeRotationY(time.deltaTime * -20);
    AfterTransform = RotationMatrix.clone().multiply(jupiterGeometry.worldMatrix.clone().multiply(new Matrix4().makeRotationY(time.deltaTime * 60)));
    PlantPosition.Jupiter = new Vector3(AfterTransform.elements[3], AfterTransform.elements[7], AfterTransform.elements[11]);
    jupiterGeometry.worldMatrix = AfterTransform;

    RotationMatrix = new Matrix4().makeRotationY(time.deltaTime * -18);
    AfterTransform = RotationMatrix.clone().multiply(saturnGeometry.worldMatrix.clone().multiply(new Matrix4().makeRotationY(time.deltaTime * 50)));
    PlantPosition.Saturn = new Vector3(AfterTransform.elements[3], AfterTransform.elements[7], AfterTransform.elements[11]);
    saturnGeometry.worldMatrix = AfterTransform;

    RotationMatrix = new Matrix4().makeRotationY(time.deltaTime * -10);
    AfterTransform = RotationMatrix.clone().multiply(uranusGeometry.worldMatrix.clone().multiply(new Matrix4().makeRotationY(time.deltaTime * 40)));
    PlantPosition.Uranus = new Vector3(AfterTransform.elements[3], AfterTransform.elements[7], AfterTransform.elements[11]);
    uranusGeometry.worldMatrix = AfterTransform;

    RotationMatrix = new Matrix4().makeRotationY(time.deltaTime * -3);
    AfterTransform = RotationMatrix.clone().multiply(neptuneGeometry.worldMatrix.clone().multiply(new Matrix4().makeRotationY(time.deltaTime * 30)));
    PlantPosition.Neptune = new Vector3(AfterTransform.elements[3], AfterTransform.elements[7], AfterTransform.elements[11]);
    neptuneGeometry.worldMatrix = AfterTransform;

    RotationMatrix = new Matrix4().makeRotationY(time.deltaTime * -25);
    AfterTransform = sunGeometry.worldMatrix.clone().multiply(RotationMatrix);
    sunGeometry.worldMatrix = AfterTransform;

    //#endregion

    var up = new Vector4(0, 1, 0, 0);
    var lightPosition = new Vector3();
    lightCamera.cameraWorldMatrix.makeLookAt(lightPosition, PlantPosition.Earth, up);

    time.update();
    camera.update(time.deltaTime);

    //#region shadow
    // specify what portion of the canvas we want to draw to (all of it, full width and height)
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
    gl.bindRenderbuffer(gl.RENDERBUFFER, renderBuffer);

    gl.clearColor(0, 1, 0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    gl.viewport(0, 0, fbo.width, fbo.height);
    shadowProjectionMatrix.makeOrthographic(-8, 8, 8, -8, 2, 40);

    gl.disable(gl.CULL_FACE);
    earthGeometry.render(lightCamera, shadowProjectionMatrix, depthWriteProgram);
    moonGeometry.render(lightCamera, shadowProjectionMatrix, depthWriteProgram);
    //#endregion


    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.bindRenderbuffer(gl.RENDERBUFFER, null);

    gl.viewport(0, 0, gl.canvasWidth, gl.canvasHeight);

    // this is a new frame so let's clear out whatever happened last frame
    gl.clearColor(0.707, 0.707, 1, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);


    
    gl.useProgram(phongShaderProgram);

    var uniforms = phongShaderProgram.uniforms;
    var cameraPosition = camera.getPosition();

    var lightVPMatrix = shadowProjectionMatrix.clone().multiply(lightCamera.getViewMatrix());

    gl.uniform3f(uniforms.earthPositionUniform, PlantPosition.Earth.x, PlantPosition.Earth.y, PlantPosition.Earth.z);
    gl.uniform3f(uniforms.moonPositionUniform, PlantPosition.Moon.x, PlantPosition.Moon.y, PlantPosition.Moon.z);
    gl.uniform3f(uniforms.lightDirectionUniform, lightDirection.x, lightDirection.y, lightDirection.z);
    gl.uniform3f(uniforms.cameraPositionUniform, cameraPosition.x, cameraPosition.y, cameraPosition.z);
    gl.uniformMatrix4fv(uniforms.lightVPMatrixUniform, false, lightVPMatrix.transpose().elements);

    //#region render
    gl.enable(gl.CULL_FACE);
    gl.enable(gl.BLEND);


    gl.blendFunc(gl.DST_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    //set blend mode source to gl.SRC_ALPHA and destination to gl.ONE_MINUS_SRC_ALPHA

    projectionMatrix.makePerspective(45, aspectRatio, 0.1, 1000);

    sunGeometry.render(camera, projectionMatrix, sunShaderProgram);
    mercuryGeometry.render(camera, projectionMatrix, phongShaderProgram);
    venusGeometry.render(camera, projectionMatrix, phongShaderProgram);
    marsGeometry.render(camera, projectionMatrix, phongShaderProgram);
    jupiterGeometry.render(camera, projectionMatrix, phongShaderProgram);
    saturnGeometry.render(camera, projectionMatrix, phongShaderProgram);
    uranusGeometry.render(camera, projectionMatrix, phongShaderProgram);
    neptuneGeometry.render(camera, projectionMatrix, phongShaderProgram);
    groundGeometry.render(camera, projectionMatrix, phongShaderProgram);
    TopGeometry.render(camera, projectionMatrix, phongShaderProgram);
    leftGeometry.render(camera, projectionMatrix, phongShaderProgram);
    rightGeometry.render(camera, projectionMatrix, phongShaderProgram);
    frontGeometry.render(camera, projectionMatrix, phongShaderProgram);
    backGeometry.render(camera, projectionMatrix, phongShaderProgram);
    moonGeometry.render(camera, projectionMatrix, earthShaderProgram, renderTexture);
    earthGeometry.render(camera, projectionMatrix, earthShaderProgram, renderTexture);
    cloudGeometry.render(camera, projectionMatrix, earthShaderProgram, renderTexture);

    // gl.useProgram(particleProgram);
    // gl.uniform4f(particleProgram.uniforms.colorUniform, 1.0, 1.0, 0.5, 1.0);
    // particleSystemGeometry.update(time.deltaTime, time.secondsElapsedSinceStart);
    // particleSystemGeometry.render(camera, projectionMatrix, particleProgram);

    gl.disable(gl.BLEND)
    //#endregion
}

function GoToEarth() {
    earth = true;
    sun = false;

}

function GoToSun() {
    earth = false;
    sun = true;
}

// EOF 00100001-10