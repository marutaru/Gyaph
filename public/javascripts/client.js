// Generated by CoffeeScript 1.6.2
(function() {
  $(function() {
    var force, height, hideNodes, hideTitles, link, links, node, nodes, socket, svg, tick, titles, update, width, zoomIn, zoomOut;

    socket = io.connect('http://localhost:3000');
    width = 1000;
    height = 1000;
    nodes = new Array;
    links = new Array;
    hideNodes = new Array;
    hideTitles = new Array;
    titles = new Array;
    svg = d3.select('body').append('svg').attr('width', width).attr('height', height);
    force = d3.layout.force().nodes(nodes).links(links).size([width, height]).gravity(0.5).distance(100).charge(-500);
    tick = function() {
      link.attr("x1", function(d) {
        return d.source.x;
      }).attr("y1", function(d) {
        return d.source.y;
      }).attr("x2", function(d) {
        return d.target.x;
      }).attr("y2", function(d) {
        return d.target.y;
      });
      return node.attr("transform", function(d) {
        return "translate(" + d.x + "," + d.y + ")";
      });
    };
    zoomIn = function(json) {
      console.log("zoomIn: " + json.title);
      hideNodes = _.reject(nodes, function(node) {
        return node.title === json.title;
      });
      nodes.length = 0;
      nodes.push(json);
      links.length = 0;
      svg.selectAll("g").data(nodes).exit().remove();
      svg.selectAll("line").data(links).exit().remove();
      socket.json.emit("zoom json", json);
      return update();
    };
    zoomOut = function() {
      console.log("zoomOut");
      return nodes.length = 0;
    };
    node = svg.selectAll(".node").data(nodes).enter().append("g").attr("class", "node").call(force.drag);
    /*
    node.append("circle")
    .attr("fill","Cyan")
    .attr("r",10)
    node.append("text")
    .text((d) ->
      d.title
    )
    */

    link = svg.selectAll(".link").data(links).enter().append("line").attr("class", "link").style("stroke-width", 1).style("stroke", "black");
    update = function() {
      node = svg.selectAll(".node").data(nodes);
      node.enter().insert("g").attr("class", "node").on("mouseover", function(e) {
        console.log(e);
        return svg.selectAll(".link").style("opacity", 0).filter(function(d, i) {
          return d.source.title === e.title || d.target.title === e.title;
        }).style("opacity", 1);
      }).on("mouseout", function(e) {
        return svg.selectAll(".link").style("opacity", 0.1);
      }).on("click", zoomIn).call(force.drag);
      svg.selectAll("text").remove();
      svg.selectAll("circle").remove();
      node.insert("circle").attr("r", function(d) {
        if (d.access > 400) {
          return 20;
        } else if (d.access > 200) {
          return 15;
        } else if (d.access > 50) {
          return 10;
        } else {
          return 5;
        }
      }).attr("fill", function(d) {
        if (d.id > 40) {
          return "cyan";
        } else if (d.id > 30) {
          return "blue";
        } else if (d.id > 20) {
          return "lime";
        } else if (d.id > 10) {
          return "pink";
        } else {
          return "orange";
        }
      }).style("opacity", 0.7);
      node.insert("text").text(function(d) {
        return d.title;
      }).style("opacity", 0.7);
      link = svg.selectAll(".link").data(links);
      link.enter().insert("line").attr("class", "link").style("stroke-width", 1).style("stroke", "red").style("opacity", 0.1);
      return force.on("tick", tick).start();
    };
    socket.on("add node", function(json) {
      console.log(json);
      json.id = nodes.length;
      nodes.push(json);
      titles = _.pluck(nodes, 'title');
      return update();
    });
    socket.on("update node", function(json) {
      console.log(json);
      node = _.findWhere(nodes, {
        title: json.title
      });
      node.access = json.access;
      return update();
    });
    return socket.on("add link", function(json) {
      var target;

      if (_.has(json, "source") && _.has(json, "target")) {
        links.push(json);
        return update();
      } else {
        console.log(json);
        target = json.tempTarget;
        target = target.match(/http:\/\/gyazz.com\/増井研\/(.+)/);
        if (_.contains(titles, target[1]) === true) {
          json.target = _.indexOf(titles, target[1]);
          json.source = _.indexOf(titles, json.tempSource);
          console.log(json);
          links.push(json);
          return update();
        }
      }
    });
  });

}).call(this);
