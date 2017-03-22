/* global $ */

import outdent from 'outdent'
import { find as _find } from 'lodash'
import { browserHistory } from 'react-router'

import Active from '../Active'
import AutoLayout from '../AutoLayout'
import Cable from '../Cable'
import Control from '../Control'
import Create from '../Create'
import DataModel from '../DataModel'
import DataModelMap from '../DataModel/Map'
import MapperCollection from '../DataModel/MapperCollection'
import TopicCollection from '../DataModel/TopicCollection'
import SynapseCollection from '../DataModel/SynapseCollection'
import MappingCollection from '../DataModel/MappingCollection'
import Filter from '../Filter'
import GlobalUI, { ReactApp } from '../GlobalUI'
import Import from '../Import'
import InfoBox from './InfoBox'
import JIT from '../JIT'
import Listeners from '../Listeners'
import Loading from '../Loading'
import Mouse from '../Mouse'
import Organize from '../Organize'
import PasteInput from '../PasteInput'
import Realtime from '../Realtime'
import Selected from '../Selected'
import Synapse from '../Synapse'
import SynapseCard from '../SynapseCard'
import Topic from '../Topic'
import TopicCard from '../Views/TopicCard'
import ChatView from '../Views/ChatView'
import Visualize from '../Visualize'

import CheatSheet from './CheatSheet'

const mapControl = {
  launch: function(id, serverData) {
    var dataIsReadySetupMap = function(data) {
      const newMap = {
        Active: null,
        AutoLayout: null,
        Cable: null,
        ChatView: null,
        Control: null,
        Create: null,
        DataModel: null,
        Filter: null,
        Import: null,
        JIT: null,
        Listeners: null,
        Mouse: null,
        Organize: null,
        PasteInput: null,
        Realtime: null,
        Selected: null,
        Synapse: null,
        SynapseCard: null,
        Topic: null,
        TopicCard: null,
        Visualize: null
      }
      newMap.Active = Active()
      newMap.AutoLayout = AutoLayout(newMap)
      newMap.Cable = Cable(newMap)
      newMap.ChatView = ChatView(newMap)
      newMap.Control = Control(newMap)
      newMap.Create = Create(newMap)
      newMap.DataModel = DataModel(newMap)
      newMap.Filter = Filter(newMap)
      newMap.Import = Import(newMap)
      newMap.InfoBox = InfoBox(newMap)
      newMap.JIT = JIT(newMap)
      newMap.Listeners = Listeners(newMap)
      newMap.Map = Map(newMap)
      newMap.Mouse = Mouse(newMap)
      newMap.Organize = Organize(newMap)
      newMap.PasteInput = PasteInput(newMap)
      newMap.Realtime = Realtime(newMap)
      newMap.Selected = Selected(newMap)
      newMap.Synapse = Synapse(newMap)
      newMap.SynapseCard = SynapseCard(newMap)
      newMap.Topic = Topic(newMap)
      newMap.TopicCard = TopicCard(newMap)
      newMap.Visualize = Visualize(newMap)
      
      console.log(newMap)

      newMap.Active.Map = new DataModelMap(data.map)
      newMap.DataModel.Mappers = new MapperCollection(data.mappers)
      newMap.DataModel.Collaborators = new MapperCollection(data.collaborators)
      newMap.DataModel.Topics = new TopicCollection(data.topics)
      newMap.DataModel.Synapses = new SynapseCollection(data.synapses)
      newMap.DataModel.Mappings = new MappingCollection(data.mappings)
      newMap.DataModel.Messages = data.messages
      newMap.DataModel.Stars = data.stars
      newMap.DataModel.attachCollectionEvents()
      newMap.Map.requests = data.requests
      newMap.Map.setAccessRequest()
      newMap.Visualize.type = 'ForceDirected'
      newMap.JIT.prepareVizData()
      newMap.InfoBox.load()
      newMap.Filter.checkMetacodes()
      newMap.Filter.checkSynapses()
      newMap.Filter.checkMappers()
      newMap.Realtime.startActiveMap()
      Loading.hide()
      document.title = newMap.Active.Map.get('name') + ' | Metamaps'
      ReactApp.openMap = newMap
      ReactApp.mobileTitle = newMap.Active.Map.get('name')
      ReactApp.render()
    }
    if (false) {
      // do something with serverData here
      dataIsReadySetupMap()
    }
    else {
      Loading.show()
      $.ajax({
        url: '/maps/' + id + '/contains.json',
        success: dataIsReadySetupMap
      })
    }
  },
  end: function(map) {
    $('.main').removeClass('compressed')
    $('.rightclickmenu').remove()
    map.AutoLayout.resetSpiral()
    map.TopicCard.hideCard()
    map.SynapseCard.hideCard()
    map.Create.newTopic.hide(true) // true means force (and override pinned)
    map.Create.newSynapse.hide()
    map.InfoBox.close()
    map.Realtime.endActiveMap()
    map.Map.requests = []
    map.Map.hasLearnedTopicCreation = true
  }
}
export { mapControl }

const Map = ({Active, DataModel, JIT, Visualize, Realtime}) => {
  const toExport = {
    mapIsStarred: false,
    requests: [],
    userRequested: false,
    requestAnswered: false,
    requestApproved: false,
    hasLearnedTopicCreation: true,
    init: function(serverData) {
      var self = toExport
      self.mapIsStarred = serverData.mapIsStarred
      self.requests = serverData.requests
      self.setAccessRequest()
      $('#wrapper').mousedown(function(e) {
        if (e.button === 1) return false
      })
      GlobalUI.CreateMap.emptyForkMapForm = $('#fork_map').html()
      //InfoBox.init(serverData, function updateThumbnail() {
      //  self.uploadMapScreenshot()
      //})
      CheatSheet.init(serverData)
      $(document).on(Map.events.editedByActiveMapper, self.editedByActiveMapper)
    },
    setHasLearnedTopicCreation: function(value) {
      const self = toExport
      self.hasLearnedTopicCreation = value
      ReactApp.render()
    },
    requestAccess: function() {
      const self = toExport
      self.requests.push({
        user_id: Active.Mapper.id,
        answered: false,
        approved: false
      })
      self.setAccessRequest()
      const mapId = Active.Map.id
      $.post({
        url: `/maps/${mapId}/access_request`
      })
      GlobalUI.notifyUser('Map creator will be notified of your request')
    },
    setAccessRequest: function() {
      const self = toExport
      if (Active.Mapper) {
        const request = _find(self.requests, r => r.user_id === Active.Mapper.id)
        if (!request) {
          self.userRequested = false
          self.requestAnswered = false
          self.requestApproved = false
        }
        else if (request && !request.answered) {
          self.userRequested = true
          self.requestAnswered = false
          self.requestApproved = false
        }
        else if (request && request.answered && !request.approved) {
          self.userRequested = true
          self.requestAnswered = true
          self.requestApproved = false
        }
      }
      ReactApp.render()
    },
    star: function() {
      var self = toExport

      if (!Active.Map) return
      $.post('/maps/' + Active.Map.id + '/star')
      DataModel.Stars.push({ user_id: Active.Mapper.id, map_id: Active.Map.id })
      DataModel.Maps.Starred.add(Active.Map)
      GlobalUI.notifyUser('Map is now starred')
      self.mapIsStarred = true
      ReactApp.render()
    },
    unstar: function() {
      var self = toExport

      if (!Active.Map) return
      $.post('/maps/' + Active.Map.id + '/unstar')
      DataModel.Stars = DataModel.Stars.filter(function(s) { return s.user_id !== Active.Mapper.id })
      DataModel.Maps.Starred.remove(Active.Map)
      self.mapIsStarred = false
      ReactApp.render()
    },
    fork: function() {
      GlobalUI.openLightbox('forkmap')

      let nodesData = ''
      let synapsesData = ''
      let nodesArray = []
      let synapsesArray = []
      // collect the unfiltered topics
      Visualize.mGraph.graph.eachNode(function(n) {
        // if the opacity is less than 1 then it's filtered
        if (n.getData('alpha') === 1) {
          var id = n.getData('topic').id
          nodesArray.push(id)
          let x, y
          if (n.pos.x && n.pos.y) {
            x = n.pos.x
            y = n.pos.y
          } else {
            x = Math.cos(n.pos.theta) * n.pos.rho
            y = Math.sin(n.pos.theta) * n.pos.rho
          }
          nodesData += id + '/' + x + '/' + y + ','
        }
      })
      // collect the unfiltered synapses
      DataModel.Synapses.each(function(synapse) {
        var desc = synapse.get('desc')

        var descNotFiltered = Filter.visible.synapses.indexOf(desc) > -1
        // make sure that both topics are being added, otherwise, it
        // doesn't make sense to add the synapse
        var topicsNotFiltered = nodesArray.indexOf(synapse.get('topic1_id')) > -1
        topicsNotFiltered = topicsNotFiltered && nodesArray.indexOf(synapse.get('topic2_id')) > -1
        if (descNotFiltered && topicsNotFiltered) {
          synapsesArray.push(synapse.id)
        }
      })

      synapsesData = synapsesArray.join()
      nodesData = nodesData.slice(0, -1)

      GlobalUI.CreateMap.topicsToMap = nodesData
      GlobalUI.CreateMap.synapsesToMap = synapsesData
    },
    leavePrivateMap: function() {
      var map = Active.Map
      DataModel.Maps.Active.remove(map)
      DataModel.Maps.Featured.remove(map)
      browserHistory.push('/')
      GlobalUI.notifyUser('Sorry! That map has been changed to Private.')
    },
    cantEditNow: function() {
      Realtime.turnOff(true) // true is for 'silence'
      GlobalUI.notifyUser('Map was changed to Public. Editing is disabled.')
      Active.Map.trigger('changeByOther')
    },
    canEditNow: function() {
      var confirmString = "You've been granted permission to edit this map. "
      confirmString += 'Do you want to reload and enable realtime collaboration?'
      var c = window.confirm(confirmString)
      if (c) {
        window.location.reload()
      }
    },
    editedByActiveMapper: function() {
      if (Active.Mapper) {
        DataModel.Mappers.add(Active.Mapper)
      }
    },
    offerScreenshotDownload: () => {
      const canvas = toExport.getMapCanvasForScreenshots()
      const filename = toExport.getMapScreenshotFilename(Active.Map)

      var downloadMessage = outdent`
        Captured map screenshot!
        <a id="map-screenshot-download-link"
           href="${canvas.canvas.toDataURL()}"
           download="${filename}"
        >
          DOWNLOAD
        </a>`
      GlobalUI.notifyUser(downloadMessage)
    },
    uploadMapScreenshot: () => {
      const canvas = toExport.getMapCanvasForScreenshots()
      const filename = toExport.getMapScreenshotFilename(Active.Map)

      canvas.canvas.toBlob(imageBlob => {
        const formData = new window.FormData()
        formData.append('map[screenshot]', imageBlob, filename)
        $.ajax({
          type: 'PATCH',
          dataType: 'json',
          url: `/maps/${Active.Map.id}`,
          data: formData,
          processData: false,
          contentType: false,
          success: function(data) {
            GlobalUI.notifyUser('Successfully updated map screenshot.')
          },
          error: function() {
            GlobalUI.notifyUser('Failed to update map screenshot.')
          }
        })
      })
    },
    getMapCanvasForScreenshots: () => {
      var canvas = {}

      canvas.canvas = document.createElement('canvas')
      canvas.canvas.width = 1880 // 960
      canvas.canvas.height = 1260 // 630

      canvas.scaleOffsetX = 1
      canvas.scaleOffsetY = 1
      canvas.translateOffsetY = 0
      canvas.translateOffsetX = 0
      canvas.denySelected = true

      canvas.getSize = function() {
        if (this.size) return this.size
        var canvas = this.canvas
        this.size = {
          width: canvas.width,
          height: canvas.height
        }
        return this.size
      }
      canvas.scale = function(x, y) {
        const px = this.scaleOffsetX * x
        const py = this.scaleOffsetY * y
        const dx = this.translateOffsetX * (x - 1) / px
        const dy = this.translateOffsetY * (y - 1) / py
        this.scaleOffsetX = px
        this.scaleOffsetY = py
        this.getCtx().scale(x, y)
        this.translate(dx, dy)
      }
      canvas.translate = function(x, y) {
        const sx = this.scaleOffsetX
        const sy = this.scaleOffsetY
        this.translateOffsetX += x * sx
        this.translateOffsetY += y * sy
        this.getCtx().translate(x, y)
      }
      canvas.getCtx = function() {
        return this.canvas.getContext('2d')
      }
      // center it
      canvas.getCtx().translate(1880 / 2, 1260 / 2)

      var mGraph = Visualize.mGraph

      var id = mGraph.root
      var root = mGraph.graph.getNode(id)
      var T = !!root.visited

      // pass true to avoid basing it on a selection
      JIT.zoomExtents(null, canvas, true)

      const c = canvas.canvas
      const ctx = canvas.getCtx()
      const scale = canvas.scaleOffsetX

      // draw a grey background
      ctx.fillStyle = '#d8d9da'
      const xPoint = (-(c.width / scale) / 2) - (canvas.translateOffsetX / scale)
      const yPoint = (-(c.height / scale) / 2) - (canvas.translateOffsetY / scale)
      ctx.fillRect(xPoint, yPoint, c.width / scale, c.height / scale)

      // draw the graph
      mGraph.graph.eachNode(function(node) {
        var nodeAlpha = node.getData('alpha')
        node.eachAdjacency(function(adj) {
          var nodeTo = adj.nodeTo
          if (!!nodeTo.visited === T && node.drawn && nodeTo.drawn) {
            mGraph.fx.plotLine(adj, canvas)
          }
        })
        if (node.drawn) {
          mGraph.fx.plotNode(node, canvas)
        }
        if (!mGraph.labelsHidden) {
          if (node.drawn && nodeAlpha >= 0.95) {
            mGraph.labels.plotLabel(canvas, node)
          } else {
            mGraph.labels.hideLabel(node, false)
          }
        }
        node.visited = !T
      })

      return canvas
    },
    getMapScreenshotFilename: map => {
      var today = new Date()
      var dd = today.getDate()
      var mm = today.getMonth() + 1 // January is 0!
      var yyyy = today.getFullYear()
      if (dd < 10) {
        dd = '0' + dd
      }
      if (mm < 10) {
        mm = '0' + mm
      }
      today = mm + '/' + dd + '/' + yyyy

      var mapName = map.get('name').split(' ').join(['-'])
      const filename = `metamap-${map.id}-${mapName}-${today}.png`
      return filename
    }
  }
  return toExport
}
Map.events = {
  editedByActiveMapper: 'Metamaps:Map:events:editedByActiveMapper'
}

export { CheatSheet }
export default Map
