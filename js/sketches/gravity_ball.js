/*
 *
 * Ball that follows your cursor around the screen
 *
 */

var gravityBall = function (p) {
  var center = p.createVector(
    p.windowWidth / 2,
    (p.windowHeight - footerHeight) / 2
  ); // (width, height)
  var bounds = p.createVector(p.windowWidth, p.windowHeight);
  var topSpeed = 20;
  var ball;
  var _keyAccel = p.createVector(10.0, 10.0);

  function Ball() {
    this.acceleration = p.createVector(0, 0);
    this.location = p.createVector(center.x, center.y);
    this.time = p.createVector(p.random(-10, 10), p.random(-10, 10));
    this.velocity = p.createVector(0, 0);
  }

  Ball.prototype.update = function () {
    var mouse = p.createVector(p.mouseX, p.mouseY);
    var direction = p5.Vector.sub(mouse, this.location);

    direction.normalize();
    direction.mult(0.5);
    direction.div(Math.pow(direction.mag(), 2)); // divide it by the distance squared so it has some gravity
    this.acceleration = direction;

    this.velocity.add(this.acceleration);
    this.velocity.limit(topSpeed);
    this.location.add(this.velocity);
  };

  Ball.prototype.checkEdges = function () {
    if (this.location.x > p.windowWidth) {
      this.location.x = 0;
    } else if (this.location.x < 0) {
      this.location.x = p.windowWidth;
    }

    if (this.location.y > p.windowHeight) {
      this.location.y = 0;
    } else if (this.location.y < 0) {
      this.location.y = p.windowHeight;
    }
  };

  Ball.prototype.display = function () {
    p.stroke(0);
    p.fill(175);
    // The Mover is displayed.
    p.ellipse(this.location.x, this.location.y, 16, 16);
  };

  /*
   *
   * Setup
   *
   */
  p.preload = function () {};

  p.setup = function () {
    p.createCanvas(p.windowWidth, p.windowHeight);
    ball = new Ball();
  };

  /*
   *
   * Drawing & Dynamics
   *
   */

  p.draw = function () {
    p.background(255);
    ball.update();
    ball.checkEdges();
    ball.display();
  };

  p.windowResized = function () {
    p.resizeCanvas(p.windowWidth, p.windowHeight);
    center.set(p.windowWidth / 2, (p.windowHeight - footerHeight) / 2);
  };

  p.keyPressed = function () {
    if (p.keyCode == p.UP_ARROW) {
      ball.velocity.add(_keyAccel);
      // ball.location.add(ball.velocity);
    } else if (p.keyCode == p.DOWN_ARROW) {
      ball.velocity.sub(_keyAccel);
      // ball.location.sub(ball.velocity);
    }
  };
};
