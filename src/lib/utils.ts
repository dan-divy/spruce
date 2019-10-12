
/**
 * Convert a UTC date
 *
 * @param   {Date} UTC date
 * @param   {string} locale, optional defaults to 'en-US'
 * @return  {string} formatted date string
 */
export const FormatDate = (datetime:Date, locale:string = 'en-US') => {
  const dt = Date.parse(datetime.toString());
  const options = {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric', 
    minute: 'numeric', 
    second: 'numeric',
    hour12: false,
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
  };
  return new Intl.DateTimeFormat(locale, options).format(dt);
};