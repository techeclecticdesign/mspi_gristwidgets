export const getWeekRanges = () => {
  const today = new Date();

  // Determine offset from most recent Thursday
  const offset = today.getDay() >= 4 ? today.getDay() - 4 : today.getDay() + 3;
  const currentWeekStart = new Date(today);
  currentWeekStart.setDate(today.getDate() - offset);
  currentWeekStart.setHours(0, 0, 0, 0);

  const weekRanges = [];

  const todayEnd = new Date(today);
  todayEnd.setHours(23, 59, 59, 999);

  weekRanges.push({
    start: new Date(currentWeekStart),
    end: todayEnd,
  });

  let previousStart = new Date(currentWeekStart);
  previousStart.setDate(previousStart.getDate() - 7);

  for (let i = 0; i < 4; i++) {
    const start = new Date(previousStart);
    start.setHours(0, 0, 0, 0);

    const end = new Date(previousStart);
    end.setDate(end.getDate() + 6);
    end.setHours(23, 59, 59, 999);

    weekRanges.push({ start, end });

    previousStart.setDate(previousStart.getDate() - 7);
  }

  return weekRanges;
};
