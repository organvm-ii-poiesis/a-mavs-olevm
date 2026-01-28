/**
 * Audio-Reactive Fragment Shader
 * Creates visual patterns that respond to audio frequency bands
 *
 * Uniforms:
 *   uResolution - Canvas resolution (width, height)
 *   uTime - Animation time in seconds
 *   uBass - Bass frequency band (0.0 - 1.0)
 *   uMid - Mid frequency band (0.0 - 1.0)
 *   uTreble - Treble frequency band (0.0 - 1.0)
 */

#ifdef GL_ES
precision mediump float;
#endif

uniform vec2 uResolution;
uniform float uTime;
uniform float uBass;
uniform float uMid;
uniform float uTreble;

varying vec2 vTexCoord;

// Smooth noise function
float noise(vec2 p) {
  return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
}

// Smooth interpolated noise
float smoothNoise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);

  float a = noise(i);
  float b = noise(i + vec2(1.0, 0.0));
  float c = noise(i + vec2(0.0, 1.0));
  float d = noise(i + vec2(1.0, 1.0));

  vec2 u = f * f * (3.0 - 2.0 * f);

  return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
}

void main() {
  // Normalize coordinates to 0-1 range
  vec2 uv = vTexCoord;
  vec2 center = uv - 0.5;

  // Distance from center
  float dist = length(center);

  // Create animated rings based on audio
  float bassRing = sin(dist * 20.0 - uTime * 2.0 + uBass * 6.28) * 0.5 + 0.5;
  float midRing = sin(dist * 15.0 - uTime * 1.5 + uMid * 6.28) * 0.5 + 0.5;
  float trebleRing = sin(dist * 25.0 - uTime * 3.0 + uTreble * 6.28) * 0.5 + 0.5;

  // Noise-based distortion modulated by audio
  float noiseVal = smoothNoise(uv * 5.0 + uTime * 0.2);
  float audioNoise = noiseVal * (uBass + uMid + uTreble) * 0.3;

  // Color channels driven by different frequency bands
  float r = bassRing * (0.5 + uBass * 0.5) + audioNoise;
  float g = midRing * (0.3 + uMid * 0.7) + audioNoise * 0.5;
  float b = trebleRing * (0.4 + uTreble * 0.6) + audioNoise * 0.7;

  // Add vignette effect
  float vignette = 1.0 - dist * 1.2;
  vignette = clamp(vignette, 0.0, 1.0);

  // Radial gradient overlay
  vec3 color = vec3(r, g, b) * vignette;

  // Add subtle glow effect based on total audio energy
  float totalEnergy = (uBass + uMid + uTreble) / 3.0;
  color += vec3(0.1, 0.05, 0.15) * totalEnergy * (1.0 - dist * 2.0);

  gl_FragColor = vec4(color, 1.0);
}
