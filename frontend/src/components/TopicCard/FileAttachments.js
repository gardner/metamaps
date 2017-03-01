import React, { Component, PropTypes } from 'react'
import Dropzone from 'react-dropzone'

class FileAttachments extends Component {
  getFileTypeClass = content_type => {
    if (content_type === 'text/plain') {
      return 'text-file-type'
    } else if (content_type === 'application/pdf') {
      return 'pdf-file-type'
    } else if (content_type.match(/^image\//)) {
      return 'image-file-type'
    } else if (content_type.match(/^audio\//)) {
      return 'audio-file-type'
    } else {
      return 'unknown-file-type'
    }
  }

  getFileIcon = file => {
    // TODO these icons are not suitable for use - get real ones
    if (file.content_type === 'text/plain') {
      return 'http://www.iconsdb.com/icons/preview/black/text-file-xxl.png'
    } else if (file.content_type === 'application/pdf') {
      return 'https://image.flaticon.com/icons/svg/29/29587.svg'
    } else if (file.content_type.match(/^image\//)) {
      return file.url
    } else if (file.content_type.match(/^audio\//)) {
      return 'https://cdn0.iconfinder.com/data/icons/huge-business-vector-icons/60/music_notes-512.png'
    } else {
      return 'https://image.flaticon.com/icons/png/512/8/8235.png'
    }
  }

  handleFileUpload = (acceptedFiles, rejectedFiles) => {
    console.log("unimplemented")
  }

  renderFile = (file, index) => {
    return (
      <a key={index} 
        className={`file ${this.getFileTypeClass(file.content_type)}`}
        href={file.url}
      >
        <img src={this.getFileIcon(file)}
          width="16" height="16"
          style={{ float: 'left', paddingLeft: '0.5em', paddingRight: '0.5em' }}
        />
        {file.file_name}
      </a>
    )
  }

  render() {
    return (
      <div className="file-attachments">
        {this.props.attachments.map(this.renderFile)}
        {this.props.authorizedToEdit && (
          <div className="upload-file" style={{ borderTop: '2px dashed black' }}>
            <Dropzone onDrop={this.handleFileUpload}
              style={{ height: '2em', paddingLeft: '0.5em' }}
            >
              Upload file attachments here
            </Dropzone>
          </div>
        )}
      </div>
    )
  }
}

FileAttachments.propTypes = {
  attachments: PropTypes.arrayOf(PropTypes.shape({
    content_type: PropTypes.string,
    file_name: PropTypes.string,
    file_size: PropTypes.number,
    url: PropTypes.string
  })),
  authorizedToEdit: PropTypes.bool,
  updateTopic: PropTypes.func
}

export default FileAttachments
