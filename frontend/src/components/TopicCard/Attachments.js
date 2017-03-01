import React, { PropTypes, Component } from 'react'

import EmbedlyLink from './EmbedlyLink'
import FileAttachments from './FileAttachments'

class Attachments extends Component {
  render = () => {
    const { topic, authorizedToEdit, updateTopic } = this.props
    const link = topic.get('link')

    return (
      <div className="attachments">
        <EmbedlyLink topicId={topic.id}
          link={link}
        <FileAttachments attachments={topic.get('attachments')}
          authorizedToEdit={authorizedToEdit}
          updateTopic={updateTopic}
        />
      </div>
    )
  }
}

Attachments.propTypes = {
  topic: PropTypes.object, // Backbone object
  authorizedToEdit: PropTypes.bool,
  updateTopic: PropTypes.func
}

export default Attachments
