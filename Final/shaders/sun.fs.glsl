precision mediump float;

uniform sampler2D uTexture;
varying vec2 vTexcoords;
uniform float uTime;

void main(void)
{
    vec3 finalColor = texture2D(uTexture, vTexcoords).xyz;
    gl_FragColor = vec4(finalColor.x, finalColor.y, finalColor.z, 1.0);
}