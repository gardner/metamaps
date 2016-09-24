# frozen_string_literal: true
class Events::ConversationStartedOnMap < Event
  # after_create :notify_users!

  def self.publish!(map, user)
    create!(kind: 'conversation_started_on_map',
            eventable: map,
            map: map,
            user: user)
  end
end
