precision mediump float;

attribute vec3 aVertexPosition;
attribute vec2 aTexcoords;
attribute vec2 aMyTexcoords;

uniform mat4 uWorldMatrix;
uniform mat4 uViewMatrix;
uniform mat4 uProjectionMatrix;

uniform float uTime;

// todo #2 - make sure to pass texture coordinates for interpolation to fragment shader (varying)
// 1. Declare the variable correctly, 
varying vec2 vTexcoords;
varying vec2 vMyTexcoords;
// 2. Set it correctly inside main

void main(void) {
    vMyTexcoords = vec2(aMyTexcoords.x, aMyTexcoords.y * cos(uTime));
    vTexcoords = vec2(aTexcoords.x * tan(uTime * 0.3), aTexcoords.y);
    gl_Position = uProjectionMatrix * uViewMatrix * uWorldMatrix * vec4(aVertexPosition, 1.0);
}

// EOF 00100001-10