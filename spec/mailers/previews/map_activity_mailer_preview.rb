# frozen_string_literal: true
# Preview all emails at http://localhost:3000/rails/mailers/map_activity_mailer
class MapActivityMailerPreview < ActionMailer::Preview
  def daily_summary
    user = User.first
    map = Map.first
    summary_data = MapActivityService.summarize_data(map, user)
    MapActivityMailer.daily_summary(user, summary_data)
  end
end
