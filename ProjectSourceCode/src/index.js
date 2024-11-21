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

///// openai config /////
const { OpenAI } = require('openai');
require('dotenv').config();
app.use(express.json());

const openai = new OpenAI({
  apiKey: process.env.OPEN_AI_KEY,
});

// <!-- Section 2 : Connect to DB -->

// create `ExpressHandlebars` instance and configure the layouts and partials dir.
const hbs = handlebars.create({
  extname: 'hbs',
  layoutsDir: __dirname + '/views/layouts',
  partialsDir: __dirname + '/views/partials',
  helpers: {
    eq: (a, b) => a === b, 
  }
});

// database configuration
const dbConfig = {
  //host: process.env.POSTGRES_HOST, // the database server
  host: 'db',
  port: process.env.POSTGRES_PORT, // the database port
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
    cookie: { maxAge: 86400000 }, // Cookie expires in 1 day
  })
);

app.use(
  bodyParser.urlencoded({
    extended: true,
  })
);

// <!-- Section 4 : API Routes -->

///// testing /////
app.get('/welcome', (req, res) => {
  res.json({status: 'success', message: 'Welcome!'});
});

app.get('/', (req, res) => {
    res.redirect('/landing');
});

///// landing page //////
app.get('/landing', (req, res) => {
  res.render('pages/landing', {
    username: req.session.username,
  });
});


///// login get and post /////
app.get('/login', (req, res) => {
  res.render('pages/login',
  {
   username: req.session.username,
   sign: req.session.sign,
   birthday: req.session.birthday,
   last_name: req.session.last_name,
   first_name: req.session.first_name,
  });
});

app.post('/login', async (req, res) => {
  const user1 = {
    uname: 'JaneDoe',
    fname: 'Jane',
    lname: 'Doe',
    bday: '2012-08-05',
    pwd: 'test123',
    zsign: 'Leo',
  }

  const user2 = {
    uname: 'JohnDoe',
    fname: 'John',
    lname: 'Doe',
    bday: '2001-09-07',
    pwd: 'test456',
    zsign: 'Virgo',
  }

  const user3 = {
    uname: 'sue',
    fname: 'Susane',
    lname: 'Smith',
    bday: '1980-12-20',
    pwd: 'test789',
    zsign: 'Sagittarius',
  }

  const user4 = {
    uname: 'Bob',
    fname: 'Bobby',
    lname: 'Joe',
    bday: '1999-04-01',
    pwd: 'test101',
    zsign: 'Aries',
  }

  const user5 = {
    uname: 'AnnaJ',
    fname: 'Anna',
    lname: 'Johnson',
    bday: '2000-02-29',
    pwd: 'test102',
    zsign: 'Pisces',
  }


  const userarr = [user1, user2, user3, user4, user5];

  for (let i = 0; i < userarr.length; i++) {
    const hash = await bcrypt.hash(userarr[i].pwd, 10);
    const query = `INSERT INTO users (first_name, last_name, username, password, birthday, sign) VALUES ($1, $2, $3, $4, $5, $6) ON CONFLICT (username) DO NOTHING;`; 
    await db.none(query, [userarr[i].fname, userarr[i].lname, userarr[i].uname, hash, userarr[i].bday, userarr[i].zsign]).then(courses => { 
    })
    .catch(err => {
      res.status(400);
  });
  }

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
          message: 'Incorrect password',
          error: true
        });
      }
      req.session.last_name = user.last_name,
      req.session.first_name = user.first_name,
      req.session.username = user.username;
      req.session.birthday = user.birthday;
      req.session.sign = user.sign;

      req.session.user = user;
      req.session.save();

      res.redirect('/home');
    })
    .catch(err => {
      res.render('pages/register', {
      });
    });
});


///// functions /////
function getSign(birthday) {
  const date = new Date(birthday.substring(0,10));
  const month = date.getUTCMonth() + 1; 
  const day = date.getUTCDate();

  const zodiacSigns = [
      { sign: "Capricorn", start: { month: 12, day: 22 }, end: { month: 1, day: 19 } },
      { sign: "Aquarius", start: { month: 1, day: 20 }, end: { month: 2, day: 18 } },
      { sign: "Pisces", start: { month: 2, day: 19 }, end: { month: 3, day: 20 } },
      { sign: "Aries", start: { month: 3, day: 21 }, end: { month: 4, day: 19 } },
      { sign: "Taurus", start: { month: 4, day: 20 }, end: { month: 5, day: 20 } },
      { sign: "Gemini", start: { month: 5, day: 21 }, end: { month: 6, day: 20 } },
      { sign: "Cancer", start: { month: 6, day: 21 }, end: { month: 7, day: 22 } },
      { sign: "Leo", start: { month: 7, day: 23 }, end: { month: 8, day: 22 } },
      { sign: "Virgo", start: { month: 8, day: 23 }, end: { month: 9, day: 22 } },
      { sign: "Libra", start: { month: 9, day: 23 }, end: { month: 10, day: 22 } },
      { sign: "Scorpio", start: { month: 10, day: 23 }, end: { month: 11, day: 21 } },
      { sign: "Sagittarius", start: { month: 11, day: 22 }, end: { month: 12, day: 21 } },
      { sign: "Capricorn", start: { month: 12, day: 22 }, end: { month: 12, day: 31 } } 
  ];

  for (const zodiac of zodiacSigns) {
      const startMonth = zodiac.start.month;
      const startDay = zodiac.start.day;
      const endMonth = zodiac.end.month;
      const endDay = zodiac.end.day;

      if (
          (month === startMonth && day >= startDay) ||
          (month === endMonth && day <= endDay)
      ) {
          return zodiac.sign;
      }
  }

  return "Unknown"; 
}

const horoscopes = [ //horoscopes[i][0] is sign, horoscopes[i][1] is horoscope
  ['Capricorn', `Capricorn is the tenth sign of the zodiac, symbolized by the Goat, representing ambition, discipline, and patience. 
    Governed by Saturn, Capricorns are highly responsible, practical, and determined to achieve their long-term goals. 
    Key Traits: Ambitious & Goal-Oriented: Capricorns strive for success. Responsible: They are reliable and fulfill their commitments. 
    Pragmatic: Practicality defines their approach. Strengths: Discipline, patience, resourcefulness Weaknesses: Can be overly serious or pessimistic.`],

  ['Aquarius', `Aquarius is the eleventh sign of the zodiac, symbolized by the Water Bearer, which represents the flow of knowledge and life. 
    Governed by Uranus, Aquarians are seen as innovative, independent, and forward-thinking. They are natural visionaries with a deep desire to improve the world. 
    Key Traits: Innovative & Original: Thrives on new ideas. Independent: Values freedom. Humanitarian: Strong sense of social justice. 
    Strengths: Visionary thinking, open-mindedness, empathy Weaknesses: Aloof, stubborn, struggles with intimacy.`],

  ['Pisces', `Pisces is the twelfth sign of the zodiac, symbolized by the Fish, representing empathy, intuition, and imagination. 
    Governed by Neptune, Pisceans are compassionate and highly intuitive. Key Traits: Empathetic & Compassionate: Sensitive to others' needs. 
    Creative: Vivid imagination. Intuitive: Strong inner knowing. Strengths: Kindness, creativity, adaptability Weaknesses: Overly trusting, escapist, idealistic.`],

  ['Aries', `Aries is the first sign of the zodiac, symbolized by the Ram, representing courage, initiative, and drive. 
    Governed by Mars, Aries individuals are bold, ambitious, and natural leaders. Key Traits: Energetic & Passionate: Approaches life with excitement. 
    Bold & Adventurous: Fearless. Straightforward: Values honesty. Strengths: Courage, confidence, decisiveness 
    Weaknesses: Impulsiveness, impatience, can be confrontational.`],

  ['Taurus', `Taurus is the second sign of the zodiac, symbolized by the Bull, representing stability, patience, and resilience. 
    Governed by Venus, Taureans are reliable and grounded. Key Traits: Reliable & Loyal: Dependable and loyal to loved ones. 
    Patient & Steady: Prefers a slow, steady approach. Appreciative of Beauty: Loves comfort and aesthetics. 
    Strengths: Perseverance, reliability, practicality Weaknesses: Stubborn, resistant to change, can be possessive.`],

  ['Gemini', `Gemini is the third sign of the zodiac, symbolized by the Twins, representing adaptability and communication. 
    Governed by Mercury, Geminis are curious and versatile. Key Traits: Adaptable & Quick-Witted: Able to adjust easily. 
    Communicative: Loves to share ideas. Curious: Always eager to learn. Strengths: Versatility, intellect, social skills 
    Weaknesses: Indecisive, easily distracted, can be superficial.`],

  ['Cancer', `Cancer is the fourth sign of the zodiac, symbolized by the Crab, representing sensitivity and loyalty. 
    Governed by the Moon, Cancers are nurturing and deeply connected to their emotions. 
    Key Traits: Caring & Protective: Cancers are empathetic caregivers. Intuitive: Has a strong emotional intuition. Loyal: Devoted to family and friends. 
    Strengths: Compassion, loyalty, imagination Weaknesses: Moody, sensitive, can be clingy.`],

  ['Leo', `Leo is the fifth sign of the zodiac, symbolized by the Lion, representing confidence, passion, and leadership. 
    Governed by the Sun, Leos are charismatic and natural leaders. Key Traits: Confident & Bold: Leos are courageous.
     Generous: Loves to help and support others. Creative: Often has a flair for drama. Strengths: Confidence, warmth, generosity 
     Weaknesses: Can be arrogant, stubborn, attention-seeking.`],

  ['Virgo', `Virgo is the sixth sign of the zodiac, symbolized by the Maiden, representing diligence, analysis, and practicality. 
    Governed by Mercury, Virgos are meticulous and helpful. Key Traits: Analytical & Detail-Oriented: Loves precision. 
    Practical: Focused on real-world solutions. Modest: Often humble. Strengths: Organization, reliability, problem-solving 
    Weaknesses: Overly critical, can be a perfectionist, sometimes worry-prone.`],

  ['Libra', `Libra is the seventh sign of the zodiac, symbolized by the Scales, representing balance, harmony, and justice. 
    Governed by Venus, Libras are diplomatic and value fairness. Key Traits: Diplomatic & Charming: Skilled in resolving conflicts. 
    Fair-minded: Strives for balance in all things. Social: Loves being around people. Strengths: Fairness, charm, social skills Weaknesses: Indecisive, can be self-indulgent, avoids conflict.`],

  ['Scorpio', `Scorpio is the eighth sign of the zodiac, symbolized by the Scorpion, representing intensity, passion, and mystery. 
    Governed by Pluto and Mars, Scorpios are powerful and transformative. Key Traits: Intense & Passionate: Emotions run deep. 
    Mysterious: Often keeps things private. Loyal: Deeply committed to relationships. Strengths: Determination, resourcefulness, loyalty Weaknesses: Can be jealous, secretive, sometimes vengeful.`],

  ['Sagittarius', `Sagittarius is the ninth sign of the zodiac, symbolized by the Archer, representing exploration, optimism, and adventure. 
    Governed by Jupiter, Sagittarians are free-spirited and open-minded. Key Traits: Adventurous & Independent: Loves exploring. 
    Optimistic: Sees the positive side. Philosophical: Enjoys deep conversations. Strengths: Enthusiasm, honesty, curiosity 
    Weaknesses: Can be blunt, restless, sometimes overconfident.`],
];

app.get('/horoscopes', (req, res) => {
  res.json(horoscopes);
});

///// register get and post /////
app.get('/register', (req, res) => {
  res.render('pages/register');
});

app.post('/register', async (req, res) => {
  const hash = await bcrypt.hash(req.body.password, 10);
  //call to api to get the sign for this user, add to the user db sign attribute
  const sign = getSign(req.body.birthday) 

  const duplicate = req.body.username;
  const query2 = `SELECT * FROM users WHERE username = $1;`
  db.oneOrNone(query2, [duplicate])
  .then(data => {
    if (!data) {
      const query = `INSERT INTO users (first_name, last_name, username, password, birthday, sign) VALUES ($1, $2, $3, $4, $5, $6) ON CONFLICT (username) DO NOTHING;`; 
       db.none(query, [req.body.first_name, req.body.last_name, req.body.username, hash, req.body.birthday, sign]).then(data => { 
          res.redirect('/login');
        })
        .catch(err => {
          res.status(400);
          console.log('error somehow');
          return res.render('pages/register');
      });
      return res.redirect('/login');
    }
    return res.render('pages/register', {
      message: 'Username already exists',
      error: true
    });
   })
  .catch(err => {
    console.log('error here');
    res.status(400);
    console.log(err);
    return res.render('pages/register');
  });
});

///// Authentication Middleware /////
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
  const sign = req.session.sign;
  let description = ''
  switch(sign){
    case 'Capricorn':
      description = horoscopes[0][1];
      break;
    case 'Aquarius':
      description = horoscopes[1][1];
      break;
    case 'Pisces':
      description = horoscopes[2][1];
      break;
    case 'Aries':
      description = horoscopes[3][1];
      break;
    case 'Taurus':
      description = horoscopes[4][1];
      break;
    case 'Gemini':
      description = horoscopes[5][1];
      break;
    case 'Cancer':
      description = horoscopes[6][1];
      break;
    case 'Leo':
      description = horoscopes[7][1];
      break;
    case 'Virgo':
      description = horoscopes[8][1];
      break;
    case 'Libra':
      description = horoscopes[9][1];
      break;
    case 'Scorpio':
      description = horoscopes[10][1];
      break;
    case 'Sagittarius':
      description = horoscopes[11][1];
  }

  res.render('pages/home', {
    username: req.session.username,
    birthday: truncatedbday,
    sign: req.session.sign,
    last_name: req.session.last_name,
    first_name: req.session.first_name,
    description: description,
  });
});

///// search /////
app.get('/search', async (req, res) => {
  res.render('pages/search', {
    username: req.session.username,
  });
});

///// friends /////
app.get('/friends', (req, res) => {
  res.render('pages/friends', {
    username: req.session.username,
  });
});

app.get('/friendsSearch', async (req, res) => {
  try {
    const searchValue = req.query.searchvalue;
    const sessionUsername = req.session.username;

    if (searchValue === sessionUsername) {
      return res.status(200).json({ message: 'You cannot search for your own profile.' });
    }

    const userId = await db.query('SELECT user_id FROM users WHERE username = $1;', [sessionUsername]);
    const currUserId = userId[0].user_id;

    const friends = await db.query('SELECT username, birthday, sign FROM users WHERE username = $1;', [searchValue]);
    const searchedUser = await db.query('SELECT user_id FROM users WHERE username = $1;', [searchValue]);

    if (searchedUser && searchedUser.length > 0) {
      const searchedUserId = searchedUser[0].user_id;

      const friendshipCheck = await db.query(`SELECT EXISTS (SELECT 1 FROM friendships WHERE (user_id = $1 AND friend_id = $2) OR (user_id = $2 AND friend_id = $1));`, [currUserId, searchedUserId]);

      const isFriends = friendshipCheck[0].exists; 

      friends.forEach(friend => {
        friend.isFriends = isFriends;
      });
    }

    res.json(friends);

  } catch (error) {
    console.error('Database query error:', error);
    res.status(500).send("Error loading friends");
  }
});

app.post('/addFriend', async (req, res) => {
  try {
    const searchValue = req.body.username;
    const sessionUsername = req.session.username;
    const userId = await db.query('SELECT user_id FROM users WHERE username = $1;', [sessionUsername]);
    const searchedUser = await db.query('SELECT user_id FROM users WHERE username = $1;', [searchValue]);

    const currUserId = userId[0].user_id;
    const friendUserId = searchedUser[0].user_id;
    await db.query('INSERT INTO friendships (user_id, friend_id) VALUES ($1, $2), ($3, $4)', [currUserId, friendUserId, friendUserId, currUserId]);

    res.json({ success: true});

    } catch (error) {
      console.error('Error adding friend:', error);
      res.status(500).json({ success: false});
    }
});

app.get('/friendsLoad', async (req, res) => {
  try {
    const sessionUsername = req.session.username;
    const userId = await db.query('SELECT user_id FROM users WHERE username = $1;', [sessionUsername]);
    const currUserId = userId[0].user_id;

    const friends = await db.query('SELECT u.username, u.birthday, u.sign FROM friendships f JOIN users u ON f.friend_id = u.user_id WHERE f.user_id = $1', [currUserId]);

    res.json(friends);

  } catch (error) {
    console.error('Database query error:', error);
    res.status(500).send("Error loading friends");
  }
});

app.post('/dailyAffirmation', async (req, res) => {

  //if the user has already logged in and generated affirmation
  if (req.session.dailyAffirmation) {
    return res.json({ dailyAffirmation: req.session.dailyAffirmation }); //must be wrapped in an object to work 
  }
  const sign = req.body.sign;  //how is this working on attribute zodiacSign
  const prompt = `Give me a daily affirmation for a ${sign} that is about a sentence long.`;

  try {
    const response = await openai.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'gpt-3.5-turbo',
    });
    const dailyAffirmation = response.choices[0].message.content;
    req.session.dailyAffirmation = dailyAffirmation;
    res.json({ dailyAffirmation });
  } catch (error) {
    console.error("Error generating affirmation:", error);
    res.status(500).json({ msg: "Unable to generate affirmation at this time." });
  }
});


///// song rec /////
app.post('/song-recommendation', async (req, res) => {
  const { zodiacSign } = req.body;

  // Check if recommendations already exist in the session
  if (req.session.songRecommendations) {
      return res.json(req.session.songRecommendations);
  }

  // Generate song recommendations
  const genres = ['indie', 'cool jazz', 'pop'];
  const songRecommendations = {};

  try {
      for (let i = 0; i < genres.length; i++) {
          const prompt = `Suggest one ${genres[i]} song recommendation for someone with the zodiac sign ${zodiacSign} without explaining why.`;

          const response = await openai.chat.completions.create({
              messages: [{ role: 'user', content: prompt }],
              model: 'gpt-3.5-turbo',
          });

          songRecommendations[`song${i + 1}`] = response.choices[0].message.content;
      }

      // Save recommendations to the session
      req.session.songRecommendations = songRecommendations;
      res.json(songRecommendations);
  } catch (error) {
      console.error("Error generating song recommendation:", error);
      res.status(500).json({ msg: "Unable to generate song recommendations at this time." });
  }
});

///// logout /////
app.get('/logout', async (req, res) => {
  req.session.destroy();
  res.render('pages/logout');
});

// Authentication Required
app.use(auth);

// *****************************************************
// <!-- Section 5 : Start Server-->
// *****************************************************
// starting the server and keeping the connection open to listen for more requests
const port = 3000;
module.exports = app.listen(3000);
console.log(`test test testServer is listening on port ${port}`);