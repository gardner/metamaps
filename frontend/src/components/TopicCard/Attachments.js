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
    addingPhoto: false,
    addingLink: false,
    addingAudio: false,
    addingFile: false
  }

  clearAttachments = () => {
    this.props.updateTopic({ link: null }) // attachments too
    this.setState(this.defaultState)
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
          removeLink={this.clearAttachments}
        />
      )
    } else if (file) {
      childComponent = null//renderFile()
    } else if (this.state.addingPhoto && authorizedToEdit) {
      childComponent = null//renderPhotoUploader()
    } else if (this.state.addingLink && authorizedToEdit) {
      childComponent = (
        <EmbedlyLinkChooser authorizedToEdit={authorizedToEdit}
          updateTopic={updateTopic}
        />
      )
    } else if (this.state.addingAudio && authorizedToEdit) {
      childComponent = null//renderAudioUploader()
    } else if (this.state.addingFile && authorizedToEdit) {
      childComponent = null//renderFileUploader()
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
