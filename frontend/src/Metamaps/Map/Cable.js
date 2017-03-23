/* global $, ActionCable */

import { indexOf } from 'lodash'

import Mapper from '../Mapper'

const Cable = (map) => {
const toExport = {
  subscribeToMap: id => {
    let self = toExport
    self.sub = Cable.cable.subscriptions.create({
      channel: 'MapChannel',
      id: id
    }, {
      received: event => self[event.type](event)
    })
  },
  unsubscribeFromMap: () => {
    let self = toExport
    self.sub.unsubscribe()
    delete self.sub
  },
  synapseAdded: event => {
    // we receive contentless models from the server
    // containing only the information we need to determine whether the active mapper
    // can view this synapse and the two topics it connects,
    // then if we determine it can, we make a call for the full model
    const m = map.Active.Mapper
    const s = new DataModel.Synapse(event.synapse)
    const t1 = new DataModel.Topic(event.topic1)
    const t2 = new DataModel.Topic(event.topic2)

    if (t1.authorizeToShow(m) && t2.authorizeToShow(m) && s.authorizeToShow(m) && !map.DataModel.Synapses.get(event.synapse.id)) {
      // refactor the heck outta this, its adding wicked wait time
      var topic1, topic2, node1, node2, synapse, mapping, cancel, mapper

      const waitThenRenderSynapse = () => {
        if (synapse && mapping && mapper) {
          topic1 = synapse.getTopic1()
          node1 = topic1.get('node')
          topic2 = synapse.getTopic2()
          node2 = topic2.get('node')

          map.Synapse.renderSynapse(mapping, synapse, node1, node2, false)
        } else if (!cancel) {
          setTimeout(waitThenRenderSynapse, 10)
        }
      }

      mapper = map.DataModel.Mappers.get(event.synapse.user_id)
      if (mapper === undefined) {
        Mapper.get(event.synapse.user_id, function(m) {
          map.DataModel.Mappers.add(m)
          mapper = m
        })
      }
      $.ajax({
        url: '/synapses/' + event.synapse.id + '.json',
        success: function(response) {
          map.DataModel.Synapses.add(response)
          synapse = map.DataModel.Synapses.get(response.id)
        },
        error: function() {
          cancel = true
        }
      })
      $.ajax({
        url: '/mappings/' + event.mapping_id + '.json',
        success: function(response) {
          map.DataModel.Mappings.add(response)
          mapping = map.DataModel.Mappings.get(response.id)
        },
        error: function() {
          cancel = true
        }
      })
      waitThenRenderSynapse()
    }
  },
  synapseUpdated: event => {
    // TODO: handle case where permission changed
    var synapse = map.DataModel.Synapses.get(event.id)
    if (synapse) {
      // edge reset necessary because fetch causes model reset
      var edge = synapse.get('edge')
      synapse.fetch({
        success: function(model) {
          model.set({ edge: edge })
          model.trigger('changeByOther')
        }
      })
    }
  },
  synapseRemoved: event => {
    var synapse = map.DataModel.Synapses.get(event.id)
    if (synapse) {
      var edge = synapse.get('edge')
      var mapping = synapse.getMapping()
      if (edge.getData('mappings').length - 1 === 0) {
        map.Control.hideEdge(edge)
      }

      var index = indexOf(edge.getData('synapses'), synapse)
      edge.getData('mappings').splice(index, 1)
      edge.getData('synapses').splice(index, 1)
      if (edge.getData('displayIndex')) {
        delete edge.data.$displayIndex
      }
      map.DataModel.Synapses.remove(synapse)
      map.DataModel.Mappings.remove(mapping)
    }
  },
  topicAdded: event => {
    const m = map.Active.Mapper
    // we receive a contentless model from the server
    // containing only the information we need to determine whether the active mapper
    // can view this topic, then if we determine it can, we make a call for the full model
    const t = new DataModel.Topic(event.topic)

    if (t.authorizeToShow(m) && !map.DataModel.Topics.get(event.topic.id)) {
      // refactor the heck outta this, its adding wicked wait time
      var topic, mapping, mapper, cancel

      const waitThenRenderTopic = () => {
        if (topic && mapping && mapper) {
          map.Topic.renderTopic(mapping, topic, false, false)
        } else if (!cancel) {
          setTimeout(waitThenRenderTopic, 10)
        }
      }

      mapper = map.DataModel.Mappers.get(event.topic.user_id)
      if (mapper === undefined) {
        Mapper.get(event.topic.user_id, function(m) {
          map.DataModel.Mappers.add(m)
          mapper = m
        })
      }
      $.ajax({
        url: '/topics/' + event.topic.id + '.json',
        success: function(response) {
          map.DataModel.Topics.add(response)
          topic = map.DataModel.Topics.get(response.id)
        },
        error: function() {
          cancel = true
        }
      })
      $.ajax({
        url: '/mappings/' + event.mapping_id + '.json',
        success: function(response) {
          map.DataModel.Mappings.add(response)
          mapping = map.DataModel.Mappings.get(response.id)
        },
        error: function() {
          cancel = true
        }
      })
      waitThenRenderTopic()
    }
  },
  topicUpdated: event => {
    // TODO: handle case where permission changed
    var topic = map.DataModel.Topics.get(event.id)
    if (topic) {
      var node = topic.get('node')
      topic.fetch({
        success: function(model) {
          model.set({ node: node })
          model.trigger('changeByOther')
        }
      })
    }
  },
  topicMoved: event => {
    var topic, node, mapping
    if (map.Active.Map) {
      topic = map.DataModel.Topics.get(event.id)
      mapping = map.DataModel.Mappings.get(event.mapping_id)
      mapping.set('xloc', event.x)
      mapping.set('yloc', event.y)
      if (topic) node = topic.get('node')
      if (node) node.pos.setc(event.x, event.y)
      map.Visualize.mGraph.plot()
    }
  },
  topicRemoved: event => {
    var topic = map.DataModel.Topics.get(event.id)
    if (topic) {
      var node = topic.get('node')
      var mapping = topic.getMapping()
      map.Control.hideNode(node.id)
      map.DataModel.Topics.remove(topic)
      map.DataModel.Mappings.remove(mapping)
    }
  },
  messageCreated: event => {
    if (map.Active.Mapper && map.Active.Mapper.id === event.message.user_id) return
    map.ChatView.addMessages(new DataModel.MessageCollection(event.message))
  },
  mapUpdated: event => {
    var map = map.Active.Map
    var couldEditBefore = map.authorizeToEdit(map.Active.Mapper)
    var idBefore = map.id
    map.fetch({
      success: function(model, response) {
        var idNow = model.id
        var canEditNow = model.authorizeToEdit(map.Active.Mapper)
        if (idNow !== idBefore) {
          Map.leavePrivateMap() // this means the map has been changed to private
        } else if (couldEditBefore && !canEditNow) {
          Map.cantEditNow()
        } else if (!couldEditBefore && canEditNow) {
          Map.canEditNow()
        } else {
          model.trigger('changeByOther')
        }
      }
    })
  }
}
return toExport
}
Cable.init = () => {
  Cable.cable = ActionCable.createConsumer()
}

export default Cable
