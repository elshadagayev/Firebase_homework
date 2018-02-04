var config = {
	apiKey: "AIzaSyDFCodN_mYQaMPiOTZPy0Iaqs5tfWV_ybY",
	authDomain: "ucb-demo.firebaseapp.com",
	databaseURL: "https://ucb-demo.firebaseio.com",
	projectId: "ucb-demo",
	storageBucket: "ucb-demo.appspot.com",
	messagingSenderId: "1028331503634"
};

firebase.initializeApp(config);

// users - id, name
// game - id, user1, user2, user1_wins, user2_wins

var database = firebase.database();

var usersRef = database.ref('users');
var gamesRef = database.ref('games');
var chatsRef = database.ref('chats');

var Game = function () {
	var instance = this;
	var gameStarted = false;
	var gameEnd = false;
	var winner = '';
	var chatIndex = 0;

	this.start = function(){
		var userId = $.cookie('player1');
		if(userId) {
			continueSession();
		} else {
			$('#name_btn').on('click', startSession);
		}

		gamesRef.on('value', function(snapshot){
			var games = snapshot.val();
			var gameId = $.cookie('gameid');

			if(games[gameId] && games[gameId].sessionEnd) {
				$.cookie('gameid', '');
				$.cookie('player1', '');
				$.cookie('player2', '');
				gameStarted = false;
				gameEnd = false;
				$('.ask-name').show();
				$('#player2_name').text('Waiting For Player 2');
				instance.start();
			}
		});

		$('#chat_btn').on('click', startChat);
		$('.end-session').on('click', function(){
			var gameId = $.cookie('gameid');
			if(!gameId)
				return;

			database.ref('games/' + gameId).once('value', function(snapshot){
				var game = snapshot.val();
				game.sessionEnd = true;
				database.ref('games/' + gameId).update(game);
			});
		});
		updateChat();

		$('#box1').html($('<h2>').text('Waiting For Player 1'));
		$('#player2_name').text('Waiting For Player 2');
		$('#player2_choise').empty();
	}

	function updateChat () {
		var gameId = $.cookie('gameid');
		database.ref('chats/' + gameId).once('value', function(snapshot){
			var chats = snapshot.val();

			if(!chats)
				return;

			for(var i in chats) {
				if(i < chatIndex)
					continue;

				var chat = chats[i];

				database.ref('users/' + chat.player).once('value', function(snapshot){
					var user = snapshot.val();
					if(!user)
						return;
					var div = $('<div>');
					div.append($('<strong>').text(user.name + ': '));
					div.append($('<span>').text(chat.text));
					$('.chat-window').prepend(div);
				});

				chatIndex = i+1;

				break;
			}
		});

		setTimeout(updateChat, 1000);
	}

	function startChat () {
		if(!gameStarted || gameEnd)
			return;

		var gameId = $.cookie('gameid');
		var player1 = $.cookie('player1');
		var player2 = $.cookie('player2');

		var text = $('#chat_inp').val();

		database.ref('chats/' + gameId).once('value', function(snapshot){
			var chat = snapshot.val();
			if(!chat) {
				chat = [];
			}

			chat.push({
				player: player1,
				text
			});

			database.ref('chats/' + gameId).set(chat);
		});

		$('#chat_inp').val('');
	}

	function startSession () {
		var name = $('#name_inp').val().trim();
		if(!name) {
			alert("Type your name");
			return;
		}

		registerUser(name);
	}

	function registerUser(name) {
		var user = usersRef.push({
			name: name
		});

		user.then(function(snapshot){
			$.cookie('player1', snapshot.key);
			$('#name_inp').val('');
			continueSession();
		});
	}

	function isGameEnded () {
		var gameId = $.cookie('gameid');
		var player1 = $.cookie('player1');
		var player2 = $.cookie('player2');

		database.ref('games/' + gameId).once('value', function(snapshot){
			var game = snapshot.val();
			var user1Variant = game.user1Variant;
			var user2Variant = game.user2Variant;


			if(user1Variant == 'scissors' && user2Variant == 'rock') {
				// user2 wins
				winner = 'user2';
				gameEnd = true;

				database.ref('users/' + game.user2).once('value', function(snapshot){
					var user = snapshot.val();
					$('#box2').html($('<h1>').text(user.name + ' Won!'));
				});
			}
			else if(user1Variant == 'rock' && user2Variant == 'scissors') {
				// user1 wins
				winner = 'user1';
				gameEnd = true;

				database.ref('users/' + game.user1).once('value', function(snapshot){
					var user = snapshot.val();
					$('#box2').html($('<h1>').text(user.name + ' Won!'));
				});
			}
			else if(user1Variant == 'scissors' && user2Variant == 'paper') {
				// user1 wins
				winner = 'user1';
				gameEnd = true;

				database.ref('users/' + game.user1).once('value', function(snapshot){
					var user = snapshot.val();
					$('#box2').html($('<h1>').text(user.name + ' Won!'));
				});
			}
			else if(user1Variant == 'paper' && user2Variant == 'scissors') {
				// user2 wins
				winner = 'user2';
				gameEnd = true;

				database.ref('users/' + game.user2).once('value', function(snapshot){
					var user = snapshot.val();
					$('#box2').html($('<h1>').text(user.name + ' Won!'));
				});
			}
			else if(user1Variant == 'paper' && user2Variant == 'rock') {
				// user1 wins
				winner = 'user1';
				gameEnd = true;

				database.ref('users/' + game.user1).once('value', function(snapshot){
					var user = snapshot.val();
					$('#box2').html($('<h1>').text(user.name + ' Won!'));
				});
			}
			else if(user1Variant == 'rock' && user2Variant == 'paper') {
				// user2 wins
				winner = 'user2';
				gameEnd = true;

				database.ref('users/' + game.user2).once('value', function(snapshot){
					var user = snapshot.val();
					$('#box2').html($('<h1>').text(user.name + ' Won!'));
				});
			} else if(user1Variant === user2Variant && user1Variant && user2Variant) {
				gameEnd = true;
				winner = '';

				$('#box2').html($('<h1>').text('There is no winner'));
			}

			if(game.user1Variant && game.user1 === player1) {
				$('.variant').hide();
				$('.variant').each(function(ind,el){
					if($(el).html().trim().toLowerCase() === game.user1Variant) {
						$(el).show().css({
							fontSize: '4em'
						});
					}
				});
			} else if(game.user2Variant && game.user2 === player1) {
				$('.variant').hide();
				$('.variant').each(function(ind,el){
					if($(el).html().trim().toLowerCase() === game.user2Variant) {
						$(el).show().css({
							fontSize: '4em'
						});
					}
				});
			}

			if(gameEnd) {
				if(game.user1Variant && game.user1 === player2) {
					$('#player2_choise').text(user1Variant);
				} else if(game.user2Variant && game.user2 === player2) {
					$('#player2_choise').text(user2Variant);
				}
				database.ref('games/' + gameId).update(game);
			}
		});
	}

	function resetGame () {
		var gameId = $.cookie('gameid');
		var player1 = $.cookie('player1');
		var player2 = $.cookie('player2');

		$('#box2').empty();
		$('.variant').css({
			fontSize: '2em'
		}).show();

		$('#player2_choise').empty();

		database.ref('games/' + gameId).once('value', function(snapshot){
			var game = snapshot.val();
			switch(winner) {
				case 'user1':
					game.user1Wins = game.user1Wins ? game.user1Wins + 1 : 1;
					break;
				case 'user2':
					game.user2Wins = game.user2Wins ? game.user2Wins + 1 : 1;
					break;
				default:
					winner = '';
			}

			game.user1Variant = null;
			game.user2Variant = null;
			gameEnd = false;
			gameStarted = true;
			database.ref('games/' + gameId).update(game);
			continueSession();
		});
	}

	function continueSession () {
		$('.ask-name').hide();
		var userId = $.cookie('player1');
		var player2 = $.cookie('player2');
		var gameId = $.cookie('gameid');

		// player1
		usersRef.child(userId).once('value', function(snapshot) {
			if(!snapshot.val())
				return;

			setUser(snapshot.val().name, '#box1', true);
		
			// search empty room or create new room
			if(!gameStarted && !gameId) {
				gamesRef.once('value', function(snapshot){
					var games = snapshot.val();

					for(var id in games) {
						var game = games[id];
						// if game was not started and if user1 is not equal to current user and user2 is empty then join to that room
						if(!game.sessionEnd && game.user1 && game.user1 !== userId && !game.user2 && !gameStarted) {
							game.user2 = userId;
							database.ref('games/' + id).update(game);
							gameStarted = true;
							$.cookie('gameid', id);
						} else if(!game.sessionEnd && game.user2 && game.user2 !== userId && !game.user1 && !gameStarted) {
							game.user1 = userId;
							database.ref('games/' + id).update(game);
							gameStarted = true;
							$.cookie('gameid', id);
						}
					}

					if(!gameStarted) {
						var game = gamesRef.push({
							user1: userId
						});
						gameStarted = true;
						game.then(function(snapshot){
							$.cookie('gameid', snapshot.key);
						});
					}
				});
			} else {
				gameStarted = true;
			}
		});

		if(!gameStarted)
			setTimeout(continueSession, 1000);
		else
			updateGame();
	}

	function updateGame () {

		var gameId = $.cookie('gameid');
		var player1 = $.cookie('player1');
		var player2 = $.cookie('player2');

		// get player2
		if(!player2) {
			database.ref('games/' + gameId).once('value', function(snapshot){
				var game = snapshot.val();
				var player2 = game.user1 === player1 ? game.user2 : game.user1;
				if(player2) {
					database.ref('users/' + player2).once('value', function(snapshot){
						var user = snapshot.val();
						$('#player2_name').text(user.name);
						$.cookie('player2', snapshot.key);
					});
				}
			});
		} else {
			database.ref('users/' + player2).once('value', function(snapshot){
				var user = snapshot.val();
				$('#player2_name').text(user.name);
			})
		}

		isGameEnded();

		if(gameEnd) {
			setTimeout(resetGame, 3000);
			return;
		}

		if(!gameEnd)
			setTimeout(updateGame, 1000);
	}

	function setUser(name, id, player1) {
		$(id).html($('<h2>').text(name));

		if(!player1)
			return;

		var rock = $('<h3 class="variant">').text('rock');
		var paper = $('<h3 class="variant">').text('paper');
		var scissors = $('<h3 class="variant">').text('scissors');

		$(id).append(rock);
		$(id).append(paper);
		$(id).append(scissors);

		rock.dblclick(resizeSelectedVariant);
		paper.dblclick(resizeSelectedVariant);
		scissors.dblclick(resizeSelectedVariant);

		function resizeSelectedVariant () {
			$(id).find('.variant').hide();
			$(this).show().css({
				fontSize: '4em'
			});

			var variant = $(this).html().trim().toLowerCase();

			// sending selected variant to database
			var gameId = $.cookie('gameid');
			var player1 = $.cookie('player1');
			database.ref('games/' + gameId).once('value', function(snapshot){
				var game = snapshot.val();
				if(game.user1 === player1) {
					game.user1Variant = variant;					
				} else if(game.user2 === player1) {
					game.user2Variant = variant;
				}

				database.ref('games/' + gameId).update(game);
			});
		}
	}

}

var game = new Game();
game.start();