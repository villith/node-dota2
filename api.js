const express = require('express');
const bodyParser = require('body-parser');
const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const server = app.listen(3001, () => { console.log(`App running on port: ${server.address().port}`) });

app.get('/', (req, res) => { res.status(200).send("Test Response")});