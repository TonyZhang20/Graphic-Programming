attribute vec3 aVertexPosition;

uniform mat4 uWorldMatrix;
uniform mat4 uViewMatrix;
uniform mat4 uProjectionMatrix;

varying float vDepth;

void main(void) 
{
    gl_Position = uProjectionMatrix * uViewMatrix * uWorldMatrix * vec4(aVertexPosition, 1.0);

    vDepth = gl_Position.z / gl_Position.w;

    vDepth = (1.0 + vDepth) / 2.0;
}