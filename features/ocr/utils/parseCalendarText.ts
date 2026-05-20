type ParsedEvent = {
  date: string;
  title: string;
  time: string;
};

export function parseCalendarText(text: string, year: number, month: number): ParsedEvent[] {
  const lines = text
    .split("\n")
    .map((line) => line.replace(/\s+/g, " ").trim())
    .filter(Boolean);

  const events: ParsedEvent[] = [];

  let currentDate: string | null = null;
  let pendingTime = "";

  const regexMonthDay = /(\d{1,2})[\/\-월]\s*(\d{1,2})[일]?/;
  const regexOnlyDay = /^(\d{1,2})일$/; // Only match if it's exactly like "21일"
  const regexTime = /(\d{1,2}):(\d{2})/;

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];

    // 날짜 감지
    const md = line.match(regexMonthDay);
    const od = line.match(regexOnlyDay);

    if (md || od) {
      const m = md ? Number(md[1]) : month;
      const d = md ? Number(md[2]) : Number(od![1]);

      const date = new Date(year, m - 1, d);

      if (!isNaN(date.getTime()) && date.getDate() === d) {
        currentDate =
          `${date.getFullYear()}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      }

      line = line.replace(md?.[0] || od?.[0] || "", "").trim();
    }

    // 시간 감지
    const tm = line.match(regexTime);
    if (tm) {
      pendingTime = `${tm[1].padStart(2, "0")}:${tm[2]}`;
      line = line.replace(tm[0], "").trim();
    }

    line = line.replace(/^[:\-\s•◦]+/, "").trim();

    // 제목이 있을 때만 저장 (한 글자도 허용)
    if (currentDate && line.length > 0) {
      events.push({
        date: currentDate,
        title: line,
        time: pendingTime,
      });

      pendingTime = "";
      continue; // Skip look-ahead since we already processed this line
    }

    // If no title on this line but we have date/time context, look ahead up to 2 lines
    if ((currentDate || pendingTime) && line.length === 0) {
      // Look ahead up to 2 lines for content
      for (let lookAhead = 1; lookAhead <= 2; lookAhead++) {
        if (i + lookAhead >= lines.length) break;

        let nextLine = lines[i + lookAhead];
        let nextTitle = nextLine.replace(/\s+/g, " ").trim();
        let nextTime = pendingTime; // Inherit current pending time

        // Check if next line has time
        const nextTimeMatch = nextLine.match(regexTime);
        if (nextTimeMatch) {
          nextTime = `${nextTimeMatch[1].padStart(2, "0")}:${nextTimeMatch[2]}`;
          nextTitle = nextLine.replace(nextTimeMatch[0], "").replace(/^[:\-\s•◦]+/, "").trim();
        }

        // Check if next line has date (which would mean it's a new event)
        const nextDateMatch = nextLine.match(regexMonthDay) || nextLine.match(regexOnlyDay);
        if (nextDateMatch) {
          // Next line is a new date, stop looking ahead
          break;
        }

        // If we found a title
        if (nextTitle.length > 0) {
          // Determine date to use
          let eventDate = currentDate;
          if (!eventDate && nextDateMatch) {
            const m = nextDateMatch ? Number(nextDateMatch[1]) : month;
            const d = nextDateMatch ? Number(nextDateMatch[2]) :
                     (nextLine.match(regexOnlyDay) ? Number(nextLine.match(regexOnlyDay)![1]) : 1);
            eventDate = `${year}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
          }

          if (eventDate) {
            events.push({
              date: eventDate,
              title: nextTitle,
              time: nextTime,
            });

            // Skip the lines we've consumed
            i += lookAhead;
          }
          break; // Stop looking ahead once we find content
        }
      }
    }
  }

  return dedupeEvents(events);
}

function dedupeEvents(events: ParsedEvent[]) {
  return events.filter(
    (event, index, self) =>
      index ===
      self.findIndex(
        (e) =>
          e.date === event.date &&
          e.title === event.title &&
          e.time === event.time
      )
  );
}