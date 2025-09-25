const REFRESH_INTERVAL_MS = 30000;
const THEME_STORAGE_KEY = 'junat-theme';
const THEME_COLORS = {
  dark: '#121826',
  light: '#f8fafc'
};

const timeFormatter = new Intl.DateTimeFormat(undefined, {
  hour: '2-digit',
  minute: '2-digit',
  hour12: false
});

const headerTimeFormatter = new Intl.DateTimeFormat(undefined, {
  weekday: 'short',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false
});

const trainLines = {
  helsinki_ogeli: {
    id: 'helsinki_ogeli',
    name: 'Helsinki to Oulunkylä',
    url: 'https://rata.digitraffic.fi/api/v1/live-trains/station/HKI/OLK',
    station: 'HKI',
    tracks: ['1', '2', '3', '4', '5', '6', '7', '8', '9']
  },
  ogeli_helsinki: {
    id: 'ogeli_helsinki',
    name: 'Oulunkylä to Helsinki',
    url: 'https://rata.digitraffic.fi/api/v1/live-trains/station/OLK/HKI',
    station: 'OLK',
    tracks: ['4']
  }
};

async function updateTimeTables() {
  const now = new Date();
  const timeEl = document.getElementById('time');
  if (timeEl) {
    timeEl.textContent = headerTimeFormatter.format(now);
  }

  const sections = await Promise.all(
    Object.values(trainLines).map(async (line) => {
      try {
        const trains = await getTrainLineData(line);
        return trainDataToHTML(trains, line);
      } catch (error) {
        console.error('Failed to load train data', error);
        return errorState(line);
      }
    })
  );

  const container = document.getElementById('data');
  if (container) {
    container.innerHTML = sections.join('');
  }

  setTimeout(updateTimeTables, REFRESH_INTERVAL_MS);
}

function errorState(line) {
  return `
    <section class="line-card" aria-live="polite">
      <header class="line-header">
        <h2 class="line-title">${line.name}</h2>
        <span class="line-meta">Unable to load departures right now</span>
      </header>
      <div class="empty-state">Check your connection and try again.</div>
    </section>
  `;
}

async function getTrainLineData(line) {
  const now = Date.now();
  const startDate = new Date(now - 5 * 60 * 1000).toISOString();
  const endDate = new Date(now + 60 * 60 * 1000).toISOString();
  const urlWithTime = `${line.url}?startDate=${startDate}&endDate=${endDate}`;
  const response = await fetch(urlWithTime);

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  return response.json();
}

function trainData(train, line) {
  const timeTable = train.timeTableRows.find((row) =>
    row.stationShortCode === line.station &&
    row.type === 'DEPARTURE' &&
    (line.tracks === undefined || line.tracks.includes(row.commercialTrack))
  );

  if (!timeTable) {
    return null;
  }

  const scheduledDate = new Date(timeTable.scheduledTime);
  const estimateDate = timeTable.liveEstimateTime
    ? new Date(timeTable.liveEstimateTime)
    : null;

  const label = train.commuterLineID || `${train.trainType || ''}${train.trainNumber || ''}`.trim();
  const scheduled = timeFormatter.format(scheduledDate);

  let estimate = null;
  let deltaMinutes = 0;

  if (estimateDate) {
    estimate = timeFormatter.format(estimateDate);
    deltaMinutes = Math.round((estimateDate - scheduledDate) / 60000);
  }

  return {
    label: label || 'N/A',
    scheduled,
    estimate,
    deltaMinutes,
    cancelled: Boolean(timeTable.cancelled),
    track: timeTable.commercialTrack || '?'
  };
}

function trainDataToHTML(trainsResponse, line) {
  const trains = trainsResponse
    .map((train) => trainData(train, line))
    .filter((train) => train !== null)
    .slice(0, 6);

  const departures = trains.length
    ? trains.map((train) => renderDeparture(train)).join('')
    : '<div class="empty-state">No departures in the next hour.</div>';

  return `
    <section class="line-card" aria-live="polite">
      <header class="line-header">
        <h2 class="line-title">${line.name}</h2>
      </header>
      <div class="departures">${departures}</div>
    </section>
  `;
}

function renderDeparture(train) {
  const showDelay = !train.cancelled && Number.isFinite(train.deltaMinutes) && train.deltaMinutes > 0;
  const delayBadge = showDelay
    ? `<span class="estimate">${train.deltaMinutes} min</span>`
    : '';

  const cancelledHint = train.cancelled ? '<span class="estimate">Cancelled</span>' : '';

  return `
    <div class="departure-row${train.cancelled ? ' cancelled' : ''}">
      <div class="train-badge">${train.label}</div>
      <div class="time-cell">
        <span>${train.scheduled}</span>
        ${delayBadge}
        ${cancelledHint}
      </div>
      <div class="track-pill">Track ${train.track}</div>
    </div>
  `;
}

function getPreferredTheme() {
  try {
    const storedTheme = localStorage.getItem(THEME_STORAGE_KEY);
    if (storedTheme === 'light' || storedTheme === 'dark') {
      return storedTheme;
    }
  } catch (error) {
    console.warn('Unable to read stored theme', error);
  }

  const datasetTheme = document.documentElement.dataset.theme;
  if (datasetTheme === 'light' || datasetTheme === 'dark') {
    return datasetTheme;
  }

  const prefersLight = window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches;
  return prefersLight ? 'light' : 'dark';
}

function applyTheme(theme) {
  const normalizedTheme = theme === 'light' ? 'light' : 'dark';
  document.documentElement.dataset.theme = normalizedTheme;

  const metaThemeColor = document.querySelector('meta[name="theme-color"]');
  if (metaThemeColor) {
    metaThemeColor.setAttribute('content', THEME_COLORS[normalizedTheme]);
  }

  updateThemeToggle(normalizedTheme);
}

function updateThemeToggle(theme) {
  const toggle = document.getElementById('theme-toggle');
  if (!toggle) {
    return;
  }

  const nextTheme = theme === 'dark' ? 'light' : 'dark';
  const label = `Switch to ${nextTheme} theme`;

  toggle.setAttribute('aria-label', label);

  const iconElement = toggle.querySelector('.theme-toggle__icon');
  if (iconElement) {
    iconElement.textContent = nextTheme === 'light' ? '☀️' : '🌙';
  }
}

function initThemeToggle() {
  const toggle = document.getElementById('theme-toggle');
  if (!toggle) {
    return;
  }

  toggle.addEventListener('click', () => {
    const currentTheme = document.documentElement.dataset.theme === 'light' ? 'light' : 'dark';
    const nextTheme = currentTheme === 'light' ? 'dark' : 'light';

    applyTheme(nextTheme);

    try {
      localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
    } catch (error) {
      console.warn('Unable to persist theme selection', error);
    }
  });
}

function initialiseTheme() {
  const initialTheme = getPreferredTheme();
  applyTheme(initialTheme);
  initThemeToggle();
}

initialiseTheme();
updateTimeTables();
