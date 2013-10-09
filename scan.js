var twitter = require('ntwitter');

var t = new twitter({
    consumer_key: process.env.t_consumer_key,
    consumer_secret: process.env.t_consumer_secret,
    access_token_key: process.env.t_access_token_key,
    access_token_secret: process.env.t_access_token_secret
});

Array.prototype.contains = function (id) {
	for (i in this) {
		if (this[i] == id) return true;
	}
	return false;
}

function stream(){
	t.stream(
		'statuses/filter',
		{
			track: process.env.symbols
		},
		function(stream) {
			var dotcount = 0;

			console.log();
			console.log("Tracking symbols '" + globals.symbols + "'.")
			process.stdout.write('Streaming...........\r');
			process.stdout.write('Streaming');

			stream.on('data', function(tweet){

				for(var i=0;i<globals.symbols.length;i++){
					var matched = globals.symbols[i];
					if(tweet.text.indexOf(matched) != -1){
						connection.query('INSERT INTO tweets (`id_str`, `handle`, `text`, `phrase`) VALUES (?, ?, ?, ?);', [tweet.id_str, tweet.user.screen_name, tweet.text, matched], function(err, results) {
							if(err){
								console.log("lol" + err);
							} else {
								if(dotcount==10){
									process.stdout.write('\rStreaming');
									dotcount=0;
								} else {
									process.stdout.write(".");
									dotcount+=1;
								}
							}
						});
					}
				}

			});
		}
	);
}

stream();