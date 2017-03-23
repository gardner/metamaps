/* global $ */

import _ from 'lodash'

import $jit from '../../patched/JIT'

import Loading from '../Loading'

const Visualize = (map) => {
const toExport = {
  mGraph: null, // a reference to the graph object.
  cameraPosition: null, // stores the camera position when using a 3D visualization
  type: 'ForceDirected', // the type of graph we're building, could be "RGraph", "ForceDirected", or "ForceDirected3D"
  loadLater: false, // indicates whether there is JSON that should be loaded right in the offset, or whether to wait till the first topic is created
  touchDragNode: null,
  init: function(serverData) {
    var self = toExport

    if (serverData.VisualizeType) self.type = serverData.VisualizeType

    // disable awkward dragging of the canvas element that would sometimes happen
    $('#infovis-canvas').on('dragstart', function(event) {
      event.preventDefault()
    })

    // prevent touch events on the canvas from default behaviour
    $('#infovis-canvas').bind('touchstart', function(event) {
      event.preventDefault()
      self.mGraph.events.touched = true
    })

    // prevent touch events on the canvas from default behaviour
    $('#infovis-canvas').bind('touchmove', function(event) {
      // map.JIT.touchPanZoomHandler(event)
    })

    // prevent touch events on the canvas from default behaviour
    $('#infovis-canvas').bind('touchend touchcancel', function(event) {
      if (!self.mGraph.events.touchMoved && !map.Visualize.touchDragNode) map.TopicCard.hideCurrentCard()
      self.mGraph.events.touched = self.mGraph.events.touchMoved = false
      map.Visualize.touchDragNode = false
    })
  },
  computePositions: function() {
    const self = toExport

    if (self.type === 'RGraph') {
      let i
      let l

      self.mGraph.graph.eachNode(function(n) {
        const topic = map.DataModel.Topics.get(n.id)
        topic.set({ node: n }, { silent: true })
        topic.updateNode()

        n.eachAdjacency(function(edge) {
          if (!edge.getData('init')) {
            edge.setData('init', true)

            l = edge.getData('synapseIDs').length
            for (i = 0; i < l; i++) {
              const synapse = map.DataModel.Synapses.get(edge.getData('synapseIDs')[i])
              synapse.set({ edge: edge }, { silent: true })
              synapse.updateEdge()
            }
          }
        })

        var pos = n.getPos()
        pos.setc(-200, -200)
      })
      self.mGraph.compute('end')
    } else if (self.type === 'ForceDirected') {
      self.mGraph.graph.eachNode(function(n) {
        const topic = map.DataModel.Topics.get(n.id)
        topic.set({ node: n }, { silent: true })
        topic.updateNode()
        const mapping = topic.getMapping()

        n.eachAdjacency(function(edge) {
          if (!edge.getData('init')) {
            edge.setData('init', true)

            const l = edge.getData('synapseIDs').length
            for (let i = 0; i < l; i++) {
              const synapse = map.DataModel.Synapses.get(edge.getData('synapseIDs')[i])
              synapse.set({ edge: edge }, { silent: true })
              synapse.updateEdge()
            }
          }
        })

        const startPos = new $jit.Complex(0, 0)
        const endPos = new $jit.Complex(mapping.get('xloc'), mapping.get('yloc'))
        n.setPos(startPos, 'start')
        n.setPos(endPos, 'end')
      })
    } else if (self.type === 'ForceDirected3D') {
      self.mGraph.compute()
    }
  },
  /**
   * render does the heavy lifting of creating the engine that renders the graph with the properties we desire
   *
   */
  render: function() {
    const self = toExport

    if (self.type === 'RGraph') {
      // clear the previous canvas from #infovis
      $('#infovis').empty()

      const RGraphSettings = $.extend(true, {}, map.JIT.ForceDirected.graphSettings)

      $jit.RGraph.Plot.NodeTypes.implement(map.JIT.ForceDirected.nodeSettings)
      $jit.RGraph.Plot.EdgeTypes.implement(map.JIT.ForceDirected.edgeSettings)

      RGraphSettings.width = $(document).width()
      RGraphSettings.height = $(document).height()
      RGraphSettings.background = map.JIT.RGraph.background
      RGraphSettings.levelDistance = map.JIT.RGraph.levelDistance

      self.mGraph = new $jit.RGraph(RGraphSettings)
    } else if (self.type === 'ForceDirected') {
      // clear the previous canvas from #infovis
      $('#infovis').empty()

      const FDSettings = $.extend(true, {}, map.JIT.ForceDirected.graphSettings)

      $jit.ForceDirected.Plot.NodeTypes.implement(map.JIT.ForceDirected.nodeSettings)
      $jit.ForceDirected.Plot.EdgeTypes.implement(map.JIT.ForceDirected.edgeSettings)

      FDSettings.width = $('body').width()
      FDSettings.height = $('body').height()

      self.mGraph = new $jit.ForceDirected(FDSettings)
    } else if (self.type === 'ForceDirected3D' && !self.mGraph) {
      // clear the previous canvas from #infovis
      $('#infovis').empty()

      // init ForceDirected3D
      self.mGraph = new $jit.ForceDirected3D(map.JIT.ForceDirected3D.graphSettings)
      self.cameraPosition = self.mGraph.canvas.canvases[0].camera.position
    } else {
      self.mGraph.graph.empty()
    }

    function runAnimation() {
      Loading.hide()
      // load JSON data, if it's not empty
      if (!self.loadLater) {
        // load JSON data.
        var rootIndex = 0
        if (map.Active.Topic) {
          var node = _.find(map.JIT.vizData, function(node) {
            return node.id === map.Active.Topic.id
          })
          rootIndex = _.indexOf(map.JIT.vizData, node)
        }
        self.mGraph.loadJSON(map.JIT.vizData, rootIndex)
        // compute positions and plot.
        self.computePositions()
        self.mGraph.busy = true
        if (self.type === 'RGraph') {
          self.mGraph.fx.animate(map.JIT.RGraph.animate)
        } else if (self.type === 'ForceDirected') {
          self.mGraph.animate(map.JIT.ForceDirected.animateSavedLayout)
        } else if (self.type === 'ForceDirected3D') {
          self.mGraph.animate(map.JIT.ForceDirected.animateFDLayout)
        }
      }
    }
    // hold until all the needed metacode images are loaded
    // hold for a maximum of 80 passes, or 4 seconds of waiting time
    var tries = 0
    function hold() {
      const unique = _.uniq(map.DataModel.Topics.models, function(metacode) { return metacode.get('metacode_id') })
      const requiredMetacodes = _.map(unique, function(metacode) { return metacode.get('metacode_id') })
      let loadedCount = 0

      _.each(requiredMetacodes, function(metacodeId) {
        const metacode = DataModel.Metacodes.get(metacodeId)
        const img = metacode ? metacode.get('image') : false

        if (img && (img.complete || (typeof img.naturalWidth !== 'undefined' && img.naturalWidth !== 0))) {
          loadedCount += 1
        }
      })

      if (loadedCount === requiredMetacodes.length || tries > 80) {
        runAnimation()
      } else {
        setTimeout(function() { tries++; hold() }, 50)
      }
    }
    hold()
  },
  clearVisualization: function() {
    const self = toExport
    self.mGraph.graph.empty()
    self.mGraph.plot()
    map.JIT.centerMap(map.Visualize.mGraph.canvas)
    $('#infovis').empty()
  }
}
return toExport
}

export default Visualize
