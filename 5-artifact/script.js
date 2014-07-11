var Poem = function() {
	
	this.div = document.getElementById( 'container' );
	this.$message = $('.message');
	this.$canvas2d = $('.canvas2d');
	this.canvas2d = this.$canvas2d.get(0);
	this.$canvas3d = $('.canvas3d');
	this.canvas3d = this.$canvas3d.get(0);
	this.ratio = window.devicePixelRatio >= 1 ? window.devicePixelRatio : 1;
	this.context2d = this.canvas2d.getContext( '2d' );
	
	this.prevTime = new Date().getTime();
	this.currTime = this.prevTime;
	
	this.scene = new THREE.Scene();
	this.camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 1, 100000); //(fov, aspect ratio, near, far frustrum)
	this.camera.position.z = 50;
	
	this.addRenderer();
	this.addLights();
	this.addGrid();
	this.addControls();
	//this.addStats();
	
	this.tree = new Tree( this.scene );
	
	this.curveDrawingLayer = new CurveDrawingLayer( 50, this.canvas2d, this.context2d, function( curve ) {
		
		this.reset();
		this.tree.onNewCurve( curve );
		
	}.bind(this));
	
	this.addEventListeners();	
	this.resizeCanvas();
	this.loop();
	
	
	
};
		
Poem.prototype = {
	
	addLights : function() {
		this.lights = [];
		this.lights[0] = new THREE.AmbientLight( 0xffffff );
		this.lights[1] = new THREE.PointLight( 0xffffff, 1, 0 );
		this.lights[2] = new THREE.PointLight( 0xffffff, 1, 0 );
		this.lights[3] = new THREE.PointLight( 0xffffff, 1, 0 );
		
		this.lights[1].position.set(0, 200, 0);
		this.lights[2].position.set(100, 200, 100);
		this.lights[3].position.set(-100, -200, -100);
		
		//this.scene.add( this.lights[0] );
		this.scene.add( this.lights[1] );
		this.scene.add( this.lights[2] );
		this.scene.add( this.lights[3] );
	},
	
	addRenderer : function() {
		this.renderer = new THREE.WebGLRenderer({
			canvas : this.canvas3d,
			antialias : true
		});
		this.renderer.setSize( window.innerWidth, window.innerHeight );
		this.div.appendChild( this.renderer.domElement );
	},
	
	addGrid : function() {

		var lineMaterial = new THREE.LineBasicMaterial( { color: 0x303030 } ),
			geometry = new THREE.Geometry(),
			floor = -75, step = 25;

		for ( var i = 0; i <= 40; i ++ ) {

			geometry.vertices.push( new THREE.Vector3( - 500, floor, i * step - 500 ) );
			geometry.vertices.push( new THREE.Vector3(   500, floor, i * step - 500 ) );

			geometry.vertices.push( new THREE.Vector3( i * step - 500, floor, -500 ) );
			geometry.vertices.push( new THREE.Vector3( i * step - 500, floor,  500 ) );

		}

		this.grid = new THREE.Line( geometry, lineMaterial, THREE.LinePieces );
		this.scene.add( this.grid );

	},
	
	loop : function() {
		var dt;
		
		this.currTime = new Date().getTime();
		dt = this.currTime - this.prevTime;
		
		requestAnimationFrame( this.loop.bind(this) );
		this.update( dt );
		
		this.prevTime = this.currTime;

	},
	
	addControls : function() {
		this.controls = new THREE.OrbitControls( this.camera, this.renderer.domElement );
	},
	
	addStats : function() {
		this.stats = new Stats();
		this.stats.domElement.style.position = 'absolute';
		this.stats.domElement.style.top = '0px';
		$("#container").append( this.stats.domElement );
	},
	
	addEventListeners : function() {
		$(window).on('resize', this.resizeCanvas.bind(this));
		$(document).on('touchmove', false);
	},
	
	resizeCanvas : function(e) {
		this.canvas3d.width = this.canvas2d.width = $(window).width() * this.ratio;
		this.canvas3d.height = this.canvas2d.height = $(window).height() * this.ratio;
		this.width = this.canvas2d.width;
		this.height = this.canvas2d.height;
		this.left = this.$canvas2d.offset().left;
		this.top = this.$canvas2d.offset().top;
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
		
		this.context2d.clearRect(0,0,this.width, this.height);
		this.tree.reset();
		
	},
	
	update : function( dt ) {
		this.controls.update();
		//this.stats.update();
		//this.camera.position.z += 1;
		//this.camera.position.y += 0.1;
		this.renderer.render( this.scene, this.camera );
		
		
		this.tree.update();
		
	}
	
};

var Tree = function( scene ) {
	this.scene = scene;
	
	this.maxChildNodes = 3;
	this.childLength = 0.9;
	this.baseTheta = Math.PI * (80 / 180);
	this.nodeLevels = 3;
	this.lineWidth = 8 * this.ratio;

	this.hue = Math.random() * 360;
	
	this.treeGeometry = new THREE.Geometry();
	this.tree3d = null;
	this.treeMaterial = null;
	
	this.treeRotationSpeed = new THREE.Vector3();
	this.treeRotationPeriod = new THREE.Vector3();
	this.treeRotationOffset = new THREE.Vector3();
	
	this.addToScene();
};

Tree.prototype = {
	
	reset : function() {
		this.maxChildNodes = Math.round( this.random(2, 4) );
		this.childLength = this.random(0.9, 0.99);
		this.baseTheta = Math.PI * (90 / 180) * this.random(0.5, 1);
		this.nodeLevels = Math.round( 9 * this.random(0.7, 1) );
		this.lineWidth = 20 * this.random(0.3, 1) * this.ratio;
		this.hue += 30;
		
		this.treeRotationSpeed.set(
			this.random(-0.01, 0.01),
			this.random(-0.01, 0.01),
			this.random(-0.01, 0.01)
		);
		
		this.treeRotationPeriod.set(
			this.random(0, 100),
			this.random(0, 100),
			this.random(0, 100)
		);
		
		this.treeRotationOffset.set(
			this.random(0, 1000),
			this.random(0, 1000),
			this.random(0, 1000)
		);
		
	},
	
	random : function(min, max) {
	  return Math.random() * (max - min) + min;
	},
	
	generateLine : function() {
		
		var lengthVector = new THREE.Vector3();
		var tmpMatrix = new THREE.Matrix4();
		
		return function( prevLineNode, prevLevel, totalLevels ) {
		
			var i;
			var lineNode = new LineNode();
			var currentLevel = prevLevel - 1;
			var ratioTop = (totalLevels - currentLevel) / totalLevels;
			var ratioBottom = currentLevel / totalLevels;
			var randomness = 2 * (Math.random() - 0.5);
			var thetaChange = this.baseTheta * randomness;
			var theta = prevLineNode.theta - thetaChange; //Theta is the previous angle, minus base theta
			var numberOfChildNodes = Math.round(this.maxChildNodes * this.random(0.5, 1));
			
			//Create the new rotation
			lineNode.localRotation.copy( prevLineNode.localRotation );
			
			lineNode.localRotation.multiply( tmpMatrix.makeRotationX( this.random(-0.02, 0.02) ) );
			lineNode.localRotation.multiply( tmpMatrix.makeRotationY( this.random(-0.02, 0.02) ) );
			lineNode.localRotation.multiply( tmpMatrix.makeRotationZ( this.random(-0.1, 0.1) ) );
			
			//Set the beginning vector
			lineNode.beg.copy( prevLineNode.end );
			
			//Set the ending vector
			lengthVector.subVectors( prevLineNode.end, prevLineNode.beg );
			lengthVector.multiplyScalar( this.childLength );
			lineNode.end.copy( prevLineNode.end ).add( lengthVector);
			
			lineNode.update();
			
			prevLineNode.children.push( lineNode );
			
			this.addToCurrentGeometry( lineNode );
			
			var ratio = prevLevel / totalLevels;
			var ratio2 = ( (ratio * ratio) + ratio ) / 2;
			
			
			this.treeGeometry.colors.push( new THREE.Color().setHSL(
			
				(this.hue - 90 * ratio) / 360,
				(30 * (ratio2) + 20 + 10) / 100,
				((30 * (ratio) + 30) * this.random(0.8, 1)) / 100
			
			));
			this.treeGeometry.colors.push( new THREE.Color().setHSL(
			
				(this.hue - 90 * ratio) / 360,
				(30 * (ratio2) + 20 + 10) / 100,
				((30 * (ratio) + 30) * this.random(0.8, 1)) / 100
			
			));
		
		
		
			if(currentLevel > 0) {
				for(i=0; i < numberOfChildNodes; i++) {
					this.generateLine( lineNode, currentLevel, totalLevels );
				}
			}
		
		};
	}(),
	
	addToCurrentGeometry : function( lineNode ) {
		
		this.treeGeometry.vertices.push( new THREE.Vector3().copy( lineNode.beg ) );
		this.treeGeometry.vertices.push( new THREE.Vector3().copy( lineNode.end ) );
	},
	
	onNewCurve : function( curve ) {
		var i, lineNode;
		
		this.reset();
		
		this.treeGeometry.vertices = [];
		
		this.treeGeometry = new THREE.Geometry();
		this.scene.remove( this.tree3d );
		
		this.scaleCurve( curve );
		
		//Go through each line segment
		for(i=1; i < curve.line.length; i++) {
			
			this.hue += 10;
			this.hue %= 360;
			this.lineWidth *= 0.92;
			
			lineNode = new LineNode();
		
			lineNode.beg.copy( curve.line[i-1] );
			lineNode.end.copy( curve.line[i] );
			lineNode.beg.z = lineNode.end.z = 0;
			
			lineNode.update();
			
			this.generateLine( lineNode, this.nodeLevels, this.nodeLevels );
		}
		
		this.tree3d = new THREE.Line( this.treeGeometry, this.lineMaterial, THREE.LinePieces );
		this.scene.add( this.tree3d );
		
		//this.treeGeometry.verticesNeedUpdate = true;
		//this.treeGeometry.computeBoundingBox()
		
	},
	
	scaleCurve : function() {
		for(i=0; i < curve.line.length; i++) {
			curve.line[i].x /= 2000;
			curve.line[i].y /= 2000;
		}
	},
	
	addToScene : function() {

		this.treeGeometry = new THREE.Geometry();
		this.lineMaterial = new THREE.LineBasicMaterial( {
			color: 0xffffff,
			linewidth: 2 * this.ratio,
			vertexColors: THREE.VertexColors
		} );
		this.tree3d = new THREE.Line( this.treeGeometry, this.lineMaterial, THREE.LinePieces );
		this.scene.add( this.tree3d );

	},
	
	update : function() {
		this.tree3d.rotation.x += Math.sin( this.treeRotationSpeed.x + this.treeRotationOffset.x ) * this.treeRotationSpeed.x;
		this.tree3d.rotation.y += Math.sin( this.treeRotationSpeed.y + this.treeRotationOffset.y ) * this.treeRotationSpeed.y;
		this.tree3d.rotation.z += Math.sin( this.treeRotationSpeed.z + this.treeRotationOffset.z ) * this.treeRotationSpeed.z;
	}
};

var LineNode = function() {
	this.beg = new THREE.Vector3();
	this.end = new THREE.Vector3();
	this.segment = new THREE.Vector3;
	this.distance = undefined;
	
	this.localRotation = new THREE.Matrix4();
	this.globalRotation = new THREE.Matrix4();
	
	this.theta = 0;
	
	this.children = [];
};

LineNode.prototype = {
	
	update : function() {
		
		var tmpMatrix = new THREE.Matrix4();
		
		return function() {
			
			this.segment.x = this.end.x - this.beg.x;
			this.segment.y = this.end.y - this.beg.y;
			this.segment.z = this.end.z - this.beg.z;
		
			this.distance = Math.sqrt(
				this.segment.x * this.segment.x +
				this.segment.y * this.segment.y +
				this.segment.z * this.segment.z
			);
		
			//Take the local rotation, and build a matrix to create the global rotation
			this.globalRotation.makeTranslation(
				this.beg.x * -1,
				this.beg.y * -1,
				this.beg.z * -1
			);
		
			this.globalRotation.multiply( this.localRotation );
		
		
			this.globalRotation.multiply(
				tmpMatrix.makeTranslation(
					this.beg.x,
					this.beg.y,
					this.beg.z
				)
			);
		
			//Move the end point to the appropriate location
			this.end.applyMatrix4( this.globalRotation );
		}
	}()
};

var CurveDrawingLayer = function( smoothness, canvas, context, onCurveDrawn ) {
	
	this.smoothness = smoothness;
	this.canvas = canvas;
	this.context = context;
	this.onCurveDrawn = onCurveDrawn;
	this.$canvas = $(canvas);
	this.$message = $('.message');
	this.$drawingTarget = $('.drawing-target');
	this.points = undefined;
	this.pointsDistance = undefined;
	this.drawingCurve = false;
	this.distance = 0;
	this.targetPointDistance = 50;
	
	this.doCurveDrawingLayer = false;
	this.doDrawTrail = true;
	this.ratio = window.devicePixelRatio >= 1 ? window.devicePixelRatio : 1;
	
	this.$drawingTarget.on('mousedown', this.onMouseDown.bind(this) );
	this.$drawingTarget.on('touchmove', this.onTouchMove.bind(this) );
	this.$drawingTarget.on('touchstart', this.onTouchStart.bind(this) );
	
};

CurveDrawingLayer.prototype = {
	
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
		
		if( this.doCurveDrawingLayer ) {
			this.curveDrawingLayer( curve );
		}
		
		if(typeof this.onCurveDrawn === 'function') {
			this.onCurveDrawn( curve );
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
		ctx.strokeStyle = Poem.prototype.hslToFillStyle(180, 50, 80, 1);
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
		ctx.strokeStyle = Poem.prototype.hslToFillStyle(0, 50, 50, 0.5);
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
			ctx.strokeStyle = Poem.prototype.hslToFillStyle(135, 100, 25, 0.4);
			ctx.stroke();
			ctx.closePath();

			ctx.lineWidth = 50;
			
			
			ctx.beginPath();
			ctx.arc( this.cpLeft[i].x, this.cpLeft[i].y, 5, 0, 2 * Math.PI );
			ctx.fillStyle = Poem.prototype.hslToFillStyle(90, 50, 50, 0.3);
			ctx.fill();
			ctx.closePath();
			
			ctx.beginPath();
			ctx.arc( this.cpRight[i].x, this.cpRight[i].y, 5, 0, 2 * Math.PI );
			ctx.fillStyle = Poem.prototype.hslToFillStyle(180, 50, 50, 0.3);
			ctx.fill();
			ctx.closePath();
			
			
		}
	},
	
	drawLineSegments : function( ctx ) {
		var line = this.line;
		
		ctx.lineWidth = 1;
		ctx.beginPath();
		ctx.strokeStyle = Poem.prototype.hslToFillStyle(0, 0, 0, 0.3);
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

var poem;

$(function() {
	poem = new Poem();
});