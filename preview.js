const express = require('express');
const path = require('path');
const app = express();

app.use(express.static(__dirname));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'test.html'));
});

const PORT = process.env.PREVIEW_PORT || 5500;
app.listen(PORT, () => {
  console.log(`Preview server running at http://localhost:${PORT}/`);
});