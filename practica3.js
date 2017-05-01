/* globals Quintus:false */
/*jshint strict: false */


window.addEventListener("load",function() {

	var Q = window.Q = Quintus({ audioSupported: [ 'mp3','ogg' ] })
			.include("Sprites, Scenes, Input, Touch, UI, TMX, Anim, 2D, Audio")
			.setup({ width: 320, height: 480 })
			.controls().touch()
			.enableSound();

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
			die: { frames: [2], loop: false, rate: 1/15, trigger: "die" }
	});

	Q.animations('bloopa_anim', {
			normal: { frames: [0, 1], rate: 1/5, loop: true},
			die: { frames: [2], loop: false, rate: 1/15, trigger: "die"}
	});

	Q.animations('coin_anim', {
			normal: { frames: [0,1,2], rate: 1/15, loop: true}
	});

	Q.Sprite.extend("Player",{
		init: function(p) {
		    this._super(p, { sheet: "marioR", sprite: "mario_anim" });
		    this.add('2d, platformerControls, animation');
		    
		},

		step: function(dt) {

			if(this.p.y > 580){
				this.bajarVidas();
        	}

        	if(Q.state.p.live > 0){
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
			}
			else{
				this.morir()
			}
			
		},

		bajarVidas: function(){
			this.p.x = 150;
			this.p.y = 380;
			Q.state.dec("live", 1);
		},

		morir: function() {
			Q.audio.play("music_die.mp3");
			this.play("die");
			Q.stageScene("endGame", 2, { label: "You Lose!" }); 
    		Q.stage().pause();
		}
	});

	Q.Sprite.extend("Goomba",{
		init: function(p) {
		    this._super(p, { sheet: "goomba", sprite: "goomba_anim" });
		    this.add('2d, aiBounce, animation, defaultEnemy');
		}
	});

	Q.Sprite.extend("Bloopa",{
		
		init: function(p) {
		    this._super(p, { sheet: "bloopa", sprite: "bloopa_anim" });
		    this.add('2d, aiBounce, animation, defaultEnemy');

		    this.on("bump.bottom", function(collision){
		    	this.p.vy = -500;
		    });
		},
	});

	Q.Sprite.extend("Princess", {
		init: function(p) {
			this._super(p, { asset: "princess.png" });

			this.on("hit.sprite",function(collision) {
      			if(collision.obj.isA("Player")) {
      				Q.audio.play("music_level_complete.mp3");
      				Q.stage().pause();
        			Q.stageScene("endGame", 2, { label: "You Won!" }); 
      			}
    		});
		}
	});

	Q.Sprite.extend("Coin", {
	    init: function(p) {
	        this._super(p, { sheet: "coin", sprite: "coin_anim", gravity : 0 });
	        this.add('2d, tween, animation');
	        this.on("bump.left,bump.right,bump.bottom,bump.top",function(collision) {
	        	if(collision.obj.isA("Player")) {
	        		Q.audio.play("coin.mp3");
	        		this.del('2d');
					this.animate({ y: this.p.y - 50 }, 1/4, Q.Easing.Quadratic.InOut, { callback: function() {this.destroy()}});
					Q.state.inc("coin", 1);
				}
	        });
	    }            
	});

	Q.component("defaultEnemy", {
		added: function(){
			this.entity.on("bump.left,bump.right,bump.bottom", function(collision) {
				if(collision.obj.isA("Player")) { 
					collision.obj.bajarVidas();
				}
			});

			this.entity.on("bump.top",function(collision) {
				if(collision.obj.isA("Player")) { 
					this.play("die");
					collision.obj.p.vy = -300;
				}
			});

			this.entity.on("die", function(){ 
				this.destroy(); 
			});

			
		},
	});

	Q.scene("level1", function(stage){
		Q.state.reset({ coin: 0, live: 3});
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
                ["Coin", { x: 250, y: 470 }],
                ["Coin", { x: 350, y: 470 }],
                ["Coin", { x: 450, y: 470 }],
                ["Coin", { x: 550, y: 470 }]
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
	  	Q.audio.stop('music_main.mp3');
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
		    Q.stageScene("live",2);
		    Q.audio.play("music_main.mp3", { loop: true });
		};

	  	Q.input.on("confirm", function(){
	  		empezarNivel();
	  	});

	  	button.on("click", function(){
	  		empezarNivel();
	  	});
	
	});

	Q.scene("coin", function(stage) {
		var label = stage.insert(new Q.UI.Text({ x: Q.width/2, y: 50, label: "Coins: 0" }));
		Q.state.on("change.coin", this, function( coin ) {
			label.p.label = "Coins: " + coin;
		});	
	});

	Q.scene("live", function(stage) {
		var label = stage.insert(new Q.UI.Text({ x: Q.width/2, y: 100, label: "Lives: 3" }));
		Q.state.on("change.live", this, function( live ) {
			label.p.label = "Lives: " + live;
		});	
	});

	Q.load(["mario_small.png", "mario_small.json", "goomba.png", "goomba.json", "bloopa.png", "bloopa.json", "princess.png", "mainTitle.png", "coin.png", "coin.json", "coin.mp3", "coin.ogg", "music_die.mp3", "music_die.ogg", "music_level_complete.mp3", "music_level_complete.ogg", "music_main.mp3", "music_main.ogg"], function() {
  		Q.compileSheets("mario_small.png","mario_small.json");
  		Q.compileSheets("goomba.png","goomba.json");
  		Q.compileSheets("bloopa.png","bloopa.json");
  		Q.compileSheets("coin.png","coin.json");
  		Q.loadTMX("level.tmx", function() {
  			Q.stageScene("mainTitle");
  		});
	});

});