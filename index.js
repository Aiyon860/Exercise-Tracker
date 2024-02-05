const express = require("express");
const app = express();
const cors = require("cors");
require("dotenv").config();
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const { connect, Schema, model, ObjectId } = mongoose;
const mongodb = require("mongodb");

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
        type: String,
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

app.post("/api/users/:_id/exercises", (req, res) => {
  const { _id, description, duration, date } = req.body;
  // const formattedId = new mongodb.ObjectId(_id);
  let formattedDate;

  // Check if "date" is a non-empty string before attempting to create a Date object
  if (date && typeof date === "string") {
    formattedDate = new Date(date);
  } else {
    formattedDate = new Date();
  }

  User.findOneAndUpdate(
    { _id: _id },
    {
      $inc: { count: 1 },
      $push: {
        log: {
          description: description,
          duration: Number(duration),
          date: formattedDate,
        },
      },
    },
  )
    .then((updatedUser) => {
      if (!updatedUser) {
        console.error(`❌  User ${_id} not found.`);
        return res.status(404).json({ error: "User not found" });
      }
      console.log(`✅  User ${_id} updated`);
      return res.status(200).json({
        _id: updatedUser._id,
        username: updatedUser.username,
        date: updatedUser.date,
        duration: updatedUser.duration,
        description: updatedUser.description,
      });
    })
    .catch((err) => {
      console.error(`❌  Error updating user ${_id}: ${err}.`);
      res.status(500).json({ error: "Internal server error" });
    });
});

app.get("/api/users/:_id/logs", (req, res) => {
  const _id = req.params._id;

  User.findOne({ _id: _id })
    .then((user) => {
      return res.status(200).json({
        _id: user._id,
        username: user.username,
        count: user.count,
        log: user.log,
      });
    })
    .catch((err) => {
      console.error(`❌  Error finding user ${_id}: ${err}.`);
      res.status(500).json({ error: "Internal server error" });
    });
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log("Your app is listening on port " + listener.address().port);
});
