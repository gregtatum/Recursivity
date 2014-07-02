var TwoScene = function() {
	
	this.div = document.getElementById( 'container' );
	this.$canvas = $('canvas');
	this.canvas = this.$canvas.get(0);
	this.ratio = window.devicePixelRatio >= 1 ? window.devicePixelRatio : 1;
	this.context = this.canvas.getContext( '2d' );
	this.depth = 3;

	this.resizeCanvas();
	
	
	this.circle = new Circle();
	this.setupCircle();
	
	//this.addStats();
	this.addEventListeners();
	this.hue = Math.random() * 360;
	
	
	this.ct = new Date().getTime();
	this.pt = this.ct;
	this.dt = 0;
	
	this.loop();
	
	this.thetaChange = 0;
	
	this.$canvas.on('mousedown', this.mouseDown.bind(this));
	//this.$message.on('mousedown', this.mouseDown.bind(this));
};
		
TwoScene.prototype = {
	
	mouseDown : function(e) {
		
		pCircle = this.circle;
		
		e.preventDefault();
		
		
		
		if(e.which == 1) {
			this.depth++;
		} else {
			this.depth = Math.max( 2, this.depth - 1 );
		}
		
		this.circle = new Circle();
		this.circle.theta = pCircle.theta;
		
		
		
		this.setupCircle();
		
		return false;
	},
	
	setupCircle : function() {
		
		Circle.prototype.instruments = [];
		
		this.circle.h = Math.floor(Math.random() * 360);
		this.circle.s = 50;
		this.circle.l = 50;
		this.circle.a = 0.1;
		
		this.fillStyle = this.hslToFillStyle(
			this.circle.h - 10,
			this.circle.s,
			70,
			0.1
		);
		
		this.circle.theta = Math.random() * 2 * Math.PI;
		
		this.circle.isRoot = true;
		
		this.circle.updateColor();
		
		this.updateBaseCircle();
		
		this.generateCircle( this.circle, this.depth );
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
		
		//this.render();
	},
	
	loop : function() {
		
		this.pt = this.ct;
		this.ct = new Date().getTime();
		this.dt = this.ct - this.pt;
		
		this.update( this.dt );
		this.render( this.dt );

		requestAnimationFrame( this.loop.bind(this) );

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
	
	updateBaseCircle : function() {
		this.circle.center.x = (this.canvas.width) / 2;
		this.circle.center.y = (this.canvas.height) / 2;
		this.circle.radius = Math.max(
			this.circle.center.x,
			this.circle.center.y
		);
	},
	
	generateCircle : function( parent, targetLevel ) {

		var circle1, circle2,
			currentLevel = targetLevel - 1,
			thetaOffset = Math.PI / 10;
		
		if( currentLevel > 0 ) {
			
			circle1 = new Circle();
			circle2 = new Circle();
			
			parent.addChildren( circle1, circle2 );
			
			circle1.generate( parent, parent.theta + thetaOffset );
			circle2.generate( parent, parent.theta + thetaOffset + Math.PI );
				
			this.generateCircle( circle1, currentLevel );
			this.generateCircle( circle2, currentLevel );
		}
	},
	
	update : function( dt ) {
		this.circle.update( dt );
	},
	
	render : function( dt ) {
		//this.stats.update();
		
		this.context.fillStyle = this.fillStyle;
		this.context.fillRect(0,0,this.width, this.height);
		
		//this.context.clearRect(0,0,this.width, this.height);
		
		this.circle.draw( this.context );
		
	}
	
};

var Circle = function() {
	this.center = new THREE.Vector2();
	this.radius;
	this.depth = 0;
	this.theta = 0;
	
	this.h;
	this.s;
	this.l;
	this.a;

	this.tickDistance = Math.PI / 10;
	this.totalTick = 2000;
	this.currentTick = 0;

	this.children = [];
	this.hasChildren = false;
	this.parent;
	this.firstPlay = true;
	
	this.fillStyle;
	this.strokeStyle;
}

Circle.prototype = {
	
	instruments : [],
	
	generate : function( parent, theta ) {
		
		this.parent = parent;
				
		this.theta = theta;
		this.prevTheta = theta;
		
		this.depth = parent.depth + 1;
		this.radius = (parent.radius / 2);
		this.isRoot = false;
		this.startThreshold = (this.totalTick / 75) * this.depth;
		this.startDelay = 0;
		
		this.update(0);
		
		this.h = parent.h + 40;
		this.s = parent.s;
		this.l = parent.l;
		this.a = parent.a + 0.2;

		this.updateColor();
		
		if( !this.instruments[this.depth] ) {
			this.instruments[this.depth] = true;
			this.instrument = new Instrument();
			this.instrument.baseGain = 1 - ((10 - this.depth) / 10);
			this.instrument.setFrequency( 600 + this.depth * 50 );
		}
	},
	
	updateColor : function() {
		
		this.fillStyle = TwoScene.prototype.hslToFillStyle(
			this.h,
			this.s,
			this.l,
			this.a
		);
		
		this.strokeStyle = TwoScene.prototype.hslToFillStyle(
			this.h,
			this.s,
			this.l / 2,
			this.a
		);	
	},
	
	addChildren : function( child1, child2 ) {
		
		this.children.push( child1 );
		this.children.push( child2 );
		
		this.hasChildren = true;
	},
	
	update : function( dt ) {
		
		//Figure out initial delay
		this.startDelay += dt;
		if(this.startDelay < this.startThreshold) {
			return;
		} else {
			if( this.firstPlay && this.instrument ) {
				this.instrument.tick();
			}
			this.firstPlay = false;
			
		}
		
		//Increment the current tick
		this.currentTick += dt;
		this.currentTick = Math.min( this.currentTick, this.totalTick );
		
		//Update the theta
		this.theta = jQuery.easing.easeOutElastic(
			null,
			this.currentTick,
			this.prevTheta,
			this.tickDistance * this.depth,
			this.totalTick
		);
		
		//Set a new tick if needed
		if( this.currentTick === this.totalTick ) {
			this.currentTick = 0;
			this.prevTheta = this.theta;
			
			if(this.instrument) {
				this.instrument.tick();
			}
		}
		
		if( !this.isRoot ) {
			this.center.x = this.parent.center.x + Math.cos( this.theta ) * this.radius;
			this.center.y = this.parent.center.y + Math.sin( this.theta ) * this.radius;
		}
		
		if( this.hasChildren ) {
			this.children[0].update( dt );
			this.children[1].update( dt );
		}
	},
	
	draw : function( ctx ) {
		
		ctx.beginPath();
		ctx.fillStyle = this.fillStyle;
		ctx.strokeStyle = this.strokeStyle;
		ctx.lineWidth = 10 / (this.depth + 1);
		//ctx.fillStyle = "rgba(0, 0, 200, 0.5)";
		ctx.arc(
			this.center.x,
			this.center.y,
			this.radius,
			0, 2 * Math.PI
		);
		ctx.fill();
		ctx.stroke();
		ctx.closePath();

		if( this.hasChildren ) {
			this.children[0].draw( ctx );
			this.children[1].draw( ctx );
		}
	}
}

Instrument = function() {
	
	//Test to make sure the AudioContext is available
	this.enabled = ( this.context !== undefined );
	
	if(!this.enabled) return;
	
	this.baseGain = 1;
	
	//Define audio nodes
	this.panner;
	this.oscillator;
	this.gain;
	this.bandpass;
	
	this.setupNodes();
};

Instrument.prototype = {
	
	context : AudioContext ? new AudioContext() : undefined, //Create only 1 audio context
	
	setupNodes : function() {
		this.panner = this.context.createPanner();
		this.panner.panningModel = 'equalpower';
		this.panner.coneOuterGain = 0.1;
		this.panner.coneOuterAngle = 180;
		this.panner.coneInnerAngle = 0;
	
		this.oscillator = this.context.createOscillator();
		this.oscillator.type = "sawtooth";
		this.oscillator.frequency.value = 1000;	
		/*
			enum OscillatorType {
			  "sine",
			  "square",
			  "sawtooth",
			  "triangle",
			  "custom"
			}
		*/

		this.gain = this.context.createGain();
		this.gain.gain.value = 0;
	
		this.bandpass = this.context.createBiquadFilter();
		this.bandpass.type = "bandpass";
		this.bandpass.frequency.value = 440;
		this.bandpass.Q.value = 0.5;

		this.context.listener.setPosition(0, 0, 0);

		/*
		this.oscillator.connect( this.bandpass );
		this.bandpass.connect( this.panner );
		this.panner.connect( this.gain );
		this.gain.connect( this.context.destination );
		*/
		
		this.oscillator.connect( this.gain );
		this.gain.connect( this.context.destination )
		this.oscillator.start(0);
	},
	
	//Interact with audio:
	
	tick : function() {
		this.gain.gain.setTargetAtTime(this.baseGain, this.context.currentTime, 0)
		this.gain.gain.setTargetAtTime(0, this.context.currentTime + .001, 0.2)
	},
	
	setFrequency : function ( frequency ) {
		if(!this.enabled) return;
		this.oscillator.frequency.setTargetAtTime(frequency, this.context.currentTime, 0.1);
	},
	
	setPosition : function ( x, y, z ) {
		if(!this.enabled) return;
		this.panner.setPosition( x, y, z );
	},
	
	setGain : function ( gain ) {
		if(!this.enabled) return;
		Math.max( Math.abs( gain ), 1);
		
		gain / this.totalCreatedSq;
				
		this.gain.gain.setTargetAtTime(gain, this.context.currentTime, 0.1)
	},
	
	setBandpassQ : function ( Q ) {
		if(!this.enabled) return;
		this.bandpass.Q.setTargetAtTime(Q, this.context.currentTime, 0.1);
	},
	
	setBandpassFrequency : function ( frequency ) {
		if(!this.enabled) return;
		this.bandpass.frequency.setTargetAtTime(frequency, this.context.currentTime, 0.1);
	}
};

var twoScene;

$(function() {
	twoScene = new TwoScene();
});