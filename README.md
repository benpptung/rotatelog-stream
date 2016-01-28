# rotatelog-stream

A Writable Stream for rotating logs. 

## example

    var join = require('path').join;
    var rlog = require('rotatelog-stream');
    
    var stream = rlog.createRotateLogStream(
    				join(__dirname, 'log'), 
    				{
    				  maxsize: 1024 * 1024,
    				  keep: 5
    				});

or 

    var join = require('path').join;
    var RotateLog = require('rotatelog-stream').RotateLogStream;
    
    var stream = new RotateLog({
      path: join(__dirname, 'log'),
      maxsize: 1024 * 1024 * 5,
      keep: 10
    });


## options

- `path`: the log path
- `maxsize`: max file size, default: 1024 * 1024 * 5
- `keep`: the number of log files limitation, default: 5; `0` means no limitation