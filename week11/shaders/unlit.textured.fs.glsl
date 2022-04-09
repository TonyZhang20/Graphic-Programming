precision mediump float;

uniform sampler2D uTexture;
uniform sampler2D uMyTexture;

uniform float uAlpha;
uniform float uTime;

// todo #3 - receive texture coordinates and verify correctness by 
varying vec2 vTexcoords;
// using them to set the pixel color 


void main(void) {
    // todo #5
    // todo #3
    vec4 texture = texture2D(uTexture, vTexcoords);

    vec4 texture2 = texture2D(uMyTexture, vTexcoords);

    vec4 finalColor = (texture + texture2) * 0.5;

    gl_FragColor = vec4(finalColor.xyz, uAlpha);
}

// EOF 00100001-10
