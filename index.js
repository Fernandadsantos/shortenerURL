require('dotenv').config(); 
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');  
const app = express();
const {Schema} = mongoose;
const port = process.env.PORT || 3000; 
mongoose.connect(process.env.MONGO_URI);

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({extended: true}));

const url_schema = new Schema({  
  original_url: String,
  shortURL: String
});
 
const URL_data = mongoose.model("url_data", url_schema); 

const generateHash = () => {
  const min_upper = 65;
  const max_upper = 90;
  const min_lower = 97;
  const max_lower = 122;
  const currentHash = []; 
  
  for(let i = 0; i < 3; i++){
    currentHash.push(Math.floor(Math.random() * (max_upper-min_upper+1)) + min_upper);
    currentHash.push(Math.floor(Math.random() * (max_lower-min_lower+1)) + min_lower);
  }
  
  const hash = currentHash.map(num => { 
    return String.fromCharCode(num);
  }).join(''); 
 
  return hash;
}
 
const createAndSaveShortUrl =  async (originalURL) => { 
  const hash = generateHash(); 
  const availableHash = await URL_data.findOne({hash: hash}); 
  
  if(!availableHash){

    const newURL = new URL_data({ 
      original_url: originalURL,
      shortURL: hash 
    }) 

    await newURL.save(); 
    return newURL;
  }  
}
 

const findOneByURL = async (originalURL) => {
  try {
    const obj = await URL_data.findOne({ original_url: originalURL });
    if (obj) { 
      return obj.shortURL;
    } 
    else { 
      const {shortURL} = await createAndSaveShortUrl(originalURL);
      
      return shortURL;
    }
  } catch (err) {
    console.error('Ocorreu um erro ao pesquisar:', err);
  }
};
 
app.use('/public/style.css', express.static(`${process.cwd()}/public/style.css`));  

app.get('/', (req, res) => { 
  res.sendFile(process.cwd() + '/views/index.html'); 
}); 
 
app.post('/api/shorturl', async (req, res) => {   
  const originalURL = req.body.url;
  const pattern = /^https:\/\/www\./;

  if(pattern.test(originalURL)){

    const shorturl = await findOneByURL(originalURL);
   
    res.json({
      originalURL: originalURL,
      shortURL: shorturl
    });
  
    app.get(`/api/shorturl/${shorturl}`, (req, res) => { 
      res.redirect(originalURL);
    });
  }
  else{
    res.json({
      error: 'invalid url'
    });
  }
});

app.listen(port, () => {
  console.log(`Listening on port ${port}`);
});
