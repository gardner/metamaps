/* global $ */

import $jit from '../../patched/JIT'

import GlobalUI, { ReactApp } from '../GlobalUI'
import Loading from '../Loading'
import Settings from '../Settings'
import Util from '../Util'

const noOp = () => {}

const Topic = (map) => {
const toExport = {
  get: function(id, callback = noOp) {
    // if the desired topic is not yet in the local topic repository, fetch it
    if (map.DataModel.Topics.get(id) === undefined) {
      $.ajax({
        url: '/topics/' + id + '.json',
        success: function(data) {
          map.DataModel.Topics.add(data)
          callback(map.DataModel.Topics.get(id))
        }
      })
    } else callback(map.DataModel.Topics.get(id))
  },
  launch: function(id) {
    var dataIsReadySetupTopic = function() {
      map.Visualize.type = 'RGraph'
      map.JIT.prepareVizData()
      map.Selected.reset()
      map.Filter.reset()
      map.Filter.checkMetacodes()
      map.Filter.checkSynapses()
      map.Filter.checkMappers()
      document.title = map.Active.Topic.get('name') + ' | Metamaps'
      ReactApp.mobileTitle = map.Active.Topic.get('name')
      ReactApp.render()
    }
    if (map.Active.Topic && map.Active.Topic.id === id) {
      dataIsReadySetupTopic()
    }
    else {
      Loading.show()
      $.ajax({
        url: '/topics/' + id + '/network.json',
        success: function(data) {
          map.Active.Topic = new DataModel.Topic(data.topic)
          map.DataModel.Creators = new DataModel.MapperCollection(data.creators)
          map.DataModel.Topics = new DataModel.TopicCollection([data.topic].concat(data.relatives))
          map.DataModel.Synapses = new DataModel.SynapseCollection(data.synapses)
          DataModel.attachCollectionEvents()
          dataIsReadySetupTopic()
        }
      })
    }
  },
  end: function() {
    if (map.Active.Topic) {
      $('.rightclickmenu').remove()
      map.TopicCard.hideCard()
      map.SynapseCard.hideCard()
    }
  },
  centerOn: function(nodeid, callback) {
    // don't clash with fetchRelatives
    if (!map.Visualize.mGraph.busy) {
      map.Visualize.mGraph.onClick(nodeid, {
        hideLabels: false,
        duration: 1000,
        onComplete: function() {
          if (callback) callback()
        }
      })
      map.Active.Topic = map.DataModel.Topics.get(nodeid)
    }
  },
  onTopicFollow: topic => {
    const isFollowing = topic.isFollowedBy(map.Active.Mapper)
    $.post({
      url: `/topics/${topic.id}/${isFollowing ? 'un' : ''}follow`
    })
    if (isFollowing) {
      GlobalUI.notifyUser('You are no longer following this topic')
      map.Active.Mapper.unfollowTopic(topic.id)
    } else {
      GlobalUI.notifyUser('You are now following this topic')
      map.Active.Mapper.followTopic(topic.id)
    }
    ReactApp.render()
  },
  fetchRelatives: function(nodes, metacodeId) {
    var self = toExport

    var node = $.isArray(nodes) ? nodes[0] : nodes

    var topics = map.DataModel.Topics.map(function(t) { return t.id })
    var topicsString = topics.join()

    var creators = map.DataModel.Creators.map(function(t) { return t.id })
    var creatorsString = creators.join()

    var topic = node.getData('topic')

    var successCallback
    successCallback = function(data) {
      if (map.Visualize.mGraph.busy) {
        // don't clash with centerOn
        window.setTimeout(function() { successCallback(data) }, 100)
        return
      }
      if (data.creators.length > 0) map.DataModel.Creators.add(data.creators)
      if (data.topics.length > 0) map.DataModel.Topics.add(data.topics)
      if (data.synapses.length > 0) map.DataModel.Synapses.add(data.synapses)

      var topicColl = new DataModel.TopicCollection(data.topics)
      topicColl.add(topic)
      var synapseColl = new DataModel.SynapseCollection(data.synapses)

      var graph = map.JIT.convertModelsToJIT(topicColl, synapseColl)[0]
      map.Visualize.mGraph.op.sum(graph, {
        type: 'fade',
        duration: 500,
        hideLabels: false
      })

      var i, l, t, s

      map.Visualize.mGraph.graph.eachNode(function(n) {
        t = map.DataModel.Topics.get(n.id)
        t.set({ node: n }, { silent: true })
        t.updateNode()

        n.eachAdjacency(function(edge) {
          if (!edge.getData('init')) {
            edge.setData('init', true)

            l = edge.getData('synapseIDs').length
            for (i = 0; i < l; i++) {
              s = map.DataModel.Synapses.get(edge.getData('synapseIDs')[i])
              s.set({ edge: edge }, { silent: true })
              s.updateEdge()
            }
          }
        })
      })
      if ($.isArray(nodes) && nodes.length > 1) {
        self.fetchRelatives(nodes.slice(1), metacodeId)
      }
    }

    let paramsString = metacodeId ? 'metacode=' + metacodeId + '&' : ''
    paramsString += 'network=' + topicsString + '&creators=' + creatorsString

    $.ajax({
      type: 'GET',
      url: '/topics/' + topic.id + '/relatives.json?' + paramsString,
      success: successCallback,
      error: function() {}
    })
  },

  // opts is additional options in a hash
  // TODO: move createNewInDB and permitCreateSynapseAfter into opts
  renderTopic: function(mapping, topic, createNewInDB, permitCreateSynapseAfter, opts = {}) {
    var nodeOnViz, tempPos

    var newnode = topic.createNode()

    var midpoint = {}
    var pixelPos

    if (!$.isEmptyObject(map.Visualize.mGraph.graph.nodes)) {
      map.Visualize.mGraph.graph.addNode(newnode)
      nodeOnViz = map.Visualize.mGraph.graph.getNode(newnode.id)
      topic.set('node', nodeOnViz, {silent: true})
      topic.updateNode() // links the topic and the mapping to the node

      nodeOnViz.setData('dim', 1, 'start')
      nodeOnViz.setData('dim', 25, 'end')
      if (map.Visualize.type === 'RGraph') {
        tempPos = new $jit.Complex(mapping.get('xloc'), mapping.get('yloc'))
        tempPos = tempPos.toPolar()
        nodeOnViz.setPos(tempPos, 'current')
        nodeOnViz.setPos(tempPos, 'start')
        nodeOnViz.setPos(tempPos, 'end')
      } else if (map.Visualize.type === 'ForceDirected') {
        nodeOnViz.setPos(new $jit.Complex(mapping.get('xloc'), mapping.get('yloc')), 'current')
        nodeOnViz.setPos(new $jit.Complex(mapping.get('xloc'), mapping.get('yloc')), 'start')
        nodeOnViz.setPos(new $jit.Complex(mapping.get('xloc'), mapping.get('yloc')), 'end')
      }
      if (map.Create.newTopic.addSynapse && permitCreateSynapseAfter) {
        map.Create.newSynapse.topic1id = map.JIT.tempNode.getData('topic').id

        // position the form
        midpoint.x = map.JIT.tempNode.pos.getc().x + (nodeOnViz.pos.getc().x - map.JIT.tempNode.pos.getc().x) / 2
        midpoint.y = map.JIT.tempNode.pos.getc().y + (nodeOnViz.pos.getc().y - map.JIT.tempNode.pos.getc().y) / 2
        pixelPos = Util.coordsToPixels(map.Visualize.mGraph, midpoint)
        $('#new_synapse').css('left', pixelPos.x + 'px')
        $('#new_synapse').css('top', pixelPos.y + 'px')
        // show the form
        map.Create.newSynapse.open()
        map.Visualize.mGraph.fx.animate({
          modes: ['node-property:dim'],
          duration: 500,
          onComplete: function() {
            map.JIT.tempNode = null
            map.JIT.tempNode2 = null
            map.JIT.tempInit = false
          }
        })
      } else {
        map.Visualize.mGraph.fx.plotNode(nodeOnViz, map.Visualize.mGraph.canvas)
        map.Visualize.mGraph.fx.animate({
          modes: ['node-property:dim'],
          duration: 500,
          onComplete: function() {}
        })
      }
    } else {
      map.Visualize.mGraph.loadJSON(newnode)
      nodeOnViz = map.Visualize.mGraph.graph.getNode(newnode.id)
      topic.set('node', nodeOnViz, {silent: true})
      topic.updateNode() // links the topic and the mapping to the node

      nodeOnViz.setData('dim', 1, 'start')
      nodeOnViz.setData('dim', 25, 'end')
      nodeOnViz.setPos(new $jit.Complex(mapping.get('xloc'), mapping.get('yloc')), 'current')
      nodeOnViz.setPos(new $jit.Complex(mapping.get('xloc'), mapping.get('yloc')), 'start')
      nodeOnViz.setPos(new $jit.Complex(mapping.get('xloc'), mapping.get('yloc')), 'end')
      map.Visualize.mGraph.fx.plotNode(nodeOnViz, map.Visualize.mGraph.canvas)
      map.Visualize.mGraph.fx.animate({
        modes: ['node-property:dim'],
        duration: 500,
        onComplete: function() {}
      })
    }

    var mappingSuccessCallback = function(mappingModel, response, topicModel) {
      if (map.Active.Mapper.get('follow_map_on_contributed')) {
        map.Active.Mapper.followMap(map.Active.Map.id)
      }
      // call a success callback if provided
      if (opts.success) {
        opts.success(topicModel)
      }
    }
    var topicSuccessCallback = function(topicModel, response) {
      if (map.Active.Mapper.get('follow_topic_on_created')) {
        map.Active.Mapper.followTopic(topicModel.id)
      }
      if (map.Active.Map) {
        mapping.save({ mappable_id: topicModel.id }, {
          success: function(model, response) {
            mappingSuccessCallback(model, response, topicModel)
          },
          error: function(model, response) {
            console.log('error saving mapping to database')
          }
        })
      }

      if (map.Create.newTopic.addSynapse) {
        map.Create.newSynapse.topic2id = topicModel.id
      }
    }

    if (!Settings.sandbox && createNewInDB) {
      if (topic.isNew()) {
        topic.save(null, {
          success: topicSuccessCallback,
          error: function(model, response) {
            console.log('error saving topic to database')
          }
        })
      } else if (!topic.isNew() && map.Active.Map) {
        mapping.save(null, {
          success: mappingSuccessCallback
        })
      }
    }
  },
  createTopicLocally: function() {
    var self = toExport

    if (map.Create.newTopic.name === '') {
      GlobalUI.notifyUser('Please enter a topic title...')
      return
    }

    Map.setHasLearnedTopicCreation(true)

    $(document).trigger(Map.events.editedByActiveMapper)

    var metacode = DataModel.Metacodes.get(map.Create.newTopic.metacode)

    var topic = new DataModel.Topic({
      name: map.Create.newTopic.name,
      metacode_id: metacode.id,
      defer_to_map_id: map.Active.Map.id
    })
    map.DataModel.Topics.add(topic)

    if (map.Create.newTopic.pinned) {
      var nextCoords = map.AutoLayout.getNextCoord({ mappings: map.DataModel.Mappings })
    }
    var mapping = new DataModel.Mapping({
      xloc: nextCoords ? nextCoords.x : map.Create.newTopic.x,
      yloc: nextCoords ? nextCoords.y : map.Create.newTopic.y,
      mappable_id: topic.cid,
      mappable_type: 'Topic'
    })
    map.DataModel.Mappings.add(mapping)

    // these can't happen until the value is retrieved, which happens in the line above
    if (!map.Create.newTopic.pinned) map.Create.newTopic.hide()
    map.Create.newTopic.reset()

    self.renderTopic(mapping, topic, true, true) // this function also includes the creation of the topic in the database
  },
  getTopicFromAutocomplete: function(id) {
    var self = toExport

    Map.setHasLearnedTopicCreation(true)

    $(document).trigger(Map.events.editedByActiveMapper)

    if (!map.Create.newTopic.pinned) map.Create.newTopic.hide()
    map.Create.newTopic.reset()

    self.get(id, (topic) => {
      if (map.Create.newTopic.pinned) {
        var nextCoords = map.AutoLayout.getNextCoord({ mappings: map.DataModel.Mappings })
      }
      var mapping = new DataModel.Mapping({
        xloc: nextCoords ? nextCoords.x : map.Create.newTopic.x,
        yloc: nextCoords ? nextCoords.y : map.Create.newTopic.y,
        mappable_type: 'Topic',
        mappable_id: topic.id
      })
      map.DataModel.Mappings.add(mapping)

      self.renderTopic(mapping, topic, true, true)
      // this blocked the enterKeyHandler from creating a new topic as well
      if (map.Create.newTopic.pinned) map.Create.newTopic.beingCreated = true
    })
  },
  getMapFromAutocomplete: function(data) {
    var self = toExport

    $(document).trigger(Map.events.editedByActiveMapper)

    var metacode = DataModel.Metacodes.findWhere({ name: 'Metamap' })
    var topic = new DataModel.Topic({
      name: data.name,
      metacode_id: metacode.id,
      defer_to_map_id: map.Active.Map.id,
      link: window.location.origin + '/maps/' + data.id
    })
    map.DataModel.Topics.add(topic)

    var mapping = new DataModel.Mapping({
      xloc: map.Create.newTopic.x,
      yloc: map.Create.newTopic.y,
      mappable_id: topic.cid,
      mappable_type: 'Topic'
    })
    map.DataModel.Mappings.add(mapping)

    // these can't happen until the value is retrieved, which happens in the line above
    if (!map.Create.newTopic.pinned) map.Create.newTopic.hide()
    map.Create.newTopic.reset()

    self.renderTopic(mapping, topic, true, true) // this function also includes the creation of the topic in the database
    // this blocked the enterKeyHandler from creating a new topic as well
    if (map.Create.newTopic.pinned) map.Create.newTopic.beingCreated = true
  },
  getTopicFromSearch: function(event, id) {
    var self = toExport

    $(document).trigger(Map.events.editedByActiveMapper)

    self.get(id, (topic) => {
      var nextCoords = map.AutoLayout.getNextCoord({ mappings: map.DataModel.Mappings })
      var mapping = new DataModel.Mapping({
        xloc: nextCoords.x,
        yloc: nextCoords.y,
        mappable_type: 'Topic',
        mappable_id: topic.id
      })
      map.DataModel.Mappings.add(mapping)
      self.renderTopic(mapping, topic, true, true)
      GlobalUI.notifyUser('Topic was added to your map!')
    })

    event.stopPropagation()
    event.preventDefault()
    return false
  }
}
return toExport
}

export default Topic
