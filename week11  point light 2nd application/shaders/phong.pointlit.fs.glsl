precision mediump float;

uniform vec3 uLightPosition;
uniform vec3 uCameraPosition;
uniform sampler2D uTexture;

varying vec2 vTexcoords;
varying vec3 vWorldNormal;
varying vec3 vWorldPosition;

void main(void) {
    // diffuse contribution
    // todo #1 normalize the light direction and store in a separate variable
    vec3 dLight = normalize(uLightPosition - vWorldPosition);
    // todo #2 normalize the world normal and store in a separate variable
    vec3 WorldNormal_normalize = normalize(vWorldNormal);
    // todo #3 calculate the lambert term
    // dot(A,B) = cos(angle(A,B)) , because we normalize the a and b
    float lambert = max(0.0, dot(dLight, WorldNormal_normalize));

    // specular contribution
    // todo #4 in world space, calculate the direction from the surface point to the eye (normalized)
    // to - from
    vec3 dSurfaceToEye = normalize(uCameraPosition - vWorldPosition);

    // todo #5 in world space, calculate the reflection vector (normalized)
    //r = -L + 2 * (L · nhat) * nhat?
    //L · nhat = lambert
    //L = dSurfaceToEye
    vec3 reflection = normalize(dLight * -1.0 + 2.0 * WorldNormal_normalize * lambert);
    
    // todo #6 calculate the phong term
    float phong = max(0.0 , dot(reflection , dSurfaceToEye));
    phong = pow(phong, 64.0);

    // combine
    // todo #7 apply light and material interaction for diffuse value by using the texture color as the material
    // todo #8 apply light and material interaction for phong, assume phong material color is (0.3, 0.3, 0.3)

    vec3 albedo = texture2D(uTexture, vTexcoords).rgb;

    vec3 ambient = albedo * 0.1;
    vec3 diffuseColor =  vec3(1,1,1) * albedo * lambert;
    vec3 specularColor = phong * vec3(0.3,0.3,0.3) * albedo;

    // todo #9
    // add "diffuseColor" and "specularColor" when ready
    vec3 finalColor = ambient + diffuseColor + specularColor;

    gl_FragColor = vec4(finalColor, 1.0);
}

// EOF 00100001-10