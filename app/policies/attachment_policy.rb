# frozen_string_literal: true
class AttachmentPolicy < ApplicationPolicy
  def create?
    Pundit.policy(user, record.attachable).update?
  end

  def destroy?
    Pundit.policy(user, record.attachable).update?
  end
end
