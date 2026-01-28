/**
 * Default Vertex Shader for p5.js WebGL sketches
 * Passes through position and texture coordinates
 */
attribute vec3 aPosition;
attribute vec2 aTexCoord;

varying vec2 vTexCoord;

void main() {
  // Copy texture coordinates
  vTexCoord = aTexCoord;

  // Convert from p5.js coordinate space to clip space
  // p5.js uses origin at top-left, WebGL uses -1 to 1
  vec4 positionVec4 = vec4(aPosition, 1.0);
  positionVec4.xy = positionVec4.xy * 2.0 - 1.0;

  gl_Position = positionVec4;
}
