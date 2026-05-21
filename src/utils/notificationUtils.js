// utils/notificationUtils.js

function validateNotificationData(data) {
  const errors = [];
  if (!data.title || typeof data.title !== "string" || data.title.trim() === "") {
    errors.push("Title is required and must be a non-empty string");
  }
  if (!data.message || typeof data.message !== "string" || data.message.trim() === "") {
    errors.push("Message is required and must be a non-empty string");
  }
  if (data.type && !["reminder", "error", "info", "reminder", "overdue", "payment_confirmation"].includes(data.type)) {
    errors.push("Type must be one of: reminder, overdue, payment_confirmation");
  }
  if (data.isRead !== undefined && typeof data.isRead !== "boolean") {
    errors.push("isRead must be a boolean");
  }
  if (data.scheduledFor) {
    const date = new Date(data.scheduledFor);
    if (isNaN(date.getTime())) {
      errors.push("scheduledFor must be a valid date");
    }
  }
  if (data.debtId !== undefined && data.debtId !== null && isNaN(parseInt(data.debtId, 10))) {
    errors.push("debtId must be a valid number");
  }
  return { valid: errors.length === 0, errors };
}

module.exports = { validateNotificationData };