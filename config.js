module.exports = {
  masters: ['MATR1XF1NG3RS'],
  server: 'irc.76chan.org',
  nick: 'PastorDave',
  commandIdentifer: '!',
  
  /**
   * chattiness variables
   */
  minLevel: -1,
  maxLevel: 14,
  talkyMax: 9,
  talkyMin: 2,
  threshold: 7, // What must the level be on the channel before speaking
  talkyDecreaseRate: 9000,
  levelDecreaseRate: 8000,
  
  /**
   * connection variables (for irc)
   */
  connection: {
    port: 6667,
    channels: ['#76chan'],
    userName: 'gr8News', // ident
    realName: 'Pastor Dave',
    debug: true,
    secure: false,
    selfSigned: true,
    certExpired: true,
    floodProtection: true,
    floodProtectionDelay: 1000,
  }
};