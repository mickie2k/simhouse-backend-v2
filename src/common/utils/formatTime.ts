export function formatTime(date: Date): string {
    const timeOptions: Intl.DateTimeFormatOptions = {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false, // Use 24-hour format
        timeZone: 'UTC', // Ensure time is treated as UTC
    };

    // Format the time
    const formattedTime = date.toLocaleTimeString('en-GB', timeOptions);
    return formattedTime;
}
