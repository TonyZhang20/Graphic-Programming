precision mediump float;

uniform sampler2D uTexture;
uniform sampler2D uShadowTexture;
uniform mat4 uLightVPMatrix;
uniform vec3 uCameraPosition;

varying vec2 vTexcoords;
varying vec3 vWorldNormal;
varying vec3 vWorldPosition;

uniform float uAlpha;

float offset_lookup(sampler2D map, vec2 offset, vec2 UV, vec2 texelSize, float lightDepth, float bias) {
    return (texture2D(map, UV + offset * vTexcoords * texelSize).r + bias) < lightDepth ? 0.0 : 1.0;
}

void main(void) {

    vec3 WorldNormal_normalize = normalize(vWorldNormal);
    vec3 dLight = normalize(vec3(0.0, 0.0, 0.0) - vWorldPosition);

    float lambert = max(0.0, dot(dLight, WorldNormal_normalize));

    vec3 dSurfaceToEye = normalize(uCameraPosition - vWorldPosition);

    vec3 reflection = 2.0 * dot(WorldNormal_normalize, dLight) * WorldNormal_normalize - dLight;

    float phong = max(0.0, dot(reflection, dSurfaceToEye));
    phong = pow(phong, 64.0);

    vec3 albedo = texture2D(uTexture, vTexcoords).rgb;

    vec3 ambient = albedo * 0.2;
    vec3 diffuseColor = albedo * lambert;
    vec3 specularColor = phong * vec3(0.3,0.3,0.3) * albedo;

    // todo #9
    // add "diffuseColor" and "specularColor" when ready
    vec3 finalColor = ambient + diffuseColor + specularColor;

    vec4 lightSpaceNDC = uLightVPMatrix * vec4(vWorldPosition, 1.0);

    vec2 lightSpaceUV = vec2((1.0 + lightSpaceNDC.x) / 2.0, (1.0 + lightSpaceNDC.y) / 2.0);
    vec4 shadowColor = texture2D(uShadowTexture, lightSpaceUV);
    float lightDepth = (1.0 + lightSpaceNDC.z) / 2.0;

    float bias = 0.004;
    float dotLightNormal = dot(normalize(vWorldNormal), normalize(uCameraPosition - vWorldPosition));

    bias = max(0.05 * (1.0 - dotLightNormal), bias);

    float sum = 0.0;
    
    vec2 texelSize = vec2(1.0 / vec2(2048.0, 2048.0));
    for(float x = -1.5; x <= 1.5; x += 1.0) {
        for(float y = -1.5; y <= 1.5; y += 1.0) {
            sum += offset_lookup(uShadowTexture, vec2(x, y), lightSpaceUV, texelSize, lightDepth, bias);
        }
    }
    sum = sum / 9.0;

    if(lightDepth > shadowColor.z + sum) {
        gl_FragColor = vec4(ambient, 1.0);
    } else {
        gl_FragColor = vec4(finalColor, 1.0);
    }

    gl_FragColor = vec4(finalColor, uAlpha);

}

// EOF 00100001-10