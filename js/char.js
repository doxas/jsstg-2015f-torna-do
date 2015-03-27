// ----------------------------------------------------------------------------
// 
// torna-do char.js
// 
// ----------------------------------------------------------------------------

// box
function box(side){
	var hs = side * 0.5;
	var pos = [
		 hs,  hs,  hs,  hs,  hs, -hs,  hs, -hs,  hs,  hs, -hs, -hs,  hs,  hs,  hs, // px
		-hs,  hs,  hs, -hs,  hs, -hs, -hs, -hs,  hs, -hs, -hs, -hs, -hs,  hs,  hs, // nx
		-hs,  hs, -hs,  hs,  hs, -hs, -hs,  hs,  hs,  hs,  hs,  hs, -hs,  hs, -hs, // py
		-hs, -hs, -hs,  hs, -hs, -hs, -hs, -hs,  hs,  hs, -hs,  hs, -hs, -hs, -hs, // ny
		-hs,  hs,  hs, -hs, -hs,  hs,  hs,  hs,  hs,  hs, -hs,  hs, -hs,  hs,  hs, // pz
		-hs,  hs, -hs, -hs, -hs, -hs,  hs,  hs, -hs,  hs, -hs, -hs, -hs,  hs, -hs  // nz
	];
	var obj = new mesh();
	obj.position = pos;
	return obj;
}

// ball
function ball(row, col, side){
	if(row < 3 || col < 3){return null;}
	var obj = new mesh();
	var pos = [];
	var rSplit = (180 / (row - 1)) * Math.PI / 180;
	var cSplit = (180 / (col - 1)) * Math.PI / 180;
	for(var i = 0; i < row - 1; i++){
		var t = Math.cos(rSplit * i) * side;
		var n = Math.cos(rSplit * (i + 1)) * side;
		var v = Math.sin(rSplit * i) * side;
		var w = Math.sin(rSplit * (i + 1)) * side;
		for(var j = 0; j < col * 2 - 2; j++){
			var x = Math.sin(cSplit * j);
			var z = Math.cos(cSplit * j);
			var p = Math.sin(cSplit * (j + 1));
			var q = Math.cos(cSplit * (j + 1));
			pos.push(
				x * v, t, z * v,
				x * w, n, z * w,
				p * v, t, q * v,
				x * v, t, z * v
			);
		}
	}
	obj.position = pos;
	return obj;
}

// vector
function Vec(){
	this.x = this.y = this.z = 0.0;
}

Vec.prototype.arrow = function(v){
	var d = new Vec();
	d.x = v.x - this.x;
	d.y = v.y - this.y;
	d.z = v.z - this.z;
	return d;
};

Vec.prototype.length = function(){
	return Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z);
};

Vec.prototype.normalize = function(){
	var l = 1 / this.length();
	this.x *= l;
	this.y *= l;
	this.z *= l;
};

// character
function Char(){
	this.position = new Vec();
	this.vpos = new Vec();
	this.speed = 0.02;
	this.life = 0;
	this.size = 0.20;
	this.field = 2.0;
	this.alive = false;
	this.param = 0;
	this.power = 0;
	this.fire = false;
	this.fireParam = 0;
	this.fireCheck = 0;
	this.gage = 0;
	this.score = 0;
	this.scoreValue = 0;
}

Char.prototype.init = function(){
	this.position.x = -0.95;
	this.position.y = 0.0;
	this.position.z = 6.0;
	this.vpos.x = 0.0;
	this.vpos.y = 0.0;
	this.vpos.z = 0.0;
	this.life = 0;
	this.size = 0.20;
	this.alive = true;
	this.param = 0;
	this.power = 0;
	this.fire = false;
	this.fireParam = 0;
	this.fireCheck = 0;
	this.gage = 0;
	this.score = 0;
	this.scoreValue = 0;
}

Char.prototype.update = function(scene, sceneCount){
	var i, j, k;
	switch(scene){
		case 0:
			this.position.x = -0.95;
			this.position.y = 0.0;
			this.position.z = 6.0;
			break;
		case 1:
			i = 1.0 - sceneCount / 100;
			j = easing(i);
			k = easeQuintic(i);
			this.position.x = -0.95 * k;
			this.position.y = 0.0;
			this.position.z = 6.0 * j;
			break;
		case 3:
			this.vpos.x *= 0.95;
			this.vpos.y *= 0.95;
			this.vpos.z *= 0.95;
			if(Math.abs(this.vpos.x) < 0.0005){this.vpos.x = 0;}
			if(Math.abs(this.vpos.y) < 0.0005){this.vpos.y = 0;}
			if(Math.abs(this.vpos.z) < 0.0005){this.vpos.z = 0;}

			if(kArrowUp.press    || kWkey.press){this.vpos.y += 0.004;}
			if(kArrowRight.press || kDkey.press){this.vpos.x += 0.004;}
			if(kArrowDown.press  || kSkey.press){this.vpos.y -= 0.004;}
			if(kArrowLeft.press  || kAkey.press){this.vpos.x -= 0.004;}
			if(this.vpos.x < -0.04){this.vpos.x = -0.04;}
			if(this.vpos.y < -0.04){this.vpos.y = -0.04;}
			if(this.vpos.x >  0.04){this.vpos.x =  0.04;}
			if(this.vpos.y >  0.04){this.vpos.y =  0.04;}

			this.position.x += this.vpos.x;
			this.position.y += this.vpos.y;
			this.position.z += this.vpos.z;
			if(this.position.x < -3.5){this.position.x = -3.5;}
			if(this.position.y < -3.5){this.position.y = -3.5;}
			if(this.position.x >  3.5){this.position.x =  3.5;}
			if(this.position.y >  3.5){this.position.y =  3.5;}
			break;
	}

	if(this.param !== 1){this.param = 0;}
	if(this.power > 0){this.power--;}

	if(this.fire){
		this.fireParam -= 6;
		if(this.fireParam < 0){
			this.fire = false;
			this.fireParam = 0;
		}
	}

	this.fireCheck = 0;
};

Char.prototype.check = function(enemys){
	var i, j, k, l;
	if(!this.alive){return;}
	k = this.size * 0.5;
	l = this.field / 2;
	for(i = 0, j = enemys.length; i < j; i++){
		if(enemys[i].alive){
			var ex = enemys[i].position.x - this.position.x;
			var ey = enemys[i].position.y - this.position.y;
			var el = Math.sqrt(ex * ex + ey * ey);
			if(el < k + enemys[i].size * 0.75 && !this.fire){
				this.param = 1;
				break;
			}else if(el < l + enemys[i].size * 1.25){
				this.param = 2;
				this.power += 3.5;
				if(this.fire){enemys[i].life--;}
			}
		}
	}
	this.power = Math.min(this.power, 200);
}

// enemy
function Enemy(){
	this.position = new Vec();
	this.vector = new Vec();
	this.color = null;
	this.speed = 0.0;
	this.type = 0;
	this.size = 0;
	this.alive = false;
	this.life = 0;
	this.param1 = 0;
	this.param2 = 0;
	this.param3 = 0;
}

Enemy.prototype.init = function(speed, color, type, size, life){
	var signX, signY;
	this.vector.x = Math.random() * 2.0 - 1.0;
	this.vector.y = Math.random() * 2.0 - 1.0;
	this.vector.normalize();
	signX = this.vector.x >= 0.0 ? 1.0 : -1.0;
	signY = this.vector.y >= 0.0 ? 1.0 : -1.0;
	if(Math.abs(this.vector.x) > Math.abs(this.vector.y)){
		this.position.x = (Math.random() * 0.3 + 4.5) * -signX;
		this.position.y = Math.random() * 8.0 - 4.0;
	}else{
		this.position.x = Math.random() * 8.0 - 4.0;
		this.position.y = (Math.random() * 0.3 + 4.5) * -signY;
	}
	this.speed = speed;
	this.color = [color[0], color[1], color[2], color[3]];
	this.type = type;
	this.size = size;
	this.alive = true;
	this.life = life;
	this.param1 = 0;
	this.param2 = Math.floor(Math.random() * 360);
	this.param3 = 0;
	switch(this.type){
		case 2:
			this.param3 = this.speed;
			break;
	}
}

Enemy.prototype.update = function(character, fires){
	var i, j, k;
	var a = Math.abs;
	var m = 3;
	this.param1++;
	this.param2++;
	if(this.life < 0 && this.alive){
		character.score++;
		character.scoreValue += 1 + character.gage * character.gage;
		this.alive = false;
		audioCtr.src[2].play();
		for(i = 0, j = fires.length; i < j; i++){
			if(!fires[i].alive){
				fires[i].init(this.position.x, this.position.y);
				return;
			}
		}
		return;
	}
	switch(this.type){
		case 0:
			this.param2--;
			this.position.x += this.vector.x * this.speed;
			this.position.y += this.vector.y * this.speed;
			this.position.z += this.vector.z * this.speed;
			break;
		case 1:
			this.param2 += 9;
			var v = new Vec();
			v.x = character.position.x - this.position.x;
			v.y = character.position.y - this.position.y;
			this.vector.x += v.x * 0.01;
			this.vector.y += v.y * 0.01;
			this.vector.normalize();
			this.position.x += this.vector.x * this.speed;
			this.position.y += this.vector.y * this.speed;
			this.position.z += this.vector.z * this.speed;
			break;
		case 2:
			if((this.param2 % 250) === 0){
				this.vector.x = character.position.x - this.position.x;
				this.vector.y = character.position.y - this.position.y;
				this.vector.normalize();
				this.speed = this.param3;
			}else{
				this.speed *= 0.98;
			}
			this.position.x += this.vector.x * this.speed;
			this.position.y += this.vector.y * this.speed;
			this.position.z += this.vector.z * this.speed;
			break;
		case 3:
			this.param2 += 5;
			this.position.x += this.vector.x * this.speed;
			this.position.y += this.vector.y * this.speed;
			this.position.z += this.vector.z * this.speed;
			break;
		default :
			this.position.x += this.vector.x * this.speed;
			this.position.y += this.vector.y * this.speed;
			this.position.z += this.vector.z * this.speed;
			break;
	}
	if(this.param1 > 25){
		if(a(this.position.x) > 4.8 || a(this.position.y) > 4.8){
			this.alive = false;
		}
	}
};

// fire
function Fire(){
	this.position = new Vec();
	this.alive = false;
	this.param = 0;
	this.size = 0;
	this.max = 2;
	this.chain = 0;
}

Fire.prototype.init = function(x, y){
	this.position.x = x;
	this.position.y = y;
	this.alive = true;
	this.param = 0;
	this.size = 0.5;
	this.chain = 0;
}

Fire.prototype.update = function(character, enemys){
	var i, j, k;
	var x, y;
	if(!this.alive){return;}
	character.fireCheck++;
	this.param++;
	if(this.param > 60){
		this.alive = false;
	}else{
		if(!character.alive){return;}
		for(i = 0, j = enemys.length; i < j; i++){
			if(enemys[i].alive){
				x = enemys[i].position.x - this.position.x;
				y = enemys[i].position.y - this.position.y;
				k = Math.sqrt(x * x + y * y);
				if(k < this.size + enemys[i].size){
					if(this.chain < this.max){
						if(enemys[i].param1 > 75){
							enemys[i].life--;
							if(enemys[i].life === 0){
								this.chain++;
								character.gage = Math.min(character.gage + 1, 10);
							}
						}
					}
				}
			}
		}
	}
}
