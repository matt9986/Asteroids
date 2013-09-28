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
    for(var i = 0; i < 12; i++){
      var angle = (Math.PI * i / 6);
      var r = (Math.random() - 0.5) * 5 + radius;
      var x = (Math.sin(angle) * r);
      var y = (Math.cos(angle) * r);
      this.edges.push([x, y]);
    };
    this.radius = radius;
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
    ctx.moveTo(this.edges[0][0] + this.x_coord, this.edges[0][1] + this.y_coord);
    for(var i = 1; i < this.edges.length; i++){
      ctx.lineTo(this.edges[i][0] + this.x_coord, this.edges[i][1] + this.y_coord);
    };
    ctx.lineTo(this.edges[0][0] + this.x_coord, this.edges[0][1] + this.y_coord);
    //ctx.fillStyle = "black";
    //ctx.fill();
    ctx.lineWidth = "2";
    ctx.strokeStyle = "black";
    ctx.stroke();
  };

  Asteroids.Game = function() {
    var canvas = document.createElement("canvas");
    canvas.id = "asteroids";
    document.body.appendChild(canvas)

    canvas.width = 800;
    canvas.height = 600;
    this.ctx = canvas.getContext("2d");

    var max_x = this.ctx.canvas.width;
    var max_y = this.ctx.canvas.height;

    this.ship = new Ship(this.ctx);

    this.asteroids = [];
    this.asteroids.push(Asteroids.randomAsteroid(max_x, max_y, 10));

    this.bullets = [];
  };
  var Game = Asteroids.Game
  
  Game.prototype.check_keys = function (key_arr) {
    for( var i = 0; i < key_arr.length; i++){
      switch(key_arr[i]){
        case 38: //up
          this.ship.power.bind(this.ship, 5);
          break;
        case 40: //down
          this.ship.power.bind(this.ship, -5);
          break;
        case 37: //left
          this.ship.turn.bind(this.ship, -0.1);
          break;
        case 39: //right
          this.ship.turn.bind(this.ship, 0.1);
          break;
        case 32: //space
          this.shipFireBullet.bind(this);
          break;
      };
    };
  };

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
    this.check_keys(key.getPressedKeyCodes());
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
    this.side = 15;
  }

  var Ship = Asteroids.Ship
  Ship.inherits(Asteroids.MovingObject)

  Ship.prototype.draw = function(ctx){
    ctx.beginPath();
    ctx.moveTo(this.x_coord + Math.cos(this.angle) * this.side, 
               this.y_coord + Math.sin(this.angle) * this.side);
    for(var i = 1; i < 3; i++){
      var ang = this.angle + (2 * i * Math.PI / 3);
      ctx.lineTo(this.x_coord + Math.cos(ang) * this.side,
                 this.y_coord + Math.sin(ang) * this.side);
    };
    ctx.lineTo(this.x_coord + Math.cos(this.angle) * this.side,
               this.y_coord + Math.sin(this.angle) * this.side);
    ctx.lineWidth = "2";
    ctx.strokeStyle = "red";
    ctx.stroke();
    
  };

  Ship.prototype.isHit = function(asteroids){
    for (var i = 0; i < asteroids.length; i++) {
      var xdif = this.x_coord - asteroids[i].x_coord;
      var ydif = this.y_coord - asteroids[i].y_coord;

      var dist = Math.pow((Math.pow(xdif, 2) + Math.pow(ydif, 2)), 0.5);

      if ((asteroids[i].radius + this.side) >= dist) {
        return true
      }
    }
    return false
  };

  Ship.prototype.power = function (pow) {
    this.x_vel = Math.cos(this.angle) * pow;
    this.y_vel = Math.sin(this.angle) * pow;
  };
  
  Ship.prototype.turn = function (direction) {
    this.angle += direction;
  };

  Ship.prototype.fireBullet = function() {
    var bullet = new Bullet(this.x_coord, this.y_coord, this.angle);
    return bullet;
  };

  Asteroids.Bullet = function(x_coord, y_coord, trajectory){
    this.x_coord = x_coord;
    this.y_coord = y_coord;
    this.x_vel = 10 * Math.cos(trajectory);
    this.y_vel = 10 * Math.sin(trajectory);
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

