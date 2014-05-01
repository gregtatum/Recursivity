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
	
	this.treeEvery = 30;
	this.treeI = 0;
	
	
	//this.addStats();
	this.addEventListeners();
	this.hue = Math.random() * 360;
	
	this.reset();
	this.resizeCanvas(false);
	this.loop();
	
	this.$canvas.on('mousedown', this.onClick.bind(this));
};
		
TwoScene.prototype = {
	
	onClick : function(e) {
		this.reset();
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
		
		if(e) {
			this.render();
		}
	},
			
	loop : function() {

		requestAnimationFrame( this.loop.bind(this) );
		this.render();

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
		
		this.baseNode = new LineNode();
		
		this.baseNode.beg.x = this.width / 2;
		this.baseNode.beg.y = this.height;
		this.baseNode.end.x = this.width / 2;
		this.baseNode.end.y = this.height * 9 / 10;
		this.baseNode.update();
		
	},
	
	random : function(min, max) {
	  return Math.random() * (max - min) + min;
	},
	
	generateLine : function( prevLineNode, prevLevel, totalLevels ) {
		
		totalLevels *= 1.1;
		
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
		lineNode.parent = prevLineNode;
		
		if(currentLevel > 0) {
			for(i=0; i < this.numberOfChildNodes; i++) {
				this.generateLine( lineNode, currentLevel, totalLevels );
			}
		}
		
	},
	
	renderTree : function( lineNode, prevLevel, totalLevels ) {

		var ratio = prevLevel / totalLevels;
		var ratio2 = ( (ratio * ratio) + ratio ) / 2;
		var ratioFlipped = (totalLevels - prevLevel) / totalLevels
		var siblings, nodeIndex, p1, p2, p3;
		
		this.callCount++;
		
		this.context.lineWidth = ratio2 * this.lineWidth;
		
		this.context.beginPath();
		this.context.moveTo( lineNode.beg.x, lineNode.beg.y );
		this.context.lineTo( lineNode.end.x, lineNode.end.y );
		this.context.strokeStyle = this.hslToFillStyle(
			this.hue - 90 * ratio + (this.callCount / 20),
			30 * (1 - ratio2) + 10,
			(30 * (1 - ratio) + 30) * this.random(0.8, 1),
			0.6 * ratioFlipped * ratioFlipped
		);
		this.context.stroke();
		this.context.closePath();
		
		
		if( lineNode.parent ) {
			
			siblings = lineNode.parent.children;
			nodeIndex = siblings.indexOf( lineNode );
		
			if( nodeIndex > 0 ) {
				p1 = lineNode.beg;
				p2 = lineNode.end;
				p3 = siblings[ nodeIndex - 1 ].end;
			
				this.context.beginPath();
				this.context.moveTo( p1.x, p1.y );
				this.context.lineTo( p2.x, p2.y );
				this.context.lineTo( p3.x, p3.y );
				this.context.fillStyle = this.hslToFillStyle(
					this.hue - 90 * ratio + (this.callCount / 20),
					30 * (1 - ratio2) + 10,
					(30 * (1 - ratio) + 30) * this.random(0.8, 1),
					0.6 * ratioFlipped * ratioFlipped
				);;
				this.context.fill();
				this.context.closePath();
			}
		}
		
	   	for(var i=0; i < lineNode.children.length; i++) {
	   		this.renderTree(
				lineNode.children[i],
				prevLevel - 1,
				totalLevels
			);
	   	}
	},
	
	render : function() {
		//this.stats.update();
		//this.context.fillStyle = this.rgbToFillStyle(255, 255, 255, 0.99);
		//this.context.fillRect(0,0,this.width, this.height);
		
		if(this.treeI === 0) {
			this.context.strokeStyle = this.hslToFillStyle(180, 50, 50);
			this.context.lineCap = "round";
			this.callCount = 0;
			this.generateLine( this.baseNode, this.nodeLevels, this.nodeLevels );
			this.renderTree( this.baseNode, this.nodeLevels, this.nodeLevels );
		}
		this.treeI++;
		this.treeI %= this.treeEvery;
	}
	
};

var LineNode = function() {
	this.beg = new THREE.Vector2();
	this.end = new THREE.Vector2();
	this.segment = new THREE.Vector2;
	this.distance = undefined;
	
	this.children = [];
	this.parent = undefined;
};

LineNode.prototype = {
	update : function() {

		this.segment.x = this.end.x - this.beg.x;
		this.segment.y = this.end.y - this.beg.y;
		
		this.distance = Math.sqrt( this.segment.x * this.segment.x + this.segment.y * this.segment.y );
		this.theta = Math.atan2( this.segment.y, this.segment.x );
	}
};

var twoScene;

$(function() {
	twoScene = new TwoScene();
});