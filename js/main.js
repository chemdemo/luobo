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
	objOnHand: '',//��ǰ�������ŵġ���Ʒ����
	emptys: 0,//��ͼ�����еĿյ�Ԫ��
	wipeQueue: [],//�������ĵ�Ԫ���б�
	isMousedown: false,//��ʾ���mouseoverһ����Ԫ��֮��ʱ����
	//currSearch: null,//��ǰ����search�ĵ�Ԫ��
	focusCell: null//��굱ǰ���ڵĵ�Ԫ������ƿ�ʱ��ͨ���Ƚ�currSearch��focusCellģ�ⵥԪ���mouseout�¼�
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
	
	this.blink = function() {//���ϵز���&�ػ棬�γ�һ�֡�������Ч��
		var img = null,
			tp = '',
			blinkCounts = 5;//��ࡰ������5��
		
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
		
		if(!Game.isMousedown) {//ֹͣ��������ʱ����������������û���£����ػ�
			_draw(this.type);
		}
	};
	
	this.upgrade = function(n) {
		var level = Game.levelMap[this.type],
			limit = 5 - level,//��������limit��
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
	cellPadding: 10,//cell�ڱ߾�
	gap: 8,//cell֮��ļ��
	cells: [],
	stones: 3,//һ��ʼʱ��3��ʯͷ��������5��
	plants: 8,//һ��ʼӵ�е�ֲ������������10��
	plantsNames: ['flower', 'luobo', 'tree', 'house'],//��Ϸ��ʼʱ��䵽��ƺ�е�ֲ��
	analysis: function(map) {//������ͼ
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
			stoneList.splice(getRandomNum(stoneList.length), 1);//���ѡ��һ����ȥ��
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
			mp = maps[getRandomNum(maps.length)];//�����ͼ
			
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
	if(x > Game.map.cols-1 || x < 0 || y < 0 || y > Game.map.rows-1) {//�߽��ж�
		return null;
	}
	
	return Game.map.cells[x][y];
};

Game.search = function(origin) {//�������������ĸ���
	var type = Game.objOnHand,
		wipeQueue = [],
		getRounds = function(begin, ignore) {//��ȡĿ��cell��Χ������ͬ��cell��ignoreѡ��Ϊ��������
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
		
		if(_len == 1) {//����ֻ������1
			wipeQueue.push(cells);
			wipeQueue = _.flatten(wipeQueue);
			
			if(l == 1) {
				wipeQueue.push(cell);
			}
		}
	});
	
	wipeQueue = _.union(wipeQueue);//����Ψһ��
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

Game.update = function() {//�����˹����ų��ֵĸ���
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
		
		if(cell !== Game.focusCell && Game.wipeQueue.length > 1 && !Game.isMousedown) {//��һ���������ƿ�ʱ����������ڡ��������ĸ��ӣ��������Щ���ӵġ�������
			_.forEach(Game.wipeQueue, function(cell) {
				cell.stopBlink();
			});
		}
		Game.wipeQueue = [];
		
		if(Game.objOnHand !== 'trowel' && cell.type === 'empty') {//������ɵĲ��ǲ�����cellΪ��
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
		if(Game.objOnHand !== 'trowel') {//������ɵĲ��ǲ���
			if(cell.type === 'empty') {//cellΪ��
				cell.draw(Game.objOnHand);
				Game.isMousedown = true;
				Game.wipe(cell);
				Game.emptys--;
				Game.update();
			}
		} else {//����
			if(cell.type !== 'empty') {//cell��Ϊ��
				Game.score -= cell.score;
				cell.draw('empty');//���cell
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
		
		if(Game.objOnHand !== 'trowel') {//������ɵĲ��ǲ���
			if(cell.type === 'empty') {//cellΪ��
				cell.draw(Game.objOnHand);
				Game.emptys--;
				Game.wipe(cell);
				Game.update();
			}
		} else {//����
			if(cell.type !== 'empty') {//cell��Ϊ��
				Game.score -= cell.score;
				cell.draw('empty');//���cell
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