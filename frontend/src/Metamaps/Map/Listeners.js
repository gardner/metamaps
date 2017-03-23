/* global $ */

import Util from '../Util'
import { Search } from '../GlobalUI'

const Listeners = (map) => {
return {
  activate: function() {
    var self = this
    $(document).on('keydown.map', function(e) {
      if (!(map.Active.Map || map.Active.Topic)) return

      const onCanvas = e.target.tagName === 'BODY'

      switch (e.which) {
        case 13: // if enter key is pressed
          // prevent topic creation if sending a message
          if (e.target.className !== 'chat-input') {
            map.JIT.enterKeyHandler()
          }
          break
        case 27: // if esc key is pressed
          map.JIT.escKeyHandler()
          break
        case 38: // if UP key is pressed
          if ((e.ctrlKey || e.metaKey) && e.shiftKey) {
            map.Control.selectNeighbors()
          }
          break
        case 46: // if DEL is pressed
          if (e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA' && (map.Selected.Nodes.length + map.Selected.Edges.length) > 0) {
            e.preventDefault()
            map.Control.removeSelectedNodes()
            map.Control.removeSelectedEdges()
          }
          break
        case 65: // if a or A is pressed
          if (map.Create.isSwitchingSet && e.ctrlKey || e.metaKey) {
            map.Create.metacodeSelectorToggleSelectAll()
            e.preventDefault()
            break
          } else if ((e.ctrlKey || e.metaKey) && onCanvas) {
            const nodesCount = Object.keys(map.Visualize.mGraph.graph.nodes).length
            const selectedNodesCount = map.Selected.Nodes.length
            e.preventDefault()

            // Hit Ctrl+A once to select all nodes
            map.Control.deselectAllNodes()
            map.Visualize.mGraph.graph.eachNode(node => {
              map.Control.selectNode(node, e)
            })

            // Hitting Ctrl+A a second time will select all edges too
            map.Control.deselectAllEdges()
            if (nodesCount === selectedNodesCount) {
              map.DataModel.Synapses.models.forEach(synapse => {
                const topic1id = synapse.get('topic1_id')
                const topic2id = synapse.get('topic2_id')
                const edge = map.Visualize.mGraph.graph.edges[topic1id][topic2id]
                map.Control.selectEdge(edge, e)
              })
            }

            map.Visualize.mGraph.plot()
          }

          break
        case 68: // if d or D is pressed
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault()
            map.Control.deleteSelected()
          }
          break
        case 69: // if e or E is pressed
          if ((e.ctrlKey || e.metaKey) && map.Active.Map) {
            e.preventDefault()
            map.JIT.zoomExtents(null, map.Visualize.mGraph.canvas)
            break
          }
          if (e.altKey && map.Active.Topic) {
            e.preventDefault()

            if (map.Active.Topic) {
              self.centerAndReveal(map.Selected.Nodes, {
                center: true,
                reveal: false
              })
            }
            break
          }
          break
        case 72: // if h or H is pressed
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault()
            map.Control.hideSelectedNodes()
            map.Control.hideSelectedEdges()
          }
          break
        case 77: // if m or M is pressed
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault()
            map.Control.removeSelectedNodes()
            map.Control.removeSelectedEdges()
          }
          break
        case 82: // if r or R is pressed
          if (e.altKey && map.Active.Topic) {
            e.preventDefault()
            self.centerAndReveal(map.Selected.Nodes, {
              center: false,
              reveal: true
            })
          }
          break
        case 84: // if t or T is pressed
          if (e.altKey && map.Active.Topic) {
            e.preventDefault()
            self.centerAndReveal(map.Selected.Nodes, {
              center: true,
              reveal: true
            })
          }
          break
        case 191: // if / is pressed
          if (e.ctrlKey || e.metaKey) {
            Search.focus()
          }
          break
        default:
          // console.log(e.which)
          break
      }
    })
    $(window).on('resize.map', function() {
      if (Visualize && map.Visualize.mGraph) {
        Util.resizeCanvas(map.Visualize.mGraph.canvas)
      }

      if (map.Active.Map && map.Realtime.inConversation) map.Realtime.positionVideos()
    })
  },
  centerAndReveal: function(nodes, opts) {
    if (nodes.length < 1) return
    var node = nodes[nodes.length - 1]
    if (opts.center && opts.reveal) {
      map.Topic.centerOn(node.id, function() {
        map.Topic.fetchRelatives(nodes)
      })
    } else if (opts.center) {
      map.Topic.centerOn(node.id)
    } else if (opts.reveal) {
      map.Topic.fetchRelatives(nodes)
    }
  }
}
}

export default Listeners
