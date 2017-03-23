import { ReactApp } from '../GlobalUI'

const TopicCard = () => {
const toExport = {
  openTopic: null,
  showCard: function(node) {
    toExport.openTopic = node.getData('topic')
    ReactApp.render()
  },
  hideCard: function() {
    toExport.openTopic = null
    ReactApp.render()
  }
}
return toExport
}

export default TopicCard
