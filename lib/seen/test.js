
  var COLORS, MATERIALS, MergeTransition, MoveTransition, NewTransition, PLACE, SCALE, SHAPE_FACTORY, SIZE, SeenActuator, color, i, j, len,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  SIZE = 4;

  COLORS = ['#ffffff', '#ffff00', '#9aCD32', '#2faa2f', '#20B2AA', '#1088fF', '#7b68ee', '#9932cc', '#800080', '#8b0000', '#333333'];

  MATERIALS = {};

  for (i = j = 0, len = COLORS.length; j < len; i = ++j) {
    color = COLORS[i];
    color = seen.Colors.hex(color);
    color.a = 0xB8;
    MATERIALS[1 << (1 + i)] = new seen.Material(color);
  }

  $('.color-sample').each(function(i, e) {
    return $(e).css('background-color', COLORS[i]);
  });

  SHAPE_FACTORY = function(value) {
    var adjust, shape, transform, tri, y;
    adjust = 0.05;
    if (value <= (1 << 11)) {
      shape = seen.Shapes.rectangle(seen.P(adjust, adjust, adjust), seen.P(1 - adjust, 1 - adjust, 0.25));
    } else if (value <= (1 << 22)) {
      y = 1 - adjust;
      tri = [seen.P(adjust, y, adjust), seen.P(0.5, y, 0.25), seen.P(1 - adjust, y, adjust)];
      shape = seen.Shapes.extrude(tri, seen.P(0, -1 + 2 * adjust, 0));
    } else {
      shape = seen.Shapes.pyramid();
      transform = seen.M().rotx(Math.PI / 2).translate(0, 1, 0).scale(1, 1, 0.25);
      shape.eachSurface(function(s) {
        return s.points.forEach(function(p) {
          return p.transform(transform);
        });
      });
    }
    while (value > (1 << 11)) {
      value >>= 11;
    }
    shape.fill(MATERIALS[value]);
    return shape;
  };

  PLACE = function(shape, position0, position1, t) {
    var ref, ref1, ref2, x, y, z;
    if (t == null) {
      t = 0;
    }
    if (t > 1) {
      t = 1;
    }
    if (position1 != null) {
      x = (position1.x * t) + (position0.x * (1.0 - t));
      y = (position1.y * t) + (position0.y * (1.0 - t));
      z = (((ref = position1.z) != null ? ref : 0) * t) + (((ref1 = position0.z) != null ? ref1 : 0) * (1.0 - t));
    } else {
      x = position0.x;
      y = position0.y;
      z = (ref2 = position0.z) != null ? ref2 : 0;
    }
    return shape.reset().translate(x, SIZE - y - 1, z);
  };

  NewTransition = (function(superClass) {
    extend(NewTransition, superClass);

    function NewTransition() {
      return NewTransition.__super__.constructor.apply(this, arguments);
    }

    NewTransition.prototype.firstFrame = function() {
      this.start = {
        x: this.tile.x,
        y: this.tile.y,
        z: 1
      };
      return this.model.add(this.shape);
    };

    NewTransition.prototype.frame = function() {
      return PLACE(this.shape, this.start, this.tile, this.tFrac);
    };

    NewTransition.prototype.lastFrame = function() {
      return PLACE(this.shape, this.tile);
    };

    return NewTransition;

  })(seen.Transition);

  MoveTransition = (function(superClass) {
    extend(MoveTransition, superClass);

    function MoveTransition() {
      return MoveTransition.__super__.constructor.apply(this, arguments);
    }

    MoveTransition.prototype.frame = function() {
      return PLACE(this.shape, this.tile.previousPosition, this.tile, this.tFrac);
    };

    return MoveTransition;

  })(seen.Transition);

  MergeTransition = (function(superClass) {
    extend(MergeTransition, superClass);

    function MergeTransition() {
      return MergeTransition.__super__.constructor.apply(this, arguments);
    }

    MergeTransition.prototype.frame = function() {
      PLACE(this.shape0, this.tile.mergedFrom[0].previousPosition, this.tile, this.tFrac);
      return PLACE(this.shape1, this.tile.mergedFrom[1].previousPosition, this.tile, this.tFrac);
    };

    MergeTransition.prototype.lastFrame = function() {
      PLACE(this.shape, this.tile);
      this.model.remove(this.shape0, this.shape1);
      return this.model.add(this.shape);
    };

    return MergeTransition;

  })(seen.Transition);

  SCALE = 400 / SIZE;

  SeenActuator = (function() {
    function SeenActuator() {
      var animator, doRotate, k, results;
      this.scene = new seen.Scene({
        cullBackfaces: false,
        fractionalPoints: true,
        model: new seen.Model().scale(SCALE).rotx(-0.5),
        viewport: seen.Viewports.center(900, 500)
      });
      this.scene.model.add(seen.Lights.point({
        point: seen.P(-1, 2, 2).multiply(8),
        intensity: 0.0025
      }));
      this.scene.model.add(seen.Lights.ambient({
        intensity: 0.0015
      }));
      this.subModel = this.scene.model.append().translate(-SIZE / 2, -SIZE / 2 + 0.5).bake();
      (function() {
        results = [];
        for (var k = 0; 0 <= SIZE ? k < SIZE : k > SIZE; 0 <= SIZE ? k++ : k--){ results.push(k); }
        return results;
      }).apply(this).map((function(_this) {
        return function(x) {
          var k, results;
          return (function() {
            results = [];
            for (var k = 0; 0 <= SIZE ? k < SIZE : k > SIZE; 0 <= SIZE ? k++ : k--){ results.push(k); }
            return results;
          }).apply(this).map(function(y) {
            var shape;
            shape = seen.Shapes.rectangle(seen.P(0.05, 0.05, -0.01), seen.P(0.95, 0.95, 0.0)).translate(x, y);
            shape.fill(new seen.Material(seen.Colors.hex('#c8bbb0')));
            _this.subModel.add(shape);
            shape = seen.Shapes.rectangle(seen.P(0, 0, -0.4), seen.P(1, 1, -0.02)).translate(x, y);
            shape.fill(new seen.Material(seen.Colors.hex('#bbada0')));
            return _this.subModel.add(shape);
          });
        };
      })(this));
      this.context = seen.Context('seen-canvas');
      this.context.layer(new seen.FillLayer(900, 500, '#faf8ef'));
      this.context.sceneLayer(this.scene);
      doRotate = true;
      animator = this.context.animate().start();
      animator.onBefore((function(_this) {
        return function(t, dt) {
          _this.subModel.reset();
          if (doRotate) {
            return _this.subModel.rotz(Math.sin(t * 3e-4) / 10);
          }
        };
      })(this));
      $('#toggle-nausea').click((function(_this) {
        return function() {
          return doRotate = !doRotate;
        };
      })(this));
      this.transitions = new seen.TransitionAnimator().start();
      this.restartGame();
      this.continueGame();
    }

    SeenActuator.prototype.restartGame = function() {
      if (this.gridModel != null) {
        this.subModel.remove(this.gridModel);
      }
      this.gridModel = this.subModel.append();
      return this.grid = this._emptyGridState();
    };

    SeenActuator.prototype.continueGame = function() {
      $('#game-message').text('');
      $('.retry-button').hide();
      $('.keep-playing-button').hide();
      return $('.restart-button').show();
    };

    SeenActuator.prototype.actuate = function(grid, metadata) {
      var column, k, l, len1, len2, nextGrid, ref, shape, shape0, shape1, tile;
      nextGrid = this._emptyGridState();
      ref = grid.cells;
      for (k = 0, len1 = ref.length; k < len1; k++) {
        column = ref[k];
        for (l = 0, len2 = column.length; l < len2; l++) {
          tile = column[l];
          if (tile == null) {
            continue;
          }
          tile = _.clone(tile);
          if (tile.previousPosition != null) {
            nextGrid[tile.x][tile.y] = shape = this._getShape(tile.previousPosition);
            this.transitions.add(new MoveTransition({
              model: this.gridModel,
              tile: tile,
              shape: shape
            }));
          } else if (tile.mergedFrom != null) {
            shape0 = this._getShape(tile.mergedFrom[0].previousPosition);
            shape1 = this._getShape(tile.mergedFrom[1].previousPosition);
            nextGrid[tile.x][tile.y] = shape = SHAPE_FACTORY(tile.value);
            this.transitions.add(new MergeTransition({
              model: this.gridModel,
              tile: tile,
              shape: shape,
              shape0: shape0,
              shape1: shape1
            }));
          } else {
            nextGrid[tile.x][tile.y] = shape = SHAPE_FACTORY(tile.value);
            this.transitions.add(new NewTransition({
              model: this.gridModel,
              tile: tile,
              shape: shape
            }));
          }
        }
      }
      this.grid = nextGrid;
      this.transitions.keyframe();
      $('#score').text(metadata.score);
      if (metadata.terminated) {
        if (metadata.over) {
          return $('#game-message').text('You lose =(');
        } else if (metadata.won) {
          $('#game-message').text('You WIN! =D');
          return $('.keep-playing-button').show();
        }
      }
    };

    SeenActuator.prototype._emptyGridState = function() {
      var k, results;
      return (function() {
        results = [];
        for (var k = 0; 0 <= SIZE ? k < SIZE : k > SIZE; 0 <= SIZE ? k++ : k--){ results.push(k); }
        return results;
      }).apply(this).map(function(x) {
        var k, results;
        return (function() {
          results = [];
          for (var k = 0; 0 <= SIZE ? k < SIZE : k > SIZE; 0 <= SIZE ? k++ : k--){ results.push(k); }
          return results;
        }).apply(this).map(function(y) {
          return null;
        });
      });
    };

    SeenActuator.prototype._getShape = function(position) {
      return this.grid[position.x][position.y];
    };

    return SeenActuator;

  })();

  window.requestAnimationFrame(function() {
    return new GameManager(SIZE, KeyboardInputManager, SeenActuator, LocalStorageManager);
  });
