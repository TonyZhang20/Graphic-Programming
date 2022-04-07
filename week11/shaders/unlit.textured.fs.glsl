precision mediump float;

uniform sampler2D uTexture;
uniform float uAlpha;

// todo #3 - receive texture coordinates and verify correctness by 
varying vec2 vTexcoords;
// using them to set the pixel color 

void main(void) {
    // todo #5
    // todo #3
    //gl_FragColor = vec4(vTexcoords.x, vTexcoords.y, 0.0, uAlpha);
    gl_FragColor = texture2D(uTexture, vTexcoords, uAlpha);
}

// EOF 00100001-10
