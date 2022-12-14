
  # The size of the game. In this case, a 4-by-4 grid
  SIZE = 4

  # The 11 colors defining the "2^N" values
  COLORS = [
    '#ffffff'
    '#ffff00'
    '#9aCD32'
    '#2faa2f'
    '#20B2AA'
    '#1088fF'
    '#7b68ee'
    '#9932cc'
    '#800080'
    '#8b0000'
    '#333333'
  ]

  # Define the materials for the tile levels
  MATERIALS = {}
  for color, i in COLORS
    color = seen.Colors.hex color
    color.a = 0xB8 # add some transparency
    MATERIALS[1 << (1 + i)] = new seen.Material color

  # Update the swatch legend
  $('.color-sample').each (i, e) ->
    $(e).css 'background-color', COLORS[i]

  # Returns a new seen.Shape representing a tile
  SHAPE_FACTORY =  (value) ->
    adjust = 0.05

    # Up to 2048 (2^11) we use rectangles
    if value <= (1 << 11)
      shape = seen.Shapes.rectangle(seen.P(adjust,adjust,adjust), seen.P(1 - adjust, 1 - adjust, 0.25))

    # From 2^11 to 2^22 we use triangular prisms
    else if value <= (1 << 22)
      y = 1 - adjust
      tri = [seen.P(adjust,y,adjust), seen.P(0.5,y,0.25), seen.P(1-adjust,y,adjust)]
      shape = seen.Shapes.extrude(tri, seen.P(0, -1 + 2*adjust,0))

    # From 2^22 and beyond we use pyramid
    else
      shape = seen.Shapes.pyramid()
      transform = seen.M().rotx(Math.PI/2).translate(0,1,0).scale(1,1,0.25)
      shape.eachSurface (s) -> s.points.forEach (p) -> p.transform(transform)

    # Bring down value into color scales range
    while value > (1 << 11)
      value >>= 11

    shape.fill MATERIALS[value]
    return shape

  # This method interpolates between position0 and position1 then places
  # the shape at that position.
  PLACE = (shape, position0, position1, t = 0) ->
    t = 1 if t > 1
    if position1?
      x = (position1.x * t) + (position0.x * (1.0 - t))
      y = (position1.y * t) + (position0.y * (1.0 - t))
      z = ((position1.z ? 0) * t) + ((position0.z ? 0) * (1.0 - t))
    else
      x = position0.x
      y = position0.y
      z = position0.z ? 0
    shape.reset().translate(x, SIZE - y - 1, z)

  # The transition for when a new tile is added
  class NewTransition extends seen.Transition
    firstFrame : ->
      @start = {x : @tile.x, y : @tile.y, z : 1}
      @model.add(@shape)

    frame : ->
      PLACE(@shape, @start, @tile, @tFrac)

    lastFrame : ->
      PLACE(@shape, @tile)

  # The transition for when a tile is simply moved
  class MoveTransition extends seen.Transition
    frame : ->
      PLACE(@shape, @tile.previousPosition, @tile, @tFrac)

  # The transition for when two tiles are merged into one
  class MergeTransition extends seen.Transition
    frame : ->
      PLACE(@shape0, @tile.mergedFrom[0].previousPosition, @tile, @tFrac)
      PLACE(@shape1, @tile.mergedFrom[1].previousPosition, @tile, @tFrac)

    lastFrame : ->
      PLACE(@shape, @tile)
      @model.remove(@shape0, @shape1)
      @model.add(@shape)

  SCALE = 400 / SIZE

  # This is our implementation of the HTMLActuator interface from the original
  # 2048 library by https://github.com/gabrielecirulli.
  class SeenActuator
    constructor : ->
      # Create a scene
      @scene = new seen.Scene
        cullBackfaces    : false
        fractionalPoints : true
        model            : new seen.Model().scale(SCALE).rotx(-0.5)
        viewport         : seen.Viewports.center(900, 500)

      # Add some lights
      @scene.model.add seen.Lights.point
        point     : seen.P(-1, 2, 2).multiply(8)
        intensity : 0.0025

      @scene.model.add seen.Lights.ambient
        intensity : 0.0015

      # Append a submodel to create a tree of transforms
      @subModel = @scene.model.append()
        .translate(-SIZE/2,-SIZE/2 + 0.5)
        .bake() # bake in transformation so that later .reset() will return to this state

      # Create the shapes for the board
      [0...SIZE].map (x) => [0...SIZE].map (y) =>
        # Light inside piece
        shape = seen.Shapes.rectangle(seen.P(0.05, 0.05, -0.01), seen.P(0.95, 0.95, 0.0)).translate(x, y)
        shape.fill new seen.Material seen.Colors.hex '#c8bbb0'
        @subModel.add(shape)

        # Background board
        shape = seen.Shapes.rectangle(seen.P(0, 0, -0.4), seen.P(1, 1, -0.02)).translate(x, y)
        shape.fill new seen.Material seen.Colors.hex '#bbada0'
        @subModel.add(shape)

      # Create a context with a fill layer and the scene layer
      @context = seen.Context('seen-canvas')
      @context.layer(new seen.FillLayer(900, 500, '#faf8ef'))
      @context.sceneLayer(@scene)

      # Slowly rock the board back and forth, cuz why not? It is THREEEE-DEEEEE!!!
      doRotate = true
      animator = @context.animate().start()
      animator.onBefore (t, dt) =>
        @subModel.reset()
        if doRotate then @subModel.rotz(Math.sin(t*3e-4) / 10)

      $('#toggle-nausea').click => doRotate = not doRotate

      # Initialize the transition animator
      @transitions = new seen.TransitionAnimator().start()

      # Initialize game models
      @restartGame()
      @continueGame()

    # We had to modify the 2048 game manager to invoke this method on restart.
    # The original game assumes that we can rebuild the entire board on every
    # actuate(). However, in our case, we must store the shapes between calls,
    # so this method allows us to clean up when a game is restarted.
    restartGame : ->
      if @gridModel? then @subModel.remove(@gridModel)
      @gridModel = @subModel.append()
      @grid = @_emptyGridState()

    # Invoked on a restart, retry, or page load.
    continueGame : ->
      $('#game-message').text ''
      $('.retry-button').hide()
      $('.keep-playing-button').hide()
      $('.restart-button').show()

    # Invoked on user interaction / game state update
    actuate : (grid, metadata) ->

      nextGrid = @_emptyGridState()

      for column in grid.cells
        for tile in column
          continue unless tile?

          # Make a copy of the tile so we can store it inside the transition
          tile = _.clone tile

          # Transition an exiting tile that has moved
          if tile.previousPosition?
            nextGrid[tile.x][tile.y] = shape = @_getShape(tile.previousPosition)
            @transitions.add new MoveTransition {model : @gridModel, tile, shape}

          # Transition two existing tiles merged into one
          else if tile.mergedFrom?
            shape0 = @_getShape(tile.mergedFrom[0].previousPosition)
            shape1 = @_getShape(tile.mergedFrom[1].previousPosition)
            nextGrid[tile.x][tile.y] = shape = SHAPE_FACTORY(tile.value)
            @transitions.add new MergeTransition {model : @gridModel, tile, shape, shape0, shape1}

          # Transition a new tile
          else
            nextGrid[tile.x][tile.y] = shape = SHAPE_FACTORY(tile.value)
            @transitions.add new NewTransition {model : @gridModel, tile, shape}

      @grid = nextGrid
      @transitions.keyframe()

      # Update score and game end conditions
      $('#score').text metadata.score

      if metadata.terminated
        if metadata.over
          $('#game-message').text 'You lose =('
        else if metadata.won
          $('#game-message').text 'You WIN! =D'
          $('.keep-playing-button').show()

    # Returns a 2-dimensional array for storing game tile shapes
    _emptyGridState : -> [0...SIZE].map (x) -> [0...SIZE].map (y) -> null

    # Return the seen.Shape at the coordinates in the current grid state
    _getShape : (position) -> @grid[position.x][position.y]

  # Initialize the 2048 game manager
  window.requestAnimationFrame () ->
    new GameManager(SIZE, KeyboardInputManager, SeenActuator, LocalStorageManager)
