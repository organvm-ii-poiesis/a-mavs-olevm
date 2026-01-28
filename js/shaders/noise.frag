/**
 * Procedural Noise Fragment Shader
 * Creates animated noise patterns for visual effects
 *
 * Uniforms:
 *   uResolution - Canvas resolution (width, height)
 *   uTime - Animation time in seconds
 *   uScale - Noise scale factor (default: 5.0)
 *   uSpeed - Animation speed (default: 1.0)
 *   uColor1 - First gradient color (vec3)
 *   uColor2 - Second gradient color (vec3)
 */

#ifdef GL_ES
precision mediump float;
#endif

uniform vec2 uResolution;
uniform float uTime;
uniform float uScale;
uniform float uSpeed;
uniform vec3 uColor1;
uniform vec3 uColor2;

varying vec2 vTexCoord;

// Classic Perlin-style random
vec2 random2(vec2 p) {
  return fract(sin(vec2(
    dot(p, vec2(127.1, 311.7)),
    dot(p, vec2(269.5, 183.3))
  )) * 43758.5453);
}

// Cellular/Worley noise
float cellularNoise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);

  float minDist = 1.0;

  for (int y = -1; y <= 1; y++) {
    for (int x = -1; x <= 1; x++) {
      vec2 neighbor = vec2(float(x), float(y));
      vec2 point = random2(i + neighbor);

      // Animate the points
      point = 0.5 + 0.5 * sin(uTime * uSpeed + 6.2831 * point);

      vec2 diff = neighbor + point - f;
      float dist = length(diff);
      minDist = min(minDist, dist);
    }
  }

  return minDist;
}

// FBM (Fractal Brownian Motion)
float fbm(vec2 p) {
  float value = 0.0;
  float amplitude = 0.5;
  float frequency = 1.0;

  for (int i = 0; i < 5; i++) {
    value += amplitude * cellularNoise(p * frequency);
    frequency *= 2.0;
    amplitude *= 0.5;
  }

  return value;
}

void main() {
  vec2 uv = vTexCoord;

  // Apply scale
  vec2 scaledUV = uv * uScale;

  // Get noise value with time animation
  float n = fbm(scaledUV + uTime * uSpeed * 0.1);

  // Create gradient between two colors based on noise
  vec3 color = mix(uColor1, uColor2, n);

  // Add some variation
  float edge = smoothstep(0.3, 0.5, n);
  color += vec3(edge * 0.1);

  gl_FragColor = vec4(color, 1.0);
}
