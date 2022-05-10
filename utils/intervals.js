const moment = require('moment');

//Returns all intervals between 9AM to 5PM with 15 mins gap
function getAllIntervals(date) {
  let intervals = [];
  const selectedDate = moment(date);

  //Initially set the current interval start time to 9AM
  let intervalStartTime = selectedDate.clone().set({'h': 9, 'm': 0, 's': 0});

  //If selected date is same as today's date
  if (selectedDate.startOf('day').isSame(moment().utcOffset("-07:00").startOf('day'))) {
    //And time is between 9 to 5, start interval from current time
    if ((moment().hour() > 9) && (moment().hour() < 17)) {
      intervalStartTime = moment().add(15 - moment().minute() % 15, 'm').subtract(moment().seconds(), 's');
    } 
    //Else if it is already past 5PM, we dont have any slots for today
    else if (moment().hour() >= 17) {
      return [];
    }
  }

  //Set end time to 5PM today
  const intervalEndTime = selectedDate.clone().set({'h': 16, 'm': 30, 's': 0});

  //Generate time slots
  while(intervalStartTime.isSameOrBefore(intervalEndTime)){
    intervals.push({
      start: new moment(intervalStartTime),
      end: new moment(intervalStartTime).add(30, 'm')
    });
    intervalStartTime.add(15, 'm');
  }
  return intervals;
}

//This function adds the time in a readable format
function getFreeIntervals(date, busyIntervals) {
  const freeIntervals = getRawFreeIntervals(date, busyIntervals);
  return freeIntervals.map((interval) => ({
    interval: interval.start,
    formatedInterval: moment(interval.start).clone().format('LT')
  }));
}

//Returns all free intervals as Moment objects
function getRawFreeIntervals(date, busyIntervals) {
  const allIntervals = getAllIntervals(date);

  //Return all free intervals if user has no meetings for that day
  if (busyIntervals.length === 0) return allIntervals;

  //Initialize array to store free intervals
  const freeIntervals = [];

  //Initialize index for tracking progress
  let busyIntervalsIdx = 0;
  let allIntervalsIdx = 0;

  //While we are tracing through the arrays
  while (allIntervalsIdx < allIntervals.length && busyIntervalsIdx < busyIntervals.length) {
    const startTime = getLaterMoment(allIntervals[allIntervalsIdx].start, busyIntervals[busyIntervalsIdx].start);
    const endTime = getEarlierMoment(allIntervals[allIntervalsIdx].end, busyIntervals[busyIntervalsIdx].end);

    //If startTime is before endTime, there is overlap
    if(startTime.isBefore(endTime)) {
      allIntervalsIdx++;
    } 
    //If there is no overlap, and end of current interval is before end of busy interval, the interval is free
    else if(allIntervals[allIntervalsIdx].end.isBefore(busyIntervals[busyIntervalsIdx].end)) {
      freeIntervals.push(allIntervals[allIntervalsIdx]);
      allIntervalsIdx++;
    } 
    //Else check the current interval with the next free interval
    else {
      busyIntervalsIdx++;
    }
  }

  //If there are remaining intervals, all are free
  while (allIntervalsIdx < allIntervals.length) {
    freeIntervals.push(allIntervals[allIntervalsIdx]);
    allIntervalsIdx++;
  }

  return freeIntervals;
}

function getLaterMoment(moment1, moment2) {
  return moment1.isAfter(moment2) ? moment1 : moment(moment2);
}

function getEarlierMoment(moment1, moment2) {
  return moment1.isBefore(moment2) ? moment1 : moment(moment2);
}

module.exports = { getFreeIntervals };


