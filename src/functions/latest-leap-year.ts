const latestLeapYearBeforeYear = (year: number) => {
  const firstGuess = year - (year % 4);
  if (firstGuess % 100 === 0 && firstGuess % 400 !== 0) {
    return firstGuess - 4;
  }
  return firstGuess;
};

export function latestLeapDayBefore(date: Date) {
  const year = date.getFullYear();
  const month = date.getMonth();
  const day = date.getDate();

  const dateIsBeforeFeb29 = month < 1 || (month === 1 && day < 29);
  const yearToUse = dateIsBeforeFeb29 ? year - 1 : year;

  const leapYear = latestLeapYearBeforeYear(yearToUse);
  return new Date(leapYear + '-02-29T00:00:00.000Z');
}
