#  shape = seen.Shapes.cube().scale(100)
shape = new seen.Shape('my shape', [new seen.Surface([
  seen.P(0,0,5)
  seen.P(0,5,0)
  seen.P(5,0,0)
  ])])
  seen.Colors.randomSurfaces2(shape)

  scene = new seen.Scene
    model    : seen.Models.default().add(shape)
    viewport : seen.Viewports.center(600, 300)

  context = seen.Context('seen-canvas', scene).render()

  # context.animate()
  #   .onBefore((t, dt) -> shape.rotx(dt*1e-4).roty(0.7*dt*1e-4))
  #   .start()

  drag = new seen.Drag('seen-canvas', {inertia : true})
  drag.on('drag.rotate', (e) ->
    xform = seen.Quaternion.xyToTransform(e.offsetRelative...)
    shape.transform(xform)
    context.render()
  )