/* global $ */

import VideoView from './VideoView'
import Room from './Room'
import { JUNTO_UPDATED } from '../Realtime/events'

const Views = {
  init: (serverData) => {
    $(document).on(JUNTO_UPDATED, () => ExploreMaps.render())
    //map.ChatView.init([serverData['sounds/MM_sounds.mp3'], serverData['sounds/MM_sounds.ogg']])
  },
  VideoView,
  Room
}

export { VideoView, Room }
export default Views
