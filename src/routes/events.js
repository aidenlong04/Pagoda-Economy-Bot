const express = require('express');
const logger = require('../logger');
const { trackEventClick } = require('../services/eventService');

const router = express.Router();

router.get('/api/events/:eventId/track', async (req, res) => {
  const { eventId } = req.params;
  const { user, redirect } = req.query;

  if (!user) {
    return res.status(400).json({ ok: false, error: 'Missing user query parameter' });
  }

  try {
    const result = await trackEventClick(eventId, String(user), 'URL_CLICK');
    if (!result.tracked) {
      return res.status(200).json({ ok: true, tracked: false, reason: result.reason });
    }

    if (typeof redirect === 'string' && redirect.length > 0) {
      return res.redirect(302, redirect);
    }

    return res.json({ ok: true, tracked: true, eventId, user: String(user) });
  } catch (error) {
    logger.warn('Event tracking request failed', { eventId, user: String(user), error: error.message });
    if (error.message === 'Event not found') {
      return res.status(404).json({ ok: false, error: 'Event not found' });
    }
    return res.status(500).json({ ok: false, error: 'Unable to track event interaction' });
  }
});

module.exports = router;
