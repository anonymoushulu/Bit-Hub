const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  res.send('Yay! Success!');
});

module.exports = router;
