/* global $ */

import Active from '../Active'
import Visualize from '../Visualize'
import GlobalUI, { ReactApp } from '../GlobalUI'

const TopicCard = {
  openTopic: null, // stores the topic that's currently open
  metacodeSets: [],
  redrawCanvas: () => {
    Visualize.mGraph.plot()
  },
  init: function(serverData) {
    const self = TopicCard
    self.metacodeSets = serverData.metacodeSets
  },
  onTopicFollow: topic => {
    const self = TopicCard
    const isFollowing = topic.isFollowedBy(Active.Mapper)
    $.post({
      url: `/topics/${topic.id}/${isFollowing ? 'un' : ''}follow`
    })
    if (isFollowing) {
      GlobalUI.notifyUser('You are no longer following this topic')
      Active.Mapper.unfollowTopic(topic.id)
    } else {
      GlobalUI.notifyUser('You are now following this topic')
      Active.Mapper.followTopic(topic.id)
    }
    self.render()
  },
  updateTopic: (topic, obj) => {
    const self = TopicCard
    topic.save(obj, { success: self.render })
  },
  uploadAttachment: (topic, file) => {
    const data = new FormData()
    data.append('attachment[file]', file)
    data.append('attachment[attachable_type]', 'Topic')
    data.append('attachment[attachable_id]', topic.id)
    return new Promise((resolve, reject) => {
      $.ajax({
        url: '/attachments',
        type: 'POST',
        data,
        processData: false,
        contentType: false,
        success: (data) => {
          console.log("file upolad success", data)
          topic.fetch({ success: () => {
            ReactApp.render()
            resolve(true)
          }})
        },
        error: (error) => {
          console.error(error)
          alert("File upload failed")
          topic.fetch({ success: () => {
            ReactApp.render()
            resolve(false)
          }})
        }
      })
    })
  },
  removeAttachment: (topic) => {
    const attachments = topic.get('attachments')
    if (!attachments || attachments.length < 1) {
      return
    }

    $.ajax({
      url: `/attachments/${attachments[0].id}`,
      type: 'DELETE',
      success: () => {
        console.log("delete success, syncing topic")
        topic.fetch({ success: () => ReactApp.render() })
      },
      error: error => {
        console.error(error)
        alert("Failed to remove attachment"),
        topic.fetch({ success: () => ReactApp.render() })
      }
    })
  },
  render: function() {
    ReactApp.render()
  },
  showCard: function(node, opts = {}) {
    var self = TopicCard
    var topic = node.getData('topic')
    self.openTopic = topic
    self.render()
    $('.showcard').fadeIn('fast', () => {
      $('.showcard').draggable({
        handle: '.metacodeImage',
        stop: function() {
          $(this).height('auto')
        }
      })
      if (opts.complete) opts.complete()
    })
  },
  hideCard: function() {
    var self = TopicCard
    $('.showcard').fadeOut('fast')
    self.openTopic = null
  }
}

export default TopicCard
