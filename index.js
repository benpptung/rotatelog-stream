'use strict';

const fs = require('fs');
const dirname = require('path').dirname;
const basename = require('path').basename;
const Writable = require('stream').Writable;
const inherits = require('util').inherits;
const mkdirp = require('mkdirp');
const async = require('async');
const debug = require('debug')('rotatelog-stream');
const colors = require('colors');


exports = module.exports = RotateLogStream;

exports.createRotateLogStream = function(path, options) {
  return new RotateLogStream(path, options);
};

exports.RotateLogStream = RotateLogStream;


/**
 * // options
 * {
 *   path: join(__dirname, 'log') // file path to log
 *   maxsize: 1024 * 1024 * 10    // max file size, default 5MB
 *   keep: 7                      // number of log files to keep, default : 5,
 *                                // 0 mean no limitation
 * }
 *
 *
 * @param path
 * @param [options]
 * @returns {RotateLogStream}
 * @constructor
 */
function RotateLogStream(path, options) {
  if (this instanceof RotateLogStream !== true) return new RotateLogStream(path, options);
  Writable.call(this);

  if (typeof path == 'string') {
    options = options === Object(options) ? options : {};
    options.path = path;
  }

  if (path === Object(path)) {
    options = path;
  }

  this.maxsize = options.maxsize ||  1024 * 1024 * 5;
  this.keep = options.keep >= 0 && isFinite(options.keep) ? options.keep : 5;
  this.logPath = options.path;


  // init fs.Writable
  mkdirp.sync(dirname(this.logPath));
  this.file = fs.createWriteStream(this.logPath, {flags: 'a'});

  // calculate the current written logs
  this.lastLoggedNum = 0;

  var done;
  var logged;

  while(!done) {
    try {
      logged = this.logPath + '.' + ( this.lastLoggedNum + 1);
      fs.accessSync(logged, fs.F_OK);
      this.lastLoggedNum++;
    } catch(er) {
      done = true;
    }
  }

  // prune excess log files found
  while(this.keep && this.lastLoggedNum >= this.keep) {
    var _s = '.' + this.lastLoggedNum;
    fs.unlink(this.logPath + _s);
    this.lastLoggedNum--;
  }

  // internal buffering
  this.buffs = [];
  this.rotating = false;
  this.waitingDrain = false;
}

inherits(RotateLogStream, Writable);

RotateLogStream.prototype._write = function(chunk, encoding, callback) {


  this.buffs.push(chunk);

  if (this.waitingDrain || this.rotating) return callback();

  this._thresholdCheck((err, action)=> {
    if (err) return callback(err);

    if (action == 'rotate') {
      this._startRotating(err=> {
        if (err) return callback(err);
        this._flushWrite(callback);
      });
      return;
    }

    if (action == 'write') {
      this._flushWrite(callback);
    }
  });
};


RotateLogStream.prototype._thresholdCheck = function(done) {

  debug('%s start thresholdCheck %s, lastLoggedNum: %s',
    basename(this.logPath), String(this.rotating).magenta, this.lastLoggedNum);

  var maxsize = this.maxsize;

  fs.stat(this.logPath, (err, stats)=> {
    if (err) return done(err);
    var action =  stats.size >= maxsize  ? 'rotate' : 'write';
    done(null, action);
  });
};

RotateLogStream.prototype._flushWrite = function(done) {

  var buffs = this.buffs;
  var ok;

  this.buffs = [];
  ok = this.file.write(Buffer.concat(buffs), done);

  if (!ok) {
    debug(`waiting drain`);
    this.waitingDrain = true;
    this.file.once('drain', _=> {

      debug(`drain event`);
      this.waitingDrain = false;
      this._flushWrite();
    });
  }
};


RotateLogStream.prototype._startRotating = function(done) {

  this.rotating = true;

  debug('start rotating'.cyan);

  this._rotateFile(err=> {
    if (err) return done(err);

    debug('rotating finish'.cyan);

    this.rotating = false;
    done();
  })
};

RotateLogStream.prototype._rotateFile = function(done) {

  var tasks = [];
  var lastNumPtr = this.lastLoggedNum;
  var increaseLoggedNum = true;

  // end the underlying writable stream
  this.file.end();

  // reach the num of log files limit?
  // delete the last log file and disable to increase lastLoggedNum
  if (this.keep && lastNumPtr >= this.keep - 1) {
    // delete the oldest log file, because we reach the number of log file limit

      debug('reach keep. lastNumPtr:%s'.red, lastNumPtr);

      var suffix = lastNumPtr ? '.' + lastNumPtr : '';
      tasks.push(deleteFile(this.logPath + suffix));
      lastNumPtr--;
      increaseLoggedNum = false;
  }

  // move the existing log files: log -> log.1, log.1 -> log.2
  for(; lastNumPtr >= 0; lastNumPtr--) {
    var old_suffix = lastNumPtr ? '.' + lastNumPtr : '';
    var new_suffix = '.' + (lastNumPtr + 1);
    tasks.push(renameFile(this.logPath + old_suffix, this.logPath + new_suffix ));
  }

  tasks.push(this._update(increaseLoggedNum));

  async.series(tasks, done);
};


RotateLogStream.prototype._update = function (increaseLoggedNum) {
  return done=> {
    this.file = fs.createWriteStream(this.logPath, {flags: 'a'});
    if (increaseLoggedNum) this.lastLoggedNum++;
    done();
  }
};


var deleteFile = function(file) {
  return done=> {
    fs.unlink(file, done);
  }
};

var renameFile = function(oldpath, newpath) {
  return done=> {
    fs.rename(oldpath, newpath, done);
  }
};
