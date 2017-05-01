/* globals Quintus:false */
/*jshint strict: false */


window.addEventListener("load",function() {

	var Q = window.Q = Quintus()
			
			.include("Sprites, Scenes, Input, Touch, UI, TMX, Anim, 2D")

			.setup({ width: 320, height: 480 })

			.controls().touch();


	Q.animations('mario_anim', {
			stand_right: { frames: [0] },
			stand_left: { frames: [14] },
			run_right: { frames: [1,2, 3], rate: 1/7, loop: false },
			run_left: { frames: [15, 16, 17], rate: 1/7, loop: false },
			jump_right: { frames: [4] },
			jump_left: { frames: [18] },
			die: { frames: [12] }
	});

	Q.animations('goomba_anim', {
			run: { frames: [0,1], rate: 1/15, loop: false },
			die: { frames: [2] }
	});

	Q.animations('bloopa_anim', {
			normal: { frames: [0, 1], rate: 1/5, loop: true },
			die: { frames: [2] }
	});

	Q.animations('coin_anim', {
			normal: { frames: [0,1,2], rate: 1/15, loop: false}
	});

	Q.Sprite.extend("Player",{
		init: function(p) {
		    this._super(p, { sheet: "marioR", sprite: "mario_anim" });
		    this.add('2d, platformerControls, animation');
		    this.on("hit.sprite",function(collision) {
      			if(collision.obj.isA("Princess")) {
        			Q.stageScene("endGame",2, { label: "You Won!" }); 
        			this.destroy();
      			}
    		});
		},

		step: function(dt) {
			if(this.p.vy !== 0 && this.p.vx !== 0){
				this.play("jump_" + this.p.direction);
			}
			else if(this.p.vx > 0) {
		  		this.play("run_right");
		  	} 
		  	else if(this.p.vx < 0) {
				this.play("run_left");
			}
			else{
				this.play("stand_" + this.p.direction);
			}

			if(this.p.y > 580){
				this.morir();
        	}
		},

		morir: function() {
			this.play("die");
			Q.stageScene("endGame",2, { label: "You Lose!" }); 
    		
    		Q.stage().pause();
		}
	});

	Q.Sprite.extend("Goomba",{
		init: function(p) {
		    this._super(p, { sheet: "goomba", sprite: "goomba_anim" });
		    this.add('2d, aiBounce, animation');

		    this.on("bump.left, bump.right",function(collision) {
		    	if(collision.obj.isA("Player")) {
		    		collision.obj.p.vy = 500;
		        	collision.obj.morir();
		      	}
		    });

		    this.on("bump.top",function(collision) {
		    	var self = this;
		      	if(collision.obj.isA("Player")) { 
		      		collision.obj.p.vy = -300;
		        	this.morir(self);
		      	}
		    });
		},

		morir: function(self) {
			this.play("die");
			setTimeout(function(){ self.destroy(); }, 500);
		}

	});

	Q.Sprite.extend("Bloopa",{
		
		init: function(p) {
			this.muerto = false;
		    this._super(p, { sheet: "bloopa", sprite: "bloopa_anim" });
		    this.add('2d, aiBounce, animation');

		    this.on("bump.left,bump.right,bump.bottom",function(collision) {
		      	if(collision.obj.isA("Player")) {
		      		collision.obj.morir();
		      	}
		    });

		    this.on("bump.top",function(collision) {
		    	var self = this;
		      	if(collision.obj.isA("Player")) { 
		        	this.morir(self);
		        	collision.obj.p.vy = -300;
				}
		    });
		},

		step: function(dt) {
			if(this.p.vy === 0 && !this.muerto){
				this.p.vy = -500;
			}
			
		},

		morir: function(self) {
			self.muerto = true;

			this.play("die");
			//this.p.vy = 300;
			setTimeout(function(){ self.destroy(); }, 500);
		}

	});

	Q.Sprite.extend("Princess", {
		init: function(p) {
			this._super(p, { asset: "princess.png" });
		}
	});

	Q.Sprite.extend("Coin", {
	    init: function(p) {
	        this._super(p, { sheet: "coin", sprite: "coin_anim", gravity : 0 });
	        this.add('2d, tween, animation');
	        this.on("hit.sprite",function(collision) {
	        	if(collision.obj.isA("Player")) {
					this.animate({ y: this.p.y - 50 }, 1/4, Q.Easing.Quadratic.InOut, { callback: function() {this.destroy()}});
					Q.state.inc("coin", 1);
				}
	        });
	    }            
	});

	Q.scene("level1", function(stage){
		Q.state.reset({ coin: 0});
		Q.stageTMX("level.tmx", stage);
		stage.add("viewport");

		stage.viewport.offsetX = -95;
		stage.viewport.offsetY = 135;
		stage.centerOn(150,380);

		var player = stage.insert(new Q.Player({ x: 150, y: 380 }));

		stage.add("viewport").follow(player);

		var levelAssets = [
                ["Goomba", { x: 1500, y: 496, vx: 100 }],
                ["Goomba", { x: 1600, y: 496, vx: 100 }],
                ["Bloopa", { x: 1240, y: 482 }],
                ["Princess", { x: 2021, y: 452 }],
                ["Coin", {x: 250, y: 470}],
                ["Coin", {x: 350, y: 470}],
                ["Coin", {x: 450, y: 470}],
                ["Coin", {x: 550, y: 470}]
        ];

        stage.loadAssets(levelAssets); 
  		
	});

	Q.scene('endGame',function(stage) {
		var box = stage.insert(new Q.UI.Container({
	    	x: Q.width/2, y: Q.height/2, fill: "rgba(0,0,0,0.5)"
	  	}));
	  
	  	var button = box.insert(new Q.UI.Button({ x: 0, y: 0, fill: "#CCCCCC",
	                                           label: "Play Again" }));        
	 	var label = box.insert(new Q.UI.Text({ x:10, y: -10 - button.p.h, 
	                                        label: stage.options.label }));

	  	button.on("click",function() {
		    Q.clearStages();
		    Q.stageScene('mainTitle');
	  	});
	  	box.fit(20);
	});

	Q.scene('mainTitle',function(stage) {
		Q.stageTMX("level.tmx", stage);
		var box = stage.insert(new Q.UI.Container({
	    	x: Q.width/2, y: Q.height/2
	  	}));

		var button = box.insert(new Q.UI.Button({ asset: 'mainTitle.png' }));

		var empezarNivel = function(){
			Q.clearStages();
		    Q.stageScene('level1');
		    Q.stageScene("coin",1);
		};

	  	Q.input.on("confirm", function(){
	  		empezarNivel();
	  	});

	  	button.on("click", function(){
	  		empezarNivel();
	  	});
	
	});

	Q.scene("coin", function(stage) {
		var label = stage.insert(new Q.UI.Text({x: Q.width/2, y: 50, label: "Coins: 0"}));
		Q.state.on("change.coin", this, function( coin ) {
			label.p.label = "Coins: " + coin;
		});	
	});

	Q.loadTMX("level.tmx, mario_small.png, mario_small.json, goomba.png, goomba.json, bloopa.png, bloopa.json, princess.png, mainTitle.png, coin.png, coin.json", function() {
  		Q.compileSheets("mario_small.png","mario_small.json");
  		Q.compileSheets("goomba.png","goomba.json");
  		Q.compileSheets("bloopa.png","bloopa.json");
  		Q.compileSheets("coin.png","coin.json");

  		Q.stageScene("mainTitle");
  		
	});

	
});