// <!-- Section 1 : Import Dependencies -->
const path = require('path');
const express = require('express'); // To build an application server or API
const app = express();
app.use('/resources', express.static(path.join(__dirname, 'resources')));
const handlebars = require('express-handlebars');
const Handlebars = require('handlebars');
const pgp = require('pg-promise')(); // To connect to the Postgres DB from the node server
const bodyParser = require('body-parser');
const session = require('express-session'); // To set the session object. To store or access session data, use the `req.session`, which is (generally) serialized as JSON by the store.
const bcrypt = require('bcryptjs'); //  To hash passwords
const axios = require('axios');
// const { Configuration, OpenAIApi } = require('openai'); //openai

// <!-- Section 2 : Connect to DB -->

// create `ExpressHandlebars` instance and configure the layouts and partials dir.
const hbs = handlebars.create({
  extname: 'hbs',
  layoutsDir: __dirname + '/views/layouts',
  partialsDir: __dirname + '/views/partials',
});

//open ai
// const openai = new OpenAIApi(
//   new Configuration({ apiKey: process.env.OPENAI_API_KEY })
// );

// database configuration
const dbConfig = {
  host: 'db', // the database server
  port: 5432, // the database port
  database: process.env.POSTGRES_DB, // the database name
  user: process.env.POSTGRES_USER, // the user account to connect with
  password: process.env.POSTGRES_PASSWORD, // the password of the user account
};

const db = pgp(dbConfig);

// test your database
db.connect()
  .then(obj => {
    console.log('Database connection successful'); // you can view this message in the docker compose logs
    obj.done(); // success, release the connection;
  })
  .catch(error => {
    console.log('ERROR:', error.message || error);
  });

// <!-- Section 3 : App Settings -->
// Register `hbs` as our view engine using its bound `engine()` function.
app.engine('hbs', hbs.engine);
app.set('view engine', 'hbs');
app.set('views', path.join(__dirname, 'views'));
app.use(bodyParser.json()); // specify the usage of JSON for parsing request body.

// initialize session variables
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    saveUninitialized: false,
    resave: false,
  })
);

app.use(
  bodyParser.urlencoded({
    extended: true,
  })
);

// <!-- Section 4 : API Routes -->

//testing
app.get('/welcome', (req, res) => {
  res.json({status: 'success', message: 'Welcome!'});
});

app.get('/', (req, res) => {
    res.redirect('/home');
});
  

///// login get and post /////
app.get('/login', (req, res) => {
  res.render('pages/login',
  {
   username: req.session.username,
   sign: req.session.sign,
   birthday: req.session.birthday,
  });
});

app.post('/login', async (req, res) => {
  const username = req.body.username;
  const query = 'SELECT * FROM users WHERE username = $1 LIMIT 1';

  db.one(query, [username])
    .then(async user => {
      if (!user) {
        return res.render('pages/register', {
        });
      }
      const match = await bcrypt.compare(req.body.password, user.password);
      if (!match) {
        return res.render('pages/login', {
          message: 'Incorrect username or password',
          error: true
        });
      }
      req.session.username = user.username;
      req.session.birthday = user.birthday;
      req.session.zodiacSign = user.zodiacSign;

      req.session.user = user;
      req.session.save();
      res.redirect('/home');
    })
    .catch(err => {
      res.render('pages/register', {
      });
    });
});

///// register /////
app.get('/register', (req, res) => {
  res.render('pages/register');
});

app.post('/register', async (req, res) => {
  const hash = await bcrypt.hash(req.body.password, 10);
  //call to api to get the sign for this user, add to the user db sign attribute
  const query = `INSERT INTO users (username, password, birthday) VALUES ($1, $2, $3)`;

  await db.none(query, [req.body.username, hash, req.body.birthday]).then(courses => {
      res.redirect('/login');
    })
    .catch(err => {
      //console.log(err);
      res.status(400);
      res.render('pages/register');
  });
});

// Authentication Middleware.
const auth = (req, res, next) => {
  if (!req.session.user) {
    // Default to login page.
    return res.redirect('/login');
  }
  next();
};

// Authentication Required
app.use(auth);

///// home /////
app.get('/home', async(req, res) => {
  const truncatedbday = req.session.birthday.substring(0,10);
  res.render('pages/home', {
    username: req.session.username,
   birthday: truncatedbday,
    sign: req.session.sign,
  });
})

///// friends /////
app.get('/friends', async (req, res) => {
  res.render('pages/friends');
});

///// search /////
app.get('/search', async (req, res) => {
  res.render('pages/search');
});


///// logout /////
app.get('/logout', async (req, res) => {
    req.session.destroy();
    res.render('pages/logout');
});

///// test /////
/*const { OpenAI } = require('openai')
require('dotenv').config()
const openai = new OpenAI({
  apiKey: process.env.OPEN_AI_KEY,
})

const generateAnswer = async () => {
  const response = await openai.chat.completions.create({
    messages: [
      { role: 'user', content: 'Give me a horoscope and three songs based on that horoscope. I am a Capricorn.' },
    ],
    model: 'gpt-4o-mini',
  })

  console.log(response.choices[0].message.content)
}

app.get('/horoscope', async (req, res) => {
  res.render('pages/horoscope');
});

  generateAnswer()

  const generateMeta = async (title)=>{
      const description = await openai.createChatCompletion({
          model: 'gpt-3.5-turbo',
          messages: [
              {
                  role: 'user',
                  content: `Come up with a description called ${title}`
              }
          ],
          max_tokens: 100
      })


      console.log(description.data.choices[0].message);
  }

  const readline = require('readline');

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  })

  rl.question(generateMeta);
*/

const { OpenAI } = require('openai');
require('dotenv').config();
app.use(express.json());

const openai = new OpenAI({
  apiKey: process.env.OPEN_AI_KEY,
});

app.post('/horoscope', async (req, res) => {
  const zodiacSign = req.body.zodiacSign;
  const prompt = `Give me a horoscope and three songs based on that horoscope for a ${zodiacSign}.`;

  try {
    const response = await openai.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'gpt-3.5-turbo',
    });

    const horoscope = response.choices[0].message.content;
    res.json({ horoscope });
  } catch (error) {
    console.error("Error generating horoscope:", error);
    res.status(500).json({ msg: "Unable to generate horoscope at this time." });
  }
});

// Serve the horoscope.hbs file when requested (assuming you're using a view engine)
app.get('/horoscope', (req, res) => {
  res.render('pages/horoscope');
});
  
  // Authentication Required
  app.use(auth);

// TODO - Include your API routes here

// *****************************************************
// <!-- Section 5 : Start Server-->
// *****************************************************
// starting the server and keeping the connection open to listen for more requests
module.exports = app.listen(3000);
console.log('Server is listening on port 3000');