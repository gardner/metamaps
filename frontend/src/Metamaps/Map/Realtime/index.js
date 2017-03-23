/* global $ */

import SimpleWebRTC from 'simplewebrtc'
import SocketIoConnection from 'simplewebrtc/socketioconnection'

import MessageCollection from '../../DataModel/MessageCollection'
import Util from '../../Util'
import Views from '../Views'
import ChatView from '../ChatView'
import { ReactApp } from '../../GlobalUI'
import JIT from '../JIT'

import {
  JUNTO_UPDATED,
  INVITED_TO_CALL,
  INVITED_TO_JOIN,
  CALL_ACCEPTED,
  CALL_DENIED,
  INVITE_DENIED,
  CALL_IN_PROGRESS,
  CALL_STARTED,
  MAPPER_LIST_UPDATED,
  MAPPER_JOINED_CALL,
  MAPPER_LEFT_CALL,
  NEW_MAPPER,
  LOST_MAPPER,
  PEER_COORDS_UPDATED,
  TOPIC_DRAGGED
} from './events'

import {
  invitedToCall,
  invitedToJoin,
  callAccepted,
  callDenied,
  inviteDenied,
  callInProgress,
  callStarted,
  mapperListUpdated,
  mapperJoinedCall,
  mapperLeftCall,
  peerCoordsUpdated,
  newMapper,
  lostMapper,
  topicDragged
} from './receivable'

import {
  joinMap,
  leaveMap,
  checkForCall,
  acceptCall,
  denyCall,
  denyInvite,
  inviteToJoin,
  inviteACall,
  joinCall,
  leaveCall,
  sendCoords,
  sendMapperInfo,
  dragTopic
} from './sendable'

const Realtime = (map) => {
  const toExport = {
    videoId: 'video-wrapper',
    webrtc: null,
    readyToCall: false,
    mappersOnMap: {},
    chatOpen: false,
    soundId: null,
    broadcastingStatus: false,
    inConversation: false,
    localVideo: null,
    onSocketConnect: () => {},
    startActiveMap: function() {
      var self = toExport
        if (map.Active.Map.authorizeToEdit(map.Active.Mapper)) {
          self.addJuntoListeners()
          if (Realtime.socket && !Realtime.socket.disconnected) self.onSocketConnect = self._onSocketConnect
          else self._onSocketConnect()
        }
        if (map.Active.Mapper) {
          self.setupChat() // chat can happen on public maps too
          map.Cable.subscribeToMap(map.Active.Map.id) // people with viewing rights can still see live updates
        }
    },
    endActiveMap: function() {
      var self = toExport
      $(document).off('.map')
      // leave the appropriate rooms to leave
      if (self.inConversation) self.leaveCall()
      self.leaveMap()
      $('.collabCompass').remove()
      if (self.room) self.room.leave()
      if (!Realtime.socket.disconnected) self.unsubscribeFromEvents()
      map.Cable.unsubscribeFromMap()
    },
    _onSocketConnect: function() {
      console.log('testing')
      const self = toExport
      const sendables = [
        ['joinMap', joinMap],
        ['leaveMap', leaveMap],
        ['checkForCall', checkForCall],
        ['acceptCall', acceptCall],
        ['denyCall', denyCall],
        ['denyInvite', denyInvite],
        ['inviteToJoin', inviteToJoin],
        ['inviteACall', inviteACall],
        ['joinCall', joinCall],
        ['leaveCall', leaveCall],
        ['sendMapperInfo', sendMapperInfo],
        ['sendCoords', sendCoords],
        ['dragTopic', dragTopic]
      ]
      sendables.forEach(sendable => {
        toExport[sendable[0]] = sendable[1](Realtime.socket, toExport, map)
      })
      self.webrtc = new SimpleWebRTC({
        connection: Realtime.socket,
        localVideoEl: self.videoId,
        remoteVideosEl: '',
        debug: true,
        detectSpeakingEvents: false, // true,
        autoAdjustMic: false, // true,
        autoRequestMedia: false,
        localVideo: {
          autoplay: true,
          mirror: true,
          muted: true
        },
        media: {
          video: true,
          audio: true
        },
        nick: map.Active.Mapper.id
      })
      self.webrtc.webrtc.on('iceFailed', function(peer) {
        console.log('local ice failure', peer)
        // local ice failure
      })
      self.webrtc.webrtc.on('connectivityError', function(peer) {
        console.log('remote ice failure', peer)
        // remote ice failure
      })
      var $video = $('<video></video>').attr('id', self.videoId)
      self.localVideo = {
        $video: $video,
        view: new Views.VideoView($video[0], $('body'), 'me', true, {
          DOUBLE_CLICK_TOLERANCE: 200,
          avatar: map.Active.Mapper ? map.Active.Mapper.get('image') : ''
        })
      }
      self.room = new Views.Room({
        webrtc: self.webrtc,
        room: 'map-' + map.Active.Map.id,
        $video: self.localVideo.$video,
        myVideoView: self.localVideo.view,
        config: { DOUBLE_CLICK_TOLERANCE: 200 }
      })
      self.room.videoAdded(self.handleVideoAdded)
      self.subscribeToEvents()
      self.turnOn()
      self.checkForCall()
      self.joinMap()
    },
    addJuntoListeners: function() {
      var self = toExport
      $(document).on(ChatView.events.openTray, function() {
        $('.main').addClass('compressed')
        self.chatOpen = true
        self.positionPeerIcons()
      })
      $(document).on(ChatView.events.closeTray, function() {
        $('.main').removeClass('compressed')
        self.chatOpen = false
        self.positionPeerIcons()
      })
      $(document).on(ChatView.events.videosOn, function() {
        $('#wrapper').removeClass('hideVideos')
      })
      $(document).on(ChatView.events.videosOff, function() {
        $('#wrapper').addClass('hideVideos')
      })
      $(document).on(ChatView.events.cursorsOn, function() {
        $('#wrapper').removeClass('hideCursors')
      })
      $(document).on(ChatView.events.cursorsOff, function() {
        $('#wrapper').addClass('hideCursors')
      })
    },
    turnOn: function(notify) {
      var self = toExport
      $('.collabCompass').show()
      self.activeMapper = {
        id: map.Active.Mapper.id,
        name: map.Active.Mapper.get('name'),
        username: map.Active.Mapper.get('name'),
        image: map.Active.Mapper.get('image'),
        color: Util.getPastelColor(),
        self: true
      }
      self.localVideo.view.$container.find('.video-cutoff').css({
        border: '4px solid ' + self.activeMapper.color
      })
      self.setupLocalEvents()
    },
    setupChat: function() {
      const self = toExport
      map.ChatView.setNewMap()
      map.ChatView.addParticipant(self.activeMapper)
      map.ChatView.addMessages(new MessageCollection(map.DataModel.Messages), true)
    },
    setupLocalEvents: function() {
      var self = toExport
      // local event listeners that trigger events
      $(document).on(JIT.events.zoom + '.map', self.positionPeerIcons)
      $(document).on(JIT.events.pan + '.map', self.positionPeerIcons)
      $(document).on('mousemove.map', function(event) {
        var pixels = {
          x: event.pageX,
          y: event.pageY
        }
        var coords = Util.pixelsToCoords(map.Visualize.mGraph, pixels)
        self.sendCoords(coords)
      })
      $(document).on(JIT.events.topicDrag + '.map', function(event, positions) {
        self.dragTopic(positions)
      })
    },
    subscribeToEvents: function() {
      // todo scope these event listeners to map
      const socket = Realtime.socket
      socket.on(INVITED_TO_CALL, invitedToCall(toExport, map))
      socket.on(INVITED_TO_JOIN, invitedToJoin(toExport, map))
      socket.on(CALL_ACCEPTED, callAccepted(toExport, map))
      socket.on(CALL_DENIED, callDenied(toExport, map))
      socket.on(INVITE_DENIED, inviteDenied(toExport, map))
      socket.on(CALL_IN_PROGRESS, callInProgress(toExport, map))
      socket.on(CALL_STARTED, callStarted(toExport, map))
      socket.on(MAPPER_LIST_UPDATED, mapperListUpdated(toExport, map))
      socket.on(MAPPER_JOINED_CALL, mapperJoinedCall(toExport, map))
      socket.on(MAPPER_LEFT_CALL, mapperLeftCall(toExport, map))
      socket.on(PEER_COORDS_UPDATED, peerCoordsUpdated(toExport, map))
      socket.on(NEW_MAPPER, newMapper(toExport, map))
      socket.on(LOST_MAPPER, lostMapper(toExport, map))
      socket.on(TOPIC_DRAGGED, topicDragged(toExport, map))
    },
    unsubscribeFromEvents: function() {
      // todo scope these event listeners to map
      const socket = Realtime.socket
      socket.off(INVITED_TO_JOIN)
      socket.off(CALL_ACCEPTED)
      socket.off(INVITED_TO_CALL)
      socket.off(CALL_DENIED)
      socket.off(INVITE_DENIED)
      socket.off(CALL_IN_PROGRESS)
      socket.off(CALL_STARTED)
      socket.off(MAPPER_LIST_UPDATED)
      socket.off(MAPPER_JOINED_CALL)
      socket.off(MAPPER_LEFT_CALL)
      socket.off(PEER_COORDS_UPDATED)
      socket.off(NEW_MAPPER)
      socket.off(LOST_MAPPER)
      socket.off(TOPIC_DRAGGED)
    },
    countOthersInConversation: function() {
      var self = toExport
      var count = 0
      for (var key in self.mappersOnMap) {
        if (self.mappersOnMap[key].inConversation) count++
      }
      return count
    },
    handleVideoAdded: function(v, id) {
      var self = toExport
      self.positionVideos()
      v.setParent($('#wrapper'))
      v.$container.find('.video-cutoff').css({
        border: '4px solid ' + self.mappersOnMap[id].color
      })
      $('#wrapper').append(v.$container)
    },
    positionVideos: function() {
      var self = toExport
      var videoIds = Object.keys(self.room.videos)
      // var numOfVideos = videoIds.length
      // var numOfVideosToPosition = _.filter(videoIds, function(id) {
      //   return !self.room.videos[id].manuallyPositioned
      // }).length

      var screenHeight = $(document).height()
      var topExtraPadding = 20
      var topPadding = 30
      var leftPadding = 30
      var videoHeight = 150
      var videoWidth = 180
      var column = 0
      var row = 0
      var yFormula = function() {
        var y = topExtraPadding + (topPadding + videoHeight) * row + topPadding
        if (y + videoHeight > screenHeight) {
          row = 0
          column += 1
          y = yFormula()
        }
        row++
        return y
      }
      var xFormula = function() {
        var x = (leftPadding + videoWidth) * column + leftPadding
        return x
      }

      // do self first
      var myVideo = toExport.localVideo.view
      if (!myVideo.manuallyPositioned) {
        myVideo.$container.css({
          top: yFormula() + 'px',
          left: xFormula() + 'px'
        })
      }
      videoIds.forEach(function(id) {
        var video = self.room.videos[id]
        if (!video.manuallyPositioned) {
          video.$container.css({
            top: yFormula() + 'px',
            left: xFormula() + 'px'
          })
        }
      })
    },
    callEnded: function() {
      var self = toExport

      map.ChatView.conversationEnded()
      self.room.leaveVideoOnly()
      self.inConversation = false
      self.localVideo.view.$container.hide().css({
        top: '72px',
        left: '30px'
      })
      self.localVideo.view.audioOn()
      self.localVideo.view.videoOn()
    },
    createCompass: function(name, id, image, color) {
      var str = '<img width="28" height="28" src="' + image + '" /><p>' + name + '</p>'
      str += '<div id="compassArrow' + id + '" class="compassArrow"></div>'
      $('#compass' + id).remove()
      $('<div/>', {
        id: 'compass' + id,
        class: 'collabCompass'
      }).html(str).appendTo('#wrapper')
      $('#compass' + id + ' img').css({
        'border': '2px solid ' + color
      })
      $('#compass' + id + ' p').css({
        'background-color': color
      })
    },
    positionPeerIcons: function() {
      var self = toExport
      for (var key in self.mappersOnMap) {
        self.positionPeerIcon(key)
      }
    },
    positionPeerIcon: function(id) {
      var self = toExport
      var mapper = self.mappersOnMap[id]

      var origPixels = Util.coordsToPixels(map.Visualize.mGraph, mapper.coords)
      var pixels = self.limitPixelsToScreen(origPixels)
      $('#compass' + id).css({
        left: pixels.x + 'px',
        top: pixels.y + 'px'
      })
      /* showing the arrow if the collaborator is off of the viewport screen */
      if (origPixels.x !== pixels.x || origPixels.y !== pixels.y) {
        var dy = origPixels.y - pixels.y // opposite
        var dx = origPixels.x - pixels.x // adjacent
        var angle = Math.atan2(dy, dx)

        $('#compassArrow' + id).show().css({
          transform: 'rotate(' + angle + 'rad)',
          '-webkit-transform': 'rotate(' + angle + 'rad)'
        })

        if (dx > 0) {
          $('#compass' + id).addClass('labelLeft')
        }
      } else {
        $('#compassArrow' + id).hide()
        $('#compass' + id).removeClass('labelLeft')
      }
    },
    limitPixelsToScreen: function(pixels) {
      var self = toExport

      var boundary = self.chatOpen ? '#wrapper' : document
      var xLimit, yLimit
      var xMax = $(boundary).width()
      var yMax = $(boundary).height()
      var compassDiameter = 56
      var compassArrowSize = 24

      xLimit = Math.max(0 + compassArrowSize, pixels.x)
      xLimit = Math.min(xLimit, xMax - compassDiameter)
      yLimit = Math.max(0 + compassArrowSize, pixels.y)
      yLimit = Math.min(yLimit, yMax - compassDiameter)

      return {x: xLimit, y: yLimit}
    }
  }
  return toExport
}

Realtime.init = function(serverData) {
  var self = Realtime
  self.socket = new SocketIoConnection({
    url: serverData['REALTIME_SERVER'],
    socketio: {
      // don't poll forever if in development
      reconnectionAttempts: serverData.RAILS_ENV === 'development' ? 5 : Infinity
    }
  })
  self['junto_spinner_darkgrey.gif'] = serverData['junto_spinner_darkgrey.gif']
  self.socket.on('connect', function() {
    console.log('connected')
    self.socket.on(JUNTO_UPDATED, (state) => {
      ReactApp.juntoState = state
      ReactApp.render()
    })
    self.disconnected = false
    ReactApp.openMap && ReactApp.openMap.Realtime.onSocketConnect()
  })
  self.socket.on('disconnect', function() {
    self.disconnected = true
  })
}


export default Realtime
