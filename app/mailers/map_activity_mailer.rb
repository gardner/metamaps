# frozen_string_literal: true
class MapActivityMailer < ApplicationMailer
  default from: 'team@metamaps.cc'

  def daily_summary(user, summary_data)
    @user = user
    @summary_data = summary_data
    mail(to: user.email, subject: 'some subject line')
  end
end
