const express = require("express");
const app = express();
const cors = require("cors");
require("dotenv").config();
const bodyParser = require("body-parser");
const { connect, Schema, model } = require("mongoose");

/* mongodb config */
connect()
  .then(() => {})
  .catch((err) => {});

const userSchema = new Schema({
  username: {
    type: String,
    required: true,
    default: `AnonymousUser${Math.floor(Math.random() * 1000)}`,
  },
});
const User = model("User", userSchema, "User");

// const logSchema = new Schema({
//   username: User.findsOne({ username:  })
//                 .then(user => user.username)
//                 .catch(err => console.log(err)),
//   count:
//   _id: User.findsOne({ _id:  }),
//   description: {
//     type: String,
//     default: `Exercise${Math.floor(Math.random() * 1000)}`
//   },
//   duration: {
//     type: Number,
//     required: true,
//   }
// });
/* end */

app.use(cors());
app.use(express.static("public"));
app.get("/", (req, res) => {
  res.sendFile(__dirname + "/views/index.html");
});
app.use(bodyParser.urlencoded({ extended: false }));

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log("Your app is listening on port " + listener.address().port);
});
