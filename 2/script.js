var TwoScene = function() {
	
	this.div = document.getElementById( 'container' );
	this.$message = $('.message');
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
	//this.loop();
	this.reset();
	
	this.$canvas.on('mousedown', this.onClick.bind(this));
	this.$message.on('mousedown', this.onClick.bind(this));
};
		
TwoScene.prototype = {
	
	onClick : function(e) {
		e.preventDefault();
		
		this.reset();
		this.render();
		this.hue += 5;
		this.$message.hide();
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
		
		this.render();
	},
			
	loop : function() {

		//requestAnimationFrame( this.loop.bind(this) );
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
		//var randomness = Math.floor( 6 * (Math.random()) ) - 3;
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
	
	renderTree : function( lineNode, prevLevel, totalLevels ) {
		
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
	   		this.renderTree( lineNode.children[i], prevLevel - 1, totalLevels );
	   	}
	},
	
	render : function() {
		//this.stats.update();
		
		this.context.fillStyle = this.rgbToFillStyle(255, 255, 255, 0.002);
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
		
		this.renderTree( lineNode, this.nodeLevels, this.nodeLevels );
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

var twoScene;

$(function() {
	twoScene = new TwoScene();
});