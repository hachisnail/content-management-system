// client/src/utils/time.js
export const formatTimeAgo = (dateString) => {
  if (!dateString) {
    return 'never';
  }
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.round((now - date) / 1000);

  if (seconds < 5) {
    return 'just now';
  } else if (seconds < 60) {
    return `${seconds} seconds ago`;
  }

  const minutes = Math.round(seconds / 60);
  if (minutes < 60) {
    return `${minutes} minutes ago`;
  }

  const hours = Math.round(minutes / 60);
  if (hours < 24) {
    return `${hours} hours ago`;
  }

  const days = Math.round(hours / 24);
  return `${days} days ago`;
};
