/*
  # Notifications System

  1. New Tables
    - `notifications`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users) - Notification recipient
      - `type` (text) - Type of notification (friend_request, etc.)
      - `related_user_id` (uuid) - User who triggered the notification
      - `related_id` (uuid) - Related record ID (e.g., friend request ID)
      - `title` (text) - Notification title
      - `message` (text) - Notification message
      - `is_read` (boolean) - Read status
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on notifications table
    - Users can only read their own notifications
    - Users can update their own notifications (mark as read)
    - System can insert notifications via trigger

  3. Triggers
    - Auto-create notification when friend request is created
*/

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type text NOT NULL,
  related_user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  related_id uuid,
  title text NOT NULL,
  message text NOT NULL,
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can read own notifications"
  ON notifications
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications"
  ON notifications
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);

-- Function to create friend request notification
CREATE OR REPLACE FUNCTION create_friend_request_notification()
RETURNS TRIGGER AS $$
DECLARE
  sender_email text;
BEGIN
  -- Only create notification for new friend requests
  IF NEW.status = 'pending' THEN
    -- Get sender's email
    SELECT email INTO sender_email
    FROM auth.users
    WHERE id = NEW.user_id;

    -- Create notification for the recipient
    INSERT INTO notifications (
      user_id,
      type,
      related_user_id,
      related_id,
      title,
      message
    ) VALUES (
      NEW.friend_id,
      'friend_request',
      NEW.user_id,
      NEW.id,
      'New Friend Request',
      sender_email || ' wants to add you as a friend'
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for friend requests
DROP TRIGGER IF EXISTS friend_request_notification_trigger ON friends;
CREATE TRIGGER friend_request_notification_trigger
  AFTER INSERT ON friends
  FOR EACH ROW
  EXECUTE FUNCTION create_friend_request_notification();

-- Function to delete notification when friend request is accepted/rejected
CREATE OR REPLACE FUNCTION delete_friend_request_notification()
RETURNS TRIGGER AS $$
BEGIN
  -- Delete notification when friend request status changes from pending
  IF OLD.status = 'pending' AND NEW.status != 'pending' THEN
    DELETE FROM notifications
    WHERE related_id = NEW.id AND type = 'friend_request';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to clean up notifications
DROP TRIGGER IF EXISTS friend_request_status_change_trigger ON friends;
CREATE TRIGGER friend_request_status_change_trigger
  AFTER UPDATE ON friends
  FOR EACH ROW
  EXECUTE FUNCTION delete_friend_request_notification();