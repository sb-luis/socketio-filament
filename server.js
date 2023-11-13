require("dotenv").config();

//Node modules
const express = require("express"); //web framework
const app = express();
const http = require("http").createServer(app); //we need a http server instance to pass to socket.io, we cannot pass it "app" which is just an express request handler function.
const mongoose = require("mongoose"); //mongodb object modeling
const passport = require("passport"); //authentication
const LocalStrategy = require("passport-local").Strategy;
const session = require("express-session"); //sessions middleware for express
const bcrypt = require("bcrypt"); //password hashing function
const MongoStore = require("connect-mongo")(session); //mongodb session store for express
const io = require("socket.io")(http); //real-time web engine built on top of WebSockets
const passportSocketIo = require("passport.socketio"); //access passport.js user info from a socket.io connection.
const cookieParser = require("cookie-parser"); //Parse Cookie header and populate req.cookies with an object.

//My modules
const { User, validateUser, validateUsername } = require("./models/user");
const { Dialog, validateMessage } = require("./models/dialog");
const socketInit = require("./service/setup");

//Server Temp Data (defined globally to access from other modules)
global.usersOnline = {};

//Connect to MongoDB
// e.g. mongodb://user:pass@host:27017/
mongoose
  .connect(process.env.MONGO_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(console.log("Connected to MongoDB..."));
//We define a variable to store our session later, using the connection we´ve established with mongoose.
const store = new MongoStore({ mongooseConnection: mongoose.connection });

//ROUTERS
const mainRouter = require("./routes/main");
const usersRouter = require("./routes/users");
const dialogsRouter = require("./routes/dialogs");
const authRouter = require("./routes/authenticate");

//Configure Passport Strategy
passport.use(
  new LocalStrategy(async function (username, password, done) {
    //Make sure user exists.
    let user = await User.findOne({
      username: username.toLowerCase(),
    }).catch((err) => done(err));

    if (!user) return done(null, false);

    //Check if password is correct
    bcrypt.compare(password, user.password, function (bcryptError, result) {
      if (bcryptError) return done(bcryptError);

      if (result) {
        return done(null, user);
      } else {
        return done(null, false);
      }
    });
  })
);

//Configure Passport Sessions
passport.serializeUser(function (user, done) {
  done(null, user.id);
});

passport.deserializeUser(function (id, done) {
  User.findById(id, function (err, user) {
    done(err, user);
  });
});

//MIDDLEWARE
app.use(express.static("public"));
app.use(express.json());
app.set("view engine", "ejs");
app.use(
  session({
    secret: process.env.PASSPORT_SECRET,
    resave: false,
    saveUninitialized: false,
    store: store,
  })
);
app.use(passport.initialize());
app.use(passport.session());
app.use("/", mainRouter);
app.use("/api/users", usersRouter);
app.use("/api/dialogs", dialogsRouter);
app.use("/api/auth", authRouter);

//SocketIO middleware
io.use(
  passportSocketIo.authorize({
    cookieParser: cookieParser,
    key: "connect.sid",
    secret: process.env.PASSPORT_SECRET,
    store: store,
    success: onAuthorizeSuccess,
    fail: onAuthorizeFail,
  })
);

function onAuthorizeSuccess(data, accept) {
  //console.log('successful connection to socket.io');
  accept(null, true);
}

function onAuthorizeFail(data, message, error, accept) {
  if (error) throw new Error(message);
  //console.log('failed connection to socket.io: ', message);
  accept(null, false);
}

//SocketIO connection
socketInit(io);

//LAUNCH APP!
const port = process.env.PORT || 3000;
http.listen(port, console.log(`Listening on port ${port}`));
