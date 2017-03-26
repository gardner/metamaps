import React, { PropTypes, Component } from 'react'

import EmbedlyLinkChooser from './EmbedlyLinkChooser'
import EmbedlyCard from './EmbedlyCard'
import FileUploader from './FileUploader'
import PhotoUploader from './PhotoUploader'
import AudioUploader from './AudioUploader'
import FileAttachment from './FileAttachment'

class Attachments extends Component {
  constructor(props) {
    super(props)

    this.state = this.defaultState
  }

  defaultState = {
    addingPhoto: false,
    addingLink: false,
    addingAudio: false,
    addingFile: false
  }

  clearState = () => {
    this.setState(this.defaultState)
  }

  // onClick handler for the 4 buttons, which triggers showing the proper uploader
  choose = key => () => {
    this.setState(Object.assign({}, this.defaultState, { [key]: true }))
  }

  render = () => {
    const { topic, authorizedToEdit, updateTopic } = this.props
    const link = topic.get('link')
    const attachments = topic.get('attachments')
    const file = attachments && attachments.length ? attachments[0] : null

    let childComponent
    if (link) {
      childComponent = (
        <EmbedlyCard link={link}
          authorizedToEdit={authorizedToEdit}
          removeLink={this.clearState}
        />
      )
    } else if (file) {
      childComponent = (
        <FileAttachment file={file}
          authorizedToEdit={authorizedToEdit}
          removeAttachment={this.props.removeAttachment}
        />
      )
    } else if (!authorizedToEdit) {
      childComponent = null
    } else if (this.state.addingPhoto) {
      childComponent = (
        <PhotoUploader updateTopic={updateTopic}
          uploadAttachment={this.props.uploadAttachment}
          cancel={this.clearAttachments}
        />
      )
    } else if (this.state.addingLink) {
      childComponent = (
        <EmbedlyLinkChooser updateTopic={updateTopic}
          cancel={this.clearState}
        />
      )
    } else if (this.state.addingAudio) {
      childComponent = (
        <AudioUploader updateTopic={updateTopic}
          uploadAttachment={this.props.uploadAttachment}
          cancel={this.clearState}
        />
      )
    } else if (this.state.addingFile) {
      childComponent = (
        <FileUploader updateTopic={updateTopic}
          uploadAttachment={this.props.uploadAttachment}
          cancel={this.clearState}
        />
      )
    } else {
      childComponent = (
        <div className="attachment-type-chooser">
          <div className="photo-upload" onClick={this.choose('addingPhoto')}>Photo</div>
          <div className="link-upload" onClick={this.choose('addingLink')}>Link</div>
          <div className="audio-upload" onClick={this.choose('addingAudio')}>Audio</div>
          <div className="file-upload" onClick={this.choose('addingFile')}>Upload</div>
        </div>
      )
    }

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
  updateTopic: PropTypes.func,
  uploadAttachment: PropTypes.func,
  removeAttachment: PropTypes.func
}

export default Attachments
