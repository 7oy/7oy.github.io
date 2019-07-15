"use strict";

let main={
body:null,
form:null,
address:'https://script.google.com/macros/s/AKfycbwqcH-Hzjml-mqk_PMOG-FZleVFhk27oiVxhApMgSPM1Zq4zg/exec',
text:null,
show:null,
link:null,
load(){ //инициализация модуля ошибок
	const self=$.bind_all(main);
	self.body=$.tag('body');

	if((window.location.search.length==0)||(window.location.search.length<5))$.event('a',self.body,'click',self.click_form_encode);//обработчик для клика на верхней правой части экрана
	else if(window.location.search.length>100) _fail.red('Превышен размер переданных данных!');
	else self.direction_decode(window.location.search);
},
direction_decode(text){//функция получающая сообщение и декодирующее его если есть пароль
	const find=text.substr(1,4);
	$.ajax(this.address,{find:find})
	.then(response =>{
		if('result' in response){
			this.text=this.form.textarea.value=response.result;
			if(text.length>5) this.click_decode();
		}
		else if('error' in response)throw new Error(response.error);
		this.show_wait(0);
		})
	.catch(error =>{
		_fail.red(error);
		this.show_wait(0);
	});
	this.layout();//создаем форму
	this.form.button.innerText='Декодировать';//обзываем кнопку
	if(text.length>5)this.form.text.value=text.substr(5,text.length);//записываем пароль(если есть) в форму
	$.event('a',this.form.button,'click',this.click_decode);//вешаем обработчик на кнопку для расшифровки
	this.show_wait(1);
},
click_encode(){
	if((this.form.text.value.length==0)||(this.form.textarea.value.length==0))_fail.red('Необходимые данные для отправки данных отсутсвуют!');
	else{
		const message=this.encrypt(this.form.text.value,this.form.textarea.value);
		this.show_wait(1);
		$.ajax(this.address,{set:message})
		.then(response =>{
			if('id' in response)this.show_result(response.id);
			else if('error' in response)throw new Error(response.error);	
		})
		.catch(error =>{
			_fail.red(error);
			this.show_wait(0);
		});
	};
},
click_decode(){//при нажатии по кнопке декодирует сообщение
	if((this.form.text.value.length==0)||(this.text==null)) _fail.red('Необходимые данные для рассшифровки отсутсвуют!');
	else this.form.textarea.value=this.decrypt(this.form.text.value,this.text);
},
click_form_encode(){//обработчик клика для создания формы кодирования
	const width=$.property(event.target).width;
	const height=$.property(event.target).height;
	const x=event.offsetX;
	const y=event.offsetY;
	if((width>300)&&(height>300)){
		if((x<300)&&(y<300)){
			this.form_encode();
		};
	};
},
form_encode(){//форма кодирования
	$.event('r',this.body,'click',this.click_form_encode);
	this.layout();
	this.form.button.innerText='Кодировать';
	$.event('a',this.form.button,'click',this.click_encode);//вешаем обработчик на кнопку для расшифровки
},
layout(){//макет на основе которого создается формы
	const form=$.box({array:['class','form'],node:this.body,text:`<div class='text'><input type='text' id='text_1' placeholder=' ' data-caret><label for='text_1' data-title='Пароль'></label></div><div class='textarea'><textarea rows='4' placeholder=' ' data-caret></textarea><div data-title='Текст'></div></div><button>Действие</button>`});//контейнер для формы
	this.form={
		text:$.css(`input[type='text']`,form),
		textarea:$.tag('textarea',form),
		button:$.tag('button',form),
	}
},
show_wait(i){//показывает/скрывает экран ожидания
	if(this.show==null)this.show=$.box({array:[['class','fill'],['date-icon','turn']],node:this.body,text:``});//контейнер для заливки
	if(i==1) this.show.classList.add('show');
	else if(i==0) this.show.classList.remove('show');
},
show_result(link){//выводит ссылку для сообщения
	let actual=window.location.origin+'?'+link;
	actual=actual.substr(8,actual.length);
/**///const actual='file:///'+window.location.pathname.substr(1,window.location.pathname.length)+'?'+link;//для ДОМА
	this.show.classList.add('not');
	this.link=$.box({array:['class','link'],node:this.body,text:actual});//контейнер для заливки
},
ingot(password, length, mark=0){//функция заготовки создает на основе password и length хеш заданной длины, mark учитывает длину маркера окончания строки
	if(mark) length+=10;
	let n=Math.ceil((length)/128);
	let text='';
	for(let i=1;i<=n;i++){
		if(i==1)text+=sha512.go(password);
		else text+=sha512.go(text);
	};
	return text;
},
encrypt(password,text){
	text.normalize();
	let string='';
	for(let i=0;i<text.length;i++){
		let sign=text.charCodeAt(i);
		if(sign>65535)sign=32;//если больше то забиваем пробелом
		string+=((sign).toString(16)).padStart(4,'0');
	};
	let mask=this.ingot(password,string.length,1);//создаем маску на основе пароля
	string=string.padEnd(mask.length,mask);//добиваем текст до длины маски
	let result_string='';
	for(let i=0;i<mask.length;i++){//накладываем маску на текст
		result_string+=(parseInt(mask[i],16)^parseInt(string[i],16)).toString(16);
	};
	return result_string;
},
decrypt(password,text){
	let mask=this.ingot(password,text.length);//создаем маску на основе пароля
	let string='';
	for(let i=0;i<mask.length;i++){//накладываем маску на текст
		string+=(parseInt(mask[i],16)^parseInt(text[i],16)).toString(16);
	};
	let index=string.indexOf(mask.substr(0,10));
	if(index==-1) return this.text;
	string=string.substr(0,index);
	let result_string='';
	for(let i=0;i<string.length;i+=4){
		let sign=parseInt(string.substr(i,4),16);
		result_string+=String.fromCharCode(sign);
	};
	return result_string;
},
};

let $={ //Объект упрощающий жизнь
id(id){return document.getElementById(id);}, //определение объекта по id
tag(tag,object){return (object || document).getElementsByTagName(tag)[0];}, //определение объекта по тегу
css(selector,object){return (object || document).querySelector(selector)},
event(...array){//навешивает, удаляет события скопом и поодиночке
//$.event(['a',self.window,'mouseup',self.stop_move],[])//обработчик для окончания перемещения
		//передавать (a/r), obj, action, function
	const a=typeof array[0]==='string'?[array]:array;
	a.forEach((x)=>{
			switch(x[0]){
				case 'a':x[1].addEventListener(x[2],x[3]);
				break;
				case 'r':x[1].removeEventListener(x[2],x[3]);
				break;
				default: _fail.red("Для назначения события передан не тот параметр"); return;
			}
	});
},
bind_all(obj){
	for(var prop in obj) if (typeof obj[prop] == 'function') obj[prop]=obj[prop].bind(obj);
	return obj;
},
box(obj){//создание и вставка узла
//передавать {array,node,text}
	const c=document.createElement('div');
	if('array' in obj){//если есть массив со значениями атрибутов
		const a=typeof obj.array[0]==='string'?[obj.array]:obj.array;
		a.forEach(x=>c.setAttribute(x[0],x[1]));
	}
	if('text' in obj) c.innerHTML=obj.text;
	if('node' in obj) return obj.node.appendChild(c);
	else return c; 
},
async ajax(url,obj=0){//AJAX модуль
	const controller=new AbortController();
	const signal=controller.signal;
	setTimeout(() => controller.abort(), 20000);
	const options={
		method:'post',
		headers:{'Content-type':'application/json; charset=utf-8','Accept': 'application/json','X-Requested-With': 'XMLHttpRequest'},
		cache:'no-cache',
		body:JSON.stringify(obj),
		signal
	}
	const response=await fetch('https://cors-anywhere.herokuapp.com/'+url,options);
	if(!response.ok) throw new Error (response.status+' '+response.statusText);
	const text=await response.text();
	//if (text.toLowerCase().indexOf("error")!=-1) throw new Error(text); //проверяем проблемы
	const data = JSON.parse(text);
	if(data.alert) throw new Error(data.error); //проверяем есть ли проблемы на стороне сервера
	return data;
},
property(node){ //получает свойства элемента
	const box = node.getBoundingClientRect();
	return{
		top: box.top+pageYOffset,
		left: box.left+pageXOffset,
		width: box.width,
		height: box.height,
		right: box.right+pageXOffset,
		bottom: box.bottom+pageYOffset
	};
},
};

let _fail={//Модуль ошибок
node:null,
load(){ //инициализация модуля ошибок
	const self=$.bind_all(_fail);
	self.node=$.id('alarm_info');
	$.event('a',self.node,'click',self.delete);
},
red(text){ this.timer(this.output(text,'red_report'));},//ошибка
green(text){ this.timer(this.output(text,'green_report'));},//информационное сообщение
orange(text){ this.output(text,'orange_report');},//важное сообщение
timer(node){ //ставит таймер на удаление сообщения
	const timer = setInterval(()=> {
	  if(!node) clearInterval(timer);
	  else if(!+window.getComputedStyle(this.node).counterReset[6]){//если курсор не наведен то удаляет
		node.remove();  
		clearInterval(timer);  
	  }
	}, 5000);	
},
output(text,color){ //создает сообщение о ошибке
	switch(color){ 
	case 'red_report': console.error(text); break;
	case 'green_report': console.info(text); break;
	case 'orange_report': console.warn(text); break;
	}
	if(this.node!=0) return $.box({array:['class',color],node:this.node,text:text+'<div date-icon="cross"></div>'});
	else return 0;
},
delete(){ //удаляет сообщение по клику
	if(event.target.hasAttribute('date-icon')) event.target.parentNode.remove();
},
};

let sha512={//(str) 
	charsize:8,
/**/int64:function(msint_32, lsint_32){//переделать на ES6
		this.highOrder = msint_32;
		this.lowOrder = lsint_32;
	},
	load(){ //инициализация модуля ошибок
		$.bind_all(sha512);
	},
	utf8_encode(str){
		return unescape(encodeURIComponent(str));
	},
	str2binb(str){
		let bin=[];
		const charsize=this.charsize,
			mask=(1<<charsize)-1,
			len=str.length*charsize;
		for(let i=0;i<len;i+=charsize){
			bin[i>>5]|=(str.charCodeAt(i/charsize)&mask)<<(32-charsize-(i%32));
		}
		return bin;
	},
	binb2hex(binarray){
		const hex_tab='0123456789abcdef';
		let str='';
		const length=binarray.length * 4;
		let srcByte;
		for(let i=0;i<length;i+=1){
			srcByte=binarray[i>>2]>>((3-(i%4))*8);
			str+=hex_tab.charAt((srcByte>>4)&0xF)+hex_tab.charAt(srcByte&0xF);
		}
		return str;
	},
	safe_add_2(x,y){
		let lsw,
		msw,
		lowOrder,
		highOrder;
		lsw=(x.lowOrder&0xFFFF)+(y.lowOrder&0xFFFF);
		msw=(x.lowOrder>>>16)+(y.lowOrder>>>16)+(lsw>>>16);
		lowOrder=((msw&0xFFFF)<<16)|(lsw&0xFFFF);
		lsw=(x.highOrder&0xFFFF)+(y.highOrder&0xFFFF)+(msw>>>16);
		msw=(x.highOrder>>>16)+(y.highOrder>>>16)+(lsw>>>16);
		highOrder=((msw&0xFFFF)<<16)|(lsw&0xFFFF);
		return new this.int64(highOrder,lowOrder);
	},
	safe_add_4(a,b,c,d){
		let lsw,
		msw,
		lowOrder,
		highOrder;
		lsw=(a.lowOrder&0xFFFF)+(b.lowOrder&0xFFFF)+(c.lowOrder&0xFFFF)+(d.lowOrder&0xFFFF);
		msw=(a.lowOrder>>>16)+(b.lowOrder>>>16)+(c.lowOrder>>>16)+(d.lowOrder>>>16)+(lsw>>>16);
		lowOrder=((msw&0xFFFF)<<16)|(lsw&0xFFFF);
		lsw=(a.highOrder&0xFFFF)+(b.highOrder&0xFFFF)+(c.highOrder&0xFFFF)+(d.highOrder&0xFFFF)+(msw>>>16);
		msw=(a.highOrder>>>16)+(b.highOrder>>>16)+(c.highOrder>>>16)+(d.highOrder>>>16)+(lsw>>>16);
		highOrder=((msw&0xFFFF)<<16)|(lsw&0xFFFF);
		return new this.int64(highOrder, lowOrder);
	},
	safe_add_5(a,b,c,d,e){
		let lsw,
		msw,
		lowOrder,
		highOrder;
		lsw=(a.lowOrder&0xFFFF)+(b.lowOrder&0xFFFF)+(c.lowOrder&0xFFFF)+(d.lowOrder&0xFFFF)+(e.lowOrder&0xFFFF);
		msw=(a.lowOrder>>>16)+(b.lowOrder>>>16)+(c.lowOrder>>>16)+(d.lowOrder>>>16)+(e.lowOrder>>>16)+(lsw>>>16);
		lowOrder=((msw&0xFFFF)<<16)|(lsw&0xFFFF);
		lsw=(a.highOrder&0xFFFF)+(b.highOrder&0xFFFF)+(c.highOrder&0xFFFF)+(d.highOrder&0xFFFF)+(e.highOrder&0xFFFF)+(msw>>>16);
		msw=(a.highOrder>>>16)+(b.highOrder>>>16)+(c.highOrder>>>16)+(d.highOrder>>>16)+(e.highOrder>>>16)+(lsw>>>16);
		highOrder=((msw&0xFFFF)<<16)|(lsw&0xFFFF);
		return new this.int64(highOrder, lowOrder);
	},
	maj(x,y,z){
		return new this.int64(
			(x.highOrder&y.highOrder)^(x.highOrder&z.highOrder)^(y.highOrder&z.highOrder),
			(x.lowOrder&y.lowOrder)^(x.lowOrder&z.lowOrder)^(y.lowOrder&z.lowOrder));
	},
	ch(x,y,z){
		return new this.int64(
			(x.highOrder&y.highOrder)^(~x.highOrder&z.highOrder),
			(x.lowOrder&y.lowOrder)^(~x.lowOrder&z.lowOrder));
	},
	rotr(x,n){
		if(n<=32){
			return new this.int64(
				(x.highOrder>>>n)|(x.lowOrder<<(32-n)),
				(x.lowOrder>>>n)|(x.highOrder<<(32-n)));
		} else{
			return new this.int64(
				(x.lowOrder>>>n)|(x.highOrder<<(32-n)),
				(x.highOrder>>>n)|(x.lowOrder<<(32-n)));
		}
	},
	sigma0(x){
		const rotr28=this.rotr(x,28),
			rotr34=this.rotr(x,34),
			rotr39=this.rotr(x,39);
		return new this.int64(
			rotr28.highOrder^rotr34.highOrder^rotr39.highOrder,
			rotr28.lowOrder^rotr34.lowOrder^rotr39.lowOrder);
	},
	sigma1(x){
		const rotr14=this.rotr(x,14),
			rotr18=this.rotr(x,18),
			rotr41=this.rotr(x,41);
		return new this.int64(
			rotr14.highOrder^rotr18.highOrder^rotr41.highOrder,
			rotr14.lowOrder^rotr18.lowOrder^rotr41.lowOrder);
	},
	gamma0(x){
		const rotr1=this.rotr(x,1),
			rotr8=this.rotr(x,8),
			shr7=this.shr(x,7);
		return new this.int64(
			rotr1.highOrder^rotr8.highOrder^shr7.highOrder,
			rotr1.lowOrder^rotr8.lowOrder^shr7.lowOrder);
	},
	gamma1(x){
		const rotr19=this.rotr(x,19),
			rotr61=this.rotr(x,61),
			shr6=this.shr(x,6);
		return new this.int64(
			rotr19.highOrder^rotr61.highOrder^shr6.highOrder,
			rotr19.lowOrder^rotr61.lowOrder^shr6.lowOrder);
	},
	shr(x,n){
		if(n<=32){
			return new this.int64(
				x.highOrder>>>n,
				x.lowOrder>>>n|(x.highOrder<<(32-n)));
		} else{
			return new this.int64(
				0,
				x.highOrder<<(32-n));
		}
	},
	go(str){
	const int64=this.int64,
		safe_add_2=this.safe_add_2;//.bind(this);
	let H=[new int64(0x6a09e667, 0xf3bcc908), new int64(0xbb67ae85, 0x84caa73b),
		new int64(0x3c6ef372, 0xfe94f82b), new int64(0xa54ff53a, 0x5f1d36f1),
		new int64(0x510e527f, 0xade682d1), new int64(0x9b05688c, 0x2b3e6c1f),
		new int64(0x1f83d9ab, 0xfb41bd6b), new int64(0x5be0cd19, 0x137e2179)],
	K=[new int64(0x428a2f98, 0xd728ae22), new int64(0x71374491, 0x23ef65cd),
		new int64(0xb5c0fbcf, 0xec4d3b2f), new int64(0xe9b5dba5, 0x8189dbbc),
		new int64(0x3956c25b, 0xf348b538), new int64(0x59f111f1, 0xb605d019),
		new int64(0x923f82a4, 0xaf194f9b), new int64(0xab1c5ed5, 0xda6d8118),
		new int64(0xd807aa98, 0xa3030242), new int64(0x12835b01, 0x45706fbe),
		new int64(0x243185be, 0x4ee4b28c), new int64(0x550c7dc3, 0xd5ffb4e2),
		new int64(0x72be5d74, 0xf27b896f), new int64(0x80deb1fe, 0x3b1696b1),
		new int64(0x9bdc06a7, 0x25c71235), new int64(0xc19bf174, 0xcf692694),
		new int64(0xe49b69c1, 0x9ef14ad2), new int64(0xefbe4786, 0x384f25e3),
		new int64(0x0fc19dc6, 0x8b8cd5b5), new int64(0x240ca1cc, 0x77ac9c65),
		new int64(0x2de92c6f, 0x592b0275), new int64(0x4a7484aa, 0x6ea6e483),
		new int64(0x5cb0a9dc, 0xbd41fbd4), new int64(0x76f988da, 0x831153b5),
		new int64(0x983e5152, 0xee66dfab), new int64(0xa831c66d, 0x2db43210),
		new int64(0xb00327c8, 0x98fb213f), new int64(0xbf597fc7, 0xbeef0ee4),
		new int64(0xc6e00bf3, 0x3da88fc2), new int64(0xd5a79147, 0x930aa725),
		new int64(0x06ca6351, 0xe003826f), new int64(0x14292967, 0x0a0e6e70),
		new int64(0x27b70a85, 0x46d22ffc), new int64(0x2e1b2138, 0x5c26c926),
		new int64(0x4d2c6dfc, 0x5ac42aed), new int64(0x53380d13, 0x9d95b3df),
		new int64(0x650a7354, 0x8baf63de), new int64(0x766a0abb, 0x3c77b2a8),
		new int64(0x81c2c92e, 0x47edaee6), new int64(0x92722c85, 0x1482353b),
		new int64(0xa2bfe8a1, 0x4cf10364), new int64(0xa81a664b, 0xbc423001),
		new int64(0xc24b8b70, 0xd0f89791), new int64(0xc76c51a3, 0x0654be30),
		new int64(0xd192e819, 0xd6ef5218), new int64(0xd6990624, 0x5565a910),
		new int64(0xf40e3585, 0x5771202a), new int64(0x106aa070, 0x32bbd1b8),
		new int64(0x19a4c116, 0xb8d2d0c8), new int64(0x1e376c08, 0x5141ab53),
		new int64(0x2748774c, 0xdf8eeb99), new int64(0x34b0bcb5, 0xe19b48a8),
		new int64(0x391c0cb3, 0xc5c95a63), new int64(0x4ed8aa4a, 0xe3418acb),
		new int64(0x5b9cca4f, 0x7763e373), new int64(0x682e6ff3, 0xd6b2b8a3),
		new int64(0x748f82ee, 0x5defb2fc), new int64(0x78a5636f, 0x43172f60),
		new int64(0x84c87814, 0xa1f0ab72), new int64(0x8cc70208, 0x1a6439ec),
		new int64(0x90befffa, 0x23631e28), new int64(0xa4506ceb, 0xde82bde9),
		new int64(0xbef9a3f7, 0xb2c67915), new int64(0xc67178f2, 0xe372532b),
		new int64(0xca273ece, 0xea26619c), new int64(0xd186b8c7, 0x21c0c207),
		new int64(0xeada7dd6, 0xcde0eb1e), new int64(0xf57d4f7f, 0xee6ed178),
		new int64(0x06f067aa, 0x72176fba), new int64(0x0a637dc5, 0xa2c898a6),
		new int64(0x113f9804, 0xbef90dae), new int64(0x1b710b35, 0x131c471b),
		new int64(0x28db77f5, 0x23047d84), new int64(0x32caab7b, 0x40c72493),
		new int64(0x3c9ebe0a, 0x15c9bebc), new int64(0x431d67c4, 0x9c100d4c),
		new int64(0x4cc5d4be, 0xcb3e42b6), new int64(0x597f299c, 0xfc657e2a),
		new int64(0x5fcb6fab, 0x3ad6faec), new int64(0x6c44198c, 0x4a475817)],
	W=new Array(64),
	a,
	b,
	c,
	d,
	e,
	f,
	g,
	h,
	T1,
	T2;
	str=this.utf8_encode(str);
	let strlen=str.length*this.charsize;
	str=this.str2binb(str);
	str[strlen>>5]|=0x80<<(24-strlen%32);
	str[(((strlen+128)>>10)<<5)+31]=strlen;
	for(let i=0;i<str.length;i+=32){
		a=H[0];
		b=H[1];
		c=H[2];
		d=H[3];
		e=H[4];
		f=H[5];
		g=H[6];
		h=H[7];
		for(let j=0;j<80;j++){
			if (j<16){
				W[j]=new int64(str[j*2+i],str[j*2+i+1]);
			} else{
				W[j]=this.safe_add_4(this.gamma1(W[j-2]),W[j-7],this.gamma0(W[j-15]),W[j-16]);
			}
			T1=this.safe_add_5(h,this.sigma1(e),this.ch(e,f,g),K[j],W[j]);
			T2=safe_add_2(this.sigma0(a),this.maj(a,b,c));
			h=g;
			g=f;
			f=e;
			e=safe_add_2(d,T1);
			d=c;
			c=b;
			b=a;
			a=safe_add_2(T1,T2);
		}
		H[0]=safe_add_2(a,H[0]);
		H[1]=safe_add_2(b,H[1]);
		H[2]=safe_add_2(c,H[2]);
		H[3]=safe_add_2(d,H[3]);
		H[4]=safe_add_2(e,H[4]);
		H[5]=safe_add_2(f,H[5]);
		H[6]=safe_add_2(g,H[6]);
		H[7]=safe_add_2(h,H[7]);
	}
	let binarray=[];
	for(let i=0;i<H.length;i++){
		binarray.push(H[i].highOrder);
		binarray.push(H[i].lowOrder);
	}
	return this.binb2hex(binarray);
},
};

(()=>{ //функция для автоматического запуска модулей
/**///$.load();
	const run=()=>{
		$.event('r',document,'DOMContentLoaded',run);
		const date=[
			_fail.load,
			sha512.load,
			main.load,
			//_authorization.load,
			//_climate.load,
			//()=>$.event('a',$.css("[date-icon='key']"),'click',()=>$.import('_gen_pass')),
			//()=>$.event('a',$.css("[date-icon='compass']"),'click',()=>$.import('_note'))
			];
			Promise.all(date.map(Function=>Function()))//промисс параллельного выполнения, метод map проходит по принимаемому массиву и выполняет указанную функцию над каждым элементом 
			.catch(error =>console.error('load error'));	
	}
	$.event('a',document,'DOMContentLoaded',run);
})();
