/* global $, ActionCable */

import Active from './Active'
import DataModel from './DataModel'
import Topic from './Topic'

const Cable = {
  topicSubs: {},
  init: () => {
    let self = Cable
    self.cable = ActionCable.createConsumer()
  },
  subAllTopics: () => {
    let self = Cable
    DataModel.Topics.models.forEach(topic => self.subTopic(topic.id))  
  },
  subUnsubbedTopics: (topic1id, topic2id) => {
    if (!Cable.topicSubs[topic1id]) Cable.subTopic(topic1id)
    if (!Cable.topicSubs[topic2id]) Cable.subTopic(topic2id)
  },
  subTopic: id => {
    let self = Cable
    self.topicSubs[id] = self.cable.subscriptions.create({
      channel: 'TopicChannel',
      id: id
    }, {
      received: event => self[event.type](event.data)
    }) 
  },
  unsubTopic: id => {
    let self = Cable
    self.topicSubs[id] && self.topicSubs[id].unsubscribe()
    delete self.topicSubs[id]
  },
  unsubAllTopics: () => {
    let self = Cable
    Object.keys(self.topicSubs).forEach(id => {
      self.topicSubs[id].unsubscribe()
    })
    self.topicSubs = {}
  },
  // begin event functions
  newSynapse: data => {
    const m = Active.Mapper
    const s = new DataModel.Synapse(data.synapse)
    const t1 = new DataModel.Topic(data.topic1)
    const t2 = new DataModel.Topic(data.topic2)
    if (t1.authorizeToShow(m) && t2.authorizeToShow(m) && s.authorizeToShow(m)) {
      Topic.fetchForTopicView(data.synapse.id)
    }
  }
}

export default Cable
