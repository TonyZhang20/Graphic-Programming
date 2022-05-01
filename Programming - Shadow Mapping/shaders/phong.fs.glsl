precision mediump float;

uniform sampler2D uAlbedoTexture;
uniform sampler2D uShadowTexture;
uniform vec2 uShadowTexture_size;
uniform mat4 uLightVPMatrix;
uniform vec3 uDirectionToLight;
uniform vec3 uCameraPosition;

varying vec2 vTexCoords;
varying vec3 vWorldNormal;
varying vec3 vWorldPosition;

float offset_lookup(sampler2D map, vec2 offset, vec2 UV, vec2 texelSize, float lightDepth, float bias) {
  return (texture2D(map, UV + offset * vTexCoords * texelSize).r + bias) < lightDepth ? 0.0 : 1.0;
}

void main(void) {
  vec3 worldNormal01 = normalize(vWorldNormal);
  vec3 directionToEye01 = normalize(uCameraPosition - vWorldPosition);
  vec3 reflection01 = 2.0 * dot(worldNormal01, uDirectionToLight) * worldNormal01 - uDirectionToLight;

  float lambert = max(dot(worldNormal01, uDirectionToLight), 0.0);
  float specularIntensity = pow(max(dot(reflection01, directionToEye01), 0.0), 64.0);

  vec4 texColor = texture2D(uAlbedoTexture, vTexCoords);

  // todo #4 sample a color from the shadow texture using vTexCoords and visualize the result

  vec3 ambient = vec3(0.2, 0.2, 0.2) * texColor.rgb;
  vec3 diffuseColor = texColor.rgb * lambert;
  vec3 specularColor = vec3(1.0, 1.0, 1.0) * specularIntensity;
  vec3 finalColor = ambient + diffuseColor + specularColor;

  // todo #5
  // transform the world position into the lights clip space (clip space and NDC will be the same for orthographic projection) 
  vec4 lightSpaceNDC = uLightVPMatrix * vec4(vWorldPosition, 1.0);

  float lightSpaceUVx = (1.0 + lightSpaceNDC.x) / 2.0;
  float lightSpaceUVy = (1.0 + lightSpaceNDC.y) / 2.0;

  // scale and bias the light-space NDC xy coordinates from [-1, 1] to [0, 1]
  vec2 lightSpaceUV = vec2(lightSpaceUVx, lightSpaceUVy);

  // todo #6
  // Sample from the shadow map texture using the previously calculated lightSpaceUV
  vec4 shadowColor = texture2D(uShadowTexture, lightSpaceUV);

  // todo #7 scale and bias the light-space NDC z coordinate from [-1, 1] to [0, 1]
  float lightDepth = (1.0 + lightSpaceNDC.z) / 2.0;

  // use this as part of todo #10
  float bias = 0.004;

  float dotLightNormal = dot(worldNormal01, directionToEye01);

  bias = max(0.05 * (1.0 - dotLightNormal), bias);

  //PCF
  float sum = 0.0;
  vec2 texelSize = vec2(1.0 / vec2(2048.0, 2048.0));
  for(float x = -1.5; x <= 1.5; x += 1.0) {
    for(float y = -1.5; y <= 1.5; y += 1.0) {
      sum += offset_lookup(uShadowTexture, vec2(x, y), lightSpaceUV, texelSize, lightDepth, bias);
    }
  }
  sum = sum / 9.0;

  vec2 offset;
  if(float(fract(lightSpaceUV.xy * 0.5)) > 0.25) 
  {
    offset = fract(lightSpaceUV.xy * 0.5);
  }// mod 
  
  offset.y += offset.x;  // y ^= x in floating point 

  //texture2D(map, vec2(loc.xy + offset * 0.5 * loc.w, loc.z, loc.w))

  if(offset.y > 1.1)
    offset.y = 0.0;
  float shadowCoeff = (offset_lookup(uShadowTexture, offset + vec2(-1.5, 0.5), lightSpaceUV, texelSize, lightDepth, bias) 
  + offset_lookup(uShadowTexture, offset + vec2(0.5, 0.5), lightSpaceUV, texelSize, lightDepth, bias) 
  + offset_lookup(uShadowTexture, offset + vec2(-1.5, -1.5), lightSpaceUV, texelSize, lightDepth, bias) 
  + offset_lookup(uShadowTexture, offset + vec2(0.5, -1.5), lightSpaceUV, texelSize, lightDepth, bias)) * 0.25;

  if(lightDepth > shadowColor.z + shadowCoeff) {
    gl_FragColor = vec4(ambient, 1.0);
  } else {
    gl_FragColor = vec4(finalColor, 1.0);
  }

  if(lightDepth > shadowColor.z + sum) {
    gl_FragColor = vec4(ambient, 1.0);
  } else {
    gl_FragColor = vec4(finalColor, 1.0);
  }

}

// EOF 00100001-10