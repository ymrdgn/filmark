-- Create notification when friend request is accepted
-- This trigger creates a notification for the original sender when their request is accepted

CREATE OR REPLACE FUNCTION create_friend_accepted_notification()
RETURNS TRIGGER AS $$
DECLARE
  accepter_email text;
BEGIN
  -- Only create notification when status changes from pending to accepted
  IF OLD.status = 'pending' AND NEW.status = 'accepted' THEN
    -- Get the email of the person who accepted the request
    SELECT email INTO accepter_email
    FROM auth.users
    WHERE id = NEW.friend_id;

    -- Create notification for the original requester (user_id)
    INSERT INTO notifications (
      user_id,
      type,
      related_user_id,
      related_id,
      title,
      message
    ) VALUES (
      NEW.user_id,
      'friend_request_accepted',
      NEW.friend_id,
      NEW.id,
      'Friend Request Accepted',
      accepter_email || ' accepted your friend request'
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for friend request acceptance
DROP TRIGGER IF EXISTS friend_accepted_notification_trigger ON friends;
CREATE TRIGGER friend_accepted_notification_trigger
  AFTER UPDATE ON friends
  FOR EACH ROW
  EXECUTE FUNCTION create_friend_accepted_notification();
