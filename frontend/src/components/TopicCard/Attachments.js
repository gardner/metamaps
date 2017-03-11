import React, { PropTypes, Component } from 'react'

import EmbedlyLinkChooser from './EmbedlyLinkChooser'
import EmbedlyCard from './EmbedlyCard'
import FileUploader from './FileUploader'

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

  clearAttachments = () => {
    this.props.updateTopic({ link: null }) // attachments too
    this.clearState()
  }

  // onClick handler for the 4 buttons, which triggers showing the proper uploader
  choose = key => () => {
    this.setState(Object.assign({}, this.defaultState, { [key]: true }))
  }

  render = () => {
    const { topic, authorizedToEdit, updateTopic } = this.props
    const link = topic.get('link')
    const file = topic.get('attachment')

    let childComponent
    if (link) {
      childComponent = (
        <EmbedlyCard link={link}
          authorizedToEdit={authorizedToEdit}
          removeLink={this.clearState}
        />
      )
    } else if (file) {
      childComponent = null
    } else if (!authorizedToEdit) {
      childComponent = null
    } else if (this.state.addingPhoto) {
      childComponent = null
    } else if (this.state.addingLink) {
      childComponent = (
        <EmbedlyLinkChooser updateTopic={updateTopic}
          cancel={this.clearAttachments}
        />
      )
    } else if (this.state.addingAudio) {
      childComponent = null
    } else if (this.state.addingFile) {
      childComponent = (
        <FileUploader updateTopic={updateTopic}
          cancel={this.clearAttachments}
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
  updateTopic: PropTypes.func
}

export default Attachments
