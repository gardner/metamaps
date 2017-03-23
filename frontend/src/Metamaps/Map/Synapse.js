/* global $ */

import Settings from '../Settings'

const noOp = () => {}

const Synapse = (map) => {
const toExport = {
  // this function is to retrieve a synapse JSON object from the database
  // @param id = the id of the synapse to retrieve
  get: function(id, callback = noOp) {
    // if the desired topic is not yet in the local topic repository, fetch it
    if (map.DataModel.Synapses.get(id) === undefined) {
      $.ajax({
        url: '/synapses/' + id + '.json',
        success: function(data) {
          map.DataModel.Synapses.add(data)
          callback(map.DataModel.Synapses.get(id))
        }
      })
    } else callback(map.DataModel.Synapses.get(id))
  },

  renderSynapse: function(mapping, synapse, node1, node2, createNewInDB) {
    var edgeOnViz

    var newedge = synapse.createEdge(mapping)

    map.Visualize.mGraph.graph.addAdjacence(node1, node2, newedge.data)
    edgeOnViz = map.Visualize.mGraph.graph.getAdjacence(node1.id, node2.id)
    synapse.set('edge', edgeOnViz)
    synapse.updateEdge() // links the synapse and the mapping to the edge

    map.Control.selectEdge(edgeOnViz)

    var synapseSuccessCallback = function(synapseModel, response) {
      if (map.Active.Map) {
        mapping.save({ mappable_id: synapseModel.id }, {
          success: function(model, response) {
            if (map.Active.Mapper.get('follow_map_on_contributed')) {
              map.Active.Mapper.followMap(map.Active.Map.id)
            }
          },
          error: function(model, response) {
            console.log('error saving mapping to database')
          }
        })
      }
    }

    if (!Settings.sandbox && createNewInDB) {
      if (synapse.isNew()) {
        synapse.save(null, {
          success: synapseSuccessCallback,
          error: function(model, response) {
            console.log('error saving synapse to database')
          }
        })
      } else if (!synapse.isNew() && map.Active.Map) {
        mapping.save(null, {
          success: function(model, response) {
            if (map.Active.Mapper.get('follow_map_on_contributed')) {
              map.Active.Mapper.followMap(map.Active.Map.id)
            }
          },
          error: function(model, response) {
            console.log('error saving mapping to database')
          }
        })
      }
    }
  },
  createSynapseLocally: function() {
    var self = toExport
    let topic1
    let topic2
    let node1
    let node2
    let synapse
    let mapping

    $(document).trigger(Map.events.editedByActiveMapper)

    // for each node in this array we will create a synapse going to the position2 node.
    var synapsesToCreate = []

    topic2 = map.DataModel.Topics.get(map.Create.newSynapse.topic2id)
    node2 = topic2.get('node')

    var len = map.Selected.Nodes.length
    if (len === 0) {
      topic1 = map.DataModel.Topics.get(map.Create.newSynapse.topic1id)
      synapsesToCreate[0] = topic1.get('node')
    } else if (len > 0) {
      synapsesToCreate = map.Selected.Nodes
    }

    for (var i = 0; i < synapsesTomap.Create.length; i++) {
      node1 = synapsesToCreate[i]
      topic1 = node1.getData('topic')
      synapse = new DataModel.Synapse({
        desc: map.Create.newSynapse.description,
        topic1_id: topic1.isNew() ? topic1.cid : topic1.id,
        topic2_id: topic2.isNew() ? topic2.cid : topic2.id
      })
      map.DataModel.Synapses.add(synapse)

      mapping = new DataModel.Mapping({
        mappable_type: 'Synapse',
        mappable_id: synapse.cid
      })
      map.DataModel.Mappings.add(mapping)

      // this function also includes the creation of the synapse in the database
      self.renderSynapse(mapping, synapse, node1, node2, true)
    } // for each in synapsesToCreate

    map.Create.newSynapse.hide()
  },
  getSynapseFromAutocomplete: function(id) {
    var self = toExport

    self.get(id, synapse => {
      const mapping = new DataModel.Mapping({
        mappable_type: 'Synapse',
        mappable_id: synapse.id
      })
      map.DataModel.Mappings.add(mapping)
      const topic1 = map.DataModel.Topics.get(map.Create.newSynapse.topic1id)
      const node1 = topic1.get('node')
      const topic2 = map.DataModel.Topics.get(map.Create.newSynapse.topic2id)
      const node2 = topic2.get('node')
      map.Create.newSynapse.hide()
      self.renderSynapse(mapping, synapse, node1, node2, true)
    })
  }
}
return toExport
}

export default Synapse
