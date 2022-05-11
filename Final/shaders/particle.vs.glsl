precision mediump float;

attribute vec3 aVertexPosition;
attribute vec4 aVertexColor;

uniform mat4 uWorldMatrix;
uniform mat4 uViewMatrix;
uniform mat4 uProjectionMatrix;

varying vec4 vColor;

void main(void) {
    // vec3 billboardPosition = aVertexPosition.x * uCameraRight + aVertexPosition.y * uCameraUp;
    // gl_Position = uProjectionMatrix * uViewMatrix * uWorldMatrix * vec4(billboardPosition, 1.0);
    gl_Position = uProjectionMatrix * uViewMatrix * uWorldMatrix * vec4(aVertexPosition, 1.0);

    // Hardcoded for simplicity
    gl_PointSize = 630.0 / gl_Position.w;

    vColor = aVertexColor;
}