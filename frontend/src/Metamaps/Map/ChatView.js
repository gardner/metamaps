/* global $ */

import Backbone from 'backbone'
import { Howl } from 'howler'

import ReactApp from '../GlobalUI/ReactApp'
import MessageCollection from '../DataModel/MessageCollection'

const ChatView = (map) => {
const toExport =  {
  isOpen: false,
  unreadMessages: 0,
  messages: new Backbone.Collection(),
  conversationLive: false,
  isParticipating: false,
  setNewMap: function() {
    const self = toExport
    self.unreadMessages = 0
    self.isOpen = false
    self.conversationLive = false
    self.isParticipating = false
    self.alertSound = true // whether to play sounds on arrival of new messages or not
    self.cursorsShowing = true
    self.videosShowing = true
    self.participants = new Backbone.Collection()
    self.messages = new Backbone.Collection()
    self.render()
  },
  render: () => {
    if (!map.Active.Map) return
    const self = toExport
    ReactApp.render()
  },
  onOpen: () => {
    const self = toExport
    self.isOpen = true
    self.unreadMessages = 0
    self.render()
    $(document).trigger(ChatView.events.openTray)
  },
  onClose: () => {
    const self = toExport
    self.isOpen = false
    $(document).trigger(ChatView.events.closeTray)
  },
  addParticipant: participant => {
    toExport.participants.add(participant)
    toExport.render()
  },
  removeParticipant: participant => {
    toExport.participants.remove(participant)
    toExport.render()
  },
  leaveConversation: () => {
    toExport.isParticipating = false
    toExport.render()
  },
  mapperJoinedCall: id => {
    const mapper = toExport.participants.findWhere({id})
    mapper && mapper.set('isParticipating', true)
    toExport.render()
  },
  mapperLeftCall: id => {
    const mapper = toExport.participants.findWhere({id})
    mapper && mapper.set('isParticipating', false)
    toExport.render()
  },
  invitationPending: id => {
    const mapper = toExport.participants.findWhere({id})
    mapper && mapper.set('isPending', true)
    toExport.render()
  },
  invitationAnswered: id => {
    const mapper = toExport.participants.findWhere({id})
    mapper && mapper.set('isPending', false)
    toExport.render()
  },
  conversationInProgress: participating => {
    toExport.conversationLive = true
    toExport.isParticipating = participating
    toExport.render()
  },
  conversationEnded: () => {
    toExport.conversationLive = false
    toExport.isParticipating = false
    toExport.participants.forEach(p => p.set({isParticipating: false, isPending: false}))
    toExport.render()
  },
  videoToggleClick: function() {
    toExport.videosShowing = !toExport.videosShowing
    $(document).trigger(toExport.videosShowing ? ChatView.events.videosOn : ChatView.events.videosOff)
  },
  cursorToggleClick: function() {
    toExport.cursorsShowing = !toExport.cursorsShowing
    $(document).trigger(toExport.cursorsShowing ? ChatView.events.cursorsOn : ChatView.events.cursorsOff)
  },
  soundToggleClick: function() {
    toExport.alertSound = !toExport.alertSound
  },
  inputFocus: () => {
    $(document).trigger(ChatView.events.inputFocus)
  },
  inputBlur: () => {
    $(document).trigger(ChatView.events.inputBlur)
  },
  addMessage: (message, isInitial, wasMe) => {
    const self = toExport
    if (!isInitial && !self.isOpen) self.unreadMessages += 1
    if (!wasMe && !isInitial && self.alertSound) ChatView.sound.play('receivechat')
    self.messages.add(message)
    if (!isInitial && self.isOpen) self.render()
  },
  sendChatMessage: message => {
    var self = toExport
    if (toExport.alertSound) ChatView.sound.play('sendchat')
    var m = new DataModel.Message({
      message: message.message,
      resource_id: map.Active.Map.id,
      resource_type: 'Map'
    })
    m.save(null, {
      success: function(model, response) {
        self.addMessages(new MessageCollection(model), false, true)
      },
      error: function(model, response) {
        console.log('error!', response)
      }
    })
  },
  handleInputMessage: text => {
    toExport.sendChatMessage({message: text})
  },
  // they should be instantiated as backbone models before they get
  // passed to this function
  addMessages: (messages, isInitial, wasMe) => {
    messages.models.forEach(m => toExport.addMessage(m, isInitial, wasMe))
  }
}
return toExport
}
/**
 * @class
 * @static
 */
ChatView.events = {
  openTray: 'ChatView:openTray',
  closeTray: 'ChatView:closeTray',
  inputFocus: 'ChatView:inputFocus',
  inputBlur: 'ChatView:inputBlur',
  cursorsOff: 'ChatView:cursorsOff',
  cursorsOn: 'ChatView:cursorsOn',
  videosOff: 'ChatView:videosOff',
  videosOn: 'ChatView:videosOn'
}
ChatView.init = function(urls) {
  ChatView.sound = new Howl({
    src: urls,
    sprite: {
      joinmap: [0, 561],
      leavemap: [1000, 592],
      receivechat: [2000, 318],
      sendchat: [3000, 296],
      sessioninvite: [4000, 5393, true]
    }
  })
}

export default ChatView
