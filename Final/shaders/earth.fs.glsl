precision mediump float;

uniform sampler2D uTexture;
uniform sampler2D uNightTexture;
uniform sampler2D uShadowTexture;

uniform vec3 uCameraPosition;
uniform mat4 uLightVPMatrix;

varying vec2 vTexcoords;
varying vec3 vWorldNormal;
varying vec3 vWorldPosition;

uniform float uAlpha;

void main(void) {

    vec3 WorldNormal_normalize = normalize(vWorldNormal);
    vec3 dLight = normalize(vec3(0.0, 0.0, 0.0) - vWorldPosition);

    float lambert = max(0.0, dot(dLight, WorldNormal_normalize));

    vec3 dSurfaceToEye = normalize(uCameraPosition - vWorldPosition);

    vec3 reflection = 2.0 * dot(WorldNormal_normalize, dLight) * WorldNormal_normalize - dLight;

    float phong = max(0.0, dot(reflection, dSurfaceToEye));
    phong = pow(phong, 64.0);

    vec3 albedo = texture2D(uTexture, vTexcoords).rgb;
    vec3 nightColor = texture2D(uNightTexture, vTexcoords).rgb;

    vec3 Color = albedo;
    if(dot(vWorldNormal, dLight) < 0.0) 
    {
        Color = nightColor * 5.0;
    }

    if(Color == vec3(0.0, 0.0, 0.0)) 
    {
        Color = albedo;
    }

    vec3 ambient = Color * 0.2;
    vec3 diffuseColor = Color * lambert;
    vec3 specularColor = phong * vec3(0.3, 0.3, 0.3) * Color;

    vec3 finalColor = ambient + diffuseColor + specularColor;

    gl_FragColor = vec4(finalColor, uAlpha);

}

// EOF 00100001-10