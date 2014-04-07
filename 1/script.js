var TwoScene = function() {
	
	this.div = document.getElementById( 'container' );
	this.$canvas = $('canvas');
	this.canvas = this.$canvas.get(0);
	this.ratio = window.devicePixelRatio >= 1 ? window.devicePixelRatio : 1;
	this.context = this.canvas.getContext( '2d' );
	this.kochDepth = 1;

	//this.addStats();
	this.addEventListeners();
	this.hue = Math.random() * 360;
	
	this.resizeCanvas();
	this.loop();
	
	//this.fillStyle = this.rgbToFillStyle(150, 150, 180, 0.7);
	this.fillStyle = this.hslToFillStyle(150, 100, 50, 0.5);
	
	console.log(this.fillStyle);
	
	this.thetaChange = 0;
	
	this.$canvas.on('mousedown', this.onClick.bind(this));
};
		
TwoScene.prototype = {
	
	onClick : function(e) {
		this.kochDepth++;
		this.kochDepth %= 7;
		this.resetKoch();
		this.render();
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
		
		this.render();
	},
			
	loop : function() {

		requestAnimationFrame( this.loop.bind(this) );
		this.render();

	},
	
	drawSquare : function() {
		this.context.beginPath();
		this.context.fillStyle = this.fillStyle;
		this.context.fillRect(
			this.width / 2 - 50,
			this.height / 2 - 50,
			100,
			100
		);
		this.context.fill();
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
	
	resetKoch : function() {
		this.thetaChange = 0;
		this.context.fillStyle = this.rgbToFillStyle(255, 255, 255);
		this.context.fillRect(0,0,this.width, this.height);
	},
	
	drawKoch : function() {
		
		var kochLine = new KochLine();
		
		kochLine.beg.x = 0;
		kochLine.beg.y = this.height * 2 / 3;
		
		kochLine.end.x = this.width;
		kochLine.end.y = kochLine.beg.y;
		
		this.thetaChange += 0.1;
		
		if(this.thetaChange > 70) {
			this.resetKoch();
		}
		
		
		this.baseTheta = (this.thetaChange / 360) * (2 * Math.PI);
		
		this.context.lineWidth = Math.sqrt(this.width * this.width + this.height * this.height) / this.kochDepth / 100;
		
		this.hue += 0.2;
		this.context.strokeStyle = this.hslToFillStyle(this.hue, 50, 50);
		this.context.beginPath();
		this.context.lineCap = "round";
		
		this.generateKoch( kochLine, this.kochDepth );
		
		this.context.stroke();
		this.context.closePath();
	},
	
	generateKoch : function( prevKochLine, targetLevel ) {
		
		var i;
		var kochLine;
		var n = prevKochLine.children;
		var currentLevel = targetLevel - 1;
		var segmentX = prevKochLine.end.x - prevKochLine.beg.x;
		var segmentY = prevKochLine.end.y - prevKochLine.beg.y;
		var distance = Math.sqrt( segmentX * segmentX + segmentY * segmentY );
		var baseTheta = this.baseTheta;
		var theta = Math.atan2( segmentY, segmentX) - baseTheta; //Theta is the previous angle, minus base theta

		var adj = distance / 6;
		var opp = adj * Math.tan( baseTheta );
		var hyp = adj / Math.cos( baseTheta );

		
		for(i=0; i < 4; i++) {
			n.push( new KochLine() );
		}
		
		n[0].beg.copy(prevKochLine.beg);
		n[0].end.x = prevKochLine.beg.x * 2/3 + prevKochLine.end.x * 1/3;
		n[0].end.y = prevKochLine.beg.y * 2/3 + prevKochLine.end.y * 1/3;
		
		n[1].beg.copy(n[0].end);
		n[1].end.x = n[1].beg.x + ( hyp ) * Math.cos( theta );
		n[1].end.y = n[1].beg.y + ( hyp ) * Math.sin( theta );
		
		n[2].beg.copy(n[1].end);
		n[2].end.x = prevKochLine.beg.x * 1/3 + prevKochLine.end.x * 2/3;
		n[2].end.y = prevKochLine.beg.y * 1/3 + prevKochLine.end.y * 2/3;
		
		n[3].beg.copy(n[2].end);
		n[3].end.copy(prevKochLine.end);
		
		if(currentLevel > 0) {
			for(i=0; i < 4; i++) {
				this.generateKoch( prevKochLine.children[i], currentLevel );
			}
		} else {
			for(i=0; i < 4; i++) {
				kochLine = prevKochLine.children[i];
			
				this.context.moveTo( kochLine.beg.x, kochLine.beg.y );
				this.context.lineTo( kochLine.end.x, kochLine.end.y );
			}
		}
		
	},
	
	render : function() {
		//this.stats.update();
		
		//this.context.clearRect(0,0,this.width, this.height);
		this.context.fillStyle = this.rgbToFillStyle(255, 255, 255, 0.002);
		this.context.fillRect(0,0,this.width, this.height);
		
		this.drawKoch();
	}
	
};

var KochLine = function() {
	this.beg = new THREE.Vector2();
	this.end = new THREE.Vector2();
	
	this.children = [];
};

var twoScene;

$(function() {
	twoScene = new TwoScene();
});