"use strict";

let main={
body:null, //ссылка на тело страницы
form:null,
address:'https://script.google.com/macros/s/AKfycbxkCdqx84NGqlYgyYGpGn8UJD_1N-iD-nBo2UqkZDAyzX08iNAYY-9RLDwrK4uHH2U/exec', //адрес макроса выдачи/записи данных
text:null,
show:null,
link:null,
load(){ //инициализация модуля ошибок
	const self=$.bind_all(main); //биндим объект, чтобы в функциях можно было использовать "this"
	self.body=$.tag('body'); //заносим в объект ссылку на тело ("body") страницы

	if((window.location.search.length==0)||(window.location.search.length<5))$.event('a',self.body,'click',self.load_encode);/*обработчик для клика на верхней правой части экрана, навешивается для входа на страницу на которой создаем запись*/
	else if(window.location.search.length>100) _fail.red('Превышен размер переданных данных!');
	else self.load_decode(window.location.search); //выполняется для входа на страницу на которой получаем и дешифруем запись
},
load_decode(text){//функция запроса сообщения и его декодировки
	const find=text.substring(1,5); //отпиливаем от адреса 4 символа, начиная с 1 ("0" это знак "?"), получаем идентификатор записи в базе 
	$.ajax(this.address,{find:find}) //отправляем запрос(идентификатор записи) по адресу базы данных
	.then(response =>{
		if('result' in response){ //если есть положительный ответ
			this.text=this.form.textarea.value=response.result; //записываем полученный результат в текстовое поле
			this.resize_textarea(); //корректируем размер текстового поля под текст
			if(text.length>5) this.event_decode(); //если к идентификатору записи был присоединен пароль, то запускаем расшифровку
		}
		else if('error' in response)throw new Error(response.error); //если база данных отправила ошибку
		this.wait(0);
		})
	.catch(error =>{ //обработка ошибок произошедших на сервере
		_fail.red(error);
		this.wait(0); //убираем экран ожидания
	});
	this.layout(); //вставка макета формы
	this.form.button.innerText='Декодировать'; //обзываем кнопку формы
	if(text.length>5)this.form.text.value=text.substring(5,text.length);//пишем пароль если он был, в поле пароля
	$.event(
			['a',this.form.button,'click',this.event_decode], //обработчик клика по кнопке декодировать
			['a',this.form.text,'keyup',this.event_decode] //обработчик отпускания физической кнопки "Enter" в поле ввода пароля
	);//вешаем обработчик на кнопку для расшифровки
	this.wait(1); //показываем экран ожидания, снимется асинхронно, когда придёт ответ от сервера
},
event_encode(){ //функция, которая висит на кнопке "кодировать", кодирует и отправляет сообщения на сервер
	if((this.form.text.value.length==0)||(this.form.textarea.value.length==0))_fail.red('Необходимые данные для отправки данных отсутствуют!'); //проверка на наличие дынных в текстовом поле и в поле пароля
	else{
		const message=this.encrypt(this.form.text.value,this.form.textarea.value); //кодируем текст
		this.wait(1); //показываем экран ожидания
		$.ajax(this.address,{set:message}) //отправка данных на сервер
		.then(response =>{
			if('id' in response)this.show_link(response.id); //если в ответе есть "id", то запись выполнена успешно
			else if('error' in response)throw new Error(response.error); //если в ответе есть "error", то возникли ошибки на стороне сервера
		})
		.catch(error =>{ //обработка ошибок произошедших на стороне сервера
			_fail.red(error);
			this.wait(0); //убираем экран ожидания
		});
	};
},
event_decode(){//при нажатии по кнопке декодирует сообщение
	if((event.type=='keyup')&&(event.key!='Enter')) return; //если функция вызвана отпусканием кнопки и это не "Enter" то выходим из функции 
	let temp;
	temp=(event.ctrlKey)?this.form.textarea.value:this.text; /*если нажат "Ctrl", то расшифровываем введённый текст, иначе берем раннее полученные данные с сервера(сделано, чтобы можно было расшифровывать данные не только с сервера)*/
	if((this.form.text.value.length==0)||(this.text==null)) _fail.red('Необходимые данные для расшифровки отсутствуют!');
	else {
		this.form.textarea.value=this.decrypt(this.form.text.value,temp);//this.text, расшифровка зашифрованного текста
		this.resize_textarea(); //корректируем размер текстового поля под текст
	};
},
load_encode(){//обработчик клика для вставки формы создания записи, срабатывает если кликнуть мышью в верхнем левом углу, также ширина и длина блока страницы должна быть больше 300 
	const width=$.property(event.target).width; //ширина объекта на котором сработало событие
	const height=$.property(event.target).height; //длинна объекта на котором сработало событие
	const x=event.offsetX; //координаты клика мыши от верхнего левого угла объекта на котором сработало событие
	const y=event.offsetY;
	console.log(event.target);
	console.table([width,height,x,y]);
	if((width>300)&&(height>300)&&(x<300)&&(y<300)){ //проверка на попадание в координаты
		$.event('r',this.body,'click',this.load_encode); //удаляем обработчик на вставку формы создания записи
		this.layout(); //вставка макета формы
		this.form.button.innerText='Кодировать'; //обзываем кнопку формы
		$.event('a',this.form.button,'click',this.event_encode);//вешаем обработчик на кнопку для кодирования и отправки записи на сервер
	};
},
layout(){//макет на основе которого создается формы
	const form=$.box({array:['class','form'],node:this.body,text:`<div class='text'><input type='password' id='text_1' placeholder=' ' data-caret><label for='text_1' data-title='Пароль'></label></div><div class='textarea'><textarea rows='1' placeholder=' ' data-caret></textarea><div data-title='Текст'></div></div><button>Действие</button>`});//создаем и вставляем макет в страницу
	this.form={ //создаём ссылки на макет
		text:$.css("input[type='password']",form), //ссылка на поле с паролем
		textarea:$.tag('textarea',form), //ссылка на текстовое поле
		button:$.tag('button',form), //ссылка на кнопку
	}
	$.event('a',this.form.textarea,'input',this.resize_textarea);//вешаем обработчик на textarea для автоматической подстройки размера
},
wait(i){//показывает/скрывает экран ожидания
	if(this.show==null)this.show=$.box({array:[['class','fill'],['date-icon','turn']],node:this.body,text:``});//вставка контейнера "экран ожидания" в тело страницы
	const obj=this.show.classList;
	i==1?obj.add('show'):obj.remove('show'); 
},
show_link(link){//выводит ссылку для сообщения
	let actual=window.location.origin+'?'+link; //присобачиваем идентификатор записи к адресу
	actual=actual.substring(8,actual.length); //отпиливаем "htpps://" и выводим ссылку 
/**///const actual='file:///'+window.location.pathname.substr(1,window.location.pathname.length)+'?'+link;//для ДОМА
	this.show.classList.add('not'); //убираем вращающейся элемент, но экран затемнения остается
	this.link=$.box({array:['class','link'],node:this.body,text:actual}); //вставка контейнера с адресом записи в тело страницы
},
ingot(password, length){ //функция заготовки создает на основе password и length хеш заданной длины, mark учитывает длину маркера окончания строки
	let n=length*8; //количество перестановочных шаблонов
	let hash=''; //переменная для хранения оконечного значения хэша
	let val=[]; //переменная для хранения промежуточных значений
	let array=[]; //переменная для хранения массива перестановочных шаблонов
	
	let permutation=(hash, password)=>{ //функция для создания одного перестановочного шаблона из хэш значения
		let template=''; //перестановочный шаблон
		while(!(template.length == 16)){ //цикл будет продолжаться пока размер шаблона не станет равным 16
			hash = sha512.go(password + hash); //вычисляем хэш на основе шаблона и предыдущего использованного хэша
			for(let i=0;i<hash.length;i++){ //проходим по длине хэша
				if(!template.includes(hash[i])) template+=hash[i]; //вставляем в шаблон уникальные символы из хэша
			}
		}
		return [template, hash]; //возвращаем перестановочный шаблон и крайний использованный хэш
	}
	for(let i=0;i<n;i++){ //создаем массив перестановочных шаблонов необходимой длины 
		val = permutation(hash, password);
		hash = val[1]; //получаем новый хэш после каждой итерации
		array[i] = val[0];
	}
	let mask_1=''; //первая маска
	let mask_2=''; //вторая маска
	let mask_3=''; //маска, полученная смещением второй маски
	let mask=''; //суммирование масок
	for(let i=0;i<length;i++){ //рассчитываем первую маску
		mask_1+=sha512.go(i==0? password + hash:password + mask_1);
	}
	for(let i=0;i<7;i++){ //перелистнем хэши
		hash=sha512.go(password + hash);
	}
	for(let i=0;i<length;i++){ //рассчитываем вторую маску
		mask_2+=sha512.go(i==0? password + hash:password + mask_2);
	}
	mask_3=mask_2.slice(-2)+mask_2.slice(0,-2); //преобразовываем вторую маску	
	for(let i=0;i<mask_1.length;i++){ //суммируем маски
		mask+=(parseInt(mask_1[i],16)^parseInt(mask_3[i],16)).toString(16);
	};
	return [array, mask, mask_1];
},
encrypt(password,text){ //функция шифровки текста, путем накладывания на него маски
	text.normalize(); //приводит буквы к нормальному виду
	let string_16=''; //строка индексов символов текста
	for(let i=0;i<text.length;i++){ //преобразовываем текст в строку индексов символов текста
		let sign=text.charCodeAt(i); //возвращает числовой номер символа Юникода по введенному индексу строки
		if(sign>65535)sign=32;//если больше, то забиваем пробелом
		string_16+=((sign).toString(16)).padStart(4,'0'); /*"padStart" забивает '0' строку спереди, чтобы строка была равна 4, "toString" преобразует десятичное число в 16-е, в строковом отображении*/ 
	};	
	let n=Math.ceil((string_16.length+10)/128); //округление до большего целого, рассчитываем длину хэш строки
	let val=this.ingot(password,n);//получим маски на основе пароля
	let array=val[0]; //массив перестановочных шаблонов
	let mask_1=val[2]; //первая маска
	let mask=val[1]; //результирующая маска
	string_16=string_16.padEnd(mask_1.length,mask_1);//добиваем текст до длины маски, текст для добивания берется с начала строки маски
	let stage_1=''; //1 стадия получения результата
	let stage_2=''; //2 стадия получения результата
	for(let i=0;i<mask.length;i++){//накладываем маску на текст
		stage_1+=(parseInt(mask[i],16)^parseInt(string_16[i],16)).toString(16);
	};
	for(let i=0; i<array.length; i++){ //переставляем символы в строке согласно шаблону
		for(let y=0; y<16; y++){
			stage_2+=stage_1[i*16+parseInt(array[i][y],16)];
		}
	}
	return stage_2;
},
decrypt(password,text){ //функция дешифровки зашифрованного текста, путем накладывания на него маски
	let n=Math.ceil((text.length)/128); //округление до большего целого, рассчитываем длину хэш строки
	let val=ingot(password,n);//получим маски на основе пароля
	let array=val[0]; //массив перестановочных шаблонов
	let mask_1=val[2]; //первая маска
	let mask=val[1]; //результирующая маска
	let val_0=[]; //временная переменная
	let stage_1=''; //1 стадия получения результата
	let stage_2=''; //2 стадия получения результата
	for(let i=0; i<array.length; i++){ //по перестановочному шаблону получаем зашифрованный текст
		for(let y=0; y<16; y++){
			val_0[parseInt(array[i][y],16)]=text[i*16+y];
		}
	stage_1+=val_0.join(''); //объединяем массивы символов в строку
	}
	for(let i=0;i<mask.length;i++){//накладываем маску на текст
		stage_2+=(parseInt(mask[i],16)^parseInt(stage_1[i],16)).toString(16);
	};
	let index=stage_2.indexOf(mask_1.substring(0,10)); //ищем фрагмент маски в расшифрованном тексте
	if(index==-1) return this.text; //если не нашли, значит, текст не расшифрован
	stage_2=stage_2.substring(0,index); //выпиливаем, фрагмент маски из текста
	let string_result='';
	for(let i=0;i<stage_2.length;i+=4){
		let sign=parseInt(stage_2.substring(i,i+4),16); //переводим символ текст из 16-й системы счисления в 10-ю
		string_result+=String.fromCharCode(sign); //заменяем число соответствующим символом
	};
	return string_result;
},
/*
ingot(password, length, mark=0){//функция заготовки создает на основе password и length хэш заданной длины, mark учитывает длину маркера окончания строки
	if(mark) length+=10;
	let n=Math.ceil((length)/128); //округление до большего целого, рассчитываем длину хэш строки
	let text='';
	for(let i=1;i<=n;i++) text+=sha512.go(password + text); //рассчитываем хэш пароля
	return text;
},
encrypt(password,text){ //функция шифровки текста, путем накладывания на него маски
	text.normalize(); //приводит буквы к нормальному виду
	let string_16='';
	for(let i=0;i<text.length;i++){
		let sign=text.charCodeAt(i); //возвращает числовой номер символа Юникода по введенному индексу строки
		if(sign>65535)sign=32;//если больше, то забиваем пробелом
		string_16+=((sign).toString(16)).padStart(4,'0'); /*"padStart" забивает '0' строку спереди, чтобы строка была равна 4, "toString" преобразует десятичное число в 16-е, в строковом отображении 
	};
	let mask=this.ingot(password,string_16.length,1);//создаем маску на основе пароля
	string_16=string_16.padEnd(mask.length,mask);//добиваем текст до длины маски, текст для добивания берется с начала строки маски
	let string_mask='';
	for(let i=0;i<mask.length;i++){//накладываем маску на текст
		string_mask+=(parseInt(mask[i],16)^parseInt(string_16[i],16)).toString(16);
	};
	return string_mask;
},
decrypt(password,text){ //функция дешифровки зашифрованного текста, путем накладывания на него маски
	let mask=this.ingot(password,text.length);//создаем маску на основе пароля
	let string='';
	for(let i=0;i<mask.length;i++){//накладываем маску на текст
		string+=(parseInt(mask[i],16)^parseInt(text[i],16)).toString(16);
	};
	let index=string.indexOf(mask.substring(0,10)); //ищем фрагмент маски в расшифрованном тексте
	if(index==-1) return this.text; //если не нашли, значит, текст не расшифрован
	string=string.substring(0,index); //выпиливаем, фрагмент маски из текста
	let string_result='';
	for(let i=0;i<string.length;i+=4){
		let sign=parseInt(string.substring(i,i+4),16); //переводим символ текст из 16-й системы счисления в 10-ю
		string_result+=String.fromCharCode(sign); //заменяем число соответствующим символом
	};
	return string_result;
},*/
resize_textarea(){ //изменение длины текстового поля, для подстройки под размер его наполнения
	const textarea=this.form.textarea; //переопределение ссылки для удобства
	textarea.style.height = 'auto'; //измеряем полосу прокрутки
	if(textarea.scrollHeight>=34) textarea.style.height = (textarea.scrollHeight) + 'px'; //если в элементе больше одной строки, то увеличиваем размер элемента
	else textarea.removeAttribute('style'); //иначе удаляем свойство, иначе уплывает нижняя граница(1px <-> 2px)
},
};

let $={ //Объект, упрощающий жизнь
id(id){return document.getElementById(id);}, //определение объекта по id
tag(tag,object){return (object || document).getElementsByTagName(tag)[0];}, //определение объекта по тегу
css(selector,object){return (object || document).querySelector(selector)}, //поиск по css аргументу внутри тега
event(...array){//навешивает, удаляет события скопом и поодиночке
//$.event(['a',self.window,'mouseup',self.stop_move],[])//обработчик для окончания перемещения
		//передавать (a/r), obj, action, function
	const a=typeof array[0]==='string'?[array]:array; //проверяем, если передан один элемент в массиве, то дополнительно оборачиваем его в массив, иначе пускаем дальше так
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
bind_all(obj){ //привязываем функции к объекту, в котором они определены, чтобы можно было использовать "this"
	for(var method in obj) if (typeof obj[method] == 'function') obj[method]=obj[method].bind(obj);
	return obj;
},
box(obj){//создание и вставка узла
//передавать {array,node,text}
	const c=document.createElement('div');
	if('array' in obj){//если есть массив со значениями атрибутов
		const a=typeof obj.array[0]==='string'?[obj.array]:obj.array; //проверяем, если передан один элемент в массиве, то дополнительно оборачиваем его в массив, иначе пускаем дальше так
		a.forEach(x=>c.setAttribute(x[0],x[1]));
	}
	if('text' in obj) c.innerHTML=obj.text; //если есть текст, то вставляем его
	if('node' in obj) return obj.node.appendChild(c); //если передан родительский объект, то вставляем в него созданный
	else return c; 
},
async ajax(url,obj=0){//AJAX модуль
	const controller=new AbortController(); //объект который позволяет сбросить запрос
	const signal=controller.signal;
	setTimeout(() => controller.abort(), 20000); //таймер на сброс запроса
	const options={ //определяем объект с опциями запроса
		method:'post',
		headers:{'Content-type':'application/json; charset=utf-8','Accept': 'application/json','X-Requested-With': 'XMLHttpRequest'},
		cache:'no-cache',
		body:JSON.stringify(obj),
		signal
	}
	const response=await fetch('https://mighty-lowlands-35866.herokuapp.com/'+url,options); //отправляем запрос
	//const response=await fetch(url,options);
	if(!response.ok) throw new Error (response.status+' '+response.statusText); //проверка на ошибки
	const text=await response.text(); //получаем тело ответа
	//if (text.toLowerCase().indexOf("error")!=-1) throw new Error(text); //проверяем проблемы
	const data = JSON.parse(text); //парсим тело ответа в объект
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
	  else if(!+window.getComputedStyle(this.node).counterReset[6]){//если курсор не наведен, то удаляет сообщение; считывает свойство css(counter-reset), которое меняетсят наведения курсора, + превращает символ в число
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

let sha512={//go(str) 
	charsize:8,
	int64(msint_32, lsint_32){
		return {highOrder:msint_32,
				lowOrder:lsint_32}
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
		return this.int64(highOrder,lowOrder);
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
		return this.int64(highOrder, lowOrder);
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
		return this.int64(highOrder, lowOrder);
	},
	maj(x,y,z){
		return this.int64(
			(x.highOrder&y.highOrder)^(x.highOrder&z.highOrder)^(y.highOrder&z.highOrder),
			(x.lowOrder&y.lowOrder)^(x.lowOrder&z.lowOrder)^(y.lowOrder&z.lowOrder));
	},
	ch(x,y,z){
		return this.int64(
			(x.highOrder&y.highOrder)^(~x.highOrder&z.highOrder),
			(x.lowOrder&y.lowOrder)^(~x.lowOrder&z.lowOrder));
	},
	rotr(x,n){
		if(n<=32){
			return this.int64(
				(x.highOrder>>>n)|(x.lowOrder<<(32-n)),
				(x.lowOrder>>>n)|(x.highOrder<<(32-n)));
		} else{
			return this.int64(
				(x.lowOrder>>>n)|(x.highOrder<<(32-n)),
				(x.highOrder>>>n)|(x.lowOrder<<(32-n)));
		}
	},
	sigma0(x){
		const rotr28=this.rotr(x,28),
			rotr34=this.rotr(x,34),
			rotr39=this.rotr(x,39);
		return this.int64(
			rotr28.highOrder^rotr34.highOrder^rotr39.highOrder,
			rotr28.lowOrder^rotr34.lowOrder^rotr39.lowOrder);
	},
	sigma1(x){
		const rotr14=this.rotr(x,14),
			rotr18=this.rotr(x,18),
			rotr41=this.rotr(x,41);
		return this.int64(
			rotr14.highOrder^rotr18.highOrder^rotr41.highOrder,
			rotr14.lowOrder^rotr18.lowOrder^rotr41.lowOrder);
	},
	gamma0(x){
		const rotr1=this.rotr(x,1),
			rotr8=this.rotr(x,8),
			shr7=this.shr(x,7);
		return this.int64(
			rotr1.highOrder^rotr8.highOrder^shr7.highOrder,
			rotr1.lowOrder^rotr8.lowOrder^shr7.lowOrder);
	},
	gamma1(x){
		const rotr19=this.rotr(x,19),
			rotr61=this.rotr(x,61),
			shr6=this.shr(x,6);
		return this.int64(
			rotr19.highOrder^rotr61.highOrder^shr6.highOrder,
			rotr19.lowOrder^rotr61.lowOrder^shr6.lowOrder);
	},
	shr(x,n){
		if(n<=32){
			return this.int64(
				x.highOrder>>>n,
				x.lowOrder>>>n|(x.highOrder<<(32-n)));
		} else{
			return this.int64(
				0,
				x.highOrder<<(32-n));
		}
	},
	go(str){
	const int64=this.int64,
		safe_add_2=this.safe_add_2;
	let H=[int64(0x6a09e667, 0xf3bcc908), int64(0xbb67ae85, 0x84caa73b),
		int64(0x3c6ef372, 0xfe94f82b), int64(0xa54ff53a, 0x5f1d36f1),
		int64(0x510e527f, 0xade682d1), int64(0x9b05688c, 0x2b3e6c1f),
		int64(0x1f83d9ab, 0xfb41bd6b), int64(0x5be0cd19, 0x137e2179)],
	K=[int64(0x428a2f98, 0xd728ae22), int64(0x71374491, 0x23ef65cd),
		int64(0xb5c0fbcf, 0xec4d3b2f), int64(0xe9b5dba5, 0x8189dbbc),
		int64(0x3956c25b, 0xf348b538), int64(0x59f111f1, 0xb605d019),
		int64(0x923f82a4, 0xaf194f9b), int64(0xab1c5ed5, 0xda6d8118),
		int64(0xd807aa98, 0xa3030242), int64(0x12835b01, 0x45706fbe),
		int64(0x243185be, 0x4ee4b28c), int64(0x550c7dc3, 0xd5ffb4e2),
		int64(0x72be5d74, 0xf27b896f), int64(0x80deb1fe, 0x3b1696b1),
		int64(0x9bdc06a7, 0x25c71235), int64(0xc19bf174, 0xcf692694),
		int64(0xe49b69c1, 0x9ef14ad2), int64(0xefbe4786, 0x384f25e3),
		int64(0x0fc19dc6, 0x8b8cd5b5), int64(0x240ca1cc, 0x77ac9c65),
		int64(0x2de92c6f, 0x592b0275), int64(0x4a7484aa, 0x6ea6e483),
		int64(0x5cb0a9dc, 0xbd41fbd4), int64(0x76f988da, 0x831153b5),
		int64(0x983e5152, 0xee66dfab), int64(0xa831c66d, 0x2db43210),
		int64(0xb00327c8, 0x98fb213f), int64(0xbf597fc7, 0xbeef0ee4),
		int64(0xc6e00bf3, 0x3da88fc2), int64(0xd5a79147, 0x930aa725),
		int64(0x06ca6351, 0xe003826f), int64(0x14292967, 0x0a0e6e70),
		int64(0x27b70a85, 0x46d22ffc), int64(0x2e1b2138, 0x5c26c926),
		int64(0x4d2c6dfc, 0x5ac42aed), int64(0x53380d13, 0x9d95b3df),
		int64(0x650a7354, 0x8baf63de), int64(0x766a0abb, 0x3c77b2a8),
		int64(0x81c2c92e, 0x47edaee6), int64(0x92722c85, 0x1482353b),
		int64(0xa2bfe8a1, 0x4cf10364), int64(0xa81a664b, 0xbc423001),
		int64(0xc24b8b70, 0xd0f89791), int64(0xc76c51a3, 0x0654be30),
		int64(0xd192e819, 0xd6ef5218), int64(0xd6990624, 0x5565a910),
		int64(0xf40e3585, 0x5771202a), int64(0x106aa070, 0x32bbd1b8),
		int64(0x19a4c116, 0xb8d2d0c8), int64(0x1e376c08, 0x5141ab53),
		int64(0x2748774c, 0xdf8eeb99), int64(0x34b0bcb5, 0xe19b48a8),
		int64(0x391c0cb3, 0xc5c95a63), int64(0x4ed8aa4a, 0xe3418acb),
		int64(0x5b9cca4f, 0x7763e373), int64(0x682e6ff3, 0xd6b2b8a3),
		int64(0x748f82ee, 0x5defb2fc), int64(0x78a5636f, 0x43172f60),
		int64(0x84c87814, 0xa1f0ab72), int64(0x8cc70208, 0x1a6439ec),
		int64(0x90befffa, 0x23631e28), int64(0xa4506ceb, 0xde82bde9),
		int64(0xbef9a3f7, 0xb2c67915), int64(0xc67178f2, 0xe372532b),
		int64(0xca273ece, 0xea26619c), int64(0xd186b8c7, 0x21c0c207),
		int64(0xeada7dd6, 0xcde0eb1e), int64(0xf57d4f7f, 0xee6ed178),
		int64(0x06f067aa, 0x72176fba), int64(0x0a637dc5, 0xa2c898a6),
		int64(0x113f9804, 0xbef90dae), int64(0x1b710b35, 0x131c471b),
		int64(0x28db77f5, 0x23047d84), int64(0x32caab7b, 0x40c72493),
		int64(0x3c9ebe0a, 0x15c9bebc), int64(0x431d67c4, 0x9c100d4c),
		int64(0x4cc5d4be, 0xcb3e42b6), int64(0x597f299c, 0xfc657e2a),
		int64(0x5fcb6fab, 0x3ad6faec), int64(0x6c44198c, 0x4a475817)],
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
				W[j]=int64(str[j*2+i],str[j*2+i+1]);
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
	const run=()=>{
		$.event('r',document,'DOMContentLoaded',run);
		const date=[
			_fail.load,
			sha512.load,
			main.load,
			];
			Promise.all(date.map(Function=>Function()))//промисс параллельного выполнения, метод map проходит по принимаемому массиву и выполняет указанную функцию над каждым элементом 
			.catch(error =>console.error('load error'));	
	}
	$.event('a',document,'DOMContentLoaded',run);
})();

let help ="Для создания записи, открываем сайт без передаваемых аргументов, нажимаем по белому фону в левом верхнем углу. Вводим пароль и текст, далее получаем ссылку на созданную запись. Для получения текста записи, переходим по ранее полученной ссылке, после введения пароля, полученный зашифрованный текст будет расшифрован."
