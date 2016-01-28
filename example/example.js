'use strict';

var crypto = require('crypto');
var createRotateLog = require('..').createRotateLogStream;
var join = require('path').join;
var inspect = require('util').inspect;

process.on('uncaughtException', function (err) {
  console.log(inspect(err));
});


var options = {
  //path: join(__dirname, 'log'),
  keep: 3,
  maxsize: 1024 * 1024 * 3
};


var writer = createRotateLog(join(__dirname, 'log'), options);
var i = 20000;
write();
function write() {
  do {
    i -= 1;
    writer.write(randStr());
  } while (i > 0)
}


function randStr() {
  return JSON.stringify({
      "name": "jhlhklhj khjh",
      "hostname": "use1-hjkhk-jkgkjh-kjhkjhkj",
      "pid": 98188,
      "cor_id": "a6631b87-e1d2-495b-bf86-32c9d788e24f",
      "level": 30,
      "req": {
        "method": "GET",
        "url": "/ictjhkh/lihjhb/akjksset/gakjhkjhllery/bz-gjhgjgwriter212x250.jpg",
        "headers": {
          "host": "bdkjgjkgglgigiz",
          "x-amz-cf-id": "PJK9YrczoT4pyU5ra8Fdof9WBv7NFttJfKww0iZZODFD5VX4AcnDuQ==",
          "connection": "Keep-Alive",
          "accept-encoding": "gzip",
          "user-agent": "Amazon CloudFront",
          "via": "1.1 3905f6b396c96f958286f8e228e61547.cloudfront.net (CloudFront)",
          "x-forwarded-for": "213.205.252.131",
          "x-wap-profile": "http://wap.samsungmobile.com/uaprof/SM-G901F.xml",
          "cache-control": "max-age=0"
        },
        "remoteAddress": "54.240.787.89",
        "remotePort": 29200
      },
      "res": {
        "statusCode": 200,
        "header": "HTTP/1.1 200 OK\r\nCache-Control: max-age=290304000, public\r\nExpires: Thu, 15 Apr 2030 20:00:00 GMT\r\nAcce^C.239.137.20",
        "remotePort": 44169
      },
      "elapsed": 1,
      "msg": "access log",
      "time": "2015-08-31T08:27:39.808Z",
      "v": 0
    }) + '\n'
}