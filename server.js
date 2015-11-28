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
  saveUninitialized: true,
  cookie: { maxAge: 67967000000 }
}));

// **Static folder for serving application assets**
app.use('/', express.static(__dirname + '/public'));

// **Static folder for serving documentation**
app.use('/documentation', express.static(__dirname + '/docs'));

app.use(function (req, res, next) {
  console.log('LOGGING MIDDLEWARE',req.session);
  next();
});

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

  return board.save()
  .then(function (board) {

    console.log(id);
    return res.redirect('/' + id);

  })
  .catch(function (err) {

    return res.redirect('/');

  });
});


//post the users details to the database
app.post('/api/signUp', function (req, res) {
  var email = req.body.email;
  var password = req.body.password;
  utils.encryptPassword(password)
  .then(function(data) {

    var user = new Board.userModel({
      email: email,
      password: data
    });
    return user.save();

  })
  .then(function (user) {
    //send the response to the /new route
    req.session.user = user.email;
    return res.redirect('/new');

  })
  .catch(function (err) {

    console.log(err);
    return res.status(500).send();

  });
});



//check the user detials in the database
app.post('/api/login', function (req, res) {
  var email = req.body.email;
  var password = req.body.password;
  var u;
  Board.userModel.findOne({email: email})
  .then(function (user) {
    if (!user) {
      //so this does not move to the next then, rather the next catch block
      throw new Error('User does not exist');
    } else {
      u = user;
      return utils.decrypt(user.password, password);
    }
  })
  .then(function (boolean) {
    if (boolean) {
      console.log('correct password');
      req.session.user = u.email;
      return res.status(200).json({message: boolean});
    } else {
      console.log('Incorrect Password');
      return res.status(401).json({message:'Incorrect Password'});
    }
  })
  .catch(function (err) {
    if(err.message === 'User does not exist'){
      return res.status(400).json({message:'User does not exist'});
    } else {
      console.log(err);
      res.status(500).send();
    }
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
app.delete('/api/logout', function (req, res) {

  console.log('SESSION DETAILs',req.session);
  // delete req.session;
  req.session.destroy(function() {
    res.status(200).json({message: "Session deleted"});
  });

});



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
