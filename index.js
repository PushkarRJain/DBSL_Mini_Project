const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
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
global.data = "";
global.roll = "";
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

//get request for home page - USER, ADMIN
app.get("/", (req, res) => {
  res.sendFile(__dirname + "/home.html");
});
//get request for registration form - USER, ADMIN
app.get("/signup", (req, res) => {
  res.sendFile(__dirname + "/signup.html"); //add forms
});
//get request for login form
app.get("/login", (req, res) => {
  res.sendFile(__dirname + "/login.html"); //add forms
});
//post request for registration - USER, ADMIN
app.post("/signup", (req, res) => {
  console.log("yes");
  const id = req.body.PICT_Reg_ID;
  const gender = req.body.Gender;
  const name = req.body.Name;
  const contact = req.body.Contact;
  const email = req.body.email;
  const username = req.body.username;
  const password = req.body.password;
  const role = req.body.role;
  roll = req.body.role;

  const sqlInsert = "INSERT INTO user VALUES (?,?,?,?,?,?,?,?)";
  conn.query(
    sqlInsert,
    [id, gender, role, name, username, password, email, contact],
    (err, results) => {
      if (err) {
        res.redirect("/login");
        console.log(err);
      } else {
        data = req.body.PICT_Reg_ID;
        roll = req.body.role;
        console.log(roll);
        console.log("added");
        if (roll.trim() === "user".trim()) {
          res.redirect("/menu");
        } else {
          res.redirect("/admin");
        }
      }
    }
  );
});
//post request for login - USER, ADMIN
app.post("/login", (req, res) => {
  const sqlQuery = "Select * from user where Username=(?) and Password = (?)";
  conn.query(
    sqlQuery,
    [req.body.username, req.body.password],
    (err, results) => {
      if (err) {
        console.log(err);
        res.redirect("/signup");
      } else {
        data = results[0].PICT_Reg_ID;
        roll = results[0].Role;
        console.log(data, roll);
        if (roll === "user") {
          res.redirect("/menu");
        } else {
          res.redirect("/admin");
        }
      }
    }
  );
});
//get request for menu page - USER, ADMIN
app.get("/menu", (req, res) => {
  if (data === "") {
    res.redirect("/login");
  }
  let sql = "select * from menu";
  var res_arr;
  conn.query(sql, (err, results) => {
    if (err) throw err;
    res_arr = JSON.parse(JSON.stringify(results));
    res.render("menu", { res_arr: res_arr });
  });
});
//post request for add item - USER, ADMIN
app.post("/menu/add/:id", (req, res) => {
  if (data === "") {
    res.redirect("/login");
  }
  console.log("val", data);
  //get item id from req.body
  const item_id = req.params.id;
  const sqlQuery_1 = "select * from menu where Item_ID = (?)";
  conn.query(sqlQuery_1, [item_id], (err, result) => {
    if (err) {
      console.log(err);
    }
    var obj = JSON.parse(JSON.stringify(result[0]));
    var price = obj.Price;
    var stock = obj.Stock;
    stock = Number(stock) - 1;
    if (Number(stock) < 0) {
      res.redirect("/menu");
    }
    conn.query(
      "update menu set stock = (?) where Item_ID= (?)",
      [stock, item_id],
      (e, r) => {
        conn.query(
          "select * from cart where Customer_ID = (?)",
          [data],
          (error, results) => {
            if (results == null) {
              console.log("yes");
              //
              obj = {};
              obj[item_id] = 1;
              conn.query(
                "insert into cart (Total_Price,Customer_ID,Delivered,Items) values (?,?,?,?)",
                [price, data, 0, JSON.stringify(obj)],
                (er, re) => {
                  if (er) {
                    console.log(er);
                  } else {
                    res.redirect("/menu");
                  }
                }
              );
            } else {
              console.log(JSON.parse(JSON.stringify(results)));
              var inp = JSON.parse(JSON.stringify(results));
              var items = JSON.parse(inp[0].Items);
              console.log(typeof items);
              if (item_id in items) {
                items[item_id] = Number(items[item_id]) + 1;
              } else {
                items[item_id] = 1;
              }

              var tot_price = Number(inp[0].Total_Price) + price;
              conn.query(
                "update cart set Total_Price = (?),Items = (?) where Customer_ID = (?)",
                [tot_price, JSON.stringify(items), data],
                (errr, re) => {
                  if (errr) {
                    console.log(errr);
                  } else {
                    res.redirect("/menu");
                  }
                }
              );
            }
          }
        );
      }
    );
  });
});
//post request to subtract item - USER, ADMIN
app.post("/menu/subtract/:id", (req, res) => {
  if (data === "") {
    res.redirect("/login");
  }
  console.log("val", data);
  //get item id from req.body
  const item_id = req.params.id;
  const sqlQuery_1 = "select * from menu where Item_ID = (?)";
  conn.query(sqlQuery_1, [item_id], (err, result) => {
    if (err) {
      console.log(err);
    }
    var obj = JSON.parse(JSON.stringify(result[0]));
    var price = obj.Price;
    var stock = obj.Stock;
    stock = Number(stock) + 1;
    conn.query(
      "update menu set stock = (?) where Item_ID= (?)",
      [stock, item_id],
      (e, r) => {
        conn.query(
          "select * from cart where Customer_ID = (?)",
          [data],
          (error, results) => {
            if (results == null) {
              res.redirect("/menu");
            } else {
              console.log(JSON.parse(JSON.stringify(results)));
              var inp = JSON.parse(JSON.stringify(results));
              var items = JSON.parse(inp[0].Items);
              console.log(typeof items);
              if (item_id in items) {
                items[item_id] = Number(items[item_id]) - 1;
                var tot_price = Number(inp[0].Total_Price) - price;
                conn.query(
                  "update cart set Total_Price = (?),Items = (?) where Customer_ID = (?)",
                  [tot_price, JSON.stringify(items), data],
                  (errr, re) => {
                    if (errr) {
                      console.log(errr);
                    } else {
                      res.redirect("/menu");
                    }
                  }
                );
              } else {
                res.redirect("/menu");
              }
            }
          }
        );
      }
    );
  });
});
//get request for view cart - USER, ADMIN
app.get("/cart", (req, res) => {
  if (data === "") {
    res.redirect("/login");
  }
  let sql = "select * from cart where Customer_ID=(?)";
  conn.query(sql, [data], (err, results) => {
    if (err) throw err;
    if (results === null) {
      res.render("cart", { flag: 0, inp_data: "No items added yet!" });
    } else {
      var arr = JSON.parse(JSON.stringify(results[0]));
      console.log(arr);
      var items = JSON.parse(arr.Items);
      console.log(typeof items, items[1]);
      var itemIds = [];
      var itemNames = [];
      var i = 1;
      for (var key in items) {
        itemIds.push(key);
        conn.query(
          "select Item_Name from menu where Item_ID = (?)",
          [key],
          (e, r) => {
            if (e) {
              console.log(e);
            } else {
              var name = JSON.parse(JSON.stringify(r[0].Item_Name));
              itemNames.push(name);
              // console.log("below", temp);
              // itemNames[name] = items[key];
              // console.log(name, items[key]);
              i += 1;
              if (i === 4) {
                res.render("cart", {
                  flag: 1,
                  Price: arr.Total_Price,
                  Items: arr.Items,
                  Item_ID: itemIds,
                  Item_Name: itemNames,
                });
              }
            }
          }
        );
      }
    }
  });
});
//get request for view order - USER, ADMIN
app.get("/view", (req, res) => {
  if (data === "") {
    res.redirect("/login");
  }
  let sql = "select * from cart where Customer_ID=(?)";
  conn.query(sql, [data], (err, results) => {
    if (err) throw err;
    if (results === null) {
      res.render("myorders", { flag: 0 });
    } else {
      var arr = JSON.parse(JSON.stringify(results[0]));
      console.log(arr);
      var items = JSON.parse(arr.Items);
      console.log(typeof items, items[1]);
      var itemIds = [];
      var itemNames = [];
      var i = 1;
      for (var key in items) {
        itemIds.push(key);
        conn.query(
          "select Item_Name from menu where Item_ID = (?)",
          [key],
          (e, r) => {
            if (e) {
              console.log(e);
            } else {
              var name = JSON.parse(JSON.stringify(r[0].Item_Name));
              itemNames.push(name);
              // console.log("below", temp);
              // itemNames[name] = items[key];
              // console.log(name, items[key]);
              i += 1;
              if (i === 4) {
                res.render("myorders", {
                  flag: 1,
                  Price: arr.Total_Price,
                  Items: arr.Items,
                  Item_ID: itemIds,
                  Item_Name: itemNames,
                });
              }
            }
          }
        );
      }
    }
  });
});
//Admin home page - ADMIN
app.get("/admin", (req, res) => {
  if (data === "") {
    res.redirect("/login");
  }
  if (roll === "user") {
    res.redirect("/menu");
  }
  res.sendFile(__dirname + "/admin.html");
});
//See all placed orders - ADMIN
app.get("/allorders", (req, res) => {
  if (data === "") {
    res.redirect("/login");
  }
  if (roll === "user") {
    res.redirect("/menu");
  }
  conn.query("select * from cart", (err, results) => {
    var arr = JSON.parse(JSON.stringify(results));
    var item_id = [];
    var item_name = [];
    conn.query("select Item_ID,Item_Name from menu", (e, r) => {
      var arr_data = JSON.parse(JSON.stringify(r));
      res.render("viewall", { arr: arr, arr_data: arr_data });
    });
  });
});
//Add item in menu - ADMIN
app.post("/additem", (req, res) => {
  if (data === "") {
    res.redirect("/login");
  }
  if (roll === "user") {
    res.redirect("/menu");
  }
  const Item_id = req.body.item_id;
  const Price = req.body.Price;
  const Item_Name = req.body.Item_Name;

  const sqlInsert = "INSERT INTO menu VALUES (?,?,?)";
  conn.query(sqlInsert, [Item_id, Price, role, Item_Name], (err, results) => {
    if (err) {
      console.log(err);
    }
    console.log("added");
    res.redirect("/admin");
  });
});
app.listen(process.env.PORT, () => {
  console.log("Server up and running ");
});
