var path = require('path')
  , gutil = require('gulp-util')
  , through = require('through2')
  , crypto = require('crypto');

module.exports = function(options) {
  var separator = '_',
    size = options,
    index = '';

  if (typeof options === 'object') {
    separator = options.separator || '_';
    index = options.index || '';
    size = options.size | 0;
  }

  return through.obj(function(file, enc, cb) {
    if (file.isStream()) {
      this.emit('error', new gutil.PluginError('gulp-debug', 'Streaming not supported'));
      return cb();
    }

    var md5Hash = calcMd5(file, size),
      filename = path.basename(file.path),
      newfilename,
      dir;

    if (file.path[0] == '.') {
      dir = path.join(file.base, file.path);
    } else {
      dir = file.path;
    }
    dir = path.dirname(dir);

    newfilename = filename.split('.').map(function(item, i, arr) {
      return i == arr.length - 2 ? item + separator + md5Hash : item;
    }).join('.');

    if(index !== '') {
      var fs = require('fs');
      var target = filename.split('.').map(function(item, i, arr) {
        return i == arr.length - 2 ? item + separator + '[a-zA-Z0-9]+' : item;
      }).join('.').replace('.', '\\.');

      fs.readFile(index, 'utf8', function (err,data) {
        if (err) {
          return console.log(err);
        }
        data = data.replace( new RegExp(target, 'g'), newfilename);
        fs.writeFile(index,data);
      });
    }

    filename = newfilename;

    file.path = path.join(dir, filename);

    this.push(file);
    cb();
  }, function(cb) {
    cb();
  });
};

function calcMd5(file, slice) {
  var md5 = crypto.createHash('md5');
  md5.update(file.contents, 'utf8');

  return slice > 0 ? md5.digest('hex').slice(0, slice) : md5.digest('hex');
}
