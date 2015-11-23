// # Main Server

// ##### [Back to Table of Contents](./tableofcontents.html)

// ## Dependencies
var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var Board = require('./db/board');
var port = process.env.PORT || 8080;
var handleSocket = require('./server/sockets');
var utils = require('./server/utils');
var bodyParser = require('body-parser');
var morgan = require('morgan');
var session = require('express-session');


app.use(bodyParser.json());
app.use(morgan('dev'));

app.use(session({
  secret: 'nofflePenguin',
  resave: false,
  // saveUninitialized: true,
  cookie: { maxAge: 6000000 }
}));

// ## Routes
var id = utils.createId();
console.log(typeof id);

// **Static folder for serving application assets**
app.use('/', express.static(__dirname + '/public'));

// **Static folder for serving documentation**
app.use('/documentation', express.static(__dirname + '/docs'));

// **Home Page**
app.get('/', function(req, res) {
  res.sendFile(__dirname + '/public/index.html');
});

// **Documentation Page**
app.get('/documentation', function(req, res) {
  res.sendFile(__dirname + '/docs/tableofcontents.html');
});


// **Get a new whiteboard**
app.get('/new', function(req, res) {
  // Create a new mongoose board model.
  console.log('in new board session----------', req.session.user);
  var id = utils.createId();

  var board = new Board.boardModel({
    id: id,
    boardName: 'null',
    userEmail: req.session.user,
    users: 0,
    strokes: []
  });
  board.save()
  .then(function (board) {
    console.log('redirect to Bjarke function');
    res.redirect('/' + id);
  })
  .catch(function (err) {
    console.log('error in /new',err);
    res.redirect('/');
  });
});

//post the users details to the database
app.post('/api/signUp', function (req, res) {
  console.log('body',req.body);
  console.log('IN signUp');
  var email = req.body.email;
  var password = req.body.password;
  var user = new Board.userModel({
    email: email,
    password: password
  });
  user.save()
  .then(function (user) {
    //send the response to the /new route
    console.log('sending to /new');
    req.session.user = user.email;
    res.redirect('/new');
  })
  .catch(function (err) {
    console.log(err);
    res.status(500).send();
  });
});

//**Wildcard route & board id handler.**
app.get('/*', function(req, res) {
  var id = req.url.slice(1);
  Board.boardModel.findOne({id: id})
  .then(function (board) {
    board.users++;
    return board.save();
  })
  .then(function (savedBoard) {
    console.log('savedboard-users',savedBoard.users);
    // Invoke [request handler](../documentation/sockets.html) for a new socket connection
    // with board id as the Socket.io namespace.
    handleSocket(req.url, savedBoard, io);
    // Send back whiteboard html template.
    res.sendFile(__dirname + '/public/board.html');
  })
  .catch(function (err) {
    res.redirect('/');
  });
});


//check the user detials in the database
app.post('/api/login', function (req, res) {
  console.log('login',req.body);
  var email = req.body.email;
  var password = req.body.password;
  Board.userModel.findOne({email: email})
  .then(function (user) {
    if (password === user.password) {
      //SESSION SEND HERE
      req.session.user = user.email;
      console.log('session Last bit', req.session);
      //SHOULD I REDIRECT TO ANOTHER ROUTE/go back to the client?
      res.status(200).redirect('/new');
    } else {
      console.log('bad pass');
      res.status(401).json({message:'Incorrect Password'});
    }
  })
  .catch(function (err) {
    console.log(err);
    res.status(500).send();
  });
});

//request all the board data from the database for the specific user
app.get('/api/userBoards', function (req, res) {
  //can I talk to the session object here?? I assume yes!
  console.log('session-----', req.session.user);
  var user = req.session.user;
  Board.boardModel.find({})
  .then(function (boards) {
    var data = boards.map(function (board) {
      console.log('boardName', boardName);
      return board.name;//CURRENTLY NO BOARDS HAVE NAMES!
    });
    console.log('all names if the saved boards',data);
    // res.status(200).body(data);
  })
  .catch(function (err) {
    res.status(500).json({message:'None Found'});
  });
});

//ON CLICK OF ONE OF THESE BOARDS DISPALYED ON THE SCREEN
//go to the database and get the id of the board and redirect to /+id
app.get('/api/getOneBoard', function (req, res) {
  var user = req.session.user; //email add
  Board.boardModel.findOne({user:user})
  .then(function (user) {
    var boardId = user.id;
    res.redirect('/'+ boardId);
  })
  .catch(function (err) {
    res.status(500).json({message:'Board Not Found'});
  });
});
  

//ON SAVE
app.post('/api/save', function (req, res) {
  //take the name saved with it and get the user details from the session and save the new board
  var newBoardName = req.body.name;
  var user = req.session.user;
  Board.boardModel.findOne({ userEmail: user})
  .then(function (board) {
    var query = { boardName : board.boardName };
    var options = {new: true};
    return Board.boardSchema.findOneAndUpdate(query, { $set: { boardName: newBoardName }}, options);
  })
  .then(function (board) {
    res.status(200).body('Board Name Saved');
    //TRIGGER GET ON CLIENT TO UODATE LIST OF SAVED BOARDS
  })
  .catch(function (err) {
    res.status(500).json({message:'Error Saving File'});
  });
  
});


//LOGOUT


// **Start the server.**
http.listen(port, function() {
  console.log('server listening on', port, 'at', new Date());
});
