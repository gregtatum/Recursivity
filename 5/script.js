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
	
	//this.resizeCanvas();
	// this.loop();
	//this.reset();
	
	//this.$canvas.on('mousedown', this.onClick.bind(this));
	//this.$message.on('mousedown', this.onClick.bind(this));
	
	this.worker = new Worker("worker.js");
	this.worker.onmessage = this.receiveMessage.bind(this);
	
	this.render();

};
		
TwoScene.prototype = {
	
	receiveMessage : function(e) {
		console.log(e);
	},
	
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
		var lineNode = getLineNode();
		var currentLevel = prevLevel - 1;
		var ratioTop = (totalLevels - currentLevel) / totalLevels;
		var ratioBottom = currentLevel / totalLevels;
		var randomness = 2 * (Math.random() - 0.5);
		var thetaChange = this.baseTheta * randomness * ratioTop;
		var theta = prevLineNode.theta - thetaChange; //Theta is the previous angle, minus base theta
		var hyp = prevLineNode.distance * this.childLength;
		
		lineNode.beg[0] = prevLineNode.end[0];
		lineNode.beg[1] = prevLineNode.end[1];
		lineNode.end[0] = prevLineNode.end[0] + ( hyp ) * Math.cos( theta );
		lineNode.end[1] = prevLineNode.end[1] + ( hyp ) * Math.sin( theta );
		
		updateLineNode( lineNode );
		
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
		this.context.moveTo( lineNode.beg[0], lineNode.beg[1] );
		this.context.lineTo( lineNode.end[0], lineNode.end[1] );
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
		
		var lineNode = getLineNode();
		
		lineNode.beg[0] = 0;
		lineNode.beg[1] = this.height / 2;
		lineNode.end[0] = this.width / 10;
		lineNode.end[1] = this.height / 2;
		
		updateLineNode(lineNode);
		
		this.generateLine( lineNode, this.nodeLevels, this.nodeLevels );
		
		console.log('generate');
		this.worker.postMessage( lineNode );
		
		debugger;
		
		this.context.strokeStyle = this.hslToFillStyle(180, 50, 50);
		this.context.lineCap = "round";
		
		//this.renderTree( lineNode, this.nodeLevels, this.nodeLevels );
	}
	
};

var getLineNode = function() {
	
	return {
		beg : [],
		end : [],
		segment : [],
		distance : 0,
		children : []
	};
	
}

function updateLineNode(node) {

	node.segment[0] = node.end[0] - node.beg[0];
	node.segment[1] = node.end[1] - node.beg[1];
	
	node.distance = Math.sqrt( node.segment[0] * node.segment[0] + node.segment[1] * node.segment[1] );
	node.theta = Math.atan2( node.segment[1], node.segment[0] );
}

var twoScene;

$(function() {
	twoScene = new TwoScene();
});