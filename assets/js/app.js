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

	this.start = function(){
		continueSession();
		$('#register_form').on('submit', function(e){
			e.preventDefault();

			startSession();
		});
		$('#chat_form').on('submit', function(e){
			e.preventDefault();

			startChat();
		});

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

		$('#box1').html($('<h2>').text('Waiting For Player 1'));
		$('#player2_name').text('Waiting For Player 2');
		$('#player2_choise').empty();
	}

	function updateChat () {
		var gameId = $.cookie('gameid');
		
		database.ref('chats/' + gameId).on('value', function(snapshot){
			var chats = snapshot.val();
			
			setChatWindow(chats);
		});

		function setChatWindow (chats) {
			if(!chats)
				return;

			$('.chat-window').empty();

			for(var i in chats) {

				var chat = chats[i];

				(function(chat){
					database.ref('users/' + chat.player).once('value', function(snapshot){
						var user = snapshot.val();
						if(!user)
							return;
						var div = $('<div>');
						div.append($('<strong>').text(user.name + ': '));
						div.append($('<span>').text(chat.text));
						$('.chat-window').prepend(div);
					});
				})(chat);
			}
		}
	}

	function startChat () {
		var gameId = $.cookie('gameid');
		var player1 = $.cookie('player1');
		var player2 = $.cookie('player2');

		if(!gameId || !player1 || !player2)
			return;

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

			database.ref('chats/' + gameId).update(chat);
		});

		$('#chat_inp').val('');
	}

	function startSession () {
		var name = $('#name_inp').val().trim();
		if(!name) {
			alert("Type your name");
			return;
		}

		var user = usersRef.push({
			name
		});

		user.then(function(snapshot){
			$.cookie('player1', snapshot.key);
			$('#name_inp').val('');
		});
	}

	function resetGame (player1Wins, player2Wins) {
		var gameId = $.cookie('gameid');
		var player1 = $.cookie('player1');
		var player2 = $.cookie('player2');
		gameEnd = false;
		gameStarted = true;

		$('#box2').empty();
		$('.variant').css({
			fontSize: '2em'
		}).show();

		$('#player2_choise').empty();

		database.ref('games/' + gameId).once('value', function(snapshot){
			var game = snapshot.val();
			game.user1Variant = null;
			game.user2Variant = null;
			game.user1Wins = player1Wins;
			game.user2Wins = player2Wins;
			database.ref('games/' + gameId).update(game);
		});
	}

	function updateScore (game) {
		var player1 = $.cookie('player1');
		var player2 = $.cookie('player2');
		var gameId = $.cookie('gameId');
		var score = {player1: 0, player2: 0};

		if(game.user1 === player1) {
			score.player1 = game.user1Wins;
			score.player2 = game.user2Wins;
		} else {
			score.player1 = game.user2Wins;
			score.player2 = game.user1Wins;
		}

		if(typeof score.player1 !== 'undefined' && typeof score.player2 !== 'undefined')
			$('.score').html(score.player1 + ' - ' + score.player2);
	}

	function endSession () {
		$.cookie('gameid', '');
		$.cookie('player1', '');
		$.cookie('player2', '');
		gameStarted = false;
		gameEnd = false;
		$('#box1').html('<h2>Waiting For Player 1</h2>');
		$('#player2_name').html('Waiting For Player 2');
		$('#player2_choise').empty();
		$('.score').empty();
		$('.chat-window').empty();
		$('.ask-name').show();
	}

	function continueSession () {

		gamesRef.on('value', function(snapshot){
			setTimeout(function(){
				var games = snapshot.val();
				var gameId = $.cookie('gameid');
				var player1 = $.cookie('player1');
				var player2 = $.cookie('player2');

				if(!gameId || !games || !games[gameId]) {
					return;
				}

				updateChat();

				var game = games[gameId];

				if(game.sessionEnd) {
					endSession();
					return;
				}

				if(game.user1 && game.user2 && !$.cookie('player2')) {
					if(game.user1 === player1) {
						player2 = game.user2;
					} else {
						player2 = game.user1;
					}

					if(player2) {
						$.cookie('player2', player2);
						database.ref('users/' + player2).once('value', function(snapshot){
							var user = snapshot.val();
							$('#player2_name').text(user.name);
						});
					}
				} else if(game.user1 && game.user2) {
					var user1Variant = game.user1Variant;
					var user2Variant = game.user2Variant;
					var player1Wins = game.user1Wins || 0;
					var player2Wins = game.user2Wins || 0;

					updateScore(game);

					setTimeout(function(){
						if(game.user1 === player1 && user1Variant) {
							$('.variant').hide();
							$('.variant').each(function(ind,el){
								if($(el).html() === user1Variant) {
									$(el).css({
										fontSize: '4em'
									}).show();
								}
							})
						} else if(game.user2 === player1 && user2Variant) {
							$('.variant').hide();
							$('.variant').each(function(ind,el){
								if($(el).html() === user2Variant) {
									$(el).css({
										fontSize: '4em'
									}).show();
								}
							})
						}
					}, 0);

					database.ref('users/' + player2).once('value', function(snapshot){
						var user = snapshot.val();
						$('#player2_name').text(user.name);
					});


					if(user1Variant == 'scissors' && user2Variant == 'rock') {
						// user2 wins
						winner = 'user2';
						gameEnd = true;
						player2Wins++;

						database.ref('users/' + game.user2).once('value', function(snapshot){
							var user = snapshot.val();
							$('#box2').html($('<h1>').text(user.name + ' Wins!'));
						});
					}
					else if(user1Variant == 'rock' && user2Variant == 'scissors') {
						// user1 wins
						winner = 'user1';
						gameEnd = true;
						player1Wins++;

						database.ref('users/' + game.user1).once('value', function(snapshot){
							var user = snapshot.val();
							$('#box2').html($('<h1>').text(user.name + ' Wins!'));
						});
					}
					else if(user1Variant == 'scissors' && user2Variant == 'paper') {
						// user1 wins
						winner = 'user1';
						gameEnd = true;
						player1Wins++;

						database.ref('users/' + game.user1).once('value', function(snapshot){
							var user = snapshot.val();
							$('#box2').html($('<h1>').text(user.name + ' Wins!'));
						});
					}
					else if(user1Variant == 'paper' && user2Variant == 'scissors') {
						// user2 wins
						winner = 'user2';
						gameEnd = true;
						player2Wins++;

						database.ref('users/' + game.user2).once('value', function(snapshot){
							var user = snapshot.val();
							$('#box2').html($('<h1>').text(user.name + ' Wins!'));
						});
					}
					else if(user1Variant == 'paper' && user2Variant == 'rock') {
						// user1 wins
						winner = 'user1';
						gameEnd = true;
						player1Wins++;

						database.ref('users/' + game.user1).once('value', function(snapshot){
							var user = snapshot.val();
							$('#box2').html($('<h1>').text(user.name + ' Wins!'));
						});
					}
					else if(user1Variant == 'rock' && user2Variant == 'paper') {
						// user2 wins
						winner = 'user2';
						gameEnd = true;
						player2Wins++;

						database.ref('users/' + game.user2).once('value', function(snapshot){
							var user = snapshot.val();
							$('#box2').html($('<h1>').text(user.name + ' Wins!'));
						});
					} else if(user1Variant === user2Variant && user1Variant && user2Variant) {
						gameEnd = true;
						winner = '';

						$('#box2').html($('<h1>').text('There is no winner'));
					}

					if(gameEnd) {
						if(game.user1Variant && game.user1 === player2) {
							$('#player2_choise').text(user1Variant);
						} else if(game.user2Variant && game.user2 === player2) {
							$('#player2_choise').text(user2Variant);
						}

						setTimeout(function(){
							resetGame(player1Wins, player2Wins);
						}, 3000);
					}
				}
			}, 500);
		});

		usersRef.on('value', function(snapshot){

			setTimeout(function(){
				var users = snapshot.val();
				var player1 = $.cookie('player1');
				var player2 = $.cookie('player2');
				var gameId = $.cookie('gameid');

				if(!player1 || !users[player1])
					return;

				$('.ask-name').hide();

				setUser(users[player1].name, '#box1', true);

				gamesRef.once('value', function(snapshot){
					var games = snapshot.val();

					if(games) {
						for(var id in games) {
							var game = games[id];
							if(!game.sessionEnd && (game.user1 === player1 || game.user2 === player2)) {
								//game.user2 = player1;
								//database.ref('games/' + id).update(game);
								//gameStarted = true;
								$.cookie('gameid', id);
							}
						}

						if(!$.cookie('gameid')) {
							for(var id in games) {
								var game = games[id];
								if(!game.sessionEnd && game.user2 && game.user2 !== player1 && !game.user1) {
									game.user1 = player1;
									database.ref('games/' + id).update(game);
									//gameStarted = true;
									$.cookie('gameid', id);
								} else if(!game.sessionEnd && game.user1 && game.user1 !== player1 && !game.user2) {
									game.user2 = player1;
									database.ref('games/' + id).update(game);
									//gameStarted = true;
									$.cookie('gameid', id);
								}
							}
						}

						if(!$.cookie('gameid')) {
							var game = gamesRef.push({
								user1: player1
							});
							game.then(function(snapshot){
								$.cookie('gameid', snapshot.key);
							});
						}
					} else {
						var game = gamesRef.push({
							user1: player1
						});
						game.then(function(snapshot){
							$.cookie('gameid', snapshot.key);
						});
					}
				});

			}, 500);
		})
		

		/*if(!gameStarted)
			setTimeout(continueSession, 1000);
		else
			updateGame();*/
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