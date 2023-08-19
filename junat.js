const trainLines = {
  helsinki_ogeli: {
    id: 'helsinki_ogeli',
    url: 'https://rata.digitraffic.fi/api/v1/live-trains/station/HKI/OLK',
    station: 'HKI',
    tracks: ['1','2','3','4','5','6','7','8','9']
  },
  ogeli_helsinki: {
    id: 'ogeli_helsinki',
    url: 'https://rata.digitraffic.fi/api/v1/live-trains/station/OLK/HKI',
    station: 'OLK',
    tracks: ['4']
  }
}

function fetchTimeTables() {
  document.getElementById('time').innerText = getTime()

  const lines = Object.keys(trainLines)

  getTrainLineDateData(trainLines.helsinki_ogeli)
    .then(trains => trainDataToHTML(trains, trainLines.helsinki_ogeli))

  getTrainLineDateData(trainLines.ogeli_helsinki)
    .then(trains => trainDataToHTML(trains, trainLines.ogeli_helsinki))

  setTimeout(fetchTimeTables, 5000)
}

fetchTimeTables()

async function getTrainLineDateData(line) {
  const startDate = new Date(new Date().getTime() - 5 * 1000 * 60).toISOString()
  const endDate = new Date(new Date().getTime() + 30 * 1000 * 60).toISOString()
  const urlWithTime = `${line.url}?startDate=${startDate}&endDate=${endDate}`
  const response = await fetch(urlWithTime);
  const data = await response.json();
  return data
}

function trainData(train, line) {
  const timeTable = train.timeTableRows.find(
    r => r.stationShortCode === line.station && 
    r.type === 'DEPARTURE' && 
    (line.tracks === undefined || line.tracks.includes(r.commercialTrack))
  )
  return timeTable ? {
    id: train.commuterLineID,
    departure: new Date(timeTable.scheduledTime).toLocaleTimeString(),
    cancelled: timeTable.cancelled, 
    track: timeTable.commercialTrack,
  } : null
}

function trainDataToHTML(trainsResponse, line) {
  const trains = trainsResponse.map(train => trainData(train, line)).filter(r => r !== null)
  document.getElementById(line.id).innerHTML = trains.map(t => {
    return `
    <div class="train-row">
      <div class="train-id">${t.id}</div>
      <div class="departure${t.cancelled ? ' cancelled' : ''}">${t.departure}</div>
      <div class="track">${t.track}</div>
    </div>`
  }).join('')
}

function getTime() {
  const now = new Date()
  return now.toLocaleTimeString()
}

