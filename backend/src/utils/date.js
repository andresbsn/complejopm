const getLocalDate = (date = new Date()) => {
    const timeZone = process.env.APP_TIMEZONE || 'America/Argentina/Buenos_Aires';
    const parts = new Intl.DateTimeFormat('en-CA', {
        timeZone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    }).formatToParts(date);

    const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
    return `${values.year}-${values.month}-${values.day}`;
};

module.exports = { getLocalDate };
