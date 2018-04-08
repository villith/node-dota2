var steam = require("steam"),
    util = require("util"),
    fs = require("fs"),
    crypto = require("crypto"),
    dota2 = require("./"),
    api = require('./api'),
    players = require('./players.json').players,
    steamClient = new steam.SteamClient(),
    steamUser = new steam.SteamUser(steamClient),
    steamFriends = new steam.SteamFriends(steamClient),
    Dota2 = new dota2.Dota2Client(steamClient, true);

global.config = require("./config");

var onSteamLogOn = function onSteamLogOn(logonResp) {
    if (logonResp.eresult == steam.EResult.OK) {
        steamFriends.setPersonaState(steam.EPersonaState.Online);
        steamFriends.setPersonaName(global.config.steam_name);
        util.log("Logged on.");

        Dota2.launch();
        Dota2.on("ready", function () {
            util.log("Node-dota2 ready.");

            let liveGames = [];
            // set to 1 to only get zack
            for (let i = 0; i < 1; i += 1) {
                let player = players[i];
                let steamId = player.steam64;
                Dota2.spectateFriendGame(steamId, function (steam_id, data) {
                    util.log(JSON.stringify(data));
                });
            }
        });

        Dota2.on("unready", function onUnready() {
            util.log("Node-dota2 unready.");
        });

        Dota2.on("chatMessage", function (channel, personaName, message) {
            util.log("[" + channel + "] " + personaName + ": " + message);
        });

        Dota2.on("unhandled", function (kMsg) {
            util.log("UNHANDLED MESSAGE " + dota2._getMessageName(kMsg));
        });
    }
},
    onSteamServers = function onSteamServers(servers) {
        util.log("Received servers.");
        fs.writeFile('servers', JSON.stringify(servers), (err) => {
            if (err) { if (this.debug) util.log("Error writing "); }
            else { if (this.debug) util.log(""); }
        });
    },
    onSteamLogOff = function onSteamLogOff(eresult) {
        util.log("Logged off from Steam.");
    },
    onSteamError = function onSteamError(error) {
        util.log("Connection closed by server.");
    };

steamUser.on('updateMachineAuth', function (sentry, callback) {
    var hashedSentry = crypto.createHash('sha1').update(sentry.bytes).digest();
    fs.writeFileSync('sentry', hashedSentry)
    util.log("sentryfile saved");

    callback({ sha_file: hashedSentry });
});

var logOnDetails = {
    "account_name": global.config.steam_user,
    "password": global.config.steam_pass,
};
if (global.config.steam_guard_code) logOnDetails.auth_code = global.config.steam_guard_code;
if (global.config.two_factor_code) logOnDetails.two_factor_code = global.config.two_factor_code;

try {
    var sentry = fs.readFileSync('sentry');
    if (sentry.length) logOnDetails.sha_sentryfile = sentry;
}
catch (beef) {
    util.log("Cannot load the sentry. " + beef);
}

steamClient.connect();

steamClient.on('connected', function () {
    steamUser.logOn(logOnDetails);
});

steamClient.on('logOnResponse', onSteamLogOn);
steamClient.on('loggedOff', onSteamLogOff);
steamClient.on('error', onSteamError);
steamClient.on('servers', onSteamServers);
