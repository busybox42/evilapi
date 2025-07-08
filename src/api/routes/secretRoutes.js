const express = require('express');
const router = express.Router();
const secretService = require('../../services/secretService');

// Create a new secret
router.post('/secret', (req, res) => {
  try {
    const { text, expiresIn, maxViews } = req.body;
    
    if (!text || typeof text !== 'string') {
      return res.status(400).json({ error: 'Text is required and must be a string' });
    }
    
    const expiresInSeconds = parseInt(expiresIn, 10) || 86400; // Default 24 hours
    const maxViewsInt = parseInt(maxViews, 10) || 5; // Default 5 views
    
    if (expiresInSeconds <= 0 || expiresInSeconds > 2592000) { // Max 30 days
      return res.status(400).json({ error: 'Expires in must be between 1 and 2592000 seconds' });
    }
    
    if (maxViewsInt <= 0 || maxViewsInt > 100) { // Max 100 views
      return res.status(400).json({ error: 'Max views must be between 1 and 100' });
    }
    
    const id = secretService.createSecret(text, expiresInSeconds, maxViewsInt);
    res.json({ id });
  } catch (error) {
    console.error('Error creating secret:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get a secret
router.get('/secret/:id', (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id || typeof id !== 'string') {
      return res.status(400).json({ error: 'Secret ID is required' });
    }
    
    const secret = secretService.getSecret(id);
    
    if (!secret) {
      return res.status(404).json({ error: 'Secret not found or expired' });
    }
    
    res.json(secret);
  } catch (error) {
    console.error('Error retrieving secret:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;