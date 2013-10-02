express = require('express')
routes =  require('./routes')
user = require('./routes/user')
http = require('http')
path = require('path')

app = express()

auth = require('./tmp/auth')

cheerio = require('cheerio')

app.set('port',process.env.PORT || 3000)
app.set('views', __dirname + '/views')
app.set('view engine','jade')
app.use(express.favicon())
app.use(express.logger('dev'))
app.use(express.bodyParser())
app.use(express.methodOverride())
app.use(app.router)
app.use(express.static(path.join(__dirname, 'public')))

if('development' == app.get('env'))
  app.use(express.errorHandler())

app.get('/',routes.index)
app.get('/users',user.list)

server = http.createServer(app).listen(app.get('port'), ()->
  console.log('Express server listening on port ' + app.get('port'))
)

getGyazzLink = (socket,options) ->
  title = options.title
  try
    console.log "getGyazzLink::options.title:"+options.title
    http.get(options,(res) ->
      console.log "status"+res.statusCode
      body = ''
      res.on('data',(data) ->
        body += data.toString()
      )
      res.on('end',() ->
        anchors = body.match(/href=["'](.+?)["']/g)
        if anchors != null
          for anchor in anchors
            url = anchor.match(/["'](.+)["']/)
            if url[1].match(/ico|png|xml|css|__edit/i) is null
              link =
                "tempSource": title
                "tempTarget": decodeURI(url[1])
              socket.json.emit("add link",link)
        else
          console.log "anchors:null"
      )
    ).on('error',(e) ->
      console.log e
    )
  catch err
    console.log "getGyazzLink"+err

getGyazzAccess = (socket,options,node) ->
  options.path += "/__access"
  http.get(options,(res) ->
    console.log "status"+res.statusCode
    body = ''
    res.on('data',(data) ->
      body += data.toString()
    )
    res.on('end',() ->
      try
        access = JSON.parse(body)
        node.access = access.length
        socket.json.emit("update node",node)
      catch error
        console.log "getGyazzAccess:"+error
    )
  ).on('error',(e) ->
    console.log e
  )

###
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
###

getGyazzList = (socket) ->
  options =
    hostname: 'gyazz.com'
    auth: auth.write()
    path: '/増井研/__list'
  http.get(options,(res) ->
    console.log "status"+res.statusCode
    body = ''
    res.on('data',(data) ->
      body += data.toString()
    )
    res.on('end',() ->
      try
        lists = JSON.parse(body)
      catch error
        console.log "getGyazzList:"+error
      for list,i in lists when i < 50 # display nodes
        node =
          "title": list[0]
        socket.json.emit("add node",node)
        options.path = '/増井研/'+list[0]
        options.title = list[0]
        getGyazzLink(socket,options)
        #getGyazzContent(socket,options,node)
        getGyazzAccess(socket,options,node)
    )
  ).on('error',(e) ->
    console.log e
  )

io = require('socket.io').listen(server)

io.sockets.on('connection',(socket) ->
  console.log "connect"

  getGyazzList(socket)
  ###
  node =
    "title": "hoge"
  socket.json.emit("add node",node)
  link =
    "source": 1
    "target": 4
  socket.json.emit("add link",link)
  ###
  socket.on("zoom json",(json) ->
    console.log json
    options =
      path: '/増井研/'+json.title
      hostname: 'gyazz.com'
      auth: auth.write()
    http.get(options,(res) ->
      body = ''
      res.on('data',(data) ->
        body += data.toString()
      )
      res.on('end',() ->
        $ = cheerio.load(body)
        rawdata = $("div#rawdata").text()
        strongs = rawdata.match(/\[\[\[[\s\S]+?\]\]\]/g)
        console.log strongs
        for strong,i in strongs
          node =
            "title": strong
          socket.json.emit("add node",node)
          link =
            "source": 0
            "target": i+1
          socket.emit("add link",link)
      )
    )
  )
  socket.on('disconnect',() ->
    console.log "disconnect"
  )
)
