const express = require("express");
const bodyParser = require("body-parser");
const mysql = require("mysql");
require("dotenv").config();
const app = express();
app.use(express.static("public"));
app.set("view engine", "ejs");
app.use(
  bodyParser.urlencoded({
    extended: true,
  })
);

const conn = mysql.createConnection({
  host: process.env.HOST,
  user: process.env.USER,
  password: process.env.PASSWORD,
  database: process.env.DB,
});

conn.connect((err) => {
  if (err) throw err;
  console.log("Mysql Connected...");
});
// app.get("/", (req, res) => {
//   let sql = "show tables";
//   conn.query(sql, (err, results) => {
//     if (err) throw err;
//     res.send(JSON.stringify({ response: results }));
//   });
// });

//get request for home page
app.get("/", (req, res) => {
  res.sendFile(__dirname + "/home.html");
});
//get request for registration form
app.get("/signup", (req, res) => {
  res.sendFile(__dirname + "/signup.html"); //add forms
});
//get request for login form
app.get("/login", (req, res) => {
  res.sendFile(__dirname + "/login.html"); //add forms
});
//post request for registration

//post request for login
//get request for menu page
app.get("/menu", (req, res) => {
  let sql = "select * from menu";
  conn.query(sql, (err, results) => {
    if (err) throw err;
    res.send(JSON.stringify({ response: results }));
  });
});
//post request for add item
app.post("/add/:id", (req, res) => {
  //get item id from req.body
  //price in menu table
  let price = 0;
  let sql = "select * from cart where PICT_Reg_ID=" + req.params.id;
  var cart_tot;
  conn.query(sql, (err, results) => {
    if (err) throw err;
    cart_tot = results.Total_Price;
  });
  cart_tot += price;
  let sql =
    "update cart set Total_Price = " +
    cart_tot +
    " where PICT_Reg_ID=" +
    req.params.id;
  conn.query(sql, (err, results) => {
    if (err) throw err;
    res.send(JSON.stringify({ response: results }));
  });
});
//get request for view cart
app.get("/cart", (req, res) => {
  let sql = "select * from cart";
  conn.query(sql, (err, results) => {
    if (err) throw err;
    res.send(JSON.stringify({ response: results }));
  });
});
//get request for view order
app.get("/view/:id", (req, res) => {
  console.log(req.params.id);
  let sql = "select * from cart where PICT_Reg_ID=" + req.params.id;
  conn.query(sql, (err, results) => {
    if (err) throw err;
    res.send(JSON.stringify({ response: results }));
  });
  res.send("view orders");
});

// app.post("/",(req,res))
app.listen(process.env.PORT, () => {
  console.log("Server up and running ");
});
