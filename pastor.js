/**
 * Pastor Bot 2.0
 *
 * @Dependencies: irc, underscore
 *
 * @Author: Jim Rastlerton
 * 
 * Uses the talkativeness from dikkv
 */
var config = require('./config'),
    functions = require('./functions'),
    irc = require('irc'),
    _ = require('underscore');

var client = new irc.Client(config.server, config.nick, config.connection);

config.connection.channels.forEach(function(chan) {
  functions.cache.chans[chan] = functions.chanInit();
});

/**
 *  client event bindings
 */
client.addListener('error', function(msg) {
  console.error('Error: %s: %s', msg.command, msg.args.join(' '));
});

client.addListener('message', function(from, to, message) {
  
  // Only if the message was to a channel
  if (to.match(/^#/)) {
    var chanObj = functions.cache.chans[to];
    
    // Increase the talky level
    if (chanObj.talky < chanObj.talkyMax) {
      chanObj.talky++;
    }
    
    // if the same person is talking, dont add levels
    if (from == chanObj.lastSpeaker) {
      if (chanObj.talky > chanObj.talkyMin) {
        chanObj.talky--;
      }
      //chanObj.level--;
    }
    chanObj.lastSpeaker = from;
    
    // TODO: if someone said our nick, increase chance of saying something
    var reg = new RegExp(config.nick, "gi");
    if (message.match(reg)) {
      chanObj.level += 8;
    }
    
    // Pastor gets more/less talkative with the chan
    chanObj.level += chanObj.talky;
    console.log("%s talky:  %d", to, chanObj.talky);
    console.log("%s level: %d", to, chanObj.level);
    
    while (chanObj.level > chanObj.threshold) {
      
      var toSay = functions.saySomething(to);
      
      if (toSay.match(/^\/me/gi)) {
        toSay = toSay.slice(4);
        client.action(to, toSay);
      }
      else {
        client.say(to, toSay);
      }
      
      chanObj.level -= 10;
    }
    
  }
});

client.addListener('names', function(chan, nicks) {
  for (var a in nicks) {
    if (a !== config.nick) { 
      functions.cache.chans[chan].users.push(a);
    }
  }
});

client.addListener('pm', function(nick, message) {
  var com = functions.parseCommand(message);
  
  if (com) {
    
    // Anyone can spread the Word of the Lord
    if (com.command == 'preach') {
      if (com.params[0]) {
        //preach(com.params[0]);
      }
      else {
        client.say(nick, '!preach #channel');
      }
    }
    
    // If the pm was from one of our masters
    if (config.masters.indexOf(nick) !== -1) {
      
      var channel;
      
      /**
       * Join Channel
       */
      if (com.command == 'join') {
        channel = com.params[0];
        client.join(channel);
      }
      
      /**
       * Part Channel
       */
      if (com.command == 'part') {
        channel = com.params[0];
        com.params.shift();
        var msg = com.params.join(" ");
        client.part(channel, msg);
      }
      
      /**
       * Say Channel/To
       */
      if (com.command == 'say') {
        var to = com.params[0];
        com.params.shift();
        client.say(to, com.params.join(' '));
      }
      
      /**
       * Emote Channel
       */
      if (com.command == 'emote') {
        channel = com.params[0];
        com.params.shift();
        client.action(channel, com.params.join(" "));
      }
      
      /**
       * Get All Settings for a chan
       */
      if (com.command == 'settings') {
        channel = com.params[0];
        com.params.shift();
        
        if (channel && channel.match(/^#/i) && functions.cache.chans[channel]) {
          client.say(nick, '-- Settings '+channel);
          var current =  '**Current Level: '+functions.cache.chans[channel].level+'\n'+'**Current Talky: '+functions.cache.chans[channel].talky,
              stats = '  minLevel: '+functions.cache.chans[channel].minLevel+'\n'+'  maxLevel: '+functions.cache.chans[channel].maxLevel+'\n';
          
          stats += '  talkyMin: '+functions.cache.chans[channel].talkyMin+'\n';
          stats += '  talkyMax: '+functions.cache.chans[channel].talkyMax+'\n';
          stats += '  threshold: '+functions.cache.chans[channel].threshold;
          
          client.say(nick, current);
          client.say(nick, stats);
        }
        else {
          client.say(nick, '!settings #channel');
        }
      }
      
      /**
       * Get/Set Chan minLevel
       */
      if (com.command == 'minLevel') {
        channel = com.params[0];
        com.params.shift();
        
        if (channel && channel.match(/^#/i) && functions.cache.chans[channel]) {
          if (com.params.length > 0 && com.params[0] !== "") {
            functions.cache.chans[channel].minLevel = com.params[0];
            client.say(nick, 'Setting the minLevel on '+channel+' to '+com.params[0]);
          }
          else {
            client.say(nick, 'Current minLevel on '+channel+' is '+functions.cache.chans[channel].minLevel);
          }
        }
        else {
          client.say(nick, '!minLevel #channel [value]');
        }
      }
      
      /**
       * Get/Set Chan maxLevel
       */
      if (com.command == 'maxLevel') {
        channel = com.params[0];
        com.params.shift();
        
        if (channel && channel.match(/^#/i) && functions.cache.chans[channel]) {
          if (com.params.length > 0 && com.params[0] !== "") {
            functions.cache.chans[channel].maxLevel = com.params[0];
            client.say(nick, 'Setting the maxLevel on '+channel+' to '+com.params[0]);
          }
          else {
            client.say(nick, 'Current maxLevel on '+channel+' is '+functions.cache.chans[channel].maxLevel);
          }
        }
        else {
          client.say(nick, '!maxLevel #channel [value]');
        }
      }
      
      /**
       * Get/Set Chan level
       */
      if (com.command == 'level') {
        channel = com.params[0];
        com.params.shift();
        
        if (channel && channel.match(/^#/i) && functions.cache.chans[channel]) {
          if (com.params.length > 0 && com.params[0] !== "") {
            // set the channels level
            functions.cache.chans[channel].level = com.params[0];
            if (functions.cache.chans[channel].level < functions.cache.chans[channel].minLevel) {
              functions.cache.chans[channel].level = functions.cache.chans[channel].minLevel;
              client.say(nick, 'Setting '+channel+'\'s level to '+functions.cache.chans[channel].minLevel+' instead of the value specified because it is smaller than the minLevel for this channel.');
            }
            else if (functions.cache.chans[channel].level > functions.cache.chans[channel].maxLevel) {
              functions.cache.chans[channel].level = functions.chans[channel].maxLevel - 1;
              client.say(nick, 'Setting '+channel+'\'s level to '+functions.cache.chans[channel].maxLevel-1+' instead of the value specified because it is greater than the maxLevel for this channel.');
            }
            else {
              client.say(nick, 'Set channel level on '+channel+' to:   '+com.params[0]);
            }
          }
          else {
            // display channels level
            client.say(nick, 'Current channel level for '+channel+' is:    '+functions.cache.chans[channel].level);
          }
        }
        else {
          client.say(nick, '!level #channel [value]');
        }
      }
      
      /**
       * Get/Set Chan talkyMin
       */
      if (com.command == 'talkyMin') {
        channel = com.params[0];
        com.params.shift();
        
        if (channel && channel.match(/^#/i) && functions.cache.chans[channel]) {
          if (com.params.length > 0 && com.params[0] !== "") {
            functions.cache.chans[channel].talkyMin = com.params[0];
            client.say(nick, 'Setting the talkyMin on '+channel+' to '+com.params[0]);
          }
          else {
            client.say(nick, 'Current talkyMin on '+channel+' is '+functions.cache.chans[channel].talkyMin);
          }
        }
        else {
          client.say(nick, '!talkyMin #channel [value]');
        }
      }
      
      /**
       * Get/Set Chan talkyMax
       */
      if (com.command == 'talkyMax') {
        channel = com.params[0];
        com.params.shift();
        
        if (channel && channel.match(/^#/i) && functions.cache.chans[channel]) {
          if (com.params.length > 0 && com.params[0] !== "") {
            functions.cache.chans[channel].talkyMax = com.params[0];
            client.say(nick, 'Setting the talkyMax on '+channel+' to '+com.params[0]);
          }
          else {
            client.say(nick, 'Current talkyMax on '+channel+' is '+functions.cache.chans[channel].talkyMax);
          }
        }
        else {
          client.say(nick, '!talkyMax #channel [value]');
        }
      }
      
      /**
       * Get/Set Chan talky
       */
      if (com.command == 'talky') {
        channel = com.params[0];
        com.params.shift();
        
        if (channel && channel.match(/^#/i) && functions.cache.chans[channel]) {
          if (com.params.length > 0) {
            // set channels talky
            functions.cache.chans[channel].talky = com.params[0];
            if (functions.cache.chans[channel].talky < functions.cache.chans[channel].talkyMin) {
              functions.cache.chans[channel].talky = functions.cache.chans[channel].talkyMin;
              client.say(nick, 'Setting '+channel+'\'s talky to '+functions.cache.chans[channel].talkyMin+' instead of the value specified because it is smaller than the talkyMin level for this channel.');  
            }
            else if (functions.cache.chans[channel].talky > functions.cache.chans[channel].talkyMax) {
              functions.cache.chans[channel].talky = functions.cache.chans[channel].talkyMax - 1;
              client.say(nick, 'Setting '+channel+'\'s talky to '+functions.cache.chans[channel].talkyMax+' instead of the value specified because it is greater than the talkyMax level for this channel.' );
            }
            else {
              client.say(nick, 'Set channel talky on '+channel+' to:   '+com.params[0]);
            }
          }
          else {
            // display channels talky
            client.say(nick, 'Current channel talky for '+channel+' is:    '+functions.cache.chans[channel].talky);
          }
        }
        else {
          client.say(nick, '!talky #channel [value]');
        }
      }
      
      /**
       * Get/Set Chan threshold
       */
      if (com.command == 'threshold') {
        channel = com.params[0];
        com.params.shift();
        
        if (channel && channel.match(/^#/i) && functions.cache.chans[channel]) {
          if (com.params.length > 0 && com.params[0] !== "") {
            functions.cache.chans[channel].threshold = com.params[0];
            client.say(nick, 'Setting the threshold on '+channel+' to '+com.params[0]);
          }
          else {
            client.say(nick, 'Current threshold on '+channel+' is '+functions.cache.chans[channel].threshold);
          }
        }
        else {
          client.say(nick, '!threshold #channel [value]');
        }
      }
    }
  }
});

client.addListener('join', function(chan, who) {
  console.log('%s has joined %s', who, chan);
  
  if (who == config.nick && !_.has(functions.cache.chans[chan])) {
    functions.cache.chans[chan] = functions.chanInit();
  }
});

client.addListener('part', function(chan, who, reason) {
  console.log('%s has left %s: %s', who, chan, reason);
  if (who !== config.nick) {
    functions.cache.chans[chan].users = _.without(functions.cache.chans[chan].users, who);
  }
  else {
    delete(functions.cache.chans[chan]);
  }
});

client.addListener('kick', function(chan, who, by, reason) {
  console.log('%s was kicked from %s by %s: %s', who, chan, by, reason);
  if (who !== config.nick) {
    functions.cache.chans[chan].users = _.without(functions.cache.chans[chan].users, who);
  }
  else {
    delete(functions.cache.chans[chan]);
  }
});

// Decrease channels talkiness levels
setInterval(function() {
  for (var a in functions.cache.chans) {
    functions.cache.chans[a].talky--;
    if (functions.cache.chans[a].talky < config.talkyMin) {
      functions.cache.chans[a].talky = config.talkyMin;
    }
  }
}, config.talkyDecreaseRate);

// Decrease channels levels
setInterval(function() {
  for (var a in functions.cache.chans) {
    functions.cache.chans[a].level--;
    if (functions.cache.chans[a].level < config.minLevel) {
      functions.cache.chans[a].level = config.minLevel;
    }
  }
}, config.levelDecreaseRate);