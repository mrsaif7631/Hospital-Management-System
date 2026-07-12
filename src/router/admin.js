const express = require('express');
const auth = require('../middleware/auth');

const router = new express.Router();

// Admin Dashboard
router.get('/adminMain', auth, async (req, res) => {
    try {
        res.render('adminMain', {
            name: req.hosp.name
        });
    } catch (e) {
        res.status(500).send();
    }
});

module.exports = router;