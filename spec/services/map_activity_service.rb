require 'rails_helper'

RSpec.describe MapActivityService do
  let(:map) { create(:map, created_at: 1.week.ago) }
  let(:other_user) { create(:user) }
  let(:email_user) { create(:user) }
  let(:empty_response) { {stats:{}} }

  it 'includes nothing if nothing happened' do
    response = MapActivityService.summarize_data(map, email_user)
    expect(response).to eq (empty_response)
  end

  describe 'topics added to map' do
    it 'includes a topic added within the last 24 hours' do
      topic = create(:topic)
      mapping = create(:mapping, user: other_user, map: map, mappable: topic, created_at: 6.hours.ago)
      event = Event.find_by(kind: 'topic_added_to_map', eventable_id: topic.id)
      event.update_columns(created_at: 6.hours.ago)
      response = MapActivityService.summarize_data(map, email_user)
      expect(response[:stats][:topics_added]).to eq(1)
      expect(response[:topics_added]).to eq([event])
    end

    it 'includes a topic added, then removed, then re-added within the last 24 hours' do
      topic = create(:topic)
      mapping = create(:mapping, user: other_user, map: map, mappable: topic, created_at: 6.hours.ago)
      Event.find_by(kind: 'topic_added_to_map', eventable_id: topic.id).update_columns(created_at: 6.hours.ago)
      mapping.updated_by = other_user
      mapping.destroy
      Event.find_by(kind: 'topic_removed_from_map', eventable_id: topic.id).update_columns(created_at: 5.hours.ago)
      mapping2 = create(:mapping, user: other_user, map: map, mappable: topic, created_at: 4.hours.ago)
      event = Event.where("meta->>'mapping_id' = ?", mapping2.id.to_s).first
      event.update_columns(created_at: 4.hours.ago)
      response = MapActivityService.summarize_data(map, email_user)
      expect(response[:stats][:topics_added]).to eq(1)
      expect(response[:topics_added]).to eq([event])
    end

    it 'excludes a topic removed then re-added within the last 24 hours' do
      topic = create(:topic)
      mapping = create(:mapping, user: other_user, map: map, mappable: topic, created_at: 25.hours.ago)
      Event.find_by(kind: 'topic_added_to_map', eventable_id: topic.id).update_columns(created_at: 25.hours.ago)
      mapping.updated_by = other_user
      mapping.destroy
      Event.find_by(kind: 'topic_removed_from_map', eventable_id: topic.id).update_columns(created_at: 6.hours.ago)
      mapping2 = create(:mapping, user: other_user, map: map, mappable: topic, created_at: 5.hours.ago)
      Event.where(kind: 'topic_added_to_map').where("meta->>'mapping_id' = ?", mapping2.id.to_s).first.update_columns(created_at: 5.hours.ago)
      response = MapActivityService.summarize_data(map, email_user)
      expect(response).to eq (empty_response)
    end

    it 'excludes a topic added outside the last 24 hours' do
      topic = create(:topic)
      mapping = create(:mapping, user: other_user, map: map, mappable: topic, created_at: 25.hours.ago)
      Event.find_by(kind: 'topic_added_to_map', eventable_id: topic.id).update_columns(created_at: 25.hours.ago)
      response = MapActivityService.summarize_data(map, email_user)
      expect(response).to eq (empty_response)
    end

    it 'excludes topics added by the user who will receive the data' do
      topic = create(:topic)
      topic2 = create(:topic)
      mapping = create(:mapping, user: other_user, map: map, mappable: topic, created_at: 5.hours.ago)
      event = Event.find_by(kind: 'topic_added_to_map', eventable_id: topic.id)
      event.update_columns(created_at: 5.hours.ago)
      mapping2 = create(:mapping, user: email_user, map: map, mappable: topic2, created_at: 5.hours.ago)
      Event.find_by(kind: 'topic_added_to_map', eventable_id: topic2.id).update_columns(created_at: 5.hours.ago)
      response = MapActivityService.summarize_data(map, email_user)
      expect(response[:stats][:topics_added]).to eq(1)
      expect(response[:topics_added]).to eq([event])
    end
  end

  describe 'topics moved on map' do
    it 'includes ones moved within the last 24 hours' do
      topic = create(:topic)
      event = Events::TopicMovedOnMap.publish!(topic, map, other_user, {})
      event.update(created_at: 6.hours.ago)
      response = MapActivityService.summarize_data(map, email_user)
      expect(response[:stats][:topics_moved]).to eq(1)
    end

    it 'only includes each topic that was moved in the count once' do
      topic = create(:topic)
      topic2 = create(:topic)
      event = Events::TopicMovedOnMap.publish!(topic, map, other_user, {})
      event.update(created_at: 6.hours.ago)
      event2 = Events::TopicMovedOnMap.publish!(topic, map, other_user, {})
      event2.update(created_at: 5.hours.ago)
      event3 = Events::TopicMovedOnMap.publish!(topic2, map, other_user, {})
      event3.update(created_at: 5.hours.ago)
      response = MapActivityService.summarize_data(map, email_user)
      expect(response[:stats][:topics_moved]).to eq(2)
    end

    it 'excludes ones moved outside the last 24 hours' do
      topic = create(:topic)
      event = Events::TopicMovedOnMap.publish!(topic, map, other_user, {})
      event.update(created_at: 25.hours.ago)
      response = MapActivityService.summarize_data(map, email_user)
      expect(response).to eq (empty_response)
    end

    it 'excludes ones moved by the user who will receive the data' do
      topic = create(:topic)
      event = Events::TopicMovedOnMap.publish!(topic, map, email_user, {})
      event.update(created_at: 5.hours.ago)
      response = MapActivityService.summarize_data(map, email_user)
      expect(response).to eq (empty_response)
    end
  end

  describe 'topics removed from map' do
    it 'includes a topic removed within the last 24 hours' do
      topic = create(:topic)
      mapping = create(:mapping, user: other_user, map: map, mappable: topic, created_at: 25.hours.ago)
      Event.find_by(kind: 'topic_added_to_map', eventable_id: topic.id).update_columns(created_at: 25.hours.ago)
      mapping.updated_by = other_user
      mapping.destroy
      event = Event.find_by(kind: 'topic_removed_from_map', eventable_id: topic.id)
      event.update_columns(created_at: 6.hours.ago)
      response = MapActivityService.summarize_data(map, email_user)
      expect(response[:stats][:topics_removed]).to eq(1)
      expect(response[:topics_removed]).to eq([event])
    end

    it 'excludes a topic removed outside the last 24 hours' do
      topic = create(:topic)
      mapping = create(:mapping, user: other_user, map: map, mappable: topic, created_at: 26.hours.ago)
      Event.find_by(kind: 'topic_added_to_map', eventable_id: topic.id).update_columns(created_at: 26.hours.ago)
      mapping.updated_by = other_user
      mapping.destroy
      Event.find_by(kind: 'topic_removed_from_map', eventable_id: topic.id).update_columns(created_at: 25.hours.ago)
      response = MapActivityService.summarize_data(map, email_user)
      expect(response).to eq (empty_response)
    end

    it 'excludes topics removed by the user who will receive the data' do
      topic = create(:topic)
      topic2 = create(:topic)
      mapping = create(:mapping, user: other_user, map: map, mappable: topic, created_at: 25.hours.ago)
      Event.find_by(kind: 'topic_added_to_map', eventable_id: topic.id).update_columns(created_at: 25.hours.ago)
      mapping2 = create(:mapping, user: email_user, map: map, mappable: topic2, created_at: 25.hours.ago)
      Event.find_by(kind: 'topic_added_to_map', eventable_id: topic2.id).update_columns(created_at: 25.hours.ago)
      mapping.updated_by = other_user
      mapping.destroy
      mapping2.updated_by = email_user
      mapping2.destroy
      event = Event.find_by(kind: 'topic_removed_from_map', eventable_id: topic.id)
      event.update_columns(created_at: 5.hours.ago)
      Event.find_by(kind: 'topic_removed_from_map', eventable_id: topic2.id).update_columns(created_at: 5.hours.ago)
      response = MapActivityService.summarize_data(map, email_user)
      expect(response[:stats][:topics_removed]).to eq(1)
      expect(response[:topics_removed]).to eq([event])
    end
  end

  describe 'synapses added to map' do
    it 'includes a synapse added within the last 24 hours' do
      synapse = create(:synapse)
      mapping = create(:mapping, user: other_user, map: map, mappable: synapse, created_at: 6.hours.ago)
      event = Event.find_by(kind: 'synapse_added_to_map', eventable_id: synapse.id)
      event.update_columns(created_at: 6.hours.ago)
      response = MapActivityService.summarize_data(map, email_user)
      expect(response[:stats][:synapses_added]).to eq(1)
      expect(response[:synapses_added]).to eq([event])
    end

    it 'includes a synapse added, then removed, then re-added within the last 24 hours' do
      synapse = create(:synapse)
      mapping = create(:mapping, user: other_user, map: map, mappable: synapse, created_at: 6.hours.ago)
      Event.find_by(kind: 'synapse_added_to_map', eventable_id: synapse.id).update_columns(created_at: 6.hours.ago)
      mapping.updated_by = other_user
      mapping.destroy
      Event.find_by(kind: 'synapse_removed_from_map', eventable_id: synapse.id).update_columns(created_at: 5.hours.ago)
      mapping2 = create(:mapping, user: other_user, map: map, mappable: synapse, created_at: 4.hours.ago)
      event = Event.where(kind: 'synapse_added_to_map').where("meta->>'mapping_id' = ?", mapping2.id.to_s).first
      event.update_columns(created_at: 4.hours.ago)
      response = MapActivityService.summarize_data(map, email_user)
      expect(response[:stats][:synapses_added]).to eq(1)
      expect(response[:synapses_added]).to eq([event])
    end

    it 'excludes a synapse removed then re-added within the last 24 hours' do
      synapse = create(:synapse)
      mapping = create(:mapping, user: other_user, map: map, mappable: synapse, created_at: 25.hours.ago)
      Event.find_by(kind: 'synapse_added_to_map', eventable_id: synapse.id).update_columns(created_at: 25.hours.ago)
      mapping.updated_by = other_user
      mapping.destroy
      Event.find_by(kind: 'synapse_removed_from_map', eventable_id: synapse.id).update_columns(created_at: 6.hours.ago)
      mapping2 = create(:mapping, user: other_user, map: map, mappable: synapse, created_at: 5.hours.ago)
      Event.where(kind: 'synapse_added_to_map').where("meta->>'mapping_id' = ?", mapping2.id.to_s).first.update_columns(created_at: 5.hours.ago)
      response = MapActivityService.summarize_data(map, email_user)
      expect(response).to eq (empty_response)
    end

    it 'excludes a synapse added outside the last 24 hours' do
      synapse = create(:synapse)
      mapping = create(:mapping, user: other_user, map: map, mappable: synapse, created_at: 25.hours.ago)
      Event.find_by(kind: 'synapse_added_to_map', eventable_id: synapse.id).update_columns(created_at: 25.hours.ago)
      response = MapActivityService.summarize_data(map, email_user)
      expect(response).to eq (empty_response)
    end

    it 'excludes synapses added by the user who will receive the data' do
      synapse = create(:synapse)
      synapse2 = create(:synapse)
      mapping = create(:mapping, user: other_user, map: map, mappable: synapse, created_at: 5.hours.ago)
      event = Event.find_by(kind: 'synapse_added_to_map', eventable_id: synapse.id)
      event.update_columns(created_at: 5.hours.ago)
      mapping2 = create(:mapping, user: email_user, map: map, mappable: synapse2, created_at: 5.hours.ago)
      Event.find_by(kind: 'synapse_added_to_map', eventable_id: synapse2.id).update_columns(created_at: 5.hours.ago)
      response = MapActivityService.summarize_data(map, email_user)
      expect(response[:stats][:synapses_added]).to eq(1)
      expect(response[:synapses_added]).to eq([event])
    end
  end

  describe 'synapses removed from map' do
    it 'includes a synapse removed within the last 24 hours' do
      synapse = create(:synapse)
      mapping = create(:mapping, user: other_user, map: map, mappable: synapse, created_at: 25.hours.ago)
      Event.find_by(kind: 'synapse_added_to_map', eventable_id: synapse.id).update_columns(created_at: 25.hours.ago)
      mapping.updated_by = other_user
      mapping.destroy
      event = Event.find_by(kind: 'synapse_removed_from_map', eventable_id: synapse.id)
      event.update_columns(created_at: 6.hours.ago)
      response = MapActivityService.summarize_data(map, email_user)
      expect(response[:stats][:synapses_removed]).to eq(1)
      expect(response[:synapses_removed]).to eq([event])
    end

    it 'excludes a synapse removed outside the last 24 hours' do
      synapse = create(:synapse)
      mapping = create(:mapping, user: other_user, map: map, mappable: synapse, created_at: 25.hours.ago)
      Event.find_by(kind: 'synapse_added_to_map', eventable_id: synapse.id).update_columns(created_at: 25.hours.ago)
      mapping.updated_by = other_user
      mapping.destroy
      Event.find_by(kind: 'synapse_removed_from_map', eventable_id: synapse.id).update_columns(created_at: 25.hours.ago)
      response = MapActivityService.summarize_data(map, email_user)
      expect(response).to eq (empty_response)
    end

    it 'excludes synapses removed by the user who will receive the data' do
      synapse = create(:synapse)
      synapse2 = create(:synapse)
      mapping = create(:mapping, user: other_user, map: map, mappable: synapse, created_at: 25.hours.ago)
      Event.find_by(kind: 'synapse_added_to_map', eventable_id: synapse.id).update_columns(created_at: 25.hours.ago)
      mapping2 = create(:mapping, user: email_user, map: map, mappable: synapse2, created_at: 25.hours.ago)
      Event.find_by(kind: 'synapse_added_to_map', eventable_id: synapse2.id).update_columns(created_at: 25.hours.ago)
      mapping.updated_by = other_user
      mapping.destroy
      mapping2.updated_by = email_user
      mapping2.destroy
      event = Event.find_by(kind: 'synapse_removed_from_map', eventable_id: synapse.id)
      event.update_columns(created_at: 5.hours.ago)
      Event.find_by(kind: 'synapse_removed_from_map', eventable_id: synapse2.id).update_columns(created_at: 5.hours.ago)
      response = MapActivityService.summarize_data(map, email_user)
      expect(response[:stats][:synapses_removed]).to eq(1)
      expect(response[:synapses_removed]).to eq([event])
    end
  end

  describe 'messages in the map chat' do
    it 'counts messages within the last 24 hours' do
      create(:message, resource: map, created_at: 6.hours.ago)
      create(:message, resource: map, created_at: 5.hours.ago)
      response = MapActivityService.summarize_data(map, email_user)
      expect(response[:stats][:messages_sent]).to eq(2)
    end

    it 'does not count messages outside the last 24 hours' do
      create(:message, resource: map, created_at: 25.hours.ago)
      create(:message, resource: map, created_at: 5.hours.ago)
      response = MapActivityService.summarize_data(map, email_user)
      expect(response[:stats][:messages_sent]).to eq(1)
    end

    it 'does not count messages sent by the person who will receive the data' do
      create(:message, resource: map, created_at: 5.hours.ago, user: other_user)
      create(:message, resource: map, created_at: 5.hours.ago, user: email_user)
      response = MapActivityService.summarize_data(map, email_user)
      expect(response[:stats][:messages_sent]).to eq(1)
    end
  end
end
