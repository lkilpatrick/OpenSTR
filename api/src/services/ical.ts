import https from 'https';
import http from 'http';

interface VEvent {
  uid: string;
  summary: string;
  dtstart: string;
  dtend: string;
}

function parseDate(val: string): string {
  // Handle DATE (YYYYMMDD) and DATETIME (YYYYMMDDTHHmmssZ)
  if (val.length === 8) {
    return `${val.slice(0, 4)}-${val.slice(4, 6)}-${val.slice(6, 8)}`;
  }
  return new Date(val).toISOString().slice(0, 10);
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
        let current: Partial<VEvent> | null = null;

        for (const line of lines) {
          if (line === 'BEGIN:VEVENT') { current = {}; continue; }
          if (line === 'END:VEVENT') {
            if (current?.uid && current.dtstart && current.dtend) {
              events.push(current as VEvent);
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
        }
        resolve(events);
      });
    }).on('error', reject);
  });
}
