const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");
require("dotenv").config();

const app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));
app.set("view engine", "ejs");

mongoose.connect(
  process.env.MONGO_URI
);
const itemsSchema = new mongoose.Schema({
  name: String,
});
const Item = mongoose.model("Item", itemsSchema);

const item1 = new Item({
  name: "Type Item",
});
const item2 = new Item({
  name: "Just Click '+'",
});
const defaultItems = [item1, item2];

const listSchema = new mongoose.Schema({
  title: String,
  items: [itemsSchema],
});
const List = mongoose.model("List", listSchema);

app.get("/", (req, res) => {
  Item.find({}, (err, items) => {
    if (items.length === 0) {
      Item.insertMany(defaultItems, (err) => {
        if (err) {
          console.log(err);
        }
      });
      res.redirect("/");
    } else {
      res.render("list.ejs", {
        listTitle: "Today",
        items,
      });
    }
  });
});

app.post("/", (req, res) => {
  const itemName = req.body.newItem;
  const listName = req.body.button;

  const item = new Item({
    name: itemName,
  });

  if (listName === "Today") {
    item.save(() => {
      res.redirect("/");
    });
  } else {
    List.findOne({ title: listName }, (err, foundList) => {
      foundList.items.push(item);
      foundList.save(() => {
        res.redirect(`/${listName}`);
      });
    });
  }
});

app.post("/delete", (req, res) => {
  const checkedItemId = req.body.cbox;
  const listTitle = req.body.listTitle;

  if (listTitle === "Today") {
    Item.findByIdAndRemove(checkedItemId, (err) => {
      if (!err) {
        res.redirect(`/`);
      }
    });
  } else {
    List.findOneAndUpdate(
      { title: listTitle },
      { $pull: { items: { _id: checkedItemId } } },
      (err, foundList) => {
        if (!err) {
          res.redirect(`/${listTitle}`);
        }
      }
    );
  }
});

app.get("/:customListName", (req, res) => {
  const customListName = _.capitalize(req.params.customListName);

  List.findOne({ title: customListName }, (err, foundList) => {
    if (!err) {
      if (!foundList) {
        // Create a new List
        const list = new List({
          title: customListName,
          items: defaultItems,
        });
        list.save(() => {
          res.redirect(`/${customListName}`);
        });
      } else {
        // Show an existing list
        res.render("list.ejs", {
          listTitle: foundList.title,
          items: foundList.items,
        });
      }
    }
  });
});

app.listen(process.env.PORT || 3000, () => {
  console.log(`server is up @ port 3000`);
});
