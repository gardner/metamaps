import _ from 'lodash'
import outdent from 'outdent'

import GlobalUI from '../GlobalUI'
import Settings from '../Settings'

const Control = (map) => {
  return {
    selectNode: function(node, e) {
      var filtered = node.getData('alpha') === 0

      if (filtered || map.Selected.Nodes.indexOf(node) !== -1) return
      node.selected = true
      node.setData('dim', 30, 'current')
      map.Selected.Nodes.push(node)
    },
    selectNeighbors: function() {
      if (map.Selected.Nodes.length > 0) {
        //For each selected node, select all connected node and the synapses too
        map.Selected.Nodes.forEach((item) => {
          if (map.Visualize.mGraph.graph.getNode(item.id).adjacencies) {
            for (const adjID in map.Visualize.mGraph.graph.getNode(item.id).adjacencies) {
              map.Control.selectNode(map.Visualize.mGraph.graph.getNode(adjID))
              map.Control.selectEdge(map.Visualize.mGraph.graph.getNode(item.id).adjacencies[adjID])
            }
          }
        })

        map.Visualize.mGraph.plot()
      }
    },
    deselectAllNodes: function() {
      var l = map.Selected.Nodes.length
      for (var i = l - 1; i >= 0; i -= 1) {
        var node = map.Selected.Nodes[i]
        map.Control.deselectNode(node)
      }
      map.Visualize.mGraph.plot()
    },
    deselectNode: function(node) {
      delete node.selected
      node.setData('dim', 25, 'current')

      // remove the node
      map.Selected.Nodes.splice(
        map.Selected.Nodes.indexOf(node), 1)
    },
    deleteSelected: function() {
      if (!map.Active.Map) return

      var n = map.Selected.Nodes.length
      var e = map.Selected.Edges.length
      var ntext = n === 1 ? '1 topic' : n + ' topics'
      var etext = e === 1 ? '1 synapse' : e + ' synapses'

      var authorized = map.Active.Map.authorizeToEdit(map.Active.Mapper)

      if (!authorized) {
        GlobalUI.notifyUser('Cannot edit Public map.')
        return
      }

      var r = window.confirm(outdent`
        You have ${ntext} and ${etext} selected. Are you sure you want
        to permanently delete them all? This will remove them from all
        maps they appear on.`)
      if (r) {
        map.Control.deleteSelectedEdges()
        map.Control.deleteSelectedNodes()
      }

      if (map.DataModel.Topics.length === 0) {
        Map.setHasLearnedTopicCreation(false)
      }
    },
    deleteSelectedNodes: function() { // refers to deleting topics permanently
      if (!map.Active.Map) return

      var authorized = map.Active.Map.authorizeToEdit(map.Active.Mapper)

      if (!authorized) {
        GlobalUI.notifyUser('Cannot edit Public map.')
        return
      }

      var l = map.Selected.Nodes.length
      for (var i = l - 1; i >= 0; i -= 1) {
        var node = map.Selected.Nodes[i]
        map.Control.deleteNode(node.id)
      }
    },
    deleteNode: function(nodeid) { // refers to deleting topics permanently
      if (!map.Active.Map) return

      var authorized = map.Active.Map.authorizeToEdit(map.Active.Mapper)

      if (!authorized) {
        GlobalUI.notifyUser('Cannot edit Public map.')
        return
      }

      var node = map.Visualize.mGraph.graph.getNode(nodeid)
      var topic = node.getData('topic')

      var permToDelete = map.Active.Mapper.id === topic.get('user_id') || map.Active.Mapper.get('admin')
      if (permToDelete) {
        var mapping = node.getData('mapping')
        topic.destroy()
        map.DataModel.Mappings.remove(mapping)
        map.Control.hideNode(nodeid)
      } else {
        GlobalUI.notifyUser('Only topics you created can be deleted')
      }
    },
    removeSelectedNodes: function() { // refers to removing topics permanently from a map
      if (map.Active.Topic) {
        // hideNode will handle synapses as well
        var nodeids = _.map(map.Selected.Nodes, function(node) {
          return node.id
        })
        _.each(nodeids, function(nodeid) {
          if (map.Active.Topic.id !== nodeid) {
            map.DataModel.Topics.remove(nodeid)
            map.Control.hideNode(nodeid)
          }
        })
        return
      }
      if (!map.Active.Map) return

      const l = map.Selected.Nodes.length
      const authorized = map.Active.Map.authorizeToEdit(map.Active.Mapper)

      if (!authorized) {
        GlobalUI.notifyUser('Cannot edit this map.')
        return
      }

      if (map.Active.Mapper.get('follow_map_on_contributed')) {
        map.Active.Mapper.followMap(map.Active.Map.id)
      }

      for (let i = l - 1; i >= 0; i -= 1) {
        const node = map.Selected.Nodes[i]
        map.Control.removeNode(node.id)
      }
    },
    removeNode: function(nodeid) { // refers to removing topics permanently from a map
      if (!map.Active.Map) return

      var authorized = map.Active.Map.authorizeToEdit(map.Active.Mapper)
      var node = map.Visualize.mGraph.graph.getNode(nodeid)

      if (!authorized) {
        GlobalUI.notifyUser('Cannot edit this map.')
        return
      }

      if (map.Active.Mapper.get('follow_map_on_contributed')) {
        map.Active.Mapper.followMap(map.Active.Map.id)
      }

      var topic = node.getData('topic')
      var mapping = node.getData('mapping')
      mapping.destroy()
      map.DataModel.Topics.remove(topic)
      map.Control.hideNode(nodeid)
    },
    hideSelectedNodes: function() {
      const l = map.Selected.Nodes.length
      for (let i = l - 1; i >= 0; i -= 1) {
        const node = map.Selected.Nodes[i]
        map.Control.hideNode(node.id)
      }
    },
    hideNode: function(nodeid) {
      var node = map.Visualize.mGraph.graph.getNode(nodeid)
      var graph = map.Visualize.mGraph

      map.Control.deselectNode(node)

      node.setData('alpha', 0, 'end')
      node.eachAdjacency(function(adj) {
        adj.setData('alpha', 0, 'end')
      })
      map.Visualize.mGraph.fx.animate({
        modes: ['node-property:alpha',
          'edge-property:alpha'
        ],
        duration: 500
      })
      setTimeout(function() {
        if (nodeid === map.Visualize.mGraph.root) { // && map.Visualize.type === "RGraph"
          var newroot = _.find(graph.graph.nodes, function(n) { return n.id !== nodeid })
          graph.root = newroot ? newroot.id : null
        }
        map.Visualize.mGraph.graph.removeNode(nodeid)
      }, 500)
      map.Filter.checkMetacodes()
      map.Filter.checkMappers()
    },
    selectEdge: function(edge) {
      var filtered = edge.getData('alpha') === 0 // don't select if the edge is filtered

      if (filtered || map.Selected.Edges.indexOf(edge) !== -1) return

      var width = map.Mouse.edgeHoveringOver === edge ? 4 : 2
      edge.setDataset('current', {
        showDesc: true,
        lineWidth: width,
        color: Settings.colors.synapses.selected
      })
      map.Visualize.mGraph.plot()

      map.Selected.Edges.push(edge)
    },
    deselectAllEdges: function() {
      var l = map.Selected.Edges.length
      for (var i = l - 1; i >= 0; i -= 1) {
        var edge = map.Selected.Edges[i]
        map.Control.deselectEdge(edge)
      }
      map.Visualize.mGraph.plot()
    },
    deselectEdge: function(edge) {
      edge.setData('showDesc', false, 'current')

      edge.setDataset('current', {
        lineWidth: 2,
        color: Settings.colors.synapses.normal
      })

      if (map.Mouse.edgeHoveringOver === edge) {
        edge.setDataset('current', {
          showDesc: true,
          lineWidth: 4
        })
      }

      map.Visualize.mGraph.plot()

      // remove the edge
      map.Selected.Edges.splice(
        map.Selected.Edges.indexOf(edge), 1)
    },
    deleteSelectedEdges: function() { // refers to deleting topics permanently
      if (!map.Active.Map) return

      var authorized = map.Active.Map.authorizeToEdit(map.Active.Mapper)

      if (!authorized) {
        GlobalUI.notifyUser('Cannot edit Public map.')
        return
      }

      const l = map.Selected.Edges.length
      for (let i = l - 1; i >= 0; i -= 1) {
        const edge = map.Selected.Edges[i]
        map.Control.deleteEdge(edge)
      }
    },
    deleteEdge: function(edge) {
      if (!map.Active.Map) return

      var authorized = map.Active.Map.authorizeToEdit(map.Active.Mapper)

      if (!authorized) {
        GlobalUI.notifyUser('Cannot edit Public map.')
        return
      }

      var index = edge.getData('displayIndex') ? edge.getData('displayIndex') : 0

      var synapse = edge.getData('synapses')[index]
      var mapping = edge.getData('mappings')[index]

      var permToDelete = map.Active.Mapper.id === synapse.get('user_id') || map.Active.Mapper.get('admin')
      if (permToDelete) {
        if (edge.getData('synapses').length - 1 === 0) {
          map.Control.hideEdge(edge)
        }
        synapse.destroy()

        // the server will destroy the mapping, we just need to remove it here
        map.DataModel.Mappings.remove(mapping)
        edge.getData('mappings').splice(index, 1)
        edge.getData('synapses').splice(index, 1)
        if (edge.getData('displayIndex')) {
          delete edge.data.$displayIndex
        }
      } else {
        GlobalUI.notifyUser('Only synapses you created can be deleted')
      }
    },
    removeSelectedEdges: function() {
      // Topic view is handled by removeSelectedNodes
      if (!map.Active.Map) return

      const l = map.Selected.Edges.length

      var authorized = map.Active.Map.authorizeToEdit(map.Active.Mapper)

      if (!authorized) {
        GlobalUI.notifyUser('Cannot edit this map.')
        return
      }

      if (map.Active.Mapper.get('follow_map_on_contributed')) {
        map.Active.Mapper.followMap(map.Active.Map.id)
      }

      for (let i = l - 1; i >= 0; i -= 1) {
        const edge = map.Selected.Edges[i]
        map.Control.removeEdge(edge)
      }
      map.Selected.Edges = [ ]
    },
    removeEdge: function(edge) {
      if (!map.Active.Map) return

      var authorized = map.Active.Map.authorizeToEdit(map.Active.Mapper)

      if (!authorized) {
        GlobalUI.notifyUser('Cannot edit this map.')
        return
      }

      if (map.Active.Mapper.get('follow_map_on_contributed')) {
        map.Active.Mapper.followMap(map.Active.Map.id)
      }

      if (edge.getData('mappings').length - 1 === 0) {
        map.Control.hideEdge(edge)
      }

      var index = edge.getData('displayIndex') ? edge.getData('displayIndex') : 0

      var synapse = edge.getData('synapses')[index]
      var mapping = edge.getData('mappings')[index]
      mapping.destroy()

      map.DataModel.Synapses.remove(synapse)

      edge.getData('mappings').splice(index, 1)
      edge.getData('synapses').splice(index, 1)
      if (edge.getData('displayIndex')) {
        delete edge.data.$displayIndex
      }
    },
    hideSelectedEdges: function() {
      const l = map.Selected.Edges.length
      for (let i = l - 1; i >= 0; i -= 1) {
        const edge = map.Selected.Edges[i]
        map.Control.hideEdge(edge)
      }
      map.Selected.Edges = [ ]
    },
    hideEdge: function(edge) {
      var from = edge.nodeFrom.id
      var to = edge.nodeTo.id
      edge.setData('alpha', 0, 'end')
      map.Control.deselectEdge(edge)
      map.Visualize.mGraph.fx.animate({
        modes: ['edge-property:alpha'],
        duration: 500
      })
      setTimeout(function() {
        map.Visualize.mGraph.graph.removeAdjacence(from, to)
      }, 500)
      map.Filter.checkSynapses()
      map.Filter.checkMappers()
    },
    updateSelectedPermissions: function(permission) {
      var edge, synapse, node, topic

      GlobalUI.notifyUser('Working...')

      // variables to keep track of how many nodes and synapses you had the ability to change the permission of
      var nCount = 0
      var sCount = 0

      // change the permission of the selected synapses, if logged in user is the original creator
      const edgesLength = map.Selected.Edges.length
      for (let i = edgesLength - 1; i >= 0; i -= 1) {
        edge = map.Selected.Edges[i]
        synapse = edge.getData('synapses')[0]

        if (synapse.authorizePermissionChange(map.Active.Mapper)) {
          synapse.save({
            permission: permission
          })
          sCount++
        }
      }

      // change the permission of the selected topics, if logged in user is the original creator
      const nodesLength = map.Selected.Nodes.length
      for (let i = nodesLength - 1; i >= 0; i -= 1) {
        node = map.Selected.Nodes[i]
        topic = node.getData('topic')

        if (topic.authorizePermissionChange(map.Active.Mapper)) {
          topic.save({
            permission: permission
          })
          nCount++
        }
      }

      var nString = nCount === 1 ? (nCount.toString() + ' topic and ') : (nCount.toString() + ' topics and ')
      var sString = sCount === 1 ? (sCount.toString() + ' synapse') : (sCount.toString() + ' synapses')

      var message = nString + sString + ' you created updated to ' + permission
      GlobalUI.notifyUser(message)
    },
    updateSelectedMetacodes: function(metacodeId) {
      var node, topic

      GlobalUI.notifyUser('Working...')

      var metacode = DataModel.Metacodes.get(metacodeId)

      // variables to keep track of how many nodes and synapses you had the ability to change the permission of
      var nCount = 0

      // change the permission of the selected topics, if logged in user is the original creator
      var l = map.Selected.Nodes.length
      for (var i = l - 1; i >= 0; i -= 1) {
        node = map.Selected.Nodes[i]
        topic = node.getData('topic')

        if (topic.authorizeToEdit(map.Active.Mapper)) {
          topic.save({
            'metacode_id': metacodeId
          })
          nCount++
        }
      }

      var nString = nCount === 1 ? (nCount.toString() + ' topic') : (nCount.toString() + ' topics')

      var message = nString + ' you can edit updated to ' + metacode.get('name')
      GlobalUI.notifyUser(message)
      map.Visualize.mGraph.plot()
    }
  }
}

export default Control
