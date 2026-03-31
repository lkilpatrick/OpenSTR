import https from 'https';
import http from 'http';

export interface VEvent {
  uid: string;
  summary: string;
  dtstart: string;
  dtend: string;
  description: string;
  location: string;
  transp: string;
  guest_name: string;
  phone: string;
  num_guests: number | null;
  is_blocked: boolean;
}

function parseDate(val: string): string {
  // Handle DATE (YYYYMMDD) and DATETIME (YYYYMMDDTHHmmssZ)
  if (val.length === 8) {
    return `${val.slice(0, 4)}-${val.slice(4, 6)}-${val.slice(6, 8)}`;
  }
  return new Date(val).toISOString().slice(0, 10);
}

function extractGuestInfo(summary: string, description: string) {
  let guest_name = '';
  let phone = '';
  let num_guests: number | null = null;

  // Airbnb SUMMARY: guest name, "Reserved", or "Not available" / "Airbnb (Not available)"
  const blockedSummaries = ['Not available', 'Airbnb (Not available)'];
  if (summary && !blockedSummaries.includes(summary) && summary !== 'Reserved') {
    guest_name = summary.replace(/\s*\(.*\)/, '').trim();
  }

  // Parse DESCRIPTION for phone digits, guest count, reservation URL
  if (description) {
    // Airbnb provides "Phone Number (Last 4 Digits): XXXX"
    const phoneLast4 = description.match(/Phone.*?(\d{4})/i);
    if (phoneLast4) phone = `***${phoneLast4[1]}`;

    // Full phone number if provided
    const fullPhone = description.match(/Phone[:\s]+(\+[\d\s\-()]+)/i);
    if (fullPhone) phone = fullPhone[1].trim();

    const guestMatch = description.match(/(\d+)\s*guest/i);
    if (guestMatch) num_guests = parseInt(guestMatch[1]);
  }

  // "Not available" = owner block, "Airbnb (Not available)" = platform block
  // "Reserved" = real booking (just no guest name visible in iCal)
  const is_blocked = blockedSummaries.includes(summary);

  return { guest_name, phone, num_guests, is_blocked };
}

export async function fetchIcal(url: string): Promise<VEvent[]> {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    client.get(url, (res) => {
      let data = '';
      res.on('data', (chunk: Buffer) => { data += chunk.toString(); });
      res.on('end', () => {
        const events: VEvent[] = [];
        const lines = data.replace(/\r\n /g, '').split(/\r?\n/);
        let current: Partial<VEvent> & { _desc?: string } | null = null;

        for (const line of lines) {
          if (line === 'BEGIN:VEVENT') { current = {}; continue; }
          if (line === 'END:VEVENT') {
            if (current?.uid && current.dtstart && current.dtend) {
              const desc = current._desc ?? '';
              const info = extractGuestInfo(current.summary ?? '', desc);
              events.push({
                uid: current.uid,
                summary: current.summary ?? '',
                dtstart: current.dtstart,
                dtend: current.dtend,
                description: desc,
                location: current.location ?? '',
                transp: current.transp ?? '',
                ...info,
              });
            }
            current = null;
            continue;
          }
          if (!current) continue;
          const [key, ...rest] = line.split(':');
          const value = rest.join(':');
          const baseKey = key.split(';')[0];
          if (baseKey === 'UID') current.uid = value;
          if (baseKey === 'SUMMARY') current.summary = value;
          if (baseKey === 'DTSTART') current.dtstart = parseDate(value);
          if (baseKey === 'DTEND') current.dtend = parseDate(value);
          if (baseKey === 'DESCRIPTION') current._desc = value.replace(/\\n/g, '\n');
          if (baseKey === 'LOCATION') current.location = value;
          if (baseKey === 'TRANSP') current.transp = value;
        }
        resolve(events);
      });
    }).on('error', reject);
  });
}
