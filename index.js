import fs from 'node:fs/promises'
import GpxParser from 'gpxparser'

function getDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Radius of the earth in km
    const dLat = deg2rad(lat2-lat1);  // deg2rad below
    const dLon = deg2rad(lon2-lon1);
    const a =
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
        Math.sin(dLon/2) * Math.sin(dLon/2)
    ;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const d = R * c * 1000; // Distance in meters
    return d;
}

function deg2rad(deg) {
    return deg * (Math.PI/180)
}

function duration2seconds(duration) {
    // https://stackoverflow.com/a/45292588
    const a = duration.split(':')
    return a.reduce((acc, time) => (60 * acc) + parseInt(time), 0)
}

function getTrackLength(track) {
    let distance = 0
    let lastPoint = null
    for (const currPoint of track) {
        if (lastPoint) {
            distance += getDistance(lastPoint.lat, lastPoint.lon, currPoint.lat, currPoint.lon)
        }
        lastPoint = currPoint
    }
    if (lastPoint) { // Assume circular track
        distance += getDistance(track[0].lat, track[0].lon, lastPoint.lat, lastPoint.lon)
    }
    return distance
}

async function readGPXFile(filePath) {
    try {
        const data = await fs.readFile(filePath);
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

let startTime = Date.parse('2024-10-14T12:00:00')
const totalDuration = duration2seconds('1:10:00')
const { name, track } = await readGPXFile('/Users/torsten/Downloads/Bali-Marina.gpx')
console.log('--N-->', name)
if (track && track.length > 0) {
    const totalDistance = getTrackLength(track)
    console.log('--L-->', totalDistance)
    const startPoint = track[0]
    // const startTime = startPoint.time.getTime()
    let lastPoint = null
    for (const currPoint of track) {
        if (lastPoint) {
            const distance = getDistance(lastPoint.lat, lastPoint.lon, currPoint.lat, currPoint.lon)
            const duration = totalDuration * distance / totalDistance
            //console.log(`---${duration}-->`, currPoint)
            startTime += duration * 1000
            const time = new Date(startTime).toISOString()
            console.log(`---${distance}\t${duration}\t${currPoint.time.toISOString()}\t${time}`)
        }
        lastPoint = currPoint
    }
    if (lastPoint) { // Assume circular track
        const distance = getDistance(startPoint.lat, startPoint.lon, lastPoint.lat, lastPoint.lon)
        const duration = totalDuration * distance / totalDistance
        startTime += duration * 1000
        const time = new Date(startTime).toISOString()
        console.log(`---${distance}\t${duration}\t${lastPoint.time.toISOString()}\t${time}`)
    }
    console.log('----->', totalDistance / totalDuration * 3.6)
}

/*
let x = Date.parse('2024-10-13T00:19:32')
console.log(new Date(x))
console.log(duration2seconds('50'))
console.log(duration2seconds('1:50'))
console.log(duration2seconds('1:10:20'))
*/
