const moment = require('moment');

function getFreeIntervals(date, busyIntervals) {
  const allIntervals = getAllIntervals(date);
  if (busyIntervals.length === 0) return allIntervals.map((interval) => ({
    interval: interval,
    formatedInterval: moment(interval).clone().format('LT')
  }));
  const freeIntervals = [];
  let busyIntervalIdx = 0;
  allIntervals.forEach((currentIntervalStart) => {
    if (busyIntervalIdx === busyIntervals.length) {
      return freeIntervals.push({
        interval: currentIntervalStart,
        formatedInterval: moment(currentIntervalStart).clone().format('LT')
      });
    }
    const currentIntervalEnd = currentIntervalStart.clone().add(30, 'm');
    const busyInterval = busyIntervals[busyIntervalIdx];
    if(!currentIntervalStart.isSame(busyInterval.start) && !currentIntervalStart.isBetween(busyInterval.start, busyInterval.end) && !currentIntervalEnd.isBetween(busyInterval.start, busyInterval.end)) {
      freeIntervals.push({
        interval: currentIntervalStart,
        formatedInterval: moment(currentIntervalStart).clone().format('LT')
      });
    }
    if (currentIntervalEnd.isAfter(busyInterval.end)) {
      busyIntervalIdx++;
    }
  })
  return freeIntervals;
}

function getAllIntervals(date) {
  let intervals = [];
  const selectedDate = moment(date);

  let intervalStartTime = selectedDate.clone().set({'h': 9, 'm': 0, 's': 0});
  if (selectedDate.startOf('day').isSame(moment().utcOffset("+05:30").startOf('day'))) {
    if ((moment().hour() > 9) && (moment().hour() < 17)) {
      intervalStartTime = moment().add(15 - moment().minute() % 15, 'm').subtract(moment().seconds(), 's');
    } else if (moment().hour() >= 17) {
      intervalStartTime = selectedDate.clone().add(1, 'day').set({'h': 9, 'm': 0, 's': 0});
    }
  }

  const intervalEndTime = selectedDate.clone().set({'h': 17, 'm': 0, 's': 0});
  
  while(intervalStartTime < intervalEndTime){
      intervals.push(new moment(intervalStartTime));
      intervalStartTime.add(15, 'm');
  }
  return intervals;
}

module.exports = { getFreeIntervals };


