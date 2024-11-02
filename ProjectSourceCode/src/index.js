// <!-- Section 1 : Import Dependencies -->

const express = require('express'); // To build an application server or API
const app = express();
const handlebars = require('express-handlebars');
const Handlebars = require('handlebars');
const path = require('path');
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

app.get('/', (req, res) => {
    res.redirect('/home');
});
  

///// login get and post /////
app.get('/login', (req, res) => {
  res.render('pages/login');
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
  const query = `INSERT INTO users (username, password, birthday) VALUES ($1, $2, $3)`;

  await db.none(query, [req.body.username, hash, req.body.birthday]).then(courses => {
      res.redirect('/login');
    })
    .catch(err => {
      console.log(err);
      res.redirect('/register');
  });
});

///// home /////
app.get('/home', async(req, res) => {
  res.render('pages/home');
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
    req.session.destroy()
    res.render('pages/logout');
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

// TODO - Include your API routes here

// *****************************************************
// <!-- Section 5 : Start Server-->
// *****************************************************
// starting the server and keeping the connection open to listen for more requests
app.listen(3000);
console.log('Server is listening on port 3000');