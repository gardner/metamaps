/* global $ */

import GlobalUI from '../../GlobalUI'

import {
  JOIN_MAP,
  LEAVE_MAP,
  CHECK_FOR_CALL,
  ACCEPT_CALL,
  DENY_CALL,
  DENY_INVITE,
  INVITE_TO_JOIN,
  INVITE_A_CALL,
  JOIN_CALL,
  LEAVE_CALL,
  SEND_MAPPER_INFO,
  SEND_COORDS,
  DRAG_TOPIC
} from './events'

export const joinMap = (socket, self, map) => () => {
  socket.emit(JOIN_MAP, {
    userid: map.Active.Mapper.id,
    username: map.Active.Mapper.get('name'),
    avatar: map.Active.Mapper.get('image'),
    mapid: map.Active.Map.id,
    map: map.Active.Map.attributes
  })
}

export const leaveMap = (socket, self, map) => () => {
  socket.emit(LEAVE_MAP)
}

export const checkForCall = (socket, self, map) => () => {
  socket.emit(CHECK_FOR_CALL, { room: self.room.room, mapid: map.Active.Map.id })
}

export const sendMapperInfo = (socket, self, map) => userid => {
  // send this new mapper back your details, and the awareness that you've loaded the map
  var update = {
    userToNotify: userid,
    username: map.Active.Mapper.get('name'),
    avatar: map.Active.Mapper.get('image'),
    userid: map.Active.Mapper.id,
    userinconversation: self.inConversation,
    mapid: map.Active.Map.id
  }
  socket.emit(SEND_MAPPER_INFO, update)
}

export const joinCall = (socket, self, map) => () => {
  self.webrtc.off('readyToCall')
  self.webrtc.once('readyToCall', function() {
    self.videoInitialized = true
    self.readyToCall = true
    self.localVideo.view.manuallyPositioned = false
    self.positionVideos()
    self.localVideo.view.$container.show()
    if (self.localVideo) {
      $('#wrapper').append(self.localVideo.view.$container)
    }
    self.room.join()
    map.ChatView.conversationInProgress(true)
  })
  self.inConversation = true
  socket.emit(JOIN_CALL, {
    mapid: map.Active.Map.id,
    id: map.Active.Mapper.id
  })
  self.webrtc.startLocalVideo()
  GlobalUI.clearNotify()
  map.ChatView.mapperJoinedCall(map.Active.Mapper.id)
}

export const leaveCall = (socket, self, map) => () => {
  socket.emit(LEAVE_CALL, {
    mapid: map.Active.Map.id,
    id: map.Active.Mapper.id
  })

  map.ChatView.mapperLeftCall(map.Active.Mapper.id)
  map.ChatView.leaveConversation() // the conversation will carry on without you
  self.room.leaveVideoOnly()
  self.inConversation = false
  self.localVideo.view.$container.hide()

  // if there's only two people in the room, and we're leaving
  // we should shut down the call locally
  if (self.countOthersInConversation() === 1) {
    self.callEnded()
  }
}

export const acceptCall = (socket, self, map) => userid => {
  map.ChatView.sound.stop(self.soundId)
  socket.emit(ACCEPT_CALL, {
    mapid: map.Active.Map.id,
    invited: map.Active.Mapper.id,
    inviter: userid
  })
  $.post('/maps/' + map.Active.Map.id + '/events/conversation')
  self.joinCall()
  GlobalUI.clearNotify()
}

export const denyCall = (socket, self, map) => userid => {
  map.ChatView.sound.stop(self.soundId)
  socket.emit(DENY_CALL, {
    mapid: map.Active.Map.id,
    invited: map.Active.Mapper.id,
    inviter: userid
  })
  GlobalUI.clearNotify()
}

export const denyInvite = (socket, self, map) => userid => {
  map.ChatView.sound.stop(self.soundId)
  socket.emit(DENY_INVITE, {
    mapid: map.Active.Map.id,
    invited: map.Active.Mapper.id,
    inviter: userid
  })
  GlobalUI.clearNotify()
}

export const inviteACall = (socket, self, map) => userid => {
  socket.emit(INVITE_A_CALL, {
    mapid: map.Active.Map.id,
    inviter: map.Active.Mapper.id,
    invited: userid
  })
  map.ChatView.invitationPending(userid)
  GlobalUI.clearNotify()
}

export const inviteToJoin = (socket, self, map) => userid => {
  socket.emit(INVITE_TO_JOIN, {
    mapid: map.Active.Map.id,
    inviter: map.Active.Mapper.id,
    invited: userid
  })
  map.ChatView.invitationPending(userid)
}

export const sendCoords = (socket, self, map) => coords => {
  var m = map.Active.Map
  var mapper = map.Active.Mapper
  if (m && m.authorizeToEdit(mapper)) {
    var update = {
      usercoords: coords,
      userid: map.Active.Mapper.id,
      mapid: m.id
    }
    socket.emit(SEND_COORDS, update)
  }
}

export const dragTopic = (socket, self, map) => positions => {
  if (map.Active.Map) {
    positions.mapid = map.Active.Map.id
    socket.emit(DRAG_TOPIC, positions)
  }
}
