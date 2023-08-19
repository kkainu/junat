
const trainLines = {
  helsinki_ogeli: {
    id: 'helsinki_ogeli',
    url: 'https://rata.digitraffic.fi/api/v1/live-trains/station/HKI/OLK',
    station: 'HKI'
  },
  ogeli_helsinki: {
    id: 'ogeli_helsinki',
    url: 'https://rata.digitraffic.fi/api/v1/live-trains/station/OLK/HKI',
    station: 'OLK'
  }
}



function fetchTimeTables() {
  document.getElementById('time').innerText = getTime()

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

function trainData(train, station) {
  const timeTable = train.timeTableRows.find(r => r.stationShortCode === station && r.type === 'DEPARTURE')
  return {
    id: train.commuterLineID,
    departure: timeTable.scheduledTime,
    cancelled: timeTable.cancelled, 
    track: timeTable.commercialTrack,
  }
}

function trainDataToHTML(trainsResponse, line) {
  const trains = trainsResponse.map(train => trainData(train, line.station))
  document.getElementById(line.id).innerHTML = trains.map(t => {
    return `
    <div class="train-row">
      <div class="train-id">${t.id}</div>
      <div class="departure${t.cancelled ? ' cancelled' : ''}">${t.departure.slice(11,19)}</div>
      <div class="track">${t.track}</div>
    </div>`
  }).join('')
}

function getTime() {
  const now = new Date()
  return now.toLocaleTimeString('fi-FI')
}

