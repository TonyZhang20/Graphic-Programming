precision mediump float;

uniform sampler2D uTexture;
uniform sampler2D uMyTexture;
uniform float uAlpha;
uniform float uTime;

// todo #3 - receive texture coordinates and verify correctness by 
varying vec2 vTexcoords;
varying vec2 vMyTexcoords;
// using them to set the pixel color 

void main(void) {
    // todo #5
    // todo #3
    float finalColorX = (vTexcoords.x + vMyTexcoords.x) * 0.5;
    float finalColorY = (vTexcoords.y + vMyTexcoords.y) * 0.5;
    vec2 finalColor = vec2(finalColorX, finalColorY);

    vec4 texture =texture2D(uTexture, finalColor);

    gl_FragColor = vec4(texture.x, texture.y, texture.z , uAlpha);

    //gl_FragColor = vec4(vMyTexcoords.x, vMyTexcoords.y, 0.0, uAlpha);
}

// EOF 00100001-10
