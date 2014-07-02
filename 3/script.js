var TwoScene = function() {
	
	this.div = document.getElementById( 'container' );
	this.$message = $('.message');
	this.$canvas = $('canvas');
	this.canvas = this.$canvas.get(0);
	this.ratio = window.devicePixelRatio >= 1 ? window.devicePixelRatio : 1;
	this.context = this.canvas.getContext( '2d' );
	
	this.maxChildNodes = 3;
	this.childLength = 0.9;
	this.baseTheta = Math.PI * (80 / 180);
	this.nodeLevels = 7;
	this.lineWidth = 8 * this.ratio;
	
	
	//this.addStats();
	this.addEventListeners();
	this.hue = Math.random() * 360;
	
	//Disable scroll on old iOS devices
	$(document).on('touchmove', false);
	
	
	this.resizeCanvas();
	//this.loop();
	//this.reset();
	
	_.bindAll( this, 'onNewCurve' );
	
	this.drawCurve = new DrawCurve( 50, this.canvas, this.context, this.onNewCurve )
};
		
TwoScene.prototype = {
	
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
		
		this.context.fillStyle = this.rgbToFillStyle(10, 10, 10, 1);
		this.context.fillRect(0,0,this.width, this.height);
		
		this.maxChildNodes = Math.round( this.random(2, 4) );
		this.childLength = this.random(0.9, 0.99);
		this.baseTheta = Math.PI * (90 / 180) * this.random(0.5, 1);
		this.nodeLevels = Math.round( 9 * this.random(0.7, 1) );
		this.lineWidth = 20 * this.random(0.3, 1) * this.ratio;
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
		var thetaChange = this.baseTheta * randomness;
		var theta = prevLineNode.theta - thetaChange; //Theta is the previous angle, minus base theta
		var hyp = prevLineNode.distance * this.childLength;
		var numberOfChildNodes = Math.round(this.maxChildNodes * this.random(0.5, 1));
		
		lineNode.beg.copy(prevLineNode.end);
		lineNode.end.x = prevLineNode.end.x + ( hyp ) * Math.cos( theta );
		lineNode.end.y = prevLineNode.end.y + ( hyp ) * Math.sin( theta );
		
		lineNode.update();
		
		prevLineNode.children.push( lineNode );
		
		//debugger;
		
		if(currentLevel > 0) {
			for(i=0; i < numberOfChildNodes; i++) {
				this.generateLine( lineNode, currentLevel, totalLevels );
			}
		}
		
	},
	
	onNewCurve : function( curve ) {
		var i, lineNode;


		this.reset();
		for(i=1; i < curve.line.length; i++) {
			
			this.hue += 10;
			this.hue %= 360;
			this.lineWidth *= 0.92;
			
			lineNode = new LineNode();
		
			lineNode.beg.copy( curve.line[i-1] );
			lineNode.end.copy( curve.line[i] );
			//lineNode.end.lerp( lineNode.beg, 0.5 );
			
			lineNode.update();
			this.generateLine( lineNode, this.nodeLevels, this.nodeLevels );
		
			this.context.strokeStyle = this.hslToFillStyle(180, 50, 50);
			this.context.lineCap = "round";
			this.drawTree( lineNode, this.nodeLevels, this.nodeLevels );
		}
		
		
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
			30 * (ratio2) + 20 + 10,
			(30 * (ratio) + 30) * this.random(0.8, 1),
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
		/*
		this.context.fillStyle = this.rgbToFillStyle(255, 255, 255, 0.2);
		this.context.fillRect(0,0,this.width, this.height);
		
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
	this.$message = $('.message');
	this.$drawingTarget = $('.drawing-target');
	this.points = undefined;
	this.pointsDistance = undefined;
	this.drawingCurve = false;
	this.distance = 0;
	this.targetPointDistance = 50;
	
	this.doDrawCurve = false;
	this.doDrawTrail = true;
	this.ratio = window.devicePixelRatio >= 1 ? window.devicePixelRatio : 1;
	
	this.$drawingTarget.on('mousedown', this.onMouseDown.bind(this) );
	this.$drawingTarget.on('touchmove', this.onTouchMove.bind(this) );
	this.$drawingTarget.on('touchstart', this.onTouchStart.bind(this) );
	
};

DrawCurve.prototype = {
	
	onTouchStart : function(e) {
		e.preventDefault();
		
		if( this.drawingCurve === false ) {

			this.$drawingTarget.on('touchmove', this.onTouchMove.bind(this) );
			this.$drawingTarget.on('touchend', this.onTouchEnd.bind(this) );
			
			this.$message.hide();
			
			this.drawingCurve = true;
			this.points = [];
			this.pointsDistance = [];
			this.distance = 0;
			
			this.addPoint(
				e.originalEvent.touches[0].pageX,
				e.originalEvent.touches[0].pageY
			);
			
		}
	},
	
	onMouseDown : function(e) {
		
		if( this.drawingCurve === false ) {

			this.$drawingTarget.on('mousemove', this.onMouseMove.bind(this) );
			this.$drawingTarget.on('mouseout', this.onMouseMoveDone.bind(this) );
			this.$drawingTarget.on('mouseup', this.onMouseMoveDone.bind(this) );
			
			this.$message.hide();
			
			this.drawingCurve = true;
			this.points = [];
			this.pointsDistance = [];
			this.distance = 0;
		
			this.addPoint( e.pageX, e.pageY );
			
		}
	},
	
	onMouseMove : function(e) {
		e.preventDefault();
		
		this.addPoint( e.pageX, e.pageY );
	},
	
	onTouchMove : function(e) {
		e.preventDefault();
		
		this.addPoint(
			e.originalEvent.touches[0].pageX,
			e.originalEvent.touches[0].pageY
		);
	},
	
	onTouchEnd : function() {
		
		this.$drawingTarget.off('touchmove', this.onTouchMove.bind(this) );
		this.$drawingTarget.off('touchend', this.onTouchEnd.bind(this) );
		
		this.endInteractionAndDrawTree();
	},
	
	onMouseMoveDone : function(e) {
		var points, i, prev, curr, curve,
			ctx = this.context;

		this.$drawingTarget.off('mousemove');
		this.$drawingTarget.off('mouseout');
		this.$drawingTarget.off('mouseup');
		
		
		this.addPoint( e.pageX, e.pageY );
		
		this.endInteractionAndDrawTree();
	},
	
	endInteractionAndDrawTree : function() {
		
		this.drawingCurve = false;
		
		line = this.smoothLine();
		curve = new BezierCurveFromLine( line, 0.3 );
		
		if( this.doDrawCurve ) {
			this.drawCurve( curve );
		}
		
		if(typeof this.callback === 'function') {
			this.callback( curve );
		}
		
	},
	
	smoothLine : function() {
		
		var divisions, targetDistance, i, distanceAtSegment,
			smoothPoints = [],
			theta,
			newPoint,
			positionOnLinePiece = 0,
			positionPrev = 0,
			positionOnLine = 0;
		
		if(this.points.length <= 2) {
			return this.points;
		}
		
		divisions = Math.ceil( this.distance / this.targetPointDistance );
		divisions = Math.max(2, divisions);
		targetDistance = this.distance / divisions;
		
		i = 0;
		j = 0;
		
		smoothPoints.push(this.points[0]); //Add the first point
		
		for(j=1; j < divisions; j++) {
			
			distanceAtSegment = j * targetDistance;
			
			while(positionOnLine < distanceAtSegment) {
				i++;
				positionPrev = positionOnLine;
				positionOnLine += this.pointsDistance[i];
			}
			
			positionOnLinePiece = positionOnLine - positionPrev;
			
			theta = Math.atan2(
				this.points[i].y - this.points[i-1].y,
				this.points[i].x - this.points[i-1].x
			);
			
			smoothPoints.push( new THREE.Vector2(
				this.points[i-1].x + ( positionOnLinePiece ) * Math.cos( theta ),
				this.points[i-1].y + ( positionOnLinePiece ) * Math.sin( theta )				
			));
		}
		
		smoothPoints.push( this.points[this.points.length-1] ); //Add the last point
		
		return smoothPoints;
		
	},
	
	addPoint : function(x, y) {
		
		var prev, curr, distance;
		
		x *= this.ratio;
		y *= this.ratio;
		
		curr = new THREE.Vector2( x, y );
		
		if(this.points.length > 0) {
			prev = this.points[ this.points.length - 1 ];
		} else {
			prev = curr;
		}
		
		distance = Math.sqrt(
			Math.pow( prev.x - curr.x, 2) +
			Math.pow( prev.y - curr.y, 2)
		);
		this.distance += distance;
		
		this.points.push( curr );
		this.pointsDistance.push( distance );
		
		if(this.doDrawTrail) {
			this.drawMouseMove( prev, curr );
		}
		
	},
	
	drawCurve : function( curve ) {
		var ctx = this.context;
		
		curve.drawLineSegments( ctx );
		curve.drawCurve( ctx );
		curve.drawControlPoints( ctx );
	},
	
	drawMouseMove : function( prev, curr ) {
		
		var ctx = this.context;
		
		ctx.lineWidth = 15 * this.ratio;
		ctx.strokeStyle = TwoScene.prototype.hslToFillStyle(180, 50, 80, 1);
		ctx.beginPath();
		ctx.lineCap = "round";
		ctx.moveTo(prev.x,prev.y);
		ctx.lineTo(curr.x,curr.y);
		ctx.stroke();
		ctx.closePath();	
	}
};

var BezierCurveFromLine = function(line, smoothness) {
	
	//Control point naming assumes left to right for semantic meaning only
	//Bezier curves can be any direction
	
	this.line = undefined;
	this.cpLeft = undefined;
	this.cpRight = undefined;
	this.smoothnes = undefined;
	this.distance = undefined;
	
	if(_.isArray(line) && _.isNumber(smoothness)) {
		
		this.generate(line, smoothness);
	}
};

BezierCurveFromLine.prototype = {
	
	generate : function( line, smoothness ) {
		
		var i, il,
			p1, p2, p3,
			distance,
			totalDistance = 0,
			distances = [],
			theta,
			cpLeft = [],
			cpRight = [];
		
		//Generate distances
		for(i=1, il=line.length; i < il; i++) {
			distance = Math.sqrt(
				Math.pow( line[i-1].x - line[i].x, 2) +
				Math.pow( line[i-1].y - line[i].y, 2)
			);
			distances.push( distance );
			this.distance += distance;
		}
		
		//Add a beginning control point
		cpLeft.push( new THREE.Vector2().copy(line[0]) );
		cpRight.push( new THREE.Vector2().copy(line[0]) );
		
		//Generate control points
		for(i=1, il=line.length - 1; i < il; i++) {
			
			p1 = line[i-1];
			p2 = line[i];
			p3 = line[i+1];
			
			d1 = distances[i-1];
			d2 = distances[i];
			
			theta = Math.atan2(
				p3.y - p1.y,
				p3.x - p1.x
			);
			
			cpLeft.push( new THREE.Vector2(
				p2.x + ( d1 * smoothness ) * Math.cos( theta + Math.PI ),
				p2.y + ( d1 * smoothness ) * Math.sin( theta + Math.PI )
			));
			
			cpRight.push( new THREE.Vector2(
				p2.x + ( d2 * smoothness ) * Math.cos( theta ),
				p2.y + ( d2 * smoothness ) * Math.sin( theta )
			));
		}
		
		//Add an ending control point
		cpLeft.push( new THREE.Vector2().copy(line[ line.length - 1 ]) );
		cpRight.push( new THREE.Vector2().copy(line[ line.length - 1 ]) );
		
		this.line = line;
		this.cpLeft = cpLeft;
		this.cpRight = cpRight;
		this.smoothnes = smoothness;
		this.distance = totalDistance;
	},
	
	regenerate : function() {
		this.generateBezier( this.line, this.smoothness );
	},
	
	createBezierPath : function( ctx ) {

		var i, il = this.line.length;
		
		ctx.moveTo(line[0].x, line[0].y);
	
		for(i=1; i < il; i++) {
			ctx.bezierCurveTo(
				this.cpRight[i-1].x, this.cpRight[i-1].y,
				this.cpLeft[i].x, this.cpLeft[i].y,
				this.line[i].x, this.line[i].y
			);
		}
	},
	
	drawCurve : function( ctx ) {
		
		ctx.lineWidth = 3;
		ctx.strokeStyle = TwoScene.prototype.hslToFillStyle(0, 50, 50, 0.5);
		ctx.beginPath();
		ctx.lineCap = "round";
		
		this.createBezierPath( ctx );
		
		ctx.stroke();
		ctx.closePath();
		
	},
	
	drawControlPoints : function( ctx ) {
		
		ctx.lineCap = "round";
		
		for(var i=0; i < this.cpLeft.length; i++) {

			ctx.lineWidth = 1;
			
			ctx.beginPath();
			ctx.moveTo( this.cpLeft[i].x, this.cpLeft[i].y );
			ctx.lineTo( this.cpRight[i].x, this.cpRight[i].y );
			ctx.strokeStyle = TwoScene.prototype.hslToFillStyle(135, 100, 25, 0.4);
			ctx.stroke();
			ctx.closePath();

			ctx.lineWidth = 50;
			
			
			ctx.beginPath();
			ctx.arc( this.cpLeft[i].x, this.cpLeft[i].y, 5, 0, 2 * Math.PI );
			ctx.fillStyle = TwoScene.prototype.hslToFillStyle(90, 50, 50, 0.3);
			ctx.fill();
			ctx.closePath();
			
			ctx.beginPath();
			ctx.arc( this.cpRight[i].x, this.cpRight[i].y, 5, 0, 2 * Math.PI );
			ctx.fillStyle = TwoScene.prototype.hslToFillStyle(180, 50, 50, 0.3);
			ctx.fill();
			ctx.closePath();
			
			
		}
	},
	
	drawLineSegments : function( ctx ) {
		var line = this.line;
		
		ctx.lineWidth = 1;
		ctx.beginPath();
		ctx.strokeStyle = TwoScene.prototype.hslToFillStyle(0, 0, 0, 0.3);
		for(i=1; i < line.length; i++) {
			prev = line[i-1];
			curr = line[i];
			
			ctx.moveTo(prev.x,prev.y);
			ctx.lineTo(curr.x,curr.y);
		}
		ctx.stroke();
		ctx.closePath();
	}
};

var twoScene;

$(function() {
	twoScene = new TwoScene();
});