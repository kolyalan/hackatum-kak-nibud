const path = require('path');
const express = require('express');
var bodyParser = require('body-parser')
const app = express();
const cors = require('cors');
const { getCraftsmen, updateRanking } = require('./src/simply-craftsmen-table');
const { getMappedCraftsman  } = require('./src/craftsmen-service');

app.use(cors());

app.use(express.static('public'));

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }))

// parse application/json
app.use(bodyParser.json())

app.get('/', (_, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/craftsmen', async (req, res) => {
  // ideally should be validated & sanitzed.
  const { postalcode, page} = req.query;

  const craftsmen = await getCraftsmen(postalcode, +page);

  return res.send({
    craftsmen: craftsmen.map(getMappedCraftsman)
  });
});

app.patch('/craftman/:id', async (req, res) => {
  // ideally should be validated & sanitzed.

  const id = req.params.id;
  const { maxDrivingDistance, profilePictureScore, profileDescriptionScore } = req.body;

  const updatedCraftsman = await updateRanking(+id, +maxDrivingDistance, +profilePictureScore, +profileDescriptionScore);
  
  if (typeof updatedCraftsman === 'undefined') {
    return res.status(400).send({
      message: "No fields are defined in request"
    })
  }

  res.send({
    updated: getMappedCraftsman(updatedCraftsman)
  });
});

const port = process.env['SERVER_PORT'] || 3000;

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});