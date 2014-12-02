var config = require('./config'),
    fs = require('fs'),
    _ = require('underscore'),
    phrases = fs.readFileSync('phrases.txt').toString().split("\n");

module.exports = {
  
  cache: {
    chans: {}
  },
  
  /**
   * chanInit
   * Returns a chanObj with default values
   * 
   * @return chanObj - Object
   */
  chanInit: function() {
    return {
      level: Math.floor(Math.random()*11)+1,
      minLevel: config.minLevel,
      maxLevel: config.maxLevel,
      talkyMax: config.talkyMax,
      talkyMin: config.talkyMin,
      threshold: config.threshold,
      talky: -1,
      users: [],
      lastSaid: "sladkfj",
      lastSaidTo: "asdfasfd"
    };
  },
  
  /**
   * parseCommand
   * Trys to see if the message was a command, if so, returns a com object
   * 
   * @param message - String
   * @return comObj - Object
   */
  parseCommand: function(msg) {
    if (msg[0] === config.commandIdentifer) {
      var params = msg.split(" "),
          command = params[0].slice(1),
          comObj = { command: command };
      params.shift();
      comObj.params = params;
      return comObj;
    }
    else {
      return false;
    }
  },
  
  /**
   * saySomething
   * Say something random to a channel. If the phrase contains %s, it
   * will replace that with a random nick from the channel.
   * 
   * @param chan - String
   */
  saySomething: function(chan) {
    var sayList = _.shuffle(_.without(phrases, this.cache.chans[chan].lastSaid)),
        nickList = _.shuffle(_.without(this.cache.chans[chan].users, this.cache.chans[chan].lastSaidTo)),
        toSay = _.sample(sayList),
        toNick = _.sample(nickList);
    
    toSay = toSay.replace(/%s/gi, toNick);
    
    return toSay;
  }
};