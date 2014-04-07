var TwoScene = function() {
	
	this.div = document.getElementById( 'container' );
	this.$canvas = $('canvas');
	this.canvas = this.$canvas.get(0);
	this.ratio = window.devicePixelRatio >= 1 ? window.devicePixelRatio : 1;
	this.context = this.canvas.getContext( '2d' );
	
	this.numberOfChildNodes = 3;
	this.childLength = 0.9;
	this.baseTheta = Math.PI * (80 / 180);
	this.nodeLevels = 7;
	this.lineWidth = 8;
	
	
	//this.addStats();
	this.addEventListeners();
	this.hue = Math.random() * 360;
	
	this.resizeCanvas();
	this.loop();
	//this.reset();
	
	_.bindAll( this, 'onNewCurve' );
	
	//this.$canvas.on('mousedown', this.onClick.bind(this));
	
	this.drawCurve = new DrawCurve( 50, this.canvas, this.context, this.onNewCurve )
};
		
TwoScene.prototype = {
	
	onClick : function(e) {
		this.reset();
		this.draw();
		this.hue += 5;
		e.preventDefault();
	},
	
	addStats : function() {
		this.stats = new Stats();
		this.stats.domElement.style.position = 'absolute';
		this.stats.domElement.style.top = '0px';
		$("#container").append( this.stats.domElement );
	},
	
	addEventListeners : function() {
		$(window).on('resize', this.resizeCanvas.bind(this));
	},
	
	resizeCanvas : function(e) {
		this.canvas.width = $(window).width() * this.ratio;
		this.canvas.height = $(window).height() * this.ratio;
		this.width = this.canvas.width;
		this.height = this.canvas.height;
		this.left = this.$canvas.offset().left;
		this.top = this.$canvas.offset().top;
		
		this.draw();
	},
			
	loop : function() {

		//requestAnimationFrame( this.loop.bind(this) );
		this.draw();

	},
	
	rgbToFillStyle : function(r, g, b, a) {
		if(a === undefined) {
			return ["rgb(",r,",",g,",",b,")"].join('');
		} else {
			return ["rgba(",r,",",g,",",b,",",a,")"].join('');
		}
	},
	
	hslToFillStyle : function(h, s, l, a) {
		if(a === undefined) {
			return ["hsl(",h,",",s,"%,",l,"%)"].join('');
		} else {
			return ["hsla(",h,",",s,"%,",l,"%,",a,")"].join('');
		}
	},
	
	reset : function() {
		//this.context.fillStyle = this.rgbToFillStyle(255, 255, 255);
		//this.context.fillRect(0,0,this.width, this.height);
		
		this.context.fillStyle = this.rgbToFillStyle(255, 255, 255, 0.8);
		this.context.fillRect(0,0,this.width, this.height);
		
		this.childLength = 0.98 * this.random(0.8, 1);
		this.baseTheta = Math.PI * (90 / 180) * this.random(0.5, 1);
		this.nodeLevels = Math.round( 9 * this.random(0.7, 1) );
		this.lineWidth = 20 * this.random(0.3, 1);
		this.hue += 30;
		
	},
	
	random : function(min, max) {
	  return Math.random() * (max - min) + min;
	},
	
	generateLine : function( prevLineNode, prevLevel, totalLevels ) {
		
		var i;
		var lineNode = new LineNode();
		var currentLevel = prevLevel - 1;
		var ratioTop = (totalLevels - currentLevel) / totalLevels;
		var ratioBottom = currentLevel / totalLevels;
		var randomness = 2 * (Math.random() - 0.5);
		var thetaChange = this.baseTheta * randomness * ratioTop;
		var theta = prevLineNode.theta - thetaChange; //Theta is the previous angle, minus base theta
		var hyp = prevLineNode.distance * this.childLength;
		
		lineNode.beg.copy(prevLineNode.end);
		lineNode.end.x = prevLineNode.end.x + ( hyp ) * Math.cos( theta );
		lineNode.end.y = prevLineNode.end.y + ( hyp ) * Math.sin( theta );
		
		lineNode.update();
		
		prevLineNode.children.push( lineNode );
		
		//debugger;
		
		if(currentLevel > 0) {
			for(i=0; i < this.numberOfChildNodes; i++) {
				this.generateLine( lineNode, currentLevel, totalLevels );
			}
		}
		
	},
	
	onNewCurve : function( points ) {

	},
	
	drawTree : function( lineNode, prevLevel, totalLevels ) {
		
		var ratio = prevLevel / totalLevels;
		var ratio2 = ( (ratio * ratio) + ratio ) / 2;
		
		this.context.lineWidth = ratio2 * this.lineWidth;
		
		this.context.beginPath();
		this.context.moveTo( lineNode.beg.x, lineNode.beg.y );
		this.context.lineTo( lineNode.end.x, lineNode.end.y );
		this.context.strokeStyle = this.hslToFillStyle(
			this.hue - 90 * ratio,
			30 * (1 - ratio2) + 10,
			(30 * (1 - ratio) + 30) * this.random(0.8, 1),
			0.9
		);
		this.context.stroke();
		this.context.closePath();
		
	   	for(var i=0; i < lineNode.children.length; i++) {
	   		this.drawTree( lineNode.children[i], prevLevel - 1, totalLevels );
	   	}
	},
	
	draw : function() {
		//this.stats.update();
		
		this.context.fillStyle = this.rgbToFillStyle(255, 255, 255, 0.002);
		this.context.fillRect(0,0,this.width, this.height);
		
		/*
		var lineNode = new LineNode();
		
		lineNode.beg.x = 0;
		lineNode.beg.y = this.height / 2;
		lineNode.end.x = this.width / 10;
		lineNode.end.y = this.height / 2;
		lineNode.update();
		
		this.generateLine( lineNode, this.nodeLevels, this.nodeLevels );
		
		this.context.strokeStyle = this.hslToFillStyle(180, 50, 50);
		this.context.lineCap = "round";
		
		this.drawTree( lineNode, this.nodeLevels, this.nodeLevels );
		*/
	}
	
};

var LineNode = function() {
	this.beg = new THREE.Vector2();
	this.end = new THREE.Vector2();
	this.segment = new THREE.Vector2;
	this.distance = undefined;
	
	this.children = [];
};

LineNode.prototype = {
	update : function() {

		this.segment.x = this.end.x - this.beg.x;
		this.segment.y = this.end.y - this.beg.y;
		
		this.distance = Math.sqrt( this.segment.x * this.segment.x + this.segment.y * this.segment.y );
		this.theta = Math.atan2( this.segment.y, this.segment.x );
	}
};

var DrawCurve = function( smoothness, canvas, context, callback ) {
	
	this.smoothness = smoothness;
	this.canvas = canvas;
	this.context = context;
	this.callback = callback;
	this.$canvas = $(canvas);
	this.points = undefined;
	this.drawingCurve = false;
	
	_.bindAll(this, 'onMouseDown', 'onMouseMove', 'onMouseMoveDone');
	
	this.$canvas.on('mousedown', this.onMouseDown);
};

DrawCurve.prototype = {
	
	onMouseDown : function(e) {
		
		if( this.drawingCurve === false ) {
			
			this.drawingCurve = true;
			this.points = [];
		
			this.$canvas.on('mousemove', this.onMouseMove );
			this.$canvas.on('mouseup', this.onMouseMoveDone );
			this.$canvas.on('mouseout', this.onMouseMoveDone );
		}
	},
	
	onMouseMove : function(e) {
		
		var prev, curr,
			ctx = this.context;
		
		curr = new THREE.Vector2( e.offsetX, e.offsetY );
		
		if(this.points.length > 0) {
			prev = this.points[ this.points.length - 1 ];
		} else {
			prev = curr;
		}
		
		this.points.push( curr );
		
		
		ctx.lineWidth = 4;
		ctx.strokeStyle = TwoScene.prototype.hslToFillStyle(180, 50, 50, 0.1);
		ctx.beginPath();
		ctx.lineCap = "round";
		ctx.moveTo(prev.x,prev.y);
		ctx.lineTo(curr.x,curr.y);
		ctx.stroke();
		ctx.closePath();
	},
	
	onMouseMoveDone : function(e) {
		
		var points, i, prev, curr
			ctx = this.context;

		this.drawingCurve = false;

		this.$canvas.off('mousemove', this.onMouseMove );
		this.$canvas.off('mouseup', this.onMouseMove );
		this.$canvas.off('mouseout', this.onMouseMoveDone );
		
		
		points = this.reducePoints( this.points, 0.00001 );
		
		console.log(this.points.length, points.length);
		
		if(typeof this.callback === 'function') {
			this.callback( points );
		}
		
		ctx.lineWidth = 2;
		ctx.strokeStyle = TwoScene.prototype.hslToFillStyle(0, 50, 50, 1);
		ctx.beginPath();
		ctx.lineCap = "round";
		
		for(i=1; i < points.length; i++) {
			prev = points[i-1];
			curr = points[i];
			
			ctx.moveTo(prev.x,prev.y);
			ctx.lineTo(curr.x,curr.y);
		}
		
		ctx.stroke();
		ctx.closePath();
		
		
	},

	//Ramer–Douglas–Peucker algorithm
	//Algo: http://en.wikipedia.org/wiki/Ramer%E2%80%93Douglas%E2%80%93Peucker_algorithm
	//Credit: https://gist.github.com/rhyolight/2846020
	
	reducePoints : function(points, epsilon) {
		var i,
			maxIndex = 0,
			maxDistance = 0,
			perpendicularDistance,
			leftRecursiveResults, rightRecursiveResults,
			filteredPoints;
		
		// find the point with the maximum distance
		for (i = 2; i < points.length - 1; i++) {
			perpendicularDistance = this.findPerpendicularDistance(points[i], [points[1], points[points.length - 1]]);
			if (perpendicularDistance > maxDistance) {
				maxIndex = i;
				maxDistance = perpendicularDistance;
			}
		}
		// if max distance is greater than epsilon, recursively simplify
		if (maxDistance >= epsilon) {
			leftRecursiveResults = this.reducePoints(points.slice(1, maxIndex), epsilon);
			rightRecursiveResults = this.reducePoints(points.slice(maxIndex), epsilon);
			filteredPoints = leftRecursiveResults.concat(rightRecursiveResults);
		} else {
			filteredPoints = points;
		}
		return filteredPoints;
	},
	
	findPerpendicularDistance : function(point, line) {
		var pointX = point.x,
			pointY = point.y,
			lineStart = {
				x: line[0].x,
				y: line[0].y
			},
			lineEnd = {
				x: line[1].x,
				y: line[1].y
			},
			slope = (lineEnd.y - lineStart.y) / (lineEnd.x - lineStart.x),
			intercept = lineStart.y - (slope * lineStart.x),
			result;
		
		result = Math.abs(slope * pointX - pointY + intercept) / Math.sqrt(Math.pow(slope, 2) + 1);
		
		
		
		return result;
	},
	
	//http://stackoverflow.com/questions/849211/shortest-distance-between-a-point-and-a-line-segment

	distanceToSegment : function (p, v, w) {
		return Math.sqrt(this.distanceToSegmentSquared(p, v, w));
	},

	sqr : function(x) { return x * x },

	dist2 : function (v, w) { return this.sqr(v.x - w.x) + this.sqr(v.y - w.y) },

	distanceToSegmentSquared : function(p, v, w) {
		var l2 = this.dist2(v, w);
	
		if (l2 == 0) return this.dist2(p, v);
	
		var t = ((p.x - v.x) * (w.x - v.x) + (p.y - v.y) * (w.y - v.y)) / l2;
	
		if (t < 0) return this.dist2(p, v);
		if (t > 1) return this.dist2(p, w);
	
		return this.dist2(p, {
			x: v.x + t * (w.x - v.x),
			y: v.y + t * (w.y - v.y) 
		});
	}
};





var twoScene;

$(function() {
	twoScene = new TwoScene();
});