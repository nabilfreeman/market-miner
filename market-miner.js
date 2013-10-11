var twitter = require('ntwitter'), mysql = require('mysql');

var t = new twitter({
    consumer_key: process.env.t_consumer_key,
    consumer_secret: process.env.t_consumer_secret,
    access_token_key: process.env.t_access_token_key,
    access_token_secret: process.env.t_access_token_secret
});

var connection = mysql.createConnection({
  host       : process.env.db_host,
  user       : process.env.db_user,
  password   : process.env.db_password,
  database   : process.env.db_database
});

var symbols = process.env.symbols.split(",");

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
			track: symbols
		},
		function(stream) {
			console.log();
			console.log("Tracking symbols " + symbols + ".")
			console.log('Streaming...........');

			stream.on('data', function(tweet){
				//TODO SERIOUSLY...
				//What if a tweet has multiple symbols matched? It will attempt to store the same tweet multiple times, but only the first will succeed due to unique id. Solutions?
				//1) Store the tweet twice with a different "symbol" value. This is highly inefficient.
				//2) A second table where a tweet's ID is set up against multiple symbols? Seems cooler, but harder.
				for(var i=0;i<symbols.length;i++){
					var matched = symbols[i];
					if(tweet.text.indexOf(matched) != -1){
						var lat = null, lng = null, place = null;

						if(tweet.coordinates != null){
							lat = tweet.coordinates.coordinates[0];
							lng = tweet.coordinates.coordinates[1];
						}

						if(tweet.place != null){
							place = tweet.place.full_name;
						}

						connection.query(
							'INSERT INTO tweets (`tweet_id`, `text`, `created_at`, `geo_lat`, `geo_long`, `user_id`, `screen_name`, `name`, `profile_image_url`, `retweet_count`, `retweeted`, `place`, `symbol`) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);',
							[
								tweet.id_str,
								tweet.text,
								(Date.parse(tweet.created_at)/1000),
								lat,
								lng,
								tweet.user.id_str,
								tweet.user.screen_name,
								tweet.user.name,
								tweet.user.profile_image_url,
								tweet.retweet_count,
								tweet.retweeted,
								place,
								matched
							],
							function(err, results) {
								if(err){
									console.log("ERROR: " + err);
								} else {
									console.log("Stored a tweet.");
								}
							}
						);
					}
				}

			});
		}
	);
}

connection.connect(function(e){
	if(e != null){
		process.exit(1);
	} else {
		stream();
	}
});