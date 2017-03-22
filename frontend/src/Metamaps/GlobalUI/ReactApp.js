/* global $ */

import React from 'react'
import ReactDOM from 'react-dom'
import { Router, browserHistory } from 'react-router'
import { merge } from 'lodash'

import { notifyUser } from './index.js'
import ImportDialog from './ImportDialog'
import Mapper from '../DataModel/Mapper'
import ExploreMaps from '../ExploreMaps'
import { mapControl } from '../Map'
import { topicControl } from '../Topic'
import makeRoutes from '../../components/makeRoutes'
let routes

// 220 wide + 16 padding on both sides
const MAP_WIDTH = 252
const MOBILE_VIEW_BREAKPOINT = 504
const MOBILE_VIEW_PADDING = 40
const MAX_COLUMNS = 4

const ReactApp = {
  serverData: {},
  currentUser: null,
  mapId: null,
  openMap: null,
  topicId: null,
  openTopic: null,
  unreadNotificationsCount: 0,
  mapsWidth: 0,
  toast: '',
  mobile: false,
  mobileTitle: '',
  mobileTitleWidth: 0,
  metacodeSets: [],
  juntoState: { connectedPeople: {}, liveMaps: {} },
  init: function(serverData, openLightbox) {
    const self = ReactApp
    self.serverData = serverData
    self.currentUser = new Mapper(serverData.ActiveMapper)
    self.unreadNotificationsCount = serverData.unreadNotificationsCount
    self.mobileTitle = serverData.mobileTitle
    self.openLightbox = openLightbox
    self.metacodeSets = serverData.metacodeSets
    routes = makeRoutes(serverData.ActiveMapper)
    self.resize()
    window && window.addEventListener('resize', self.resize)
  },
  handleUpdate: function(location) {
    const self = ReactApp
    const pathname = this.state.location.pathname
    switch (pathname.split('/')[1]) {
      case '':
        if (self.currentUser && self.currentUser.id) {
          $('#yield').hide()
          ExploreMaps.updateFromPath(pathname)
          self.mapId = null
          self.topicId = null
          self.openMap = null
          self.openTopic = null
        }
        break
      case 'explore':
        $('#yield').hide()
        ExploreMaps.updateFromPath(pathname)
        self.mapId = null
        self.topicId = null
        self.openMap = null
        self.openTopic = null
        break
      case 'topics':
        $('#yield').hide()
        self.openMap = null
        self.mapId = null
        self.topicId = pathname.split('/')[2]
        break
      case 'maps':
        if (!pathname.includes('request_access')) {
          $('#yield').hide()
          self.openTopic = null
          self.topicId = null
          self.mapId = pathname.split('/')[2]
        }
        break
      default:
        $('#yield').show()
        break
    }
    self.render()
    window.ga && window.ga('send', 'pageview', pathname)
  },
  render: function() {
    const self = ReactApp
    const createElement = (Component, props) => <Component {...props} {...self.getProps()}/>
    const app = <Router createElement={createElement} routes={routes} history={browserHistory} onUpdate={self.handleUpdate} />
    ReactDOM.render(app, document.getElementById('react-app'))
  },
  getProps: function() {
    const self = ReactApp
    return merge({
      unreadNotificationsCount: self.unreadNotificationsCount,
      currentUser: self.currentUser,
      toast: self.toast,
      mobile: self.mobile,
      mobileTitle: self.mobileTitle,
      mobileTitleWidth: self.mobileTitleWidth,
      mobileTitleClick: (e) => self.openMap && self.openMap.InfoBox.toggleBox(e),
      openInviteLightbox: () => self.openLightbox('invite'),
      serverData: self.serverData,
      endActiveMap: mapControl.end,
      launchNewMap: mapControl.launch,
      mapId: self.mapId,
      topicId: self.topicId
    },
    self.getMapProps(),
    self.getTopicProps(),
    self.getFilterProps(),
    self.getCommonProps(),
    self.getMapsProps(),
    self.getTopicCardProps(),
    self.getChatProps())
  },
  getMapProps: function() {
    const self = ReactApp
    if (!self.openMap) return {}
    return {
      map: self.openMap.Active.Map,
      hasLearnedTopicCreation: self.openMap.Map.hasLearnedTopicCreation,
      userRequested: self.openMap.Map.userRequested,
      requestAnswered: self.openMap.Map.requestAnswered,
      requestApproved: self.openMap.Map.requestApproved,
      onRequestAccess: self.openMap.Map.requestAccess,
      mapIsStarred: self.openMap.Map.mapIsStarred,
      toggleMapInfoBox: self.openMap.InfoBox.toggleBox,
      infoBoxHtml: self.openMap.InfoBox.html,
      openImportLightbox: () => ImportDialog.show(),
      forkMap: self.openMap.Map.fork,
      onMapStar: self.openMap.Map.star,
      onMapUnstar: self.openMap.Map.unstar
    }
  },
  getCommonProps: function() {
    const self = ReactApp
    if (!(self.openMap || self.openTopic)) return {}
    const { JIT, Visualize } = self.openMap || self.openTopic
    return {
      openHelpLightbox: () => self.openLightbox('cheatsheet'),
      onZoomExtents: event => JIT.zoomExtents(event, Visualize.mGraph.canvas),
      onZoomIn: JIT.zoomIn,
      onZoomOut: JIT.zoomOut
    }
  },
  getTopicCardProps: function() {
    const self = ReactApp
    if (!(self.openMap || self.openTopic)) return {}
    const { TopicCard } = self.openMap || self.openTopic
    return {
      openTopic: TopicCard.openTopic,
      metacodeSets: self.metacodeSets,
      updateTopic: (topic, obj) => topic.save(obj),
      onTopicFollow: Topic.onTopicFollow // todo
    }
  },
  getTopicProps: function() {
    const self = ReactApp
    if (!self.openTopic) return {}
    return {
      topic: self.openTopic.Active.Topic,
      endActiveTopic: Topic.end, // todo
      launchNewTopic: Topic.launch // todo
    }
  },
  getMapsProps: function() {
    const self = ReactApp
    return {
      section: ExploreMaps.collection && ExploreMaps.collection.id,
      maps: ExploreMaps.collection,
      juntoState: self.juntoState,
      moreToLoad: ExploreMaps.collection && ExploreMaps.collection.page !== 'loadedAll',
      user: ExploreMaps.collection && ExploreMaps.collection.id === 'mapper' ? ExploreMaps.mapper : null,
      loadMore: ExploreMaps.loadMore,
      pending: ExploreMaps.pending,
      onStar: ExploreMaps.onStar,
      onRequest: ExploreMaps.onRequest,
      onMapFollow: ExploreMaps.onMapFollow,
      mapsWidth: ReactApp.mapsWidth
    }
  },
  getChatProps: function() {
    const self = ReactApp
    if (!self.openMap) return {
      participants: [],
      messages: []
    }
    const { ChatView, Realtime } = self.openMap 
    return {
      unreadMessages: ChatView.unreadMessages,
      conversationLive: ChatView.conversationLive,
      isParticipating: ChatView.isParticipating,
      onOpen: ChatView.onOpen,
      onClose: ChatView.onClose,
      leaveCall: Realtime.leaveCall,
      joinCall: Realtime.joinCall,
      inviteACall: Realtime.inviteACall,
      inviteToJoin: Realtime.inviteToJoin,
      participants: ChatView.participants ? ChatView.participants.models.map(p => p.attributes) : [],
      messages: ChatView.messages ? ChatView.messages.models.map(m => m.attributes) : [],
      videoToggleClick: ChatView.videoToggleClick,
      cursorToggleClick: ChatView.cursorToggleClick,
      soundToggleClick: ChatView.soundToggleClick,
      inputBlur: ChatView.inputBlur,
      inputFocus: ChatView.inputFocus,
      handleInputMessage: ChatView.handleInputMessage
    }
  },
  getFilterProps: function() {
    const self = ReactApp
    if (!self.openMap) return {}
    const { Filter } = self.openMap 
    return {
      filterData: Filter.dataForPresentation,
      allForFiltering: Filter.filters,
      visibleForFiltering: Filter.visible,
      toggleMetacode: Filter.toggleMetacode,
      toggleMapper: Filter.toggleMapper,
      toggleSynapse: Filter.toggleSynapse,
      filterAllMetacodes: Filter.filterAllMetacodes,
      filterAllMappers: Filter.filterAllMappers,
      filterAllSynapses: Filter.filterAllSynapses
    }
  },
  resize: function() {
    const self = ReactApp
    const maps = ExploreMaps.collection
    const currentUser = self.currentUser
    const user = maps && maps.id === 'mapper' ? ExploreMaps.mapper : null
    const numCards = (maps ? maps.length : 0) + (user || currentUser ? 1 : 0)
    const mapSpaces = Math.floor(document.body.clientWidth / MAP_WIDTH)
    const mapsWidth = document.body.clientWidth <= MOBILE_VIEW_BREAKPOINT
                        ? document.body.clientWidth - MOBILE_VIEW_PADDING
                        : Math.min(MAX_COLUMNS, Math.min(numCards, mapSpaces)) * MAP_WIDTH

    self.mapsWidth = mapsWidth
    self.mobileTitleWidth = document ? document.body.clientWidth - 70 : 0
    self.mobile = document && document.body.clientWidth <= MOBILE_VIEW_BREAKPOINT
    self.render()
  }
}

export default ReactApp
