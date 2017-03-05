class MapActivityService

  def self.summarize_data(map, user, till = DateTime.now)
    results = {
      stats: {}
    }

    since = till - 24.hours

    message_count = Message.where(resource: map)
                           .where("created_at > ? AND created_at < ?", since, till)
                           .where.not(user: user).count
    if message_count > 0
      results[:stats][:messages_sent] = message_count
    end

    moved_count = Event.where(kind: 'topic_moved_on_map', map: map)
                       .where("created_at > ? AND created_at < ?", since, till)
                       .where.not(user: user).group(:eventable_id).count
    if moved_count.keys.length > 0
      results[:stats][:topics_moved] = moved_count.keys.length
    end

    topics_added_events = Event.where(kind: 'topic_added_to_map', map: map)
                               .where("created_at > ? AND created_at < ?", since, till)
                               .where.not(user: user)
                               .order(:created_at)

    topics_removed_events = Event.where(kind: 'topic_removed_from_map', map: map)
                                 .where("created_at > ? AND created_at < ?", since, till)
                                 .where.not(user: user)
                                 .order(:created_at)

    topics_added_to_include = {}
    topics_added_events.each do |ta|
      num_adds = topics_added_events.where(eventable_id: ta.eventable_id).count
      num_removes = topics_removed_events.where(eventable_id: ta.eventable_id).count
      topics_added_to_include[ta.eventable_id] = ta if num_adds > num_removes
    end
    if topics_added_to_include.keys.length > 0
      results[:stats][:topics_added] = topics_added_to_include.keys.length
      results[:topics_added] = topics_added_to_include.values
    end

    topics_removed_to_include = {}
    topics_removed_events.each do |ta|
      num_adds = topics_added_events.where(eventable_id: ta.eventable_id).count
      num_removes = topics_removed_events.where(eventable_id: ta.eventable_id).count
      topics_removed_to_include[ta.eventable_id] = ta if num_removes > num_adds
    end
    if topics_removed_to_include.keys.length > 0
      results[:stats][:topics_removed] = topics_removed_to_include.keys.length
      results[:topics_removed] = topics_removed_to_include.values
    end

    synapses_added_events = Event.where(kind: 'synapse_added_to_map', map: map)
                               .where("created_at > ? AND created_at < ?", since, till)
                               .where.not(user: user)
                               .order(:created_at)

    synapses_removed_events = Event.where(kind: 'synapse_removed_from_map', map: map)
                                 .where("created_at > ? AND created_at < ?", since, till)
                                 .where.not(user: user)
                                 .order(:created_at)

    synapses_added_to_include = {}
    synapses_added_events.each do |ta|
      num_adds = synapses_added_events.where(eventable_id: ta.eventable_id).count
      num_removes = synapses_removed_events.where(eventable_id: ta.eventable_id).count
      synapses_added_to_include[ta.eventable_id] = ta if num_adds > num_removes
    end
    if synapses_added_to_include.keys.length > 0
      results[:stats][:synapses_added] = synapses_added_to_include.keys.length
      results[:synapses_added] = synapses_added_to_include.values
    end

    synapses_removed_to_include = {}
    synapses_removed_events.each do |ta|
      num_adds = synapses_added_events.where(eventable_id: ta.eventable_id).count
      num_removes = synapses_removed_events.where(eventable_id: ta.eventable_id).count
      synapses_removed_to_include[ta.eventable_id] = ta if num_removes > num_adds
    end
    if synapses_removed_to_include.keys.length > 0
      results[:stats][:synapses_removed] = synapses_removed_to_include.keys.length
      results[:synapses_removed] = synapses_removed_to_include.values
    end

    results
  end
end
