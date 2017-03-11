/* global embedly */
import React, { PropTypes, Component } from 'react'

class EmbedlyLinkChooser extends Component {
  constructor(props) {
    super(props)

    this.state = {
      linkEdit: ''
    }
  }

  resetLink = () => {
    this.setState({ linkEdit: '' })
  }

  onLinkChangeHandler = e => {
    this.setState({ linkEdit: e.target.value })
  }

  onLinkKeyUpHandler = e => {
    const ENTER_KEY = 13
    if (e.which === ENTER_KEY) {
      const { linkEdit } = this.state
      this.setState({ linkEdit: '' })
      this.props.updateTopic({ link: linkEdit })
    }
  }

  render = () => {
    const { linkEdit } = this.state

    if (!this.props.authorizedToEdit) return null
    return (
      <div className="link-chooser">
        <div className="addLink">
          <div id="addLinkIcon"></div>
          <div id="addLinkInput">
            <input ref={input => (this.linkInput = input)}
              placeholder="Enter or paste a link"
              value={linkEdit}
              onChange={this.onLinkChangeHandler}
              onKeyUp={this.onLinkKeyUpHandler}></input>
            {linkEdit && <div id="addLinkReset" onClick={this.resetLink}></div>}
          </div>
        </div>
<<<<<<< HEAD:frontend/src/components/TopicCard/EmbedlyLink/index.js
        {link && <Card key={topicId} link={link} />}
        {authorizedToEdit && (
          <div id="linkremove"
            style={{ display: hasAttachment ? 'block' : 'none' }}
            onClick={this.removeLink}
          />
        )}
=======
>>>>>>> start implementing the 4-choice file uploader:frontend/src/components/TopicCard/EmbedlyLinkChooser.js
      </div>
    )
  }
}

<<<<<<< HEAD:frontend/src/components/TopicCard/EmbedlyLink/index.js
EmbedlyLink.propTypes = {
  topicId: PropTypes.number,
  link: PropTypes.string,
=======
EmbedlyLinkChooser.propTypes = {
>>>>>>> start implementing the 4-choice file uploader:frontend/src/components/TopicCard/EmbedlyLinkChooser.js
  authorizedToEdit: PropTypes.bool,
  updateTopic: PropTypes.func
}

export default EmbedlyLinkChooser
