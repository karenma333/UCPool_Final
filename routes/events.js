const express = require('express');
const router = express.Router();


/**
 * GET: /api/events/all
 *
 * Get all the events for the currently logged in user
 *
 * EXPECTS: Nothing
 * RESPONDS: [{id, title, description, location, date, time}],
 *          Code 401 if no user is logged in
 */
router.get('/all', (req, res) => {
  setTimeout(()=> {
    res.json([
      {
        id: 1000,
        title: 'Event 1',
        description: 'Description...',
        location: '123 Stanford St.',
        date: 'Friday, 10 Feb 2017',
        time: '7:30 PM'
      },
      {
        id: 1001,
        title: 'Event 2',
        description: 'Description...',
        location: '123 Stanford St.',
        date: 'Friday, 10 Feb 2017',
        time: '7:30 PM'
      },
      {
        id: 1002,
        title: 'Event 3',
        description: 'Description...',
        location: '123 Stanford St.',
        date: 'Friday, 10 Feb 2017',
        time: '7:30 PM'
      },
      {
        id: 1003,
        title: 'Event 4',
        description: 'Description...',
        location: '123 Stanford St.',
        date: 'Friday, 10 Feb 2017',
        time: '7:30 PM'
      },
      {
        id: 1004,
        title: 'Event 5',
        description: 'Description...',
        location: '123 Stanford St.',
        date: 'Friday, 10 Feb 2017',
        time: '7:30 PM'
      }
    ]);
  }, 2000);
});

module.exports = router;
