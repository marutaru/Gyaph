// Generated by CoffeeScript 1.6.2
(function() {
  var app, auth, cheerio, express, getGyazzAccess, getGyazzLink, getGyazzList, http, io, path, routes, server, user;

  express = require('express');

  routes = require('./routes');

  user = require('./routes/user');

  http = require('http');

  path = require('path');

  app = express();

  auth = require('./tmp/auth');

  cheerio = require('cheerio');

  app.set('port', process.env.PORT || 3000);

  app.set('views', __dirname + '/views');

  app.set('view engine', 'jade');

  app.use(express.favicon());

  app.use(express.logger('dev'));

  app.use(express.bodyParser());

  app.use(express.methodOverride());

  app.use(app.router);

  app.use(express["static"](path.join(__dirname, 'public')));

  if ('development' === app.get('env')) {
    app.use(express.errorHandler());
  }

  app.get('/', routes.index);

  app.get('/users', user.list);

  server = http.createServer(app).listen(app.get('port'), function() {
    return console.log('Express server listening on port ' + app.get('port'));
  });

  getGyazzLink = function(socket, options) {
    var err, title;

    title = options.title;
    try {
      console.log("getGyazzLink::options.title:" + options.title);
      return http.get(options, function(res) {
        var body;

        console.log("status" + res.statusCode);
        body = '';
        res.on('data', function(data) {
          return body += data.toString();
        });
        return res.on('end', function() {
          var anchor, anchors, link, url, _i, _len, _results;

          anchors = body.match(/href=["'](.+?)["']/g);
          if (anchors !== null) {
            _results = [];
            for (_i = 0, _len = anchors.length; _i < _len; _i++) {
              anchor = anchors[_i];
              url = anchor.match(/["'](.+)["']/);
              if (url[1].match(/ico|png|xml|css|__edit/i) === null) {
                link = {
                  "tempSource": title,
                  "tempTarget": decodeURI(url[1])
                };
                _results.push(socket.json.emit("add link", link));
              } else {
                _results.push(void 0);
              }
            }
            return _results;
          } else {
            return console.log("anchors:null");
          }
        });
      }).on('error', function(e) {
        return console.log(e);
      });
    } catch (_error) {
      err = _error;
      return console.log("getGyazzLink" + err);
    }
  };

  getGyazzAccess = function(socket, options, node) {
    options.path += "/__access";
    return http.get(options, function(res) {
      var body;

      console.log("status" + res.statusCode);
      body = '';
      res.on('data', function(data) {
        return body += data.toString();
      });
      return res.on('end', function() {
        var access, error;

        try {
          access = JSON.parse(body);
          node.access = access.length;
          return socket.json.emit("update node", node);
        } catch (_error) {
          error = _error;
          return console.log("getGyazzAccess:" + error);
        }
      });
    }).on('error', function(e) {
      return console.log(e);
    });
  };

  /*
  getGyazzContent = (socket,options,node) ->
    http.get(options,(res) ->
      console.log "status"+res.statusCode
      body = ''
      res.on('data',(data) ->
        body += data.toString()
      )
      res.on('end',() ->
        try
          contents = body.match(/rawdata.{0,30}[\s\S]{0,50}/g)
          console.log "contents:"
          console.log contents
          node.content = contents[1]
          socket.json.emit("update node",node)
        catch error
          console.log "getGyazzContent:"+error
      )
    ).on('error',(e)->
      console.log e
    )
  */


  getGyazzList = function(socket) {
    var options;

    options = {
      hostname: 'gyazz.com',
      auth: auth.write(),
      path: '/増井研/__list'
    };
    return http.get(options, function(res) {
      var body;

      console.log("status" + res.statusCode);
      body = '';
      res.on('data', function(data) {
        return body += data.toString();
      });
      return res.on('end', function() {
        var error, i, list, lists, node, _i, _len, _results;

        try {
          lists = JSON.parse(body);
        } catch (_error) {
          error = _error;
          console.log("getGyazzList:" + error);
        }
        _results = [];
        for (i = _i = 0, _len = lists.length; _i < _len; i = ++_i) {
          list = lists[i];
          if (!(i < 50)) {
            continue;
          }
          node = {
            "title": list[0]
          };
          socket.json.emit("add node", node);
          options.path = '/増井研/' + list[0];
          options.title = list[0];
          getGyazzLink(socket, options);
          _results.push(getGyazzAccess(socket, options, node));
        }
        return _results;
      });
    }).on('error', function(e) {
      return console.log(e);
    });
  };

  io = require('socket.io').listen(server);

  io.sockets.on('connection', function(socket) {
    console.log("connect");
    getGyazzList(socket);
    /*
    node =
      "title": "hoge"
    socket.json.emit("add node",node)
    link =
      "source": 1
      "target": 4
    socket.json.emit("add link",link)
    */

    socket.on("zoom json", function(json) {
      var options;

      console.log(json);
      options = {
        path: '/増井研/' + json.title,
        hostname: 'gyazz.com',
        auth: auth.write()
      };
      return http.get(options, function(res) {
        var body;

        body = '';
        res.on('data', function(data) {
          return body += data.toString();
        });
        return res.on('end', function() {
          var $, i, link, node, rawdata, strong, strongs, _i, _len, _results;

          $ = cheerio.load(body);
          rawdata = $("div#rawdata").text();
          strongs = rawdata.match(/\[\[\[[\s\S]+?\]\]\]/g);
          console.log(strongs);
          _results = [];
          for (i = _i = 0, _len = strongs.length; _i < _len; i = ++_i) {
            strong = strongs[i];
            node = {
              "title": strong
            };
            socket.json.emit("add node", node);
            link = {
              "source": 0,
              "target": i + 1
            };
            _results.push(socket.emit("add link", link));
          }
          return _results;
        });
      });
    });
    return socket.on('disconnect', function() {
      return console.log("disconnect");
    });
  });

}).call(this);
