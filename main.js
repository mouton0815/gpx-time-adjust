import fs from 'node:fs/promises'
import GpxParser from 'gpxparser'


if (process.argv.length !== 5) {
    console.error('Usage : node main.js <path-to-gpx-file> <start-datetime> <duration>')
    console.error('Sample: node main.js ~/my-files/Foo.gpx 2024-10-09T11:18:00 1:53:15')
    process.exit(-1)
}

const gpxFilePath = process.argv[2]
const startTimestamp = Date.parse(process.argv[3])
const totalDuration = parseDuration(process.argv[4])
const { name, track } = await readGPXFile(gpxFilePath)
const adjustedTrack = adjustTimes(track, startTimestamp, totalDuration)
console.log(printGPX(name, adjustedTrack))


function deg2rad(deg) {
    return deg * (Math.PI/180)
}

function calcDistance(lat1, lon1, lat2, lon2) {
    const R = 6371 // Radius of the earth in km
    const dLat = deg2rad(lat2-lat1)  // deg2rad below
    const dLon = deg2rad(lon2-lon1)
    const a =
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
        Math.sin(dLon/2) * Math.sin(dLon/2)
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
    return R * c * 1000 // Return distance in meters
}

// Input: 'HH:mm::ss'
// Output: duration in seconds
// https://stackoverflow.com/a/45292588
function parseDuration(duration) {
    const a = duration.split(':')
    return a.reduce((acc, time) => (60 * acc) + parseInt(time), 0)
}

function calcTrackLength(track) {
    let distance = 0
    let lastPoint = null
    for (const currPoint of track) {
        if (lastPoint) {
            distance += calcDistance(lastPoint.lat, lastPoint.lon, currPoint.lat, currPoint.lon)
        }
        lastPoint = currPoint
    }
    if (lastPoint) { // Assume circular track
        distance += calcDistance(track[0].lat, track[0].lon, lastPoint.lat, lastPoint.lon)
    }
    return distance
}

function adjustTimes(track, startTime /* in ms since 1970 */, totalDuration /* in seconds */) {
    const results = []
    if (track && track.length > 0) {
        const totalDistance = calcTrackLength(track)
        const startPoint = track[0]
        let lastPoint = null
        for (const currPoint of track) {
            if (lastPoint) {
                const distance = calcDistance(lastPoint.lat, lastPoint.lon, currPoint.lat, currPoint.lon)
                startTime += totalDuration * distance / totalDistance * 1000
                const time = new Date(startTime).toISOString()
                results.push(Object.assign({}, currPoint, { time }))
            }
            lastPoint = currPoint
        }
        if (lastPoint) { // Assume circular track
            const distance = calcDistance(startPoint.lat, startPoint.lon, lastPoint.lat, lastPoint.lon)
            startTime += totalDuration * distance / totalDistance * 1000
            const time = new Date(startTime).toISOString()
            results.push(Object.assign({}, lastPoint, { time }))
        }
    }
    return results
}

async function readGPXFile(filePath) {
    try {
        const data = await fs.readFile(filePath)
        const gpx = new GpxParser()
        gpx.parse(data.toString())
        if (!gpx.tracks || gpx.tracks.length !== 1 || !gpx.tracks[0].points || gpx.tracks[0].points.length < 1) {
            console.warn('No tracks array in file', filePath)
        } else {
            const trk = gpx.tracks[0]
            const name = trk.name
            const track = trk.points
            return { name, track }
        }
    } catch (err) {
        console.warn('Cannot read GPX file', filePath, err)
    }
}

function printGPX(name, track) {
    let buffer = '<?xml version="1.0" encoding="UTF-8"?>\n'
    buffer += '<gpx xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns="http://www.topografix.com/GPX/1/1" xsi:schemaLocation="http://www.topografix.com/GPX/1/1 http://www.topografix.com/GPX/1/1/gpx.xsd" version="1.1" creator="strava.com">\n'
    buffer += '  <metadata>\n'
    buffer += `    <name>${name}</name>\n`
    buffer += '  </metadata>\n'
    buffer += '  <trk>\n'
    buffer += `    <name>${name}</name>\n`
    buffer += '    <trkseg>\n'
    for (const point of track) {
        buffer += `      <trkpt lat="${point.lat}" lon="${point.lon}">\n`
        buffer += `        <ele>${point.ele}</ele>\n`
        buffer += `        <time>${point.time}</time>\n`
        buffer += '      </trkpt>\n'
    }
    buffer += '    </trkseg>\n'
    buffer += '  </trk>\n'
    buffer += '</gpx>\n'
    return buffer
}
