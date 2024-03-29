var testing = true;

if (testing)
{
var loungeUsers = [];
var listeningRanges = [];
var refreshIntervalId = "";
var refreshRate = 50; // milliseconds between interval related calls
var listenRange = 50;
options = {	options: {
                    debug: false
				},
			channels: [namespace.slice(1)]
};
var client = new irc.client(options);

client.connect();
client.on('chat', receiveTwitchMessage);

class Dummy {
    constructor(name)
    {
        this.twitch_username = name;
        this.x = Math.random() * lounge.width;
        this.y = Math.random() * lounge.height;
        this.color = randomColor();
        this.intervalId = "";
    }
}

function receiveTwitchMessage(channel, userstate, msg, self) {
    var dummy;
    var i;
    var username = userstate['display-name'];
    var user = getUser();
    
    // add client avatar to begin with
    if (loungeUsers.length == 0)
    {
        loungeUsers.push(user);
        manageInterval();
    }
    // check if user has spoken before
    for (i=0; i < loungeUsers.length; i++)
    {
        if (loungeUsers[i].twitch_username == username)
        {
            dummy = loungeUsers[i];
            window.clearInterval(dummy.intervalId);
        }
    }
    // instantiate new avatar if user is new, but cap it at 100 users
    if(dummy == null && loungeUsers.length < 100)
    {
        dummy = new Dummy(username);
        $("#players").append(createDummyEl(dummy));
        loungeUsers.push(dummy);
        listeningRanges = getListenObjects(loungeUsers, listenRange);
    }
    if (dummy != null)
    {
        // redundant on purpose
        var fadeTime = (msg.length/20)*1000; // Assuming people read at an average of 15 characters per second...
        var repeatMsgRate = 2000 + fadeTime;
        dummy.intervalId = setInterval(function() {
            var userIndex = loungeUsers.indexOf(dummy);
            var nearbyUserIndexes = listeningRanges[userIndex];
            for (i=0; i<nearbyUserIndexes.length; i++) {
                var nearbyUser = loungeUsers[nearbyUserIndexes[i]];
                // found the actual client avatar
                if(nearbyUser == user)
                {
                    $("#"+dummy.twitch_username).addClass('animated bounce').one('webkitAnimationEnd mozAnimationEnd MSAnimationEnd oanimationend animationend', function () {
                        $("#"+dummy.twitch_username).removeClass('animated bounce');
                    });    
                    var msgLi = $("<li><b style=\"color: "+dummy.color+"\">"+dummy.twitch_username + ": </b>" + twitchEmoji.parse((msg),{emojiSize : 'small'})+"</li>");
                    var emote = twitchEmoji.parse((msg),{emojiSize : 'small'}).match(/<img[^>]+>/);

                    // $("#"+dummy.twitch_username).empty();
                    // $("#"+dummy.twitch_username).append("<li>...</li>");
                    if (emote !== null && emote.length > 0)
                    {
                        var curEmote = $("#"+dummy.twitch_username+" li");
                        if(curEmote.length > 0)
                            curEmote[0].remove();
                        var emoteAvatar = $("<li>"+emote[0]+"</li>");
                        $("#"+dummy.twitch_username).append(emoteAvatar);
                        setTimeout(function(){
                            emoteAvatar.remove();
                        }, 3000);
                    }


                    var localChatBox = $("#local-messages-history");
                    localChatBox.prepend(msgLi);
                }
            }
        }, repeatMsgRate);
        



    }
}
    
function produceSpeech()
    {
    }

// Zoom is a global, is taken from clientSocket.js
function createDummyEl(dummy) { // Element appended when a new player enters
    return $("<div id=\'"+dummy.twitch_username+"\' class=\'player\' data-x=\'"+dummy.x+"\' data-y=\'"+dummy.y+"\' style=\'left:"+ (dummy.x*zoom) +"px; top:"+ (dummy.y*zoom) +"px; background-color: "+dummy.color+"\'><ul class=\'localmsgs\'></ul></div>");
}

function getPublicPlayersInfo() {
    return loungeUsers.map(function(user) { return user.siojsonify(); });
}

function manageInterval() { // Sets up or turns off the interval, which is hooked up to certain events
    if (loungeUsers.length === 1) { // Start it up when 1st user enters
        refreshIntervalId = setInterval(function() {
            // Recalculate listening ranges of users
            listeningRanges = getListenObjects(loungeUsers, listenRange);
        }, refreshRate);
    }
    if (loungeUsers.length === 0) { // Turn it off when last user leaves
        clearInterval(refreshIntervalId);
    }
}

// Returns an array of arrays, with each array containing which user indexes that user
// is in range of
getListenObjects = function(users, listenRange) {
    var sortedUsers = [];

    //Initializes our final return, augments the coordinates with their actual positions
    var listenDict = [];
    for (var i = 0; i < users.length; i++) 
    {
        listenDict.push([]);
        users[i].idx = i;
        sortedUsers.push(users[i]);
    }

    sortedUsers = sortedUsers.sort(function(c1, c2){return c1.x - c2.x})
    sortedUsers = getXOverlap(sortedUsers, listenRange);

    sortedUsers = sortedUsers.sort(function(c1, c2){return c1.y - c2.y})
    sortedUsers = getYOverlap(sortedUsers, listenRange);
    for (var i = 0; i < sortedUsers.length-1; i++) 
    {
        for(var j = i+1; j < sortedUsers.length;j++)
        {
            coord1 = sortedUsers[i];
            coord2 = sortedUsers[j];

            if(coord2.x <= coord1.x  + listenRange)
            {
                listenDict[coord1.idx].push(coord2.idx);
                listenDict[coord2.idx].push(coord1.idx);
            }
            else
                break;
        }
    }

    for (var i = 0; i < listenDict.length; i++) 
    {
        listenDict[i] = Array.from(new Set(listenDict[i]))
    }
    return listenDict
}

function getXOverlap(users, listenRange)
{
    var filteredCoord = []

    for (var i = 0; i < users.length-1; i++) 
    {
        for(var j = i+1; j < users.length;j++)
        {
            coord1 = users[i];
            coord2 = users[j];

            if(coord2.x <= coord1.x  + listenRange)
            {
                filteredCoord.push(coord1);
                filteredCoord.push(coord2);
            }
            else
                break;
        }
    }
    filteredCoord = Array.from(new Set(filteredCoord))

    return filteredCoord
}

function getYOverlap(users, listenRange)
{
    var filteredCoord = []

    for (var i = 0; i < users.length-1; i++) 
    {
        for(var j = i+1; j < users.length;j++)
        {
            coord1 = users[i];
            coord2 = users[j];

            if(coord2.y <= coord1.y  + listenRange)
            {
                filteredCoord.push(coord1);
                filteredCoord.push(coord2);
            }
            else
                break;
        }
    }
    filteredCoord = Array.from(new Set(filteredCoord))

    return filteredCoord
}
}