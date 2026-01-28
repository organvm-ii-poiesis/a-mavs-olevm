/**
 * Glow/Bloom Fragment Shader
 * Applies a soft glow effect based on luminosity
 *
 * Uniforms:
 *   uTexture - Input texture to apply glow to
 *   uResolution - Canvas resolution (width, height)
 *   uIntensity - Glow intensity (0.0 - 2.0 recommended)
 *   uThreshold - Luminosity threshold for glow (0.0 - 1.0)
 */

#ifdef GL_ES
precision mediump float;
#endif

uniform sampler2D uTexture;
uniform vec2 uResolution;
uniform float uIntensity;
uniform float uThreshold;

varying vec2 vTexCoord;

// Calculate luminance of a color
float luminance(vec3 color) {
  return dot(color, vec3(0.299, 0.587, 0.114));
}

void main() {
  vec2 texelSize = 1.0 / uResolution;
  vec4 originalColor = texture2D(uTexture, vTexCoord);

  // Gaussian blur kernel weights (5x5 approximation)
  float weights[5];
  weights[0] = 0.227027;
  weights[1] = 0.1945946;
  weights[2] = 0.1216216;
  weights[3] = 0.054054;
  weights[4] = 0.016216;

  vec3 blurredColor = vec3(0.0);
  float blurAmount = uIntensity * 0.01;

  // Horizontal blur
  for (int i = -4; i <= 4; i++) {
    vec2 offset = vec2(float(i) * blurAmount, 0.0);
    vec4 sample = texture2D(uTexture, vTexCoord + offset);

    // Only bloom bright areas
    float lum = luminance(sample.rgb);
    if (lum > uThreshold) {
      float weight = weights[abs(i)];
      blurredColor += sample.rgb * weight;
    }
  }

  // Vertical blur
  vec3 verticalBlur = vec3(0.0);
  for (int i = -4; i <= 4; i++) {
    vec2 offset = vec2(0.0, float(i) * blurAmount);
    vec4 sample = texture2D(uTexture, vTexCoord + offset);

    float lum = luminance(sample.rgb);
    if (lum > uThreshold) {
      float weight = weights[abs(i)];
      verticalBlur += sample.rgb * weight;
    }
  }

  // Combine blurs
  vec3 bloom = (blurredColor + verticalBlur) * 0.5;

  // Add bloom to original color
  vec3 finalColor = originalColor.rgb + bloom * uIntensity;

  // Tone mapping to prevent oversaturation
  finalColor = finalColor / (finalColor + vec3(1.0));

  gl_FragColor = vec4(finalColor, originalColor.a);
}
