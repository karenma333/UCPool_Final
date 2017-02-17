const express = require('express');
const router = express.Router();
const events = require('../events.json');


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
    res.json(events);
  }, 2000);
});

module.exports = router;
