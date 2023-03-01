require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const date = require(__dirname + '/date.js');
const mongoose = require('mongoose');
const _ = require('lodash');

mongoose.set('strictQuery', false);
main().catch(err => console.log(err));

async function main() {
    await mongoose.connect(process.env.MONGO_URI);
}

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

// const items = ["Buy Food", "Eat Food", "Cook Food"];
// const workItems = [];

const itemsSchema = {
    name: String
};

const Item = new mongoose.model('Item', itemsSchema);

const item1 = new Item({
    name: "Buy Food"
});
const item2 = new Item({
    name: "Cook Food"
});
const item3 = new Item({
    name: "Eat Food"
});

const defaultItems = [item1, item2, item3];

const listSchema = {
    name: String,
    items: [itemsSchema]
};

const List = mongoose.model('List', listSchema);


app.get("/", (req, res) => {

    Item.find({}, (err, foundItems) => {

        if (foundItems.length === 0) {
            Item.insertMany(defaultItems, (err) => {
                if (err)
                    console.log(err);
            });
            res.redirect("/");
        }
        else {
            res.render('list', { listTitle: day, newListitems: foundItems, route: "/" });
        }

    })

    const day = date.getDate();

});

app.post("/", (req, res) => {

    const itemName = req.body.newItem;
    const listName = req.body.list;

    const item = new Item({
        name: itemName
    });

    if (listName === date.getDate()) {
        //homepage
        item.save();
        res.redirect("/");
    } else {
        List.findOne({ name: listName }, (err, foundList) => {
            foundList.items.push(item);
            foundList.save();
            res.redirect("/" + listName);
        });
    }


});

app.post("/delete", (req, res) => {
    const item = req.body.checkBox;
    const listName = req.body.listName;

    if (listName === date.getDate()) {

        Item.findByIdAndRemove(item, (function (err) {
            if (err)
                console.log(err);
        }));

        res.redirect("/");
    } else {
        List.findOneAndUpdate(
            { name: listName },
            { $pull: { items: { _id: item } } },
            (err) => { if (err) console.log(err); }
        );
        res.redirect("/" + listName);
    }

});

app.get("/:customListName", (req, res) => {

    const customListName = _.capitalize(req.params.customListName);

    List.findOne({ name: customListName }, (err, foundList) => {
        if (!err) {
            if (!foundList) {
                //create new list
                const list = new List({
                    name: customListName,
                    items: defaultItems
                });
                list.save();

                res.redirect("/" + customListName);
            }
            else {// show existing
                res.render("list", { listTitle: foundList.name, newListitems: foundList.items, route: "/" });
            }
        }
    });
});


app.listen(process.env.PORT || 3000, () => {
    console.log("Running on 3000");
});
