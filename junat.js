const trainLines = {
  helsinki_ogeli: {
    id: 'helsinki_ogeli',
    name: 'Helsinki - Oulunkylä',
    url: 'https://rata.digitraffic.fi/api/v1/live-trains/station/HKI/OLK',
    station: 'HKI',
    tracks: ['1','2','3','4','5','6','7','8','9']
  },
  ogeli_helsinki: {
    id: 'ogeli_helsinki',
    name: 'Oulunkylä - Helsinki',
    url: 'https://rata.digitraffic.fi/api/v1/live-trains/station/OLK/HKI',
    station: 'OLK',
    tracks: ['4']
  }
}

async function updateTimeTables() {
  document.getElementById('time').innerText = new Date().toLocaleTimeString()

  const html = await Promise.all(Object.keys(trainLines).map(async line => {
    const trains = await getTrainLineData(trainLines[line])
    return trainDataToHTML(trains, trainLines[line])
  }))

  document.getElementById('data').innerHTML = html.join('')

  setTimeout(updateTimeTables, 30000)
}

async function getTrainLineData(line) {
  const startDate = new Date(new Date().getTime() - 5 * 1000 * 60).toISOString()
  const endDate = new Date(new Date().getTime() + 60 * 1000 * 60).toISOString()
  const urlWithTime = `${line.url}?startDate=${startDate}&endDate=${endDate}`
  const response = await fetch(urlWithTime);
  return response.json();
}

function trainData(train, line) {
  const timeTable = train.timeTableRows.find(
    r => r.stationShortCode === line.station && 
    r.type === 'DEPARTURE' && 
    (line.tracks === undefined || line.tracks.includes(r.commercialTrack))
  )

  if (!timeTable) {
    return null
  }

  const departureTime = new Date(timeTable.scheduledTime).toLocaleTimeString()
  const estimateTime = timeTable.liveEstimateTime && new Date(timeTable.liveEstimateTime).toLocaleDateString()

  return {
    id: train.commuterLineID,
    departure: `${departureTime}`,
    cancelled: timeTable.cancelled, 
    track: timeTable.commercialTrack,
  }
}

function trainDataToHTML(trainsResponse, line) {
  const trains = trainsResponse.map(train => trainData(train, line)).filter(r => r !== null)
  return `
    <h2>${line.name}</h2>
    <div class="station">
      ${trains.map(t => `
        <div class="train-row">
          <div class="train-id">${t.id}</div>
          <div class="departure${t.cancelled ? ' cancelled' : ''}">${t.departure}</div>
          <div class="track">${t.track}</div>
        </div>`
      ).join('')}
    </div>
  `
}

updateTimeTables()

