const express = require("express");
const app = express();
const cors = require("cors");
require("dotenv").config();
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const { connect, Schema, model } = mongoose;

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
      _id: false,
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
  const _id = req.body["_id"] || req.params._id;
  const { description, duration, date } = req.body;
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
          duration: +duration,
          date: formattedDate.toDateString(),
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
        date: formattedDate.toDateString(),
        duration: Number(duration),
        description: description,
      });
    })
    .catch((err) => {
      console.error(`❌  Error updating user ${_id}: ${err}.`);
      res.status(500).json({ error: "Internal server error" });
    });
});

app.get("/api/users/:_id/logs", (req, res) => {
  const _id = req.params._id;
  const from = req.query.from || "1970-01-01";
  const to = req.query.to || "9999-01-01";
  const limit = +req.query.limit || 100;

  const fromDate = new Date(from);
  const toDate = new Date(to);

  User.findOne({ _id: _id })
    .then((user) => {
      const filteredLogs = user.log.filter((log) => {
        const logDate = new Date(log.date);
        return logDate >= fromDate && logDate <= toDate;
      });

      const response = {
        _id: user._id,
        username: user.username,
        count: filteredLogs.slice(0, limit).length || user.log.length,
        log: filteredLogs.slice(0, limit) || user.log,
      };

      // Conditionally add 'from' and 'to' parameters to the response
      if (req.query.from) {
        response.from = fromDate.toDateString();
      }

      if (req.query.to) {
        response.to = toDate.toDateString();
      }

      return res.status(200).json(response);
    })
    .catch((err) => {
      console.error(`❌  Error finding user ${_id}: ${err}.`);
      res.status(500).json({ error: "Internal server error" });
    });
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log("Your app is listening on port " + listener.address().port);
});
