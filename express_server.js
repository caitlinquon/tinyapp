var express = require("express");
var app = express();
var PORT = process.env.PORT || 8080;
var cookieParse = require('cookie-parser');

//generates a random 6 alphanumeric value
function generateRandomString() {
  var result = '';
  var possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

  for (var i = 0; i < 6; i++){
    result += possible[Math.floor(Math.random() * possible.length)];
  }
  return result;
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
      username: req.cookies["username"]
  }
  res.render("urls_new");
});

app.get("/urls", (req, res) => {
  let templateVars = { 
       urls: urlDatabase,
       username: req.cookies["username"]};
  res.render("urls_index", templateVars);
});

app.get("/urls/:id", (req, res) => {
  let shortURL = req.params.id;
  let templateVars = { 
      shortURL: shortURL,
      longURL: urlDatabase[shortURL], 
      username: req.cookies["username"]
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
  console.log(req.body);
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

//login 
app.post("/login", (req, res) => {
  res.cookie("username", req.body.username);
  res.redirect("/urls");
});

// //logout
app.post("/logout", (req, res) => {
  res.clearCookie("username");
  res.redirect("/urls");
});

//Initialize app
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});