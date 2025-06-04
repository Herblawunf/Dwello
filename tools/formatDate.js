export const formatDate = (dateString) => {
  const now = new Date();
  const date = new Date(dateString);
  const diffInDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));

  if (diffInDays === 0) return "Today";
  if (diffInDays === 1) return "Yesterday";
  if (diffInDays < 7) return `${diffInDays} days ago`;

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  // Example outputs: "Today", "Yesterday", "3 days ago", "Jun 1, 2023"
};
