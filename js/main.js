var Game = {
	gameBox: $('game'),
	canvas: $('canvas'),
	scoreBox: $('score'),
	urls: ['empty.png', 'stone.png', 'trowel.png', 'flower.png', 'luobo.png', 'tree.png', 'house.png',  'apartment.png'],
	imgObj: {},
	score: 0,
	levelMap: {
		'flower': 1,
		'luobo': 2,
		'tree': 3,
		'house': 4,
		'apartment': 5
	},
	objOnHand: '',//当前手中拿着的“物品”名
	emptys: 0,//地图上所有的空单元格
	wipeQueue: [],//可消除的单元格列表
	isMousedown: false,//标示鼠标mouseover一个单元格之后时候按下
	//currSearch: null,//当前正在search的单元格
	focusCell: null//鼠标当前所在的单元格当鼠标移开时，通过比较currSearch和focusCell模拟单元格的mouseout事件
};

Game.getImages = function(callback) {
	var imgs = Game.urls,
		count = 0;
	
	for(var i=0, l=imgs.length; i<l; i++) {
		var img = new Image(),
			src = imgs[i],
			name = src.slice(0, src.lastIndexOf('\.'));
			
		Game.imgObj[name] = img;
		
		img.onload = function() {
			this.onload = null;
			++count;
			callback && callback(count);
		}
		
		img.src = 'images/' + src;
	}
};
	
Game.setScore = function() {
	Game.scoreBox.innerHTML = Game.score;
}

Game.Cell = function(x, y) {
	var self = this,
		startX = Game.map.startX,
		startY = Game.map.startY,
		gap = Game.map.gap,
		pd = Game.map.cellPadding,
		ctx = Game.canvas.getContext('2d'),
		_draw = function(tp) {
			var img = Game.imgObj['empty'];
		
			ctx.beginPath();
			ctx.save();
			ctx.translate(self.x, self.y);
			ctx.clearRect(0, 0, self.width, self.width);
			ctx.drawImage(img, 0, 0, img.width, img.height, pd, pd, self.width-pd, self.height-pd);
			if('empty' !== tp) {
				img = Game.imgObj[tp];
				ctx.drawImage(img, 0, 0, img.width, img.height, pd, pd, self.width-pd, self.height-pd);
			}
			ctx.restore();
		};
	
	this.x = x;
	this.y = y;
	this.height = this.width = Game.map.cellWidth;
	
	this.coord = {x: (this.x-startX)/(this.width+gap), y: (this.y-startY)/(this.height+gap)};
	
	this.draw = function(type) {
		_draw(type);
		
		this.type = type;
		var num = Game.levelMap[this.type];
		this.score = !isNaN(num) ? Math.pow(3, num-1) : 0;
		
		//this.imgObj = img;
	};
	
	this.blink = function() {//不断地擦出&重绘，形成一种“闪动”效果
		var img = null,
			tp = '',
			blinkCounts = 5;//最多“闪动”5次
		
		this.blinkTimer = setInterval(function() {
			if(blinkCounts <= 0) {
				self.stopBlink();
			}
			
			tp = (--blinkCounts%2) ? self.type : 'empty';
			_draw(tp);
		}, 100);
	};
	
	this.stopBlink = function() {
		clearInterval(this.blinkTimer);
		this.blinkTimer = null;
		
		if(!Game.isMousedown) {//停止“闪动”时，如果被擦除且鼠标没按下，则重绘
			_draw(this.type);
		}
	};
	
	this.upgrade = function(n) {
		var level = Game.levelMap[this.type],
			limit = 5 - level,//最多可能升limit级
			num = Math.min(limit, n),
			mp = objSwap(Game.levelMap);
			
		if(num) {
			var type = mp[num+level];
			
			this.draw(type);
			Game.score += this.score;
			
			Game.wipe(this);
		}
	};
};

Game.map = {
	startX: 10,
	startY: 15,
	rows: 6,
	cols: 6,
	//width: 600,
	//height: 600,
	cellWidth: 90,
	cellPadding: 10,//cell内边距
	gap: 8,//cell之间的间距
	cells: [],
	stones: 3,//一开始时有3个石头，不超过5个
	plants: 8,//一开始拥有的植物数，不超过10个
	plantsNames: ['flower', 'luobo', 'tree', 'house'],//游戏开始时填充到草坪中的植物
	analysis: function(map) {//解析地图
		var stoneList = [],
			plantList = [];
		
		_.forEach(map, function(list, i) {
			_.forEach(list, function(p, j) {
				if(p === 1) {
					stoneList.push({x: i, y: j});
				}
				if(p === 2) {
					plantList.push({x: i, y: j});
				}
			});
		});
		
		var n1 = stoneList.length - this.stones, n2 = plantList.length - this.plants;
		
		while(n1--) {
			stoneList.splice(getRandomNum(stoneList.length), 1);//随机选出一个来去除
		}
		
		while(n2--) {
			plantList.splice(getRandomNum(plantList.length), 1);
		}
		
		_.forEach(stoneList, function(p, i) {
			var cell = Game.getCell(p.x, p.y);
			
			cell.draw('stone');
		});
		
		_.forEach(plantList, function(p, i) {
			var cell = Game.getCell(p.x, p.y),
				ns = this.plantsNames,
				name = ns[getRandomNum(ns.length)];
			
			cell.draw(name);
			Game.score += cell.score;
		}, this);
		
		Game.setScore();
	},
	draw: function() {
		var ctx = Game.canvas.getContext('2d'),
			w = this.cellWidth,
			mp = maps[getRandomNum(maps.length)];//随机地图
			
		for(var i=0; i<this.rows; i++) {
			var arr = [];
			for(var j=0; j<this.cols; j++) {
				//var cell = new Game.Cell(this.startX+i*w, this.startY+j*w);
				var cell = new Game.Cell(this.startX+i*(w+this.gap), this.startY+j*(w+this.gap));
				
				cell.draw('empty');
				arr.push(cell);
				Game.emptys++;
			}
			this.cells.push(arr);
		}
		
		this.analysis(mp);
	}
};

Game.getCell = function(x, y) {
	if(x > Game.map.cols-1 || x < 0 || y < 0 || y > Game.map.rows-1) {//边界判断
		return null;
	}
	
	return Game.map.cells[x][y];
};

Game.search = function(origin) {//搜索可以消除的格子
	var type = Game.objOnHand,
		wipeQueue = [],
		getRounds = function(begin, ignore) {//获取目标cell周围的所有同类cell，ignore选项为过滤条件
			var x = begin.coord.x,
				y = begin.coord.y,
				cell = null,
				rel = [];
				
			ignore = ignore || 'undefined';
			_([[x, y-1], [x+1, y], [x, y+1], [x-1, y]]).forEach(function(dir, i) {
				cell = Game.getCell(dir[0], dir[1]);
				
				if(cell && cell.type === type) {
					if(ignore != 'undefined' && ignore != cell || ignore == 'undefined') {
						rel.push(cell);
					}
				}
			});
			
			return rel;
		},
		rounds = getRounds(origin),
		gradeCount = 0;
	
	if(type === 'apartment') {
		return;
	}
	
	var l = rounds.length;
	if(!l) {
		return;
	} else {
		if(l > 1) {
			wipeQueue.push(rounds);
			wipeQueue = _.flatten(wipeQueue);
		}
	}
	
	_.forEach(rounds, function(cell, i) {
		var cells = getRounds(cell, origin),
			_len = cells.length;
		
		if(_len == 1) {//这里只可能是1
			wipeQueue.push(cells);
			wipeQueue = _.flatten(wipeQueue);
			
			if(l == 1) {
				wipeQueue.push(cell);
			}
		}
	});
	
	wipeQueue = _.union(wipeQueue);//数组唯一化
	if(wipeQueue.length > 1) {
		_.forEach(wipeQueue, function(cell, i) {
			cell.blink();
		});
	}
	Game.wipeQueue = wipeQueue;
	//log(Game.wipeQueue)
};

Game.wipe = function(origin) {
	var len = Game.wipeQueue.length,
		gradeCount = 0;
	
	if(len > 1) {
		_.forEach(Game.wipeQueue, function(cell) {
			Game.score += cell.score;
			cell.stopBlink();
			cell.draw('empty');
			Game.emptys++;
		});
		Game.wipeQueue = [];
		
		gradeCount = Math.floor(len / 2);
		origin.upgrade(gradeCount);
	}
};

Game.update = function() {//这里人工干扰出现的概率
	var list = ['house', 'tree', 'luobo', 'flower', 'luobo', 'tree', 'flower', 'luobo', 'flower', 'house', 'luobo', 'tree', 'flower', 'trowel', 'flower'],
		n = getRandomNum(list.length),
		name = list[n];
			
	if(Game.emptys === 0) {
		Game.over();
		return;
	}
	
	Game.canvas.style.cursor = 'url(images/'+name+'.png), hand';
	Game.objOnHand = name;
	Game.setScore();
};

Game.events = {
	onmousemove: function(e) {//log('move')
		var x = e.offsetX,
			y = e.offsetY,
			startX = Game.map.startX,
			startY = Game.map.startY,
			gap = Game.map.gap,
			w = Game.map.cellWidth,
			cell = null;
		
		Game.isMousedown = false;
		
		x = Math.floor((x-startX)/(w+gap));
		y = Math.floor((y-startY)/(w+gap));
		cell = Game.getCell(x, y);
		
		if(!cell || cell === Game.focusCell) {
			return;
		}
		
		if(cell !== Game.focusCell && Game.wipeQueue.length > 1 && !Game.isMousedown) {//从一个格子上移开时，如果还有在“闪动”的格子，则清除这些格子的“闪动”
			_.forEach(Game.wipeQueue, function(cell) {
				cell.stopBlink();
			});
		}
		Game.wipeQueue = [];
		
		if(Game.objOnHand !== 'trowel' && cell.type === 'empty') {//随机生成的不是铲子且cell为空
			Game.search(cell);
		}
		Game.focusCell = cell;
	},
	onmousedown: function(e) {
		var cell = Game.focusCell;
		
		if(!cell) {
			return;
		}
		
		//log('down: ' + Game.objOnHand)
		if(Game.objOnHand !== 'trowel') {//随机生成的不是铲子
			if(cell.type === 'empty') {//cell为空
				cell.draw(Game.objOnHand);
				Game.isMousedown = true;
				Game.wipe(cell);
				Game.emptys--;
				Game.update();
			}
		} else {//铲子
			if(cell.type !== 'empty') {//cell不为空
				Game.score -= cell.score;
				cell.draw('empty');//清空cell
				Game.emptys++;
				Game.update();
			}
		}
	},
	/*onmousedown: function(e) {
		var x = e.offsetX,
			y = e.offsetY,
			startX = Game.map.startX,
			startY = Game.map.startY,
			gap = Game.map.gap,
			w = Game.map.cellWidth,
			cell = null;
		
		x = Math.floor((x-startX)/(w+gap));
		y = Math.floor((y-startY)/(w+gap));
		cell = Game.getCell(x, y);
		
		if(!cell) {
			return;
		}
		
		if(Game.objOnHand !== 'trowel') {//随机生成的不是铲子
			if(cell.type === 'empty') {//cell为空
				cell.draw(Game.objOnHand);
				Game.emptys--;
				Game.wipe(cell);
				Game.update();
			}
		} else {//铲子
			if(cell.type !== 'empty') {//cell不为空
				Game.score -= cell.score;
				cell.draw('empty');//清空cell
				Game.emptys++;
				Game.update();
			}
		}
	},*/
	onmouseup: function() {
		Game.update();
	}
};

Game.over = function() {
	removeEvt(Game.canvas, 'mousemove', Game.events.onmousemove);
	removeEvt(Game.canvas, 'mousedown', Game.events.onmousedown);
	
	alert('GAME OVER!');
};

Game.init = function() {
	Game.getImages(function(n) {
		if(n == Game.urls.length) {
			Game.map.draw();
			Game.update();
			addEvt(Game.canvas, 'mousemove', Game.events.onmousemove);
			addEvt(Game.canvas, 'mousedown', Game.events.onmousedown);
		}
	});
};