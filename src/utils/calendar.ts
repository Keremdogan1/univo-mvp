import { Event } from "@/types";

export const createGoogleCalendarUrl = (event: Event) => {
  const startDate = new Date(`${event.date}T${event.time}`).toISOString().replace(/-|:|\.\d\d\d/g, "");
  // Assume 1 hour duration if not specified
  const endDate = new Date(new Date(`${event.date}T${event.time}`).getTime() + 60 * 60 * 1000).toISOString().replace(/-|:|\.\d\d\d/g, "");
  
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: event.title,
    dates: `${startDate}/${endDate}`,
    details: `${event.description}\n\nTopluluk: ${event.community.name}`,
    location: event.location,
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
};

export const downloadIcsFile = (event: Event) => {
  const startDate = new Date(`${event.date}T${event.time}`).toISOString().replace(/-|:|\.\d\d\d/g, "");
  const endDate = new Date(new Date(`${event.date}T${event.time}`).getTime() + 60 * 60 * 1000).toISOString().replace(/-|:|\.\d\d\d/g, "");
  
  const icsContent = `
BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Univo//Campus Gazette//TR
BEGIN:VEVENT
UID:${event.id}@univo.com
DTSTAMP:${startDate}
DTSTART:${startDate}
DTEND:${endDate}
SUMMARY:${event.title}
DESCRIPTION:${event.description}
LOCATION:${event.location}
ORGANIZER;CN=${event.community.name}:MAILTO:info@univo.com
END:VEVENT
END:VCALENDAR`.trim();

  const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", `${event.title}.ics`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
