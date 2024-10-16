# Adjust the Timestamps of your GPX Tracks
This project comes with a simple Node.js script ([main.js](./main.js)) that reads a GPX file with a track
and — given a start time and a total duration — sets new timestamps for each track point.
The total duration is distributed over the distances between the points in such a way
that the total speed is approximately constant.

The time adjustment of GPX tracks is useful if you have created the track with a GPX route planner (such as [plotaroute.com](https://www.plotaroute.com)
or [BRouter-Web](https://brouter.de/brouter-web)) and then want to add position timestamps that reflect your real walk or ride.

The reason for writing this tool was a bug in my Garmin vívoactive 4 watch, which occasionally recorded the times —
but not the corresponding track.
Since I wanted to display the track on [Strava](https://www.strava.com) (and additionally hunt for [Squadrats](https://squadrats.com)),
I was looking for a solution to add timestamp information to the route afterwards.

## Installation
You need Node.js with npm.
```shell
npm install
```

## Running
```shell
npm start <path-to-gpx-file> <start-datetime> <duration>
```
The script prints the results to stdout and should be piped to a file.

Example:
```shell
npm start ~/my-files/Foo.gpx 2024-10-09T11:18:00 1:53:15 > ~/my-files/Foo-adjusted.gpx
```
