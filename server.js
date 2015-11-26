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
  cookie: { maxAge: 679000000 }
}));


// **Static folder for serving application assets**
app.use('/', express.static(__dirname + '/public'));

// **Static folder for serving documentation**
app.use('/documentation', express.static(__dirname + '/docs'));

// ## Routes
var id = utils.createId();
console.log(typeof id);

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
  console.log('IN NEW BOARD');
  var id = utils.createId();
  console.log('ID----------',id);
  req.session.id = id;

  var board = new Board.boardModel({
    id: id,
    boardName: 'null',
    userEmail: req.session.user,
    users: 0,
    strokes: []
  });
  board.save()
  .then(function (board) {
    console.log(id);
    res.redirect('/' + id);
  })
  .catch(function (err) {
    res.redirect('/');
  });
});

//post the users details to the database
app.post('/api/signUp', function (req, res) {
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



//check the user detials in the database
app.post('/api/login', function (req, res) {
  console.log('LOGIN');
  var email = req.body.email;
  var password = req.body.password;
  Board.userModel.findOne({email: email})
  .then(function (user) {
    if (!user) {
      res.status(400).json({message:'User does not exist'});
    } else if (password === user.password) {
      //SESSION SEND HERE
      req.session.user = user.email;
      console.log('session Last bit', req.session);
      //NNED THIS TO STAY ON THE SAME BOARD
      res.status(200).json({message:user});
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
  console.log('session', req.session.user);
  console.log('IN USERBOARDS');
  var user = req.session.user;
  Board.boardModel.find({})
  .then(function (boards) {
    var data = [];
    boards.forEach(function (board) {
      if (board.boardName !== 'null') {
        console.log('boardName CURRENT', board.boardName);
        data.push(board.boardName);
      }
    });
    console.log('all names if the saved boards',data);
    res.status(200).json({messages: data});
  });
});

//ON CLICK OF ONE OF THESE BOARDS DISPALYED ON THE SCREEN
//go to the database and get the id of the board and redirect to /+id
app.get('/api/getOneBoard', function (req, res) {
   //get the board name clicked on 
  Board.boardModel.findOne({boardName: boardName})
  .then(function (user) {
    var boardId = user.id;
    res.status(200).json({ messages: boardId });
  });
  
});
  

//ON SAVE
app.post('/api/save', function (req, res) {
  //take the name saved with it and get the user details from the session and save the new board
  // var newBoardName = req.body.name;
  var boardId = req.body.boardId;
  Board.boardModel.findOne({ id: boardId})
  .then(function (board) {
    console.log('BOARD to update---------', board);
    var query = { boardName : board.boardName };
    return Board.boardModel.update(query, { $set: { boardName: req.body.fileName }});
  })
  .then(function (board) {
    console.log('RETURNED LAST BOARD', board);
    res.status(200).json({message: board});
  });
  
});


//LOGOUT



// **Wildcard route & board id handler.**
app.get('/*', function(req, res) {
  var id = req.url.slice(1);
  Board.boardModel.findOne({id: id})
  .then(function (board) {
    board.users++;
    return  board.save();
  })
  .then(function (savedBoard) {
    console.log(savedBoard.users);
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


// **Start the server.**
http.listen(port, function() {
  console.log('server listening on', port, 'at', new Date());
});
