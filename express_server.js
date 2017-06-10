const express = require("express");
const app = express();
const PORT = process.env.PORT || 8080;
const cookieSession = require('cookie-session');
const bcrypt = require('bcrypt');

const users = { 
  "userRandomID": {
    id: "userRandomID", 
    email: "caitlin@caitlin.com", 
    password: bcrypt.hashSync("caitlin", 10)
  },
 "user2RandomID": {
    id: "user2RandomID", 
    email: "quon@quon.com", 
    password: bcrypt.hashSync("quon", 10)
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
  return bcrypt.compareSync(password, users[userID].password);
}

// Configuration
app.set("view engine", "ejs");

var urlDatabase = {
  "b2xVn2": {
    longURL: "http://www.lighthouselabs.ca",
    userID: "userRandomID",
  },
  "9sm5xK": {
    longURL: "http://www.google.com",
    userID: "userRandomID2",
  }
};

//allowing access post request parameters
const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieSession({
  name: 'session',
  keys: ["caitlin"]
}));

app.get("/", (req, res) => {
  let userID = req.session["userID"];
  if (users.hasOwnProperty(userID)){
  res.redirect("/urls");
  } else {
    res.redirect("/login");
  }
  
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/hello", (req, res) => {
  res.end("<html><body>Hello <b>World</b></body></html>\n");
});

app.get("/urls/new", (req, res) => {
  let templateVars = {
      user: users[req.session.userID]
  }
  if (req.session.userID) {
    res.render("urls_new", templateVars);
  } else {
    res.redirect("/login");
  }
});

app.get("/urls", (req, res) => {
  let userID = req.session["userID"];
    let userObj = users[userID];
    let templateVars = { 
       urls: urlDatabase,
       user: users[req.session.userID],
       urls: urlsForUser(userID)};
  res.render("urls_index", templateVars);
});

function urlsForUser(id){
  let filteredObj = {};
  for (let urlKey in urlDatabase) {
    if(id === urlDatabase[urlKey].userID) {
      filteredObj[urlKey] = {
        shortURL: urlDatabase[urlKey].shortURL,
        longURL: urlDatabase[urlKey].longURL,
        userID: urlDatabase[urlKey].userID,
        ownedByCurrentUser: id === urlDatabase[urlKey].userID
      }
    }
  }
  return filteredObj;
}

app.post("/register", (req, res) => {
  const newUserId = generateRandomString(6, '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ');
  const newUserEmail = req.body.email;
  const newUserPassword = req.body.password;
  const hashedPassword = bcrypt.hashSync(newUserPassword, 10);
  let existingUserEmail;

  if (newUserEmail === '' || newUserPassword === '') {
    res.status(400).send(`<p>Please enter a valid email and passowrd</p>
    <a href='http://localhost:8080/urls/'>Return to homepage.</a>`);
    return;
  } else {
  for(let user in users){
    if(users[user].email === newUserEmail) {
      res.status(400).send(`<p>User already exists</p>
    <a href='http://localhost:8080/urls/'>Return to homepage.</a>`);
      return;
    } 
  }
}
users[newUserId] = {
  id: newUserId,
  email: newUserEmail, 
  password: hashedPassword
};
 
req.session.userID = newUserId;
res.redirect("/urls");    
});

// registration page
app.get("/register", (req, res) => {
  res.render("urls_register");
});

//login
app.get("/login", (req, res) => {
  res.render("urls_login");
});

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
    res.status(403).send("Invalid credentials");
    return;
  }

  if (!passwordMatch(userID, req.body.password)) {
    res.status(403).send("User password is wrong");
  } else {
    req.session.userID = userID;
    res.redirect("/urls"); 
  }
});

// //logout
app.post("/logout", (req, res) => {
  req.session = null;
  res.redirect("/urls");
});

app.get("/urls/:id", (req, res) => {
  
  let url = urlDatabase[req.params.id];

  if (req.session.userID === undefined){
    res.status(403).send("Please login");
  } else if (url === undefined) {
    res.status(403).send("Record does not exist");
  } else if (url.userID !== req.session.userID) {
    res.status(403).send("This URL does not belong to you");
  } else if (url){

    let shortURL = req.params.id;
    let templateVars = { 
        shortURL: shortURL,
        longURL: urlDatabase[shortURL].longURL, 
        user: users[req.session.userID]
    };

    res.render("urls_show", templateVars);
  } else {
    res.status(404).send("URL not found");
  }
});

//redirects page
app.get("/u/:shortURL", (req, res) => {
  let longURL = urlDatabase[req.params.shortURL].longURL;
  res.redirect(longURL);
});

//deletes an item
app.post("/urls/:id/delete", (req, res) => {
  if (!req.session.userID) {
    res.status(403).send("You are not logged in!");
    return;
  }
   const shortUrl = req.params.id;
  const userURL = urlDatabase[shortUrl];
  
  if (userURL.userID !== req.session.userID) {
   res.status(403).send("This URL does not belong to you");
    return;
  }
  
  userURL.longURL = req.body.longURL;
  delete urlDatabase[req.params.id];
  res.redirect("/urls");
});


//gives link in order to redirect
app.post("/urls", (req, res) => {
  if (!req.session.userID){
    res.status(403).send("You are not logged in!");
    return;
  }

  let tmp = generateRandomString();
  urlDatabase[tmp] = {
    longURL: req.body.longURL,
    userID: req.session.userID
  };
  res.redirect("/urls/");
});

//updating an object
app.post("/urls/:id", (req, res) => {
  if (!req.session.userID){
    res.status(403).send("You are not logged in!");
    return;
  }
  const shortUrl = req.params.id;
  const userURL = urlDatabase[shortUrl];
  
  if (userURL.userID !== req.session.userID) {
    res.status(403).send("This URL does not belong to you");
    return;
  }
  
  userURL.longURL = req.body.longURL;
  res.redirect("/urls");
});

//Initialize app
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});