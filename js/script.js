// ----------------------------------------------------------------------------
// 
// torna-do
// 
// ----------------------------------------------------------------------------

// global
var screenCanvas, screenWidth, screenHeight, screenAspect;
var noiseBuffer, offScreenBuffer, hBlurBuffer, vBlurBuffer;
var screenSize = 512;
var bufferSize = 512;
var offScreenSize = 512;
var w   = new wgld();
var mat = new matIV();
var qtn = new qtnIV();
var camQtn = qtn.identity(qtn.create());
var rad = new radian();

var scene = 0;
var sceneCount = 0;
var count = 0;
var score = 0;
var level = 0;
var gage = 0;
var run = true;
var touch = false;
var pi  = Math.PI;

var torna;
var enemys;
var enemyCount = 10;
var enemyMaxCount = 200;
var enemyTypeCount = 4;
var enemySpeed = [
	0.035,
	0.025,
	0.055,
	0.01
];
var enemyColor = [
	[0.1, 0.3, 0.6, 1.0],
	[0.1, 0.8, 0.1, 1.0],
	[0.6, 0.3, 0.1, 1.0],
	[0.5, 0.1, 0.4, 1.0],
];
var enemySize = [
	0.25,
	0.35,
	0.45,
	0.15
];
var fires;
var fireCount = 200;

// colors
var gageColor = [0.8, 0.2, 0.2, 0.8];

// events
var kWkey       = new keys();
var kAkey       = new keys();
var kSkey       = new keys();
var kDkey       = new keys();
var kArrowUp    = new keys();
var kArrowRight = new keys();
var kArrowDown  = new keys();
var kArrowLeft  = new keys();
var deviceOrientUpdate = false;

// audio
var audioCtr = new AudioCtr(0.6, 0.2);

window.onload = function(){
	var i = 0;
	screenCanvas = document.getElementById('canvas');
	screenSize = Math.min(window.innerWidth, window.innerHeight);
	screenCanvas.width  = screenSize;
	screenCanvas.height = screenSize;
	screenWidth  = screenCanvas.width;
	screenHeight = screenCanvas.height;
	screenAspect = screenWidth / screenHeight;
	w.init(screenCanvas);
	do{
		i++;
		offScreenSize = Math.pow(2, i);
	}while(Math.pow(2, i + 1) < screenSize);
	offScreenSize = Math.min(512, offScreenSize);
	bufferSize = offScreenSize;
	
	var e = document.getElementById('info');
	e.style.width      = '100%';
	e.style.height     = screenSize + 'px';
	e.style.lineHeight = screenSize + 'px';
	e.style.display = 'block';
	
	window.addEventListener('keydown', keyDown, true);
	window.addEventListener('keyup', keyUp, true);
	window.addEventListener('mousedown', touches, true);
	window.addEventListener('touchstart', touches, true);
	window.addEventListener("deviceorientation", deviceOrientation);
	
	audioCtr.load('snd/background.mp3', 0, true, true);
	audioCtr.load('snd/powerhit.mp3', 1, false, false);
	audioCtr.load('snd/hit.mp3', 2, false, false);
	audioCtr.load('snd/shot.mp3', 3, false, false);
	
	main();
};

function main(){
	var i, j ,k ,l;
	var ease5 = new Array();
	var ease10 = new Array();
	var ease20 = new Array();
	var ease30 = new Array();
	
	// shader program initialize phase ----------------------------------------
	var basePrg = w.generate_program(
		'baseVS',
		'baseFS',
		['position'],
		[3],
		['mvpMatrix', 'ambient', 'pointSize'],
		['matrix4fv', '4fv', '1f']
	);
	
	var boardPrg = w.generate_program(
		'boardVS',
		'boardFS',
		['index'],
		[1],
		['position', 'texCoord', 'texture', 'tex', 'bgcolor'],
		['3fv', '2fv', '1i', '1i', '4fv']
	);
	
	// noise programs ---------------------------------------------------------
	var noisePrg = w.generate_program(
		'noiseVS',
		'noiseFS',
		['position'],
		[3],
		['map', 'mapSize', 'resolution'],
		['1i', '1f', '2fv']
	);
	
	// blur programs ----------------------------------------------------------
	var blurPrg = w.generate_program(
		'blurVS',
		'blurFS',
		['position', 'texCoord'],
		[3, 2],
		['mvpMatrix', 'texture', 'weight', 'resolution', 'horizon'],
		['matrix4fv', '1i', '1fv', '1f', '1i']
	);
	
	// board
	var bIndex = [0, 1, 2, 3];
	var board = w.create_vbo(bIndex);
	var boardVBOList = [board];
	var boardPosition = new Array();
	var boardColor = new Array();
	var boardCoord = new Array();
	var idx = [0, 2, 1, 1, 2, 3];
	var boardIndex = w.create_ibo(idx);
	var boardIndexLength = idx.length;
	
	// board const
	var B_FULL = 0;
	var B_GAGE = 1;
	var B_SCORE = 2;
	var B_TITLE = 3;
	
	// board - full
	boardPosition[B_FULL] = [
		-1.0,  1.0,  0.0,
		-1.0, -1.0,  0.0,
		 1.0,  1.0,  0.0,
		 1.0, -1.0,  0.0
	];
	boardColor[B_FULL] = [1.0, 1.0, 1.0, 1.0];
	boardCoord[B_FULL] = [
		0.0, 1.0,
		0.0, 0.0,
		1.0, 1.0,
		1.0, 0.0
	];
	
	// board - gage
	boardPosition[B_GAGE] = [
		-1.0, -0.95,  0.0,
		-1.0, -1.0,  0.0,
		 1.0, -0.95,  0.0,
		 1.0, -1.0,  0.0
	];
	boardColor[B_GAGE] = [1.0, 1.0, 1.0, 1.0];
	boardCoord[B_GAGE] = [ 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0 ];
	
	// board - score
	boardPosition[B_SCORE] = [];
	boardColor[B_SCORE] = [1.0, 1.0, 1.0, 1.0];
	for(i = 0; i < 10; i++){
		j = -1.0 + i * 0.1;
		k = j + 0.1;
		boardPosition[B_SCORE][i] = [
			j ,  1.0,  0.0,
			j ,  0.9,  0.0,
			k ,  1.0,  0.0,
			k ,  0.9,  0.0
		];
	}
	
	// board - title
	boardPosition[B_TITLE] = [
		-1.0,  0.25,  0.0,
		-1.0, -0.25,  0.0,
		 1.0,  0.25,  0.0,
		 1.0, -0.25,  0.0
	];
	boardColor[B_TITLE] = [1.0, 1.0, 1.0, 1.0];
	boardCoord[B_TITLE] = [
		0.0, 0.25,
		0.0, 0.0,
		1.0, 0.25,
		1.0, 0.0
	];
	
	// ortho
	var pos = [
	   -1.0,  1.0,  0.0,
		1.0,  1.0,  0.0,
	   -1.0, -1.0,  0.0,
		1.0, -1.0,  0.0
	];
	var tex = [
		0.0, 0.0,
		1.0, 0.0,
		0.0, 1.0,
		1.0, 1.0
	];
	
	var blurVBOList = [w.create_vbo(pos), w.create_vbo(tex)];
	var blurIBO = w.create_ibo(idx);
	var blurIndexLength = idx.length;
	
	// char box lines
	// var boxData = box(2.0);
	var boxData = ball(5, 5, 1.5);
	var boxPosition    = w.create_vbo(boxData.position);
	var boxVBOList     = [boxPosition];
	var boxIndexLength = boxData.position.length / 3;
	
	// char ball lines
	var ballData = ball(6, 6, 1.0);
	var ballPosition    = w.create_vbo(ballData.position);
	var ballVBOList     = [ballPosition];
	var ballIndexLength = ballData.position.length / 3;
	
	// enemy
	ballData = ball(3, 3, 1.0);
	ballPosition = w.create_vbo(ballData.position);
	var enemyVBOList     = [ballPosition];
	var enemyIndexLength = ballData.position.length / 3;
	
	// fire
	ballData = ball(16, 8, 1.0);
	ballPosition = w.create_vbo(ballData.position);
	var fireVBOList     = [ballPosition];
	var fireIndexLength = ballData.position.length / 3;
	
	// gackground
	ballData = ball(64, 64, 10.0);
	ballPosition = w.create_vbo(ballData.position);
	var backVBOList     = [ballPosition];
	var backIndexLength = ballData.position.length / 3;
	
	// noise
	var noiseData = plane(1.0);
	var noisePosition    = w.create_vbo(noiseData.position);
	var noiseVBOList     = [noisePosition];
	var noiseIndex       = w.create_ibo(noiseData.index);
	var noiseIndexLength = noiseData.index.length;
	
	// matrix and other data initialize phase ---------------------------------
	var mMatrix   = mat.identity(mat.create());
	var vMatrix   = mat.identity(mat.create());
	var pMatrix   = mat.identity(mat.create());
	var tmpMatrix = mat.identity(mat.create());
	var mvpMatrix = mat.identity(mat.create());
	var ortMatrix = mat.identity(mat.create());
	var tMatrix   = mat.identity(mat.create());
	
	// ortho
	mat.lookAt([0.0, 0.0, 0.5], [0.0, 0.0, 0.0], [0.0, 1.0, 0.0], vMatrix);
	mat.ortho(-1.0, 1.0, 1.0, -1.0, 0.1, 1.0, pMatrix);
	mat.multiply(pMatrix, vMatrix, ortMatrix);
	
	// camera and scene
	var camPosition = [0.0, 0.0, 10.0];
	var camUp       = [0.0, 1.0, 0.0];
	
	// texture initialize phase -----------------------------------------------
	w.create_texture('img/chip.png', 0);
	
	// frame buffer  initialize phase -----------------------------------------
	noiseBuffer = w.create_framebuffer(bufferSize, bufferSize);
	offScreenBuffer = w.create_framebuffer(offScreenSize, offScreenSize);
	hBlurBuffer = w.create_framebuffer(offScreenSize, offScreenSize);
	vBlurBuffer = w.create_framebuffer(offScreenSize, offScreenSize);
	
	// noise data initialize --------------------------------------------------
	w.gl.bindFramebuffer(w.gl.FRAMEBUFFER, noiseBuffer.f);
	w.gl.clearColor(0.0, 0.0, 0.0, 1.0);
	w.gl.clear(w.gl.COLOR_BUFFER_BIT);
	w.gl.viewport(0, 0, bufferSize, bufferSize);
	noisePrg.set_program();
	noisePrg.set_attribute(noiseVBOList);
	w.gl.bindBuffer(w.gl.ELEMENT_ARRAY_BUFFER, noiseIndex);
	noisePrg.push_shader([true, bufferSize, [bufferSize, bufferSize]]);
	w.gl.drawElements(w.gl.TRIANGLES, noiseIndexLength, w.gl.UNSIGNED_SHORT, 0);
	w.gl.flush();
	
	// initialize setting phase -----------------------------------------------
	w.gl.bindFramebuffer(w.gl.FRAMEBUFFER, null);
	w.gl.enable(w.gl.BLEND);
	w.gl.blendFuncSeparate(w.gl.SRC_ALPHA, w.gl.ONE, w.gl.ONE, w.gl.ONE);
	w.gl.blendEquationSeparate(w.gl.FUNC_ADD, w.gl.FUNC_ADD);
	w.gl.clearColor(0.0, 0.0, 0.0, 1.0);
	w.gl.clearDepth(1.0);
	
	for(i = 0; i <= 5;  i++){ease5[i]  = easeOutCubic(i * 0.2);}
	for(i = 0; i <= 10; i++){ease10[i] = easeOutCubic(i * 0.1);}
	for(i = 0; i <= 20; i++){ease20[i] = easeOutCubic(i * (1 / 20));}
	for(i = 0; i <= 30; i++){ease30[i] = easeOutCubic(i * (1 / 30));}
	
	// gaussian weight
	var weight = new Array(5);
	var t = 0.0;
	var d = 50.0;
	for(i = 0; i < weight.length; i++){
		var r = 1.0 + 2.0 * i;
		var v = Math.exp(-0.5 * (r * r) / d);
		weight[i] = v;
		if(i > 0){v *= 2.0;}
		t += v;
	}
	for(i = 0; i < weight.length; i++){
		weight[i] /= t;
	}
	
	// render -----------------------------------------------------------------
	w.gl.activeTexture(w.gl.TEXTURE0);
	w.gl.bindTexture(w.gl.TEXTURE_2D, noiseBuffer.t);
	
	// loading wait -----------------------------------------------------------
	(function(){
		if(audioCtr.loadComplete() && w.texture[0] != null){
			// style change
			document.getElementById('info').style.display = 'none';

			// background music play
			audioCtr.src[0].play();
			
			// renderer
			initializeSetting();
			render();
		}else{
			setTimeout(arguments.callee, 100);
		}
	})();
	
	// initialize settings ----------------------------------------------------
	function initializeSetting(){
		// char
		torna = new Char();
		torna.init();

		// enemy
		enemys = new Array(enemyMaxCount);
		for(i = 0; i < enemyMaxCount; i++){
			enemys[i] = new Enemy();
		}

		// fire
		fires = new Array(fireCount);
		for(i = 0; i < fireCount; i++){
			fires[i] = new Fire();
		}

		// init
		scene = 0;
		sceneCount = 0;
		score = 0;
		level = 0;
		count = 0;
		touch = false;
	}
	
	// render function --------------------------------------------------------
	function render(){
		var i, j, k;
		var gl = w.gl;
		
		// initialize
		count++;
		deviceOrientUpdate = false;
		gl.clear(gl.COLOR_BUFFER_BIT);
		gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE, gl.ONE, gl.ONE);
		
		// update keys
		keyUpdate();

		// off screen
		gl.bindFramebuffer(gl.FRAMEBUFFER, offScreenBuffer.f);
		gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
		gl.viewport(0, 0, offScreenSize, offScreenSize);
		
		
		// char fase
		torna.update(scene, sceneCount);

		// scene
		// 0 = title
		// 1 = ready
		// 2
		// 3 = play
		// 4 = die
		// 5 = darker
		if(scene > 2){
			i = Math.floor(torna.score / 10 + 10);
			enemyCount = Math.min(enemyMaxCount, i);
			for(i = 0; i < enemyCount; i++){
				enemys[i].update(torna, fires);
				if(scene === 3){
					if(!enemys[i].alive){
						j = Math.random();
						switch(true){
							case j < 0.75:  // 0.75
								k = 0;
								break;
							case j < 0.875: // 0.125
								k = 1;
								break;
							case j < 0.975: // 0.1
								k = 2;
								break;
							case j < 1.0:   // 0.025
								k = 3;
								break;
							default :
								k = 0;
								break;
						}
						enemys[i].init(enemySpeed[k], enemyColor[k], k, enemySize[k], 2);
					}
				}
			}
			torna.check(enemys);
			if(touch){
				if(torna.power > 180 && !torna.fire && torna.alive){
					audioCtr.src[3].play();
					torna.param = 0;
					torna.power = 0;
					torna.fire = true;
					torna.fireParam = 360;
				}
			}
			for(i = 0; i < fireCount; i++){
				fires[i].update(torna, enemys);
			}
		}

		// scene
		var centerPoint = [0.0, 0.0, 0.0];
		switch(scene){
			case 0:
				if(touch){
					scene = 1;
					sceneCount = 0;
				}
				break;
			case 1:
				sceneCount++;
				if(sceneCount > 100){
					scene = 3;
					sceneCount = 0;
				}
				break;
			case 3:
				if(torna.param === 1){
					audioCtr.src[1].play();
					torna.alive = false;
					scene = 4;
					sceneCount = 0;
				}
				break;
			case 4:
				sceneCount++;
				if(sceneCount > 100){
					scene = 5;
					sceneCount = 0;
				}else{
					i = 1.0 - sceneCount / 100;
					centerPoint = [
						Math.random() * 0.5 * i,
						Math.random() * 0.5 * i,
						Math.random() * 0.5 * i
					];
				}
				break;
			case 5:
				sceneCount++;
				if(sceneCount > 200){
					scene = 6;
					sceneCount = 0;
				}
				break;
			case 6:
				sceneCount++;
				if(sceneCount > 200){
					initializeSetting();
					scene = 0;
					sceneCount = 0;
				}
				break;
		}

		// matrix
		mat.lookAt(camPosition, centerPoint, camUp, vMatrix);
		mat.perspective(45, 1.0, 0.1, 30.0, pMatrix);
		mat.multiply(pMatrix, vMatrix, tmpMatrix);

		// render function
		basePrg.set_program();
		charRender();
		enemyRender();
		fireRender();
		
		// horizon blur
		gl.bindTexture(gl.TEXTURE_2D, offScreenBuffer.t);
		gl.bindFramebuffer(gl.FRAMEBUFFER, hBlurBuffer.f);
		gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
		gl.viewport(0, 0, offScreenSize, offScreenSize);
		
		blurPrg.set_program();
		blurPrg.set_attribute(blurVBOList);
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, blurIBO);
		blurPrg.push_shader([ortMatrix, 0, weight, offScreenSize, true]);
		gl.drawElements(gl.TRIANGLES, blurIndexLength, gl.UNSIGNED_SHORT, 0);
		
		// vertical blur
		gl.bindTexture(gl.TEXTURE_2D, hBlurBuffer.t);
		gl.bindFramebuffer(gl.FRAMEBUFFER, vBlurBuffer.f);
		gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
		gl.viewport(0, 0, offScreenSize, offScreenSize);
		
		blurPrg.push_shader([ortMatrix, 0, weight, offScreenSize, false]);
		gl.drawElements(gl.TRIANGLES, blurIndexLength, gl.UNSIGNED_SHORT, 0);
		
		// board
		gl.bindTexture(gl.TEXTURE_2D, vBlurBuffer.t);
		gl.bindFramebuffer(gl.FRAMEBUFFER, null);
		gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
		gl.viewport(0, 0, screenSize, screenSize);
		boardPrg.set_program();
		boardPrg.set_attribute(boardVBOList);
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, boardIndex);
		boardPrg.push_shader([boardPosition[B_FULL], boardCoord[B_FULL], 0, true, [2.0, 2.0, 2.0, 1.0]]);
		gl.drawElements(gl.TRIANGLES, boardIndexLength, gl.UNSIGNED_SHORT, 0);
		
		// gage
		if(torna.fireCheck > 0){
			gage = torna.gage;
			if(gage > 0){
				i = gage / 5 - 1.0;
				j = [
					-1.0, -0.985, 0.0,
					-1.0, -1.0,   0.0,
					  i , -0.985, 0.0,
					  i , -1.0,   0.0
				];
				boardPrg.push_shader([j, boardCoord[B_GAGE], 0, false, gageColor]);
				gl.drawElements(gl.TRIANGLES, boardIndexLength, gl.UNSIGNED_SHORT, 0);
				j = [
					 1.0, 0.985, 0.0,
					 1.0, 1.0,   0.0,
					 -i , 0.985, 0.0,
					 -i , 1.0,   0.0
				];
				boardPrg.push_shader([j, boardCoord[B_GAGE], 0, false, gageColor]);
				gl.drawElements(gl.TRIANGLES, boardIndexLength, gl.UNSIGNED_SHORT, 0);
				j = [
					-0.985, 1.0, 0.0,
					-1.0,   1.0, 0.0,
					-0.985, -i,  0.0,
					-1.0,   -i,  0.0
				];
				boardPrg.push_shader([j, boardCoord[B_GAGE], 0, false, gageColor]);
				gl.drawElements(gl.TRIANGLES, boardIndexLength, gl.UNSIGNED_SHORT, 0);
				j = [
					0.985, -1.0, 0.0,
					1.0,   -1.0, 0.0,
					0.985,   i,  0.0,
					1.0,     i,  0.0
				];
				boardPrg.push_shader([j, boardCoord[B_GAGE], 0, false, gageColor]);
				gl.drawElements(gl.TRIANGLES, boardIndexLength, gl.UNSIGNED_SHORT, 0);
			}
		}else{
			torna.gage = 0;
		}
		
		basePrg.set_program();
		charRender();
		enemyRender();
		fireRender();
		backRender();
		
		// black curtain
		gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE);
		if(scene >= 5){
			if(scene === 5){
				i = sceneCount / 200;
			}else{
				i = 1.0;
			}
			boardPrg.set_program();
			boardPrg.set_attribute(boardVBOList);
			gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, boardIndex);
			boardPrg.push_shader([boardPosition[B_FULL], boardCoord[B_FULL], 0, false, [0.0, 0.0, 0.0, i ]]);
			gl.drawElements(gl.TRIANGLES, boardIndexLength, gl.UNSIGNED_SHORT, 0);
		}
		
		// score value
		if(scene > 0){
			if(scene === 1){
				i = sceneCount / 100;
			}else if(scene === 6){
				i = 1.0 - sceneCount / 100;
			}else{
				i = 1.0;
			}
			boardPrg.set_program();
			boardPrg.set_attribute(boardVBOList);
			gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, boardIndex);
			gl.bindTexture(gl.TEXTURE_2D, w.texture[0]);
			l = returnCoordArray(torna.scoreValue * 100, 10);
			for(j = 0; j < 10; j++){
				boardPrg.push_shader([boardPosition[B_SCORE][j], l[j], 0, true, [1.0, 1.0, 1.0, i ]]);
				gl.drawElements(gl.TRIANGLES, boardIndexLength, gl.UNSIGNED_SHORT, 0);
			}
		}else{
			boardPrg.set_program();
			boardPrg.set_attribute(boardVBOList);
			gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, boardIndex);
			gl.bindTexture(gl.TEXTURE_2D, w.texture[0]);
			boardPrg.push_shader([boardPosition[B_TITLE], boardCoord[B_TITLE], 0, true, boardColor[B_TITLE]]);
			gl.drawElements(gl.TRIANGLES, boardIndexLength, gl.UNSIGNED_SHORT, 0);
		}
		
		// finish
		gl.flush();
		
		// touch reset
		touch = false;
		
		if(run){requestAnimationFrame(render);}
		
		// char render
		function charRender(){
			var i, j, k, l, m;
			// box
			basePrg.set_attribute(boxVBOList);
			mat.identity(mMatrix);
			mat.translate(mMatrix, [torna.position.x, torna.position.y, torna.position.z], mMatrix);
			mat.rotate(mMatrix, rad.rad[count % 360], [0.0, 1.0, 1.0], mMatrix);
			mat.multiply(tmpMatrix, mMatrix, mvpMatrix);
			basePrg.push_shader([mvpMatrix, [0.2, 0.2, 0.2, 1.0], 0.0]);
			gl.drawArrays(gl.LINE_STRIP, 0, boxIndexLength);

			if(torna.alive){
				// fire
				if(torna.fire){
					for(i = 1; i <= 3; i++){
						j = ((360 - torna.fireParam) * i) % 360;
						k = i * 0.2 + 0.6;
						l = torna.fireParam / 360;
						k -= l / 10;
						var hsvColor = hsva(j, 0.8, 0.5, l);
						mat.identity(tMatrix);
						mat.translate(tMatrix, [torna.position.x, torna.position.y, torna.position.z], tMatrix);
						mat.rotate(tMatrix, rad.rad[j], [1.0, 1.0, 1.0], tMatrix);
						mat.scale(tMatrix, [k, k, k], tMatrix);
						mat.multiply(tmpMatrix, tMatrix, mvpMatrix);
						basePrg.push_shader([mvpMatrix, hsvColor, 0.0]);
						gl.drawArrays(gl.LINE_STRIP, 0, boxIndexLength);
					}
				}
				
				// field power
				if(torna.power > 30){
					i = torna.power / 200;
					if(torna.power > 180){
						j = 0.5;
					}else{
						j = 0.0;
					}
					mat.scale(mMatrix, [i, i, i], mMatrix);
					mat.multiply(tmpMatrix, mMatrix, mvpMatrix);
					basePrg.push_shader([mvpMatrix, [0.0, 0.1 + j, i, 1.0], 0.0]);
					gl.drawArrays(gl.LINE_STRIP, 0, boxIndexLength);
				}
				
				// ball
				basePrg.set_attribute(ballVBOList);
				mat.identity(mMatrix);
				mat.translate(mMatrix, [torna.position.x, torna.position.y, torna.position.z], mMatrix);
				mat.scale(mMatrix, [torna.size, torna.size, torna.size], mMatrix);
				mat.rotate(mMatrix, rad.rad[count % 360], [0.0, 1.0, 0.0], mMatrix);
				mat.multiply(tmpMatrix, mMatrix, mvpMatrix);
				basePrg.push_shader([mvpMatrix, [0.35, 0.025, 0.0, 1.0], 0.0]);
				gl.drawArrays(gl.LINE_STRIP, 0, ballIndexLength);
			}else{
				// die
				if(scene === 4){
					m = sceneCount / 100;
					j = easeOutCubic(m) * 15.0;
					k = easeQuintic(m) * 5.0;
					l = [
						0,
						j,
						k,
						j / 2
					];
					for(i = 1; i <= 3; i++){
						mat.identity(tMatrix);
						mat.translate(tMatrix, [torna.position.x, torna.position.y, torna.position.z], tMatrix);
						mat.rotate(tMatrix, rad.rad[count % 360], [1.0, 1.0, 1.0], tMatrix);
						mat.scale(tMatrix, [l[i], l[i], l[i]], tMatrix);
						mat.multiply(tmpMatrix, tMatrix, mvpMatrix);
						basePrg.push_shader([mvpMatrix, [0.45, 0.15, 0.05, 1.0 - m], 0.0]);
						gl.drawArrays(gl.LINE_STRIP, 0, boxIndexLength);
					}
				}
			}
		}
		
		// enemy render
		function enemyRender(){
			var i, j;
			// ball
			basePrg.set_attribute(enemyVBOList);
			for(i = 0; i < enemyCount; i++){
				if(enemys[i].alive){
					mat.identity(mMatrix);
					mat.translate(mMatrix, [enemys[i].position.x, enemys[i].position.y, enemys[i].position.z], mMatrix);
					mat.scale(mMatrix, [enemys[i].size, enemys[i].size, enemys[i].size], mMatrix);
					mat.rotate(mMatrix, rad.rad[enemys[i].param2 % 360], [0.0, 1.0, 1.0], mMatrix);
					mat.multiply(tmpMatrix, mMatrix, mvpMatrix);
					basePrg.push_shader([mvpMatrix, enemys[i].color, 0.0]);
					gl.drawArrays(gl.LINE_STRIP, 0, enemyIndexLength);
				}
			}
		}

		// fire render
		function fireRender(){
			var i, j, k, l;
			// ball
			basePrg.set_attribute(fireVBOList);
			for(i = 0; i < fireCount; i++){
				if(fires[i].alive){
					j = (fires[i].param * 12) % 360;
					k = fires[i].param / 60;
					l = easeOutCubic(k) * fires[i].size * 1.2;
					k = 1.0 - k;
					mat.identity(mMatrix);
					mat.translate(mMatrix, [fires[i].position.x, fires[i].position.y, fires[i].position.z], mMatrix);
					mat.rotate(mMatrix, rad.rad[j], [1.0, 1.0, 0.0], mMatrix);
					mat.scale(mMatrix, [l, l, l], mMatrix);
					mat.multiply(tmpMatrix, mMatrix, mvpMatrix);
					basePrg.push_shader([mvpMatrix, [0.9, 0.1, 0.0, k], 1.5]);
					gl.drawArrays(gl.POINTS, 0, fireIndexLength);
				}
			}
		}

		// background render
		function backRender(){
			var i, j, k;
			switch(scene){
				case 0:
					i = 0; k = 0;
					j = [0.0, 0.0, 0.0, 0.0];
					break;
				case 1:
					i = easeQuintic(sceneCount / 100) * 0.2;
					j = hsva(count, 0.5, 0.3, i);
					i = (count % 1440) * pi / 720;
					k = easeQuintic((count % 50) / 50) * 3.0 + 5;
					break
				default :
					i = (count % 1440) * pi / 720;
					j = hsva(count, 0.5, 0.3, 0.2);
					k = easeQuintic((count % 50) / 50) * 3.0 + 5;
					break
			}

			// ball
			basePrg.set_attribute(backVBOList);
			mat.identity(mMatrix);
			mat.rotate(mMatrix, i, [0.0, 1.0, 0.0], mMatrix);
			mat.multiply(tmpMatrix, mMatrix, mvpMatrix);
			basePrg.push_shader([mvpMatrix, j, k]);
			gl.drawArrays(gl.POINTS, 0, backIndexLength);
		}

	}
}

// event and utility function =================================================
function returnCoordArray(num, round){
	var i, j, k, l;
	var s = ('0000000000' + num).slice(-round);
	var n = new Array();
	var v = new Array();
	for(i = 0; i < round; i++){
		n[i] = parseInt(s.substr(i, 1));
		j = (n[i] % 4) * 0.25;
		k = 1.0 - Math.floor(n[i] / 4) * 0.25;
		v[i] = new Array(
			j, k, j, k - 0.25, j + 0.25, k, j + 0.25, k - 0.25
		);
	}
	return v;
}

function keyDown(e){
	var ck = e.keyCode;
	if(ck === 27){
		run = false;
		audioCtr.src[0].end(0);
	}
	if(ck === 32){touch = true;}            // space
	if(ck === 37){kArrowLeft.update(1);}    // left
	if(ck === 38){kArrowUp.update(1);}      // up
	if(ck === 39){kArrowRight.update(1);}   // right
	if(ck === 40){kArrowDown.update(1);}    // down
	if(ck === 87){kWkey.update(1);}         // w
	if(ck === 65){kAkey.update(1);}         // a
	if(ck === 83){kSkey.update(1);}         // s
	if(ck === 68){kDkey.update(1);}         // d
}

function keyUp(e){
	var ck = e.keyCode;
	if(ck === 37){kArrowLeft.update(2);}    // left
	if(ck === 38){kArrowUp.update(2);}      // up
	if(ck === 39){kArrowRight.update(2);}   // right
	if(ck === 40){kArrowDown.update(2);}    // down
	if(ck === 87){kWkey.update(2);}         // w
	if(ck === 65){kAkey.update(2);}         // a
	if(ck === 83){kSkey.update(2);}         // s
	if(ck === 68){kDkey.update(2);}         // d
}

function keyUpdate(){
	kArrowLeft.update(0);
	kArrowUp.update(0);
	kArrowRight.update(0);
	kArrowDown.update(0);
	kWkey.update(0);
	kAkey.update(0);
	kSkey.update(0);
	kDkey.update(0);
}

function keys(){
	this.down  = false;
	this.press = false;
	this.up    = false;
	this.count = 0;
	this.update = function(flg){
		if(flg == 0){
			if(this.down){this.down = false;}
			if(this.up){this.up = false;}
			if(this.press){this.count++;}
		}else if(flg == 1){
			this.down = true;
			this.up = false;
			this.press = true;
		}else if(flg == 2){
			this.down = false;
			this.up = true;
			this.press = false;
			this.count = 0;
		}
	};
}

function touches(eve){
	touch = true;
}

// mobile events
function deviceOrientation(eve){
	if(deviceOrientUpdate){return;}
	deviceOrientUpdate = true;
	if(torna != null){
		var x = eve.beta;
		var y = eve.gamma;
		var vx = 0, vy = 0;
		switch(true){
			case x > 5:
				vx = Math.min(x, 10.0);
				break;
			case x < 5:
				vx = Math.max(x, -10.0);
				break;
		}
		switch(true){
			case y > 5:
				vy = Math.min(y, 10.0);
				break;
			case y < 5:
				vy = Math.max(y, -10.0);
				break;
		}
		torna.vpos.y += 0.006 * -(vx / 20);
		torna.vpos.x += 0.006 * (vy / 20);
	}
}


function easing(t){
	return t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1;
}

function easeOutCubic(t){
	return (t = t / 1 - 1) * t * t + 1;
}

function easeQuintic(t){
	var ts = (t = t / 1) * t;
	var tc = ts * t;
	return (tc * ts);
}

