/* global $ */

/*
everthing in this file happens as a result of websocket events
*/

import { JUNTO_UPDATED } from './events'

import GlobalUI, { ReactApp } from '../../GlobalUI'
import Util from '../../Util'

export const juntoUpdated = (self, map) => state => {
  ReactApp.juntoState = state
  $(document).trigger(JUNTO_UPDATED)
}

/* All the following events are received through the nodejs realtime server
    and are done this way because they are transient data, not persisted to the server */
export const topicDragged = (self, map) => positions => {
  var topic
  var node

  if (map.Active.Map) {
    for (var key in positions) {
      topic = map.DataModel.Topics.get(key)
      if (topic) node = topic.get('node')
      if (node) node.pos.setc(positions[key].x, positions[key].y)
    } // for
    map.Visualize.mGraph.plot()
  }
}

export const peerCoordsUpdated = (self, map) => data => {
  if (!self.mappersOnMap[data.userid]) return
  self.mappersOnMap[data.userid].coords = {x: data.usercoords.x, y: data.usercoords.y}
  self.positionPeerIcon(data.userid)
}

export const lostMapper = (self, map) => data => {
  // data.userid
  // data.username
  delete self.mappersOnMap[data.userid]
  map.ChatView.sound.play('leavemap')
  // $('#mapper' + data.userid).remove()
  $('#compass' + data.userid).remove()
  map.ChatView.removeParticipant(map.ChatView.participants.findWhere({id: data.userid}))

  GlobalUI.notifyUser(data.username + ' just left the map')

  if ((self.inConversation && self.countOthersInConversation() === 0) ||
    (!self.inConversation && self.countOthersInConversation() === 1)) {
    self.callEnded()
  }
}

export const mapperListUpdated = (self, map) => data => {
  // data.userid
  // data.username
  // data.avatar

  self.mappersOnMap[data.userid] = {
    id: data.userid,
    name: data.username,
    username: data.username,
    image: data.avatar,
    color: Util.getPastelColor(),
    inConversation: data.userinconversation,
    coords: {
      x: 0,
      y: 0
    }
  }

  if (data.userid !== map.Active.Mapper.id) {
    map.ChatView.addParticipant(self.mappersOnMap[data.userid])
    if (data.userinconversation) map.ChatView.mapperJoinedCall(data.userid)

    // create a div for the collaborators compass
    self.createCompass(data.username, data.userid, data.avatar, self.mappersOnMap[data.userid].color)
  }
}

export const newMapper = (self, map) => data => {
  // data.userid
  // data.username
  // data.avatar
  // data.coords
  var firstOtherPerson = Object.keys(self.mappersOnMap).length === 0

  self.mappersOnMap[data.userid] = {
    id: data.userid,
    name: data.username,
    username: data.username,
    image: data.avatar,
    color: Util.getPastelColor(),
    coords: {
      x: 0,
      y: 0
    }
  }

  // create an item for them in the realtime box
  if (data.userid !== map.Active.Mapper.id) {
    map.ChatView.sound.play('joinmap')
    map.ChatView.addParticipant(self.mappersOnMap[data.userid])

    // create a div for the collaborators compass
    self.createCompass(data.username, data.userid, data.avatar, self.mappersOnMap[data.userid].color)

    var notifyMessage = data.username + ' just joined the map'
    if (firstOtherPerson) {
      notifyMessage += ' <button type="button" class="toast-button button">Suggest A Video Call</button>'
    }
    GlobalUI.notifyUser(notifyMessage)
    $('#toast button').click(e => self.inviteACall(data.userid))
    self.sendMapperInfo(data.userid)
  }
}

export const callAccepted = (self, map) => userid => {
  // const username = (self, map).mappersOnMap[userid].name
  GlobalUI.notifyUser('Conversation starting...')
  self.joinCall()
  map.ChatView.invitationAnswered(userid)
}

export const callDenied = (self, map) => userid => {
  var username = (self, map).mappersOnMap[userid].name
  GlobalUI.notifyUser(username + " didn't accept your invitation")
  map.ChatView.invitationAnswered(userid)
}

export const inviteDenied = (self, map) => userid => {
  var username = (self, map).mappersOnMap[userid].name
  GlobalUI.notifyUser(username + " didn't accept your invitation")
  map.ChatView.invitationAnswered(userid)
}

export const invitedToCall = (self, map) => inviter => {
  map.ChatView.sound.stop(self.soundId)
  self.soundId = map.ChatView.sound.play('sessioninvite')

  var username = (self, map).mappersOnMap[inviter].name
  var notifyText = '<img src="' + self['junto_spinner_darkgrey.gif'] + '" style="display: inline-block; margin-top: -12px; margin-bottom: -6px; vertical-align: top;" />'
  notifyText += username + ' is inviting you to a conversation. Join live?'
  notifyText += ' <button type="button" class="toast-button button yes">Yes</button>'
  notifyText += ' <button type="button" class="toast-button button btn-no no">No</button>'
  GlobalUI.notifyUser(notifyText, { leaveOpen: true })
  $('#toast button.yes').click(e => self.acceptCall(inviter))
  $('#toast button.no').click(e => self.denyCall(inviter))
}

export const invitedToJoin = (self, map) => inviter => {
  map.ChatView.sound.stop(self.soundId)
  self.soundId = map.ChatView.sound.play('sessioninvite')

  var username = (self, map).mappersOnMap[inviter].name
  var notifyText = username + ' is inviting you to the conversation. Join?'
  notifyText += ' <button type="button" class="toast-button button yes">Yes</button>'
  notifyText += ' <button type="button" class="toast-button button btn-no no">No</button>'
  GlobalUI.notifyUser(notifyText, { leaveOpen: true })
  $('#toast button.yes').click(e => self.joinCall())
  $('#toast button.no').click(e => self.denyInvite(inviter))
}

export const mapperJoinedCall = (self, map) => id => {
  var mapper = (self, map).mappersOnMap[id]
  if (mapper) {
    if (self.inConversation) {
      var username = mapper.name
      var notifyText = username + ' joined the call'
      GlobalUI.notifyUser(notifyText)
    }
    mapper.inConversation = true
    map.ChatView.mapperJoinedCall(id)
  }
}

export const mapperLeftCall = (self, map) => id => {
  var mapper = (self, map).mappersOnMap[id]
  if (mapper) {
    if (self.inConversation) {
      var username = mapper.name
      var notifyText = username + ' left the call'
      GlobalUI.notifyUser(notifyText)
    }
    mapper.inConversation = false
    map.ChatView.mapperLeftCall(id)
    if ((self.inConversation && self.countOthersInConversation() === 0) ||
      (!self.inConversation && self.countOthersInConversation() === 1)) {
      self.callEnded()
    }
  }
}

export const callInProgress = (self, map) => () => {
  var notifyText = "There's a conversation happening, want to join?"
  notifyText += ' <button type="button" class="toast-button button yes">Yes</button>'
  notifyText += ' <button type="button" class="toast-button button btn-no no">No</button>'
  GlobalUI.notifyUser(notifyText, { leaveOpen: true })
  $('#toast button.yes').click(e => self.joinCall())
  $('#toast button.no').click(e => GlobalUI.clearNotify())
  map.ChatView.conversationInProgress()
}

export const callStarted = (self, map) => () => {
  if (self.inConversation) return
  var notifyText = "There's a conversation starting, want to join?"
  notifyText += ' <button type="button" class="toast-button button">Yes</button>'
  notifyText += ' <button type="button" class="toast-button button btn-no">No</button>'
  GlobalUI.notifyUser(notifyText, { leaveOpen: true })
  $('#toast button.yes').click(e => self.joinCall())
  $('#toast button.no').click(e => GlobalUI.clearNotify())
  map.ChatView.conversationInProgress()
}
