var infoCanvas = function (p) {
  var cnv;
  var forces = {};
  var lines = [];
  var totalLines = 60;

  function Line() {
    this.location = [
      p.createVector(p.random(0, 200), p.random(0, 200)),
      p.createVector(100, 100),
    ];
    this.velocity = p.createVector(0, 0);
    this.acceleration = p.createVector(0, 0);
    this.dimensions = p.createVector(30, 30);
    this.mass = p.random(5, 10);
    var lineObj = this;
    this.forces = {
      wind: p.createVector(0.2, 0),
      gravity: p.createVector(0, 0.3 * this.mass),
      friction: p.createVector(0, 0),
    };
  }

  Line.prototype.calcFriction = function () {
    var c = 1; // coefficient of friction
    var normal = 1; // normal force
    var friction = this.velocity.copy().normalize().mult(-1); // velocity normalized
    friction.mult(normal * c);
    this.forces.friction = friction;
  };

  Line.prototype.update = function () {
    this.velocity.add(this.acceleration);
    this.location[0].add(this.velocity);
    this.location[1].add(this.velocity);
    this.acceleration.mult(0);
  };

  Line.prototype.display = function () {
    p.line(
      this.location[0].x,
      this.location[0].y,
      this.location[1].x,
      this.location[1].y
    );
  };

  Line.prototype.applyForce = function (force) {
    var f = p5.Vector.div(force, this.mass);
    this.acceleration.add(f);
  };

  Line.prototype.checkEdges = function () {
    for (var i = 0; i < 2; i++) {
      if (this.location[i].x > p.windowWidth) {
        this.location[i].x = p.windowWidth;
        this.velocity.x *= -1;
      } else if (this.location[i].x < 0) {
        this.velocity.x *= -1;
        this.location[i].x = 0;
      }

      if (this.location[i].y > p.windowHeight - footerHeight) {
        this.velocity.y *= -1; // git down brahmen, git down.
        this.location[i].y = p.windowHeight - footerHeight;
      }
    }
  };

  /*
   *
   * Setup
   *
   */
  p.preload = function () {};

  p.setup = function () {
    cnv = p.createCanvas(p.windowWidth, p.windowHeight);

    for (var i = 0; i < totalLines; i++) {
      lines.push(new Line());
    }
  };

  /*
   *
   * Drawing & Dynamics
   *
   */

  p.draw = function () {
    p.background(p.color('rgba(255, 255, 255, 0.2)'));

    for (var i = 0; i < lines.length; i++) {
      lines[i].calcFriction();

      lines[i].applyForce(lines[i].forces.friction);
      lines[i].applyForce(lines[i].forces.wind);
      lines[i].applyForce(lines[i].forces.gravity);
      lines[i].update();
      lines[i].checkEdges();
      lines[i].display();
    }
  };

  p.windowResized = function () {
    p.resizeCanvas(p.windowWidth, p.windowHeight);
  };

  p.keyPressed = function () {
    if (p.keyCode == p.UP_ARROW) {
    }

    if (p.keyCode == p.DOWN_ARROW) {
    }
  };

  p.mousePressed = function () {};
};
