/**
 * Feedback Loop Fragment Shader
 * Creates visual feedback effects by blending current and previous frames
 *
 * Uniforms:
 *   uTexture - Current frame texture
 *   uPreviousFrame - Previous frame texture
 *   uResolution - Canvas resolution (width, height)
 *   uFeedback - Feedback amount (0.0 - 0.99)
 *   uZoom - Zoom factor per frame (0.99 - 1.01)
 *   uRotation - Rotation amount per frame in radians
 *   uOffset - XY offset per frame
 */

#ifdef GL_ES
precision mediump float;
#endif

uniform sampler2D uTexture;
uniform sampler2D uPreviousFrame;
uniform vec2 uResolution;
uniform float uFeedback;
uniform float uZoom;
uniform float uRotation;
uniform vec2 uOffset;

varying vec2 vTexCoord;

// Rotate UV coordinates around center
vec2 rotate(vec2 uv, float angle) {
  vec2 center = vec2(0.5);
  uv -= center;
  float s = sin(angle);
  float c = cos(angle);
  uv = vec2(uv.x * c - uv.y * s, uv.x * s + uv.y * c);
  uv += center;
  return uv;
}

// Zoom UV coordinates toward center
vec2 zoom(vec2 uv, float factor) {
  vec2 center = vec2(0.5);
  uv -= center;
  uv *= factor;
  uv += center;
  return uv;
}

void main() {
  // Get current frame color
  vec4 currentColor = texture2D(uTexture, vTexCoord);

  // Transform UV for previous frame sampling
  vec2 transformedUV = vTexCoord;
  transformedUV = zoom(transformedUV, uZoom);
  transformedUV = rotate(transformedUV, uRotation);
  transformedUV += uOffset;

  // Clamp to prevent wrapping artifacts
  transformedUV = clamp(transformedUV, 0.0, 1.0);

  // Get previous frame color with transformations
  vec4 previousColor = texture2D(uPreviousFrame, transformedUV);

  // Blend current with feedback from previous
  vec4 finalColor = currentColor + previousColor * uFeedback;

  // Subtle color shift for psychedelic effect
  finalColor.rgb = vec3(
    finalColor.r * 0.99,
    finalColor.g * 0.995,
    finalColor.b * 1.005
  );

  // Prevent color accumulation from going too bright
  finalColor = clamp(finalColor, 0.0, 1.0);

  gl_FragColor = finalColor;
}
