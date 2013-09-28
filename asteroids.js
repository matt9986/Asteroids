Function.prototype.inherits = function(fun) {
  function Surrogate() {};
  Surrogate.prototype = fun.prototype;
  this.prototype = new Surrogate();
};

(function (root) {
  Asteroids = root.Asteroids = (root.Asteroids || {});
  
  Asteroids.MovingObject = function(x_coord, y_coord) {
    this.x_coord = x_coord;
    this.y_coord = y_coord;
  };

  MovingObject = Asteroids.MovingObject;

  MovingObject.prototype.offScreen = function(ctx) {
    return (this.x_coord < 0 || this.x_coord > ctx.canvas.width ||
            this.y_coord < 0 || this.y_coord > ctx.canvas.height);
  };

  MovingObject.prototype.update = function() {
    this.x_coord = this.x_coord + this.x_vel;
    this.y_coord = this.y_coord + this.y_vel;
  };

  Asteroids.Asteroid = function(x_coord, y_coord, radius) {
    this.x_coord = x_coord;
    this.y_coord = y_coord;
    this.edges = [];
    for(var i = 0; i < 10; i++){
      var angle = (Math.PI * i / 5);
      var x = Math.sin(angle) * radius;
      var y = Math.cos(angle) * radius;
      this.edges.push([x, y]);
    };
  };
  Asteroid = Asteroids.Asteroid;
  Asteroid.inherits(Asteroids.MovingObject);

  Asteroids.randomAsteroid = function(max_x, max_y, max_speed) {
    var rand_x = (Math.round(Math.random()) * max_x);
    var rand_y = (Math.round(Math.random())  * max_y);
    var rand_rad = Math.random() * 50;
    var random = new Asteroid(rand_x, rand_y, rand_rad);

    random.randomVelocity(max_speed);

    return random;
  };

  Asteroid.prototype.randomVelocity = function(max_speed) {
    this.x_vel = (Math.random() * max_speed - (max_speed * 0.5));
    this.y_vel = (Math.random() * max_speed - (max_speed * 0.5));
  };

  Asteroid.prototype.draw = function(ctx) {
    ctx.beginPath();
    ctx.moveTo(this.endges[0])
    for(var i = 1; i < this.edges.length; i++){
      ctx.lineTo(i);
    };
    //ctx.arc(this.x_coord, this.y_coord, this.radius, 0, 2 * Math.PI, false);
    ctx.fillStyle = "black";
    ctx.fill();
    ctx.lineWidth = "5";
    ctx.strokeStyle = "#003300";
    ctx.stroke();
  };

  Asteroids.Game = function() {
    var canvas = document.createElement("canvas");
    canvas.id = "asteroids";
    document.body.appendChild(canvas)

    canvas.width = 800;
    canvas.height = 600;
    this.ctx = canvas.getContext("2d");
    console.log(this.ctx);

    var max_x = this.ctx.canvas.width;
    var max_y = this.ctx.canvas.height;

    this.ship = new Ship(this.ctx);

    this.asteroids = [];
    this.asteroids.push(Asteroids.randomAsteroid(max_x, max_y, 10));

    this.bullets = [];
  };
  var Game = Asteroids.Game

  Game.prototype.draw = function(){
    this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
    this.remove_offscreen_elements();
    this.ship.draw(this.ctx);

    for (var i = 0; i < this.asteroids.length; i++) {
      this.asteroids[i].draw(this.ctx);
    }

    for (var i = 0; i < this.bullets.length; i++) {
      this.bullets[i].draw(this.ctx);
    }
  }

  Game.prototype.remove_offscreen_elements = function(){
    for(var i = 0; i < this.asteroids.length; i++){
      if(this.asteroids[i].offScreen(this.ctx)) {
        this.asteroids.splice(i, 1);
      }
    }
    for (var i = 0; i < this.bullets.length; i++) {
      if(this.bullets[i].offScreen(this.ctx)) {
        this.bullets.splice(i, 1);
      }
    }
    return this.asteroids;
  }

  Game.prototype.update = function() {
    this.ship.update();
    for (var i = 0; i < this.asteroids.length; i++) {
      this.asteroids[i].update();
    }

    for (var i = 0; i < this.bullets.length; i++){
      this.bullets[i].update();
    }
    this.bullet_asteroid_deep_impact();
    this.draw();
    if (this.ship.isHit(this.asteroids)) {
      alert("hit!");
      return true;
    }
  }

  Game.prototype.draw_new_asteroid = function() {
    var max_x = this.ctx.canvas.width;
    var max_y = this.ctx.canvas.height;
    this.asteroids.push(Asteroids.randomAsteroid(max_x, max_y, 10));
  }

  Game.prototype.bullet_asteroid_deep_impact = function(){
    for (var i = 0; i < this.asteroids.length; i++){
      for(var j = 0; j < this.bullets.length; j++){
        var xdif = this.bullets[j].x_coord - this.asteroids[i].x_coord;
        var ydif = this.bullets[j].y_coord - this.asteroids[i].y_coord;

        var dist = Math.pow((Math.pow(xdif, 2) + Math.pow(ydif, 2)), 0.5);

        if ((this.asteroids[i].radius - 5) >= dist) {
          this.bullets.splice(j, 1);
          this.asteroids.splice(i, 1);
        }
      }
    }
  };

  Game.prototype.start = function() {
    var currentGame = this;

    key("up", this.ship.power.bind(this.ship, 0, -5));
    key("down", this.ship.power.bind(this.ship, 0, 5));
    key("left", this.ship.power.bind(this.ship, -5, 0));
    key("right", this.ship.power.bind(this.ship, 5, 0));
    key("space", this.shipFireBullet.bind(this));

    var gameUpdater = setInterval(function() {
      if (currentGame.update.bind(currentGame)()) {
       clearInterval(gameUpdater);
       clearInterval(astGenerator);
      }
    }, 30);

    var astGenerator = setInterval(currentGame.draw_new_asteroid.bind(this), 250);
  };

  Game.prototype.shipFireBullet = function() {
    this.bullets.push(this.ship.fireBullet());
  };

  Asteroids.Ship = function(ctx){
    this.angle = 0;
    this.x_coord = (800/ 2);
    this.y_coord = (600 / 2);
    this.x_vel = 0;
    this.y_vel = 0;
    this.side = 20;
  }

  var Ship = Asteroids.Ship
  Ship.inherits(Asteroids.MovingObject)

  Ship.prototype.draw = function(ctx){
    ctx.strokeStyle = "red";
    ctx.lineWidth = 2;
    ctx.strokeRect(this.x_coord, this.y_coord, this.side, this.side);
  }

  Ship.prototype.isHit = function(asteroids){
    for (var i = 0; i < asteroids.length; i++) {
      var xdif = this.x_coord + (this.side * 0.5) - asteroids[i].x_coord;
      var ydif = this.y_coord + (this.side * 0.5) - asteroids[i].y_coord;

      var dist = Math.pow((Math.pow(xdif, 2) + Math.pow(ydif, 2)), 0.5);

      if ((asteroids[i].radius + this.side - 5) >= dist) {
        return true
      }
    }
    return false
  };

  Ship.prototype.power = function(dxvel, dyvel){
    this.x_vel = dxvel;
    this.y_vel = dyvel;
  };

  Ship.prototype.fireBullet = function() {
    var bullet = new Bullet(this.x_coord, this.y_coord, this.x_vel, this.y_vel);
    return bullet;
  };

  Asteroids.Bullet = function(x_coord, y_coord, x_vel, y_vel){
    this.x_coord = x_coord;
    this.y_coord = y_coord;
    this.x_vel = 10 * (x_vel/ (Math.abs(x_vel) + Math.abs(y_vel)));
    this.y_vel = 10 * (y_vel/ (Math.abs(x_vel) + Math.abs(y_vel)));
  };

  var Bullet = Asteroids.Bullet;
  Bullet.inherits(Asteroids.MovingObject);

  Bullet.prototype.draw = function(ctx) {
    ctx.strokeStyle = "black";
    ctx.lineWidth = 2;
    ctx.strokeRect(this.x_coord, this.y_coord, 2, 2);
  };

  var game = new Game();

  game.start();
  
})(window)

