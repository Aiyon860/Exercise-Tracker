const express = require("express");
const app = express();
const cors = require("cors");
require("dotenv").config();
const bodyParser = require("body-parser");
const { connect, Schema, model } = require("mongoose");

/* mongodb config */
connect(process.env.MONGODB_URI)
  .then(() => {
    console.log("✅  Connected to MongoDB");
  })
  .catch((err) => {
    console.error(`❌  Error connecting to MongoDB: ${err}.`);
  });

const userSchema = new Schema({
  username: {
    type: String,
    required: true,
    default: `AnonymousUser${Math.floor(Math.random() * 1000)}`,
  },
  count: {
    type: Number,
    required: true,
    default: 0,
  },
  log: [
    {
      description: {
        type: String,
        required: true,
        default: "No description",
      },
      duration: {
        type: Number,
        required: true,
        default: 0,
      },
      date: {
        type: Date,
        required: true,
        default: new Date().toTimeString(),
      },
    },
  ],
});
const User = model("User", userSchema, "User");
/* end */

app.use(cors());
app.use(express.static("public"));
app.get("/", (req, res) => {
  res.sendFile(__dirname + "/views/index.html");
});
app.use(bodyParser.urlencoded({ extended: false }));

app.post("/api/users", (req, res) => {
  const { username } = req.body;
  const newUser = new User({
    username: username,
    count: 0,
    log: [],
  });
  newUser
    .save()
    .then(() => {
      res.status(201).json({
        username: newUser.username,
        _id: newUser._id,
      });
    })
    .catch((err) => {
      console.error(err);
      res.status(500).json({ error: "Internal server error" });
    });
});

app.get("/api/users", (req, res) => {
  User.find({})
    .then((users) => {
      res.status(200).send(
        users.map((user) => {
          return {
            username: user.username,
            _id: user._id,
          };
        }),
      );
    })
    .catch((err) => {
      console.error(err);
      return res.status(500).json({ error: "Internal server error" });
    });
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log("Your app is listening on port " + listener.address().port);
});
