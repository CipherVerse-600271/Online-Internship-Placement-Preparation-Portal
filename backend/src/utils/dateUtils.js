const DATE_ONLY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

// Date-only deadlines use UTC calendar days throughout the API.
const startOfUtcDay = (date = new Date()) =>
  new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));

const parseUtcDateOnly = value => {
  if (typeof value !== "string" || !DATE_ONLY_PATTERN.test(value)) return null;

  const [year, month, day] = value.split("-").map(Number);
  const parsed = new Date(Date.UTC(year, month - 1, day));

  if (
    parsed.getUTCFullYear() !== year ||
    parsed.getUTCMonth() !== month - 1 ||
    parsed.getUTCDate() !== day
  ) {
    return null;
  }

  return parsed;
};

const isDeadlineOpen = (deadline, now = new Date()) => {
  const value = deadline instanceof Date ? deadline : new Date(deadline);
  return !Number.isNaN(value.getTime()) && value >= startOfUtcDay(now);
};

module.exports = { startOfUtcDay, parseUtcDateOnly, isDeadlineOpen };
