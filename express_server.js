var express = require("express");
var app = express();
var PORT = process.env.PORT || 8080;
var cookieParse = require('cookie-parser');

const users = { 
  "userRandomID": {
    id: "userRandomID", 
    email: "user@example.com", 
    password: "purple-monkey-dinosaur"
  },
 "user2RandomID": {
    id: "user2RandomID", 
    email: "user2@example.com", 
    password: "dishwasher-funk"
  }
};


//generates a random 6 alphanumeric value
function generateRandomString() {
  var result = '';
  var possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

  for (var i = 0; i < 6; i++){
    result += possible[Math.floor(Math.random() * possible.length)];
  }
  return result;
}

//checks to see if password matches userid
const passwordMatch = (userID, password) => {
  return users[userID].password === password
}

// Configuration
app.set("view engine", "ejs");

var urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

//allowing access post request parameters
const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParse())
app.get("/", (req, res) => {
  res.end("Hello!");
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/hello", (req, res) => {
  res.end("<html><body>Hello <b>World</b></body></html>\n");
});

app.get("/urls/new", (req, res) => {
  let templateVars = {
      user: users[req.cookies.userID]
  }
  res.render("urls_new", templateVars);
});

app.get("/urls", (req, res) => {
  let templateVars = { 
       urls: urlDatabase,
       user: users[req.cookies.userID]};
  res.render("urls_index", templateVars);
});


app.post("/register", (req, res) => {
  if (req.body.email === '' || req.body.password === '') {
    res.status(400).send(`<p>Please fill out login</p>
    <a href='http://localhost:8080/urls/'>Return to homepage.</a>`);
    return;
  } 
  for(let user in users){
    if(users[user].email === req.body.email) {
      res.status(400).send(`<p>This email has been taken</p>
    <a href='http://localhost:8080/urls/'>Return to homepage.</a>`);
      return;
    } 
  }
  const userID = generateRandomString();
  users[userID] = {
    id: userID, 
    email: req.body.email, 
    password: req.body.password
  }
res.cookie("userID", userID);
res.redirect("/urls");    
});

// registration page
app.get("/register", (req, res) => {
  res.render("urls_register");
});

app.get("/login", (req, res) => {
  res.render("urls_login");
});

//login 
app.post("/login", (req, res) => {
  function userExists(email) {
    for (let user in users){
      if (users[user].email === email) {
        return users[user].id;
      }
    }
  }

  const userID = userExists(req.body.email);
  if (!userID) {
    res.status(403).send("User email is wrong");
  }

  if (!passwordMatch(userID, req.body.password)) {
    res.status(403).send("User password is wrong");
  } else {
    res.cookie("userID", userID);
    res.redirect("/urls"); 
  }
});

// //logout
app.post("/logout", (req, res) => {
  res.clearCookie("userID");
  res.redirect("/urls");
});

app.get("/urls/:id", (req, res) => {
  let shortURL = req.params.id;
  let templateVars = { 
      shortURL: shortURL,
      longURL: urlDatabase[shortURL], 
      user: users[req.cookies.userID]
  };
  res.render("urls_show", templateVars);
});

//redirects page
app.get("/u/:shortURL", (req, res) => {
  let longURL = urlDatabase[req.params.shortURL];
  res.redirect(longURL);
});

//deletes an item
app.post("/urls/:id/delete", (req, res) => {
  delete urlDatabase[req.params.id];
  res.redirect("/urls");
});

//gives link in order to redirect
app.post("/urls", (req, res) => {
  let tmp = generateRandomString();
  urlDatabase[tmp] = req.body.longURL;
  res.send(`<html><a href='http://localhost:8080/u/${tmp}'>Here's your link.</a>: http://localhost:8080/urls/${tmp}</html>`);
});

//updating an object
app.post("/urls/:id", (req, res) => {
  const updatedURL = urlDatabase[req.params.id];
  urlDatabase[req.params.id] = req.body.longURL;
  res.redirect("/urls");
});

//Initialize app
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});