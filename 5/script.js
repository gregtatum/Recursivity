var Utils = {
	random : function(min, max) {
	  return Math.random() * (max - min) + min;
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
	}
}

var Poem = function() {
	
	var supportsWebGL = ( function () { try { return !! window.WebGLRenderingContext && !! document.createElement( 'canvas' ).getContext( 'experimental-webgl' ); } catch( e ) { return false; } } )();
	
	
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
	this.scene.fog = new THREE.Fog( 0x282828, 40, 65 );

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
	
	this.mouseX = 0.5;
	this.mouseY = 0.5;
	
	
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
		var renderer
		if (window.WebGLRenderingContext) {
			renderer = THREE.WebGLRenderer;
		} else {
		 	renderer = THREE.CanvasRenderer;
		}
		
		this.renderer = new renderer({
			canvas : this.canvas3d,
			antialias : true
		});
		this.renderer.setSize( window.innerWidth, window.innerHeight );
		this.div.appendChild( this.renderer.domElement );
	},
	
	addGrid : function() {

		var lineMaterial, geometry;
		
		lineMaterial = new THREE.LineDashedMaterial( {
			color: 0x101010,
			linewidth: 2,	
			vertexColors: THREE.VertexColors,
			scale: 20000,
			fog: false
		});
	
		geometry = new THREE.Geometry();

		this.generateGrid( geometry, 0, 200 );
		
		this.grid = new THREE.Line( geometry, lineMaterial, THREE.LineStrip );
		this.scene.add( this.grid );

	},
	
	generateGrid : function( geometry, level, maxLevel ) {

		if(level > maxLevel) return;
		
		var ratio, ratio2;
		
		ratio = level / maxLevel;
		ratio2 = 1 - ratio;
		
		geometry.vertices.push( new THREE.Vector3(
			Math.sin(level / 2) * level * 3,
			Utils.random(-75, -75 + level / 10),
			Math.cos(level / 2) * level * 3 - 300
		));
		
		geometry.colors.push( new THREE.Color().setHSL(
			0.5,
			0.5,
			0.5
		));
		
		this.generateGrid( geometry, level + 1, maxLevel );
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
		$(document).on('mousemove', this.onMouseMove.bind(this));
	},
	
	resizeCanvas : function(e) {
		this.canvas3d.width = this.canvas2d.width = $(window).width() * this.ratio;
		this.canvas3d.height = this.canvas2d.height = $(window).height() * this.ratio;
		this.width = this.canvas2d.width;
		this.height = this.canvas2d.height;
		this.left = this.$canvas2d.offset().left;
		this.top = this.$canvas2d.offset().top;
		

		this.halfWindowWidth = $(window).width() / 2;
		this.halfWindowHeight = $(window).height() / 2;
		
	},
	
	reset : function() {
		
		this.context2d.clearRect(0,0,this.width, this.height);
		this.tree.reset();
		
	},
	
	onMouseMove : function(event) {

		this.mouseX = ( event.clientX - this.halfWindowWidth ) / this.halfWindowWidth;
		this.mouseY = ( event.clientY - this.halfWindowHeight ) / this.halfWindowHeight * -1;
		
		

	},
				
	update : function( dt ) {
		//this.controls.update();
		//this.stats.update();
		//this.camera.position.z += 1;
		//this.camera.position.y += 0.1;
		this.renderer.render( this.scene, this.camera );
		
		var ratio1 = 0.997;
		var ratio2 = 1 - ratio1;
		
		this.camera.position.x = this.camera.position.x * ratio1 + 40 * this.mouseX * ratio2;
		this.camera.position.y = this.camera.position.y * ratio1 + 40 * this.mouseY * ratio2;
		//this.camera.position.z = this.camera.position.z * ratio1 + (-20 * this.mouseY + 40) * ratio2;
		this.camera.rotation.y = this.camera.rotation.y * ratio1 + 0.6 * this.mouseX * ratio2;
		this.camera.rotation.x = this.camera.rotation.x * ratio1 + -0.6 * this.mouseY * ratio2;
		
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
	
	this.geometry = new THREE.Geometry();
	this.object3d = null;
	this.lineMaterial = null;
	
	this.rotationSpeed = new THREE.Vector3();
	this.rotationPeriod = new THREE.Vector3();
	this.rotationOffset = new THREE.Vector3();
	
	this.thetaMin = new THREE.Vector3();
	this.thetaMax = new THREE.Vector3();
	
	this.addToScene();
};

Tree.prototype = {
	
	reset : function() {
		this.maxChildNodes = Math.round( Utils.random(2, 4) );
		this.childLength = Utils.random(0.9, 0.99);
		this.baseTheta = Math.PI * (90 / 180) * Utils.random(0.5, 1);
		this.nodeLevels = Math.round( 9 * Utils.random(0.7, 1) );
		this.lineWidth = 20 * Utils.random(0.3, 1) * this.ratio;
		this.hue += 30;
		
		this.lineMaterial.linewidth = Utils.random(1,10);
		
		var variance = Utils.random(0.3, 1.4);
		
		variance = 1.4;
		
		this.thetaMin.set(
			Utils.random(-1 * variance, 0),
			Utils.random(-1 * variance, 0),
			Utils.random(-1 * variance, 0)
		);
		
		this.thetaMax.set(
			Utils.random(0, variance),
			Utils.random(0, variance),
			Utils.random(0, variance)
		);
		
		
		this.rotationSpeed.set(
			Utils.random(-0.01, 0.01),
			Utils.random(-0.01, 0.01),
			Utils.random(-0.01, 0.01)
		);
		
		this.rotationPeriod.set(
			Utils.random(0, 100),
			Utils.random(0, 100),
			Utils.random(0, 100)
		);
		
		this.rotationOffset.set(
			Utils.random(0, 1000),
			Utils.random(0, 1000),
			Utils.random(0, 1000)
		);
		
	},
	
	onNewCurve : function( curve ) {
		var i, lineNode;
		
		this.reset();
		
		this.geometry.vertices = [];
		
		this.geometry = new THREE.Geometry();
		this.scene.remove( this.object3d );
		
		this.scaleCurve( curve );
		
		//Go through each line segment
		//for(i=1; i ==1 && i < curve.line.length; i++) {
		for(i=1; i < curve.line.length; i++) {
			
			this.hue += 10;
			this.hue %= 360;
			this.lineWidth *= 0.92;
			
			lineNode = new LineNode();
		
			lineNode.beg.copy( curve.line[i-1] );
			lineNode.end.copy( curve.line[i] );
			lineNode.beg.z = lineNode.end.z = 0;
			
			lineNode.update();
			
			this.addToCurrentGeometry( lineNode, this.nodeLevels, this.nodeLevels );
			
			
			this.generateLine( lineNode, this.nodeLevels, this.nodeLevels );
		}
		
		
		this.object3d = new THREE.Line( this.geometry, this.lineMaterial, THREE.LinePieces );
		var center = THREE.GeometryUtils.center( this.geometry );
		
		//this.object3d.position.set(0,0,0);
		this.object3d.rotation.set(Math.PI, 0, 0);
		//this.object3d.scale.set(0,0,0);
		
		this.scene.add( this.object3d );
		
		//this.geometry.verticesNeedUpdate = true;
		//this.geometry.computeBoundingBox()
		
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
			var numberOfChildNodes = Math.round(this.maxChildNodes * Utils.random(0.5, 1));
			
			//Create the new rotation
			//lineNode.localRotation.copy( prevLineNode.localRotation );
			
			lineNode.localRotation.multiply( tmpMatrix.makeRotationX( Utils.random(this.thetaMin.x, this.thetaMax.x) ) );
			lineNode.localRotation.multiply( tmpMatrix.makeRotationY( Utils.random(this.thetaMin.y, this.thetaMax.y) ) );
			lineNode.localRotation.multiply( tmpMatrix.makeRotationZ( Utils.random(this.thetaMin.z, this.thetaMax.z) ) );
			
			//Set the beginning vector
			lineNode.beg.copy( prevLineNode.end );
			
			//Set the ending vector
			lengthVector.subVectors( prevLineNode.end, prevLineNode.beg );
			lengthVector.multiplyScalar( this.childLength );
			lineNode.end.copy( prevLineNode.end ).add( lengthVector);
			
			lineNode.update();
			
			prevLineNode.children.push( lineNode );
			
			this.addToCurrentGeometry( lineNode, prevLevel, totalLevels );
		
			if(currentLevel > 0) {
				for(i=0; i < numberOfChildNodes; i++) {
					this.generateLine( lineNode, currentLevel, totalLevels );
				}
			}
		
		};
	}(),
	
	addToCurrentGeometry : function( lineNode, prevLevel, totalLevels ) {
		
		this.geometry.vertices.push( new THREE.Vector3().copy( lineNode.beg ) );
		this.geometry.vertices.push( new THREE.Vector3().copy( lineNode.end ) );
		
		var ratio = prevLevel / totalLevels;
		var ratio2 = ( (ratio * ratio) + ratio ) / 2;
		
		
		this.geometry.colors.push( new THREE.Color().setHSL(
		
			(this.hue - 90 * ratio) / 360,
			(30 * (ratio2) + 20 + 10) / 100,
			((30 * (ratio) + 30) * Utils.random(0.8, 1)) / 100
		
		));
		this.geometry.colors.push( new THREE.Color().setHSL(
		
			(this.hue - 90 * ratio) / 360,
			(30 * (ratio2) + 20 + 10) / 100,
			((30 * (ratio) + 30) * Utils.random(0.8, 1)) / 100
		));
		
	},
	
	scaleCurve : function() {
		for(i=0; i < curve.line.length; i++) {
			curve.line[i].x /= 40;
			curve.line[i].y /= 40;
		}
	},
	
	addToScene : function() {

		this.geometry = new THREE.Geometry();
		this.lineMaterial = new THREE.LineBasicMaterial( {
			color: 0xffffff,
			linewidth: 2,
			vertexColors: THREE.VertexColors,
			fog: true
		} );
		this.object3d = new THREE.Line( this.geometry, this.lineMaterial, THREE.LinePieces );
		this.scene.add( this.object3d );

	},
	
	update : function() {
		this.object3d.rotation.x += Math.sin( this.rotationSpeed.x + this.rotationOffset.x ) * this.rotationSpeed.x;
		this.object3d.rotation.y += Math.sin( this.rotationSpeed.y + this.rotationOffset.y ) * this.rotationSpeed.y;
		this.object3d.rotation.z += Math.sin( this.rotationSpeed.z + this.rotationOffset.z ) * this.rotationSpeed.z;
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
			//this.end.applyMatrix4( this.globalRotation );
			
			this.end.copy( this.segment );
			this.end.applyMatrix4( this.localRotation );
			this.end.add( this.beg );
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
		ctx.strokeStyle = Utils.hslToFillStyle(180, 50, 80, 1);
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
		ctx.strokeStyle = Utils.hslToFillStyle(0, 50, 50, 0.5);
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
			ctx.strokeStyle = Utils.hslToFillStyle(135, 100, 25, 0.4);
			ctx.stroke();
			ctx.closePath();

			ctx.lineWidth = 50;
			
			
			ctx.beginPath();
			ctx.arc( this.cpLeft[i].x, this.cpLeft[i].y, 5, 0, 2 * Math.PI );
			ctx.fillStyle = Utils.hslToFillStyle(90, 50, 50, 0.3);
			ctx.fill();
			ctx.closePath();
			
			ctx.beginPath();
			ctx.arc( this.cpRight[i].x, this.cpRight[i].y, 5, 0, 2 * Math.PI );
			ctx.fillStyle = Utils.hslToFillStyle(180, 50, 50, 0.3);
			ctx.fill();
			ctx.closePath();
			
			
		}
	},
	
	drawLineSegments : function( ctx ) {
		var line = this.line;
		
		ctx.lineWidth = 1;
		ctx.beginPath();
		ctx.strokeStyle = Utils.hslToFillStyle(0, 0, 0, 0.3);
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