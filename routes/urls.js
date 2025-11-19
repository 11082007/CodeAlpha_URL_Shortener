const express = require('express');
const router = express.Router();
const db = require('../config/database');

// Generate short code function
function generateShortCode() {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
        result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
}

// Shorten URL endpoint
router.post('/shorten', async (req, res) => {
    try {
        const { longUrl } = req.body;
        
        if (!longUrl) {
            return res.status(400).json({ error: 'Long URL is required' });
        }

        // Basic URL validation
        try {
            new URL(longUrl);
        } catch (err) {
            return res.status(400).json({ error: 'Invalid URL format' });
        }

        let shortCode = generateShortCode();
        
        // Check if short code already exists (rare case, but handle it)
        const checkQuery = 'SELECT * FROM urls WHERE short_code = ?';
        db.query(checkQuery, [shortCode], (err, results) => {
            if (err) {
                console.error(err);
                return res.status(500).json({ error: 'Database error' });
            }
            
            if (results.length > 0) {
                // Regenerate if collision occurs
                shortCode = generateShortCode();
            }
            
            // Insert into database
            const insertQuery = 'INSERT INTO urls (short_code, long_url) VALUES (?, ?)';
            db.query(insertQuery, [shortCode, longUrl], (err, results) => {
                if (err) {
                    console.error(err);
                    return res.status(500).json({ error: 'Failed to create short URL' });
                }
                
                // Added /api/ to the shortUrl
                const shortUrl = `${req.protocol}://${req.get('host')}/api/${shortCode}`;
                res.json({
                    shortCode: shortCode,
                    shortUrl: shortUrl,
                    longUrl: longUrl
                });
            });
        });
        
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Redirect endpoint
router.get('/:shortCode', (req, res) => {
    const { shortCode } = req.params;
    
    const query = 'SELECT long_url FROM urls WHERE short_code = ?';
    db.query(query, [shortCode], (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: 'Database error' });
        }
        
        if (results.length === 0) {
            return res.status(404).json({ error: 'Short URL not found' });
        }
        
        const longUrl = results[0].long_url;
        res.redirect(longUrl);
    });
});

module.exports = router;