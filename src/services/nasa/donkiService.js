const NASA_API_ROOT = 'https://api.nasa.gov/DONKI';
const DEMO_API_KEY = 'DEMO_KEY';
const REQUEST_TIMEOUT_MS = 10000;

// Keep one request promise per page load. This also avoids a duplicate request
// when React StrictMode runs effects twice during local development.
let cachedRequest;

function utcDateDaysAgo(daysAgo) {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() - daysAgo);
  return date.toISOString().slice(0, 10);
}

function toEventDetails(parts) {
  return parts.filter(Boolean);
}

function mapSolarFlare(flare) {
  return {
    id: flare.flrID,
    type: 'Solar Flare',
    classType: flare.classType || '',
    eventDate: flare.peakTime || flare.beginTime || '',
    activeRegion: [
      flare.sourceLocation,
      flare.activeRegionNum ? `Active region ${flare.activeRegionNum}` : '',
    ].filter(Boolean).join(' · '),
    description: flare.note || '',
    details: toEventDetails([
      Array.isArray(flare.instruments) && flare.instruments.length
        ? `Instruments: ${flare.instruments.map((instrument) => instrument.displayName || instrument.name).filter(Boolean).join(', ')}`
        : '',
      flare.endTime ? `End time: ${flare.endTime}` : '',
    ]),
    sourceUrl: flare.link || '',
  };
}

function mapCme(cme) {
  return {
    id: cme.activityID,
    type: 'Coronal Mass Ejection (CME)',
    classType: '',
    eventDate: cme.startTime || '',
    activeRegion: [
      cme.sourceLocation,
      cme.activeRegionNum ? `Active region ${cme.activeRegionNum}` : '',
    ].filter(Boolean).join(' · '),
    description: cme.note || '',
    details: toEventDetails([
      cme.catalog ? `Catalog: ${cme.catalog}` : '',
      Array.isArray(cme.instruments) && cme.instruments.length
        ? `Instruments: ${cme.instruments.map((instrument) => instrument.displayName || instrument.name).filter(Boolean).join(', ')}`
        : '',
      Array.isArray(cme.linkedEvents) && cme.linkedEvents.length
        ? `Linked event IDs: ${cme.linkedEvents.map((event) => event.activityID).filter(Boolean).join(', ')}`
        : '',
    ]),
    sourceUrl: cme.link || '',
  };
}

async function fetchEventType(eventType, startDate, endDate, apiKey) {
  const url = new URL(`${NASA_API_ROOT}/${eventType}`);
  url.searchParams.set('startDate', startDate);
  url.searchParams.set('endDate', endDate);
  url.searchParams.set('api_key', apiKey);

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  let payload;
  try {
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) {
      throw new Error(`NASA DONKI ${eventType} request failed (${response.status}).`);
    }
    payload = await response.json();
  } catch (error) {
    if (controller.signal.aborted) {
      throw new Error(`NASA DONKI ${eventType} request timed out after ${REQUEST_TIMEOUT_MS / 1000} seconds.`);
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }

  if (!Array.isArray(payload)) {
    throw new Error(`NASA DONKI ${eventType} returned an unexpected response.`);
  }

  return payload;
}

async function loadDonkiSpaceWeather() {
  const configuredApiKey = import.meta.env.VITE_NASA_API_KEY?.trim();
  const apiKey = configuredApiKey || DEMO_API_KEY;
  const startDate = utcDateDaysAgo(7);
  const endDate = utcDateDaysAgo(0);

  const results = await Promise.allSettled([
    fetchEventType('FLR', startDate, endDate, apiKey),
    fetchEventType('CME', startDate, endDate, apiKey),
  ]);

  const [flareResult, cmeResult] = results;
  const failures = results.flatMap((result, index) => result.status === 'rejected'
    ? [{
      eventType: index === 0 ? 'FLR' : 'CME',
      message: result.reason instanceof Error ? result.reason.message : 'Request failed.',
    }]
    : []);
  const successfulResults = results.filter((result) => result.status === 'fulfilled').length;

  if (successfulResults === 0) {
    return {
      status: 'fallback',
      events: [],
      failures,
      dateRange: { startDate, endDate },
      usedDemoKey: !configuredApiKey,
    };
  }

  const events = [
    ...(flareResult.status === 'fulfilled' ? flareResult.value.map(mapSolarFlare) : []),
    ...(cmeResult.status === 'fulfilled' ? cmeResult.value.map(mapCme) : []),
  ].filter((event) => event.id && event.eventDate)
    .sort((a, b) => Date.parse(b.eventDate) - Date.parse(a.eventDate));

  return {
    status: failures.length > 0 ? 'partial' : 'live',
    events,
    observationSource: 'NASA Space Weather Database Of Notifications, Knowledge, Information (DONKI)',
    nasaApiUrl: 'https://api.nasa.gov/DONKI',
    dateRange: { startDate, endDate },
    usedDemoKey: !configuredApiKey,
    failures,
  };
}

/** Fetch live solar flare and CME observations once for this page load. */
export function fetchDonkiSpaceWeather() {
  if (!cachedRequest) {
    cachedRequest = loadDonkiSpaceWeather();
  }
  return cachedRequest;
}
