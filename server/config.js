// configure your variables here

var config = {};

config.opentok = {};
config.db = {};
config.web = {};
config.middleware = {};

// OpenTok Credentials
config.opentok.key = '45401072' || 'Your opentok key';
config.opentok.secret=  '317a164483101545db25ecef0e09bcec0c31159f' || 'Your opentok secret';

// Database configuration. Do not change if you do not plan to use redis
config.db.redis = false; // are you using redis?
config.db.REDISTOGO_URL = process.env.REDISTOGO_URL;

// optional middleware to support
config.middleware.p2p = /^\/.*p2p[^\/.]*(\.json)?$/; // urls matching regex will have p2p enabled sessions. Set to false to disable
config.middleware.json = /.*\.json$/; // urls matching regex will have json responses. Set to false to disable
config.middleware.reservations = [{ // reserved rooms. If you want specific rooms to use different opentok Credentials, set it here
  key: process.env.TNW_KEY,
  secret: process.env.TNW_SECRET,
  roomName: "yourdemoroom"
}]; // reserved rooms. set to false to disable

config.web.port = process.env.PORT || 8080;
config.web.env = process.env.NODE_ENV || 'development';

module.exports = config;
