export function parseCalendarText(text: string, year: number, month: number) {
  const lines = text
    .split("\n")
    .map((l) => l.replace(/\s+/g, " ").trim())
    .filter(Boolean);

  const events: { date: string; title: string; time: string }[] = [];

  let currentDate: string | null = null;

  const regexMonthDay = /(\d{1,2})[/\-월]\s*(\d{1,2})[일]?/;
  const regexOnlyDay = /^(\d{1,2})일/;
  const regexTime = /(\d{1,2}):(\d{2})/;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    let extractedMonth = month;
    let extractedDay: number | null = null;
    let time = "";
    let title = line;

    const m1 = line.match(regexMonthDay);
    if (m1) {
      extractedMonth = Number(m1[1]);
      extractedDay = Number(m1[2]);
      title = title.replace(m1[0], "").trim();
    } else {
      const m2 = line.match(regexOnlyDay);
      if (m2) {
        extractedDay = Number(m2[1]);
        title = title.replace(m2[0], "").trim();
      }
    }

    const t = title.match(regexTime);
    if (t) {
      time = `${t[1].padStart(2, "0")}:${t[2]}`;
      title = title.replace(t[0], "").trim();
    }

    title = title.replace(/^[:\-\s•]+/, "").trim();

    if (extractedDay !== null) {
      const d = new Date(year, extractedMonth - 1, extractedDay);

      if (!isNaN(d.getTime())) {
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, "0");
        const dd = String(d.getDate()).padStart(2, "0");
        currentDate = `${yyyy}-${mm}-${dd}`;
      }
    }

    if (currentDate && title) {
      events.push({
        date: currentDate,
        title,
        time,
      });
    }
  }

  return events;
}