const express = require("express");
const session = require("express-session");
const msal = require("@azure/msal-node");
const path = require("path");
require("dotenv").config();

const app = express();
const port = 3000;

// Middleware
app.use(session({
  secret: "your-random-secret",
  resave: false,
  saveUninitialized: false
}));

app.set("view engine", "ejs");
app.use(express.static("public"));

const config = require("./authconfig");
const cca = new msal.ConfidentialClientApplication(config);

const SCOPES = ["user.read"];

// Routes
app.get("/", (req, res) => {
  const user = req.session.user;
  res.render("index", { user });
});

app.get("/login", (req, res) => {
  const authCodeUrlParams = {
    scopes: SCOPES,
    redirectUri: process.env.REDIRECT_URI
  };

  cca.getAuthCodeUrl(authCodeUrlParams).then(response => {
    res.redirect(response);
  }).catch(error => console.log(JSON.stringify(error)));
});

app.get("/redirect", async (req, res) => {
  const tokenRequest = {
    code: req.query.code,
    scopes: SCOPES,
    redirectUri: process.env.REDIRECT_URI
  };

  try {
    const response = await cca.acquireTokenByCode(tokenRequest);
    req.session.user = {
      name: response.account.name,
      email: response.account.username
    };
    res.redirect("/");
  } catch (error) {
    console.log(error);
    res.status(500).send("Authentication failed.");
  }
});

app.get("/logout", (req, res) => {
  req.session.destroy(() => {
    res.redirect("https://login.microsoftonline.com/common/oauth2/v2.0/logout?post_logout_redirect_uri=http://localhost:3000");
  });
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
