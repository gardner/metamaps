import React, { PropTypes, Component } from 'react'

import EmbedlyLinkChooser from './EmbedlyLinkChooser'
import EmbedlyCard from './EmbedlyCard'
import FileAttachments from './FileAttachments'

class Attachments extends Component {
  constructor(props) {
    super(props)

    this.state = this.defaultState
  }

  defaultState = {
    addingFile: false,
    addingPhoto: false,
    addingLink: false,
    addingUpload: false
  }

  clearAttachments = () => {
    this.props.updateTopic({ link: null }) // attachments too
    this.setState(this.defaultState)
  }

  render = () => {
    const { topic, authorizedToEdit, updateTopic } = this.props
    const link = topic.get('link')
    const file = topic.get('attachment')

    let childComponent
    if (link) {
      childComponent = (
        <EmbedlyCard key={topic.id}
          link={link}
          authorizedToEdit={authorizedToEdit}
          removeLink={this.clearAttachments}
        />
      )
    } else if (file) {
      childComponent = null//renderFile()
    } else if (this.state.addingPhoto && authorizedToEdit) {
      childComponent = null//renderPhotoUploader()
    } else if (this.state.addingLink && authorizedToEdit) {
      childComponent = (
        <EmbedlyLinkChooser topicId={topic.id}
          authorizedToEdit={authorizedToEdit}
          updateTopic={updateTopic}
        />
      )
    } else if (this.state.addingAudio && authorizedToEdit) {
      childComponent = null//renderAudioUploader()
    } else if (this.state.addingFile && authorizedToEdit) {
      childComponent = null//renderFileUploader()
    } else {
      childComponent = (
        <EmbedlyLinkChooser topicId={topic.id}
          authorizedToEdit={authorizedToEdit}
          updateTopic={updateTopic}
        />
      )
    }

    //    <FileAttachments attachments={topic.get('attachments')}
    //      authorizedToEdit={authorizedToEdit}
    //      removeLink={this.clearAttachments}
    //    />

    return (
      <div className="attachments">
        {childComponent}
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
