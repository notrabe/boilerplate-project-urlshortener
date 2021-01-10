require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const { stringify } = require('querystring');
const app = express();
const bodyParser = require('body-parser');
const { resolve } = require('path');

// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());

app.use('/public', express.static(`${process.cwd()}/public`));

const uri = process.env.DB_URI
console.log(uri)

mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// Your first API endpoint
app.get('/api/hello', function(req, res) {
  res.json({ greeting: 'hello API' });
});

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});


const urlSchema = new mongoose.Schema({
  original: {type: String, required: true},
  short: Number
})

const Url = mongoose.model('URL', urlSchema)

let resObject = {}
app.post('/api/shorturl/new', bodyParser.urlencoded({extended: false}), (req, res) => {
  const inputUrl = req.body['url']
  let urlRegexp = new RegExp(/[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)?/gi)
  if(!inputUrl.match(urlRegexp)){
    res.json({err: 'Invalid URL'})
    return
  }
  resObject['orignal_url'] = inputUrl

  let inputShort = 1

  Url.findOne({})
    .sort({short:'desc'})
    .exec((err, result) => {
      if(!err && result != undefined){
        inputShort = result.short + 1
      } 
      if(!err){
        Url.findOneAndUpdate(
          {original: inputUrl},
          {original: inputUrl, short: inputShort},
          {new: true, upsert: true},
          (err, savedUrl) => {
            if(!err){
              resObject['short-url'] = savedUrl.short
              res.json(resObject)
            }
          }
        )
      }
    }) 
})

app.get('/api/shorturl/:input', (req, res) => {
  const input = req.params.input

  Url.findOne({short: input}, (err, result) => {
    if(!err && result != undefined){
      res.redirect(result.original)
    } else { 
      res.json({message: 'Url not found.'})
    }
  })
})