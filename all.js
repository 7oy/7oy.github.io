"use strict";

let main={
body:null, //ссылка на тело страницы
form:null,
address:'https://script.google.com/macros/s/AKfycbyq-zVq4JyIK0sXLV2hil82smssD61Cy3EeFVUUV1DxwUg2wyeIjSnjXXiQ0kYlVII/exec', //адрес макроса выдачи/записи данных
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
	.catch(error=>{ //обработка ошибок произошедших на сервере
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
		.then(response=>{
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
	else{
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
	const form=$.box({array:['class','form'],node:this.body,text:`<div class='text'><input type='password'id='text_1'placeholder=' '><label for='text_1'data-title='Пароль'></label></div><div class='textarea'><textarea rows='1'placeholder=' '></textarea><div data-title='Текст'></div></div><button>Действие</button>`});//создаем и вставляем макет в страницу
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
ingot(password,length){ //функция заготовки создает на основе password и length хеш заданной длины
	let n=length*8, //количество перестановочных шаблонов
		hash='', //переменная для хранения оконечного значения хэша
		val=[], //переменная для хранения промежуточных значений
		array=[]; //переменная для хранения массива перестановочных шаблонов
	let permutation=(hash,password)=>{ //функция для создания одного перестановочного шаблона из хэш значения
		let template=''; //перестановочный шаблон
		while(!(template.length==16)){ //цикл будет продолжаться пока размер шаблона не станет равным 16
			hash=this.sha_3(password+hash); //вычисляем хэш на основе шаблона и предыдущего использованного хэша
			for(let i=0;i<hash.length;i++)if(!template.includes(hash[i]))template+=hash[i]; //проходим по длине хэша,вставляем в шаблон уникальные символы из хэша
			//hash.split('').forEach(e=>!template.includes(e)&&template+=e);
		};
		return[template,hash]; //возвращаем перестановочный шаблон и крайний использованный хэш
	};
	for(let i=0;i<n;i++){ //создаем массив перестановочных шаблонов необходимой длины 
		val=permutation(hash, password);
		hash=val[1]; //получаем новый хэш после каждой итерации
		array[i]=val[0];
	};
	let mask_1='', //первая маска
		mask_2='', //вторая маска
		mask_3='', //маска, полученная смещением второй маски
		mask=''; //суммирование масок
	for(let i=0;i<length;i++)mask_1+=this.sha_3(i==0?password+hash:password+mask_1); //рассчитываем первую маску
	for(let i=0;i<7;i++)hash=this.sha_3(password+hash); //перелистнем хэши
	for(let i=0;i<length;i++)mask_2+=this.sha_3(i==0?password+hash:password+mask_2); //рассчитываем вторую маску
	mask_3=mask_2.slice(-2)+mask_2.slice(0,-2); //преобразовываем вторую маску	
	for(let i=0;i<mask_1.length;i++)mask+=(parseInt(mask_1[i],16)^parseInt(mask_3[i],16)).toString(16);//суммируем маски
	return [array, mask, mask_1];
},
encrypt(password,text){ //функция шифровки текста, путем накладывания на него маски
	text.normalize(); //приводит буквы к нормальному виду
	let string_16=Array.from(new TextEncoder().encode(text),x=>x.toString(16).padStart(2,'0')).join(''); //строка индексов символов текста
	let n=Math.ceil((string_16.length+10)/128); //округление до большего целого, рассчитываем длину хэш строки
	let val=this.ingot(password,n);//получим маски на основе пароля
	let array=val[0], //массив перестановочных шаблонов
		mask_1=val[2], //первая маска
		mask=val[1]; //результирующая маска
	string_16=string_16.padEnd(mask_1.length,mask_1);//добиваем текст до длины маски, текст для добивания берется с начала строки маски
	let stage_1='', //1 стадия получения результата
		stage_2=''; //2 стадия получения результата
	for(let i=0;i<mask.length;i++)stage_1+=(parseInt(mask[i],16)^parseInt(string_16[i],16)).toString(16);//накладываем маску на текст
	for(let i=0;i<array.length;i++)for(let y=0;y<16;y++)stage_2+=stage_1[i*16+parseInt(array[i][y],16)]; //переставляем символы в строке согласно шаблону
	return stage_2;
},
decrypt(password,text){ //функция дешифровки зашифрованного текста, путем накладывания на него маски
	let n=Math.ceil((text.length)/128); //округление до большего целого, рассчитываем длину хэш строки
	let val=this.ingot(password,n);//получим маски на основе пароля
	let array=val[0]; //массив перестановочных шаблонов
	let mask_1=val[2]; //первая маска
	let mask=val[1]; //результирующая маска
	let val_0=[]; //временная переменная
	let stage_1=''; //1 стадия получения результата
	let stage_2=''; //2 стадия получения результата
	for(let i=0;i<array.length;i++){ //по перестановочному шаблону получаем зашифрованный текст
		for(let y=0;y<16;y++){
			val_0[parseInt(array[i][y],16)]=text[i*16+y];
		};
	stage_1+=val_0.join(''); //объединяем массивы символов в строку
	};
	for(let i=0;i<mask.length;i++){//накладываем маску на текст
		stage_2+=(parseInt(mask[i],16)^parseInt(stage_1[i],16)).toString(16);
	};
	let index=stage_2.indexOf(mask_1.substring(0,10)); //ищем фрагмент маски в расшифрованном тексте
	if(index==-1)return this.text;; //если не нашли, значит, текст не расшифрован
	stage_2=stage_2.substring(0,index); //выпиливаем, фрагмент маски из текста
	let result=new TextDecoder().decode(new Uint8Array(stage_2.match(/.{2}/g).map(x=>parseInt(x, 16))));
	return result;
},
resize_textarea(){ //изменение длины текстового поля, для подстройки под размер его наполнения
	const textarea=this.form.textarea; //переопределение ссылки для удобства
	textarea.style.height = 'auto'; //измеряем полосу прокрутки
	if(textarea.scrollHeight>=34) textarea.style.height = (textarea.scrollHeight) + 'px'; //если в элементе больше одной строки, то увеличиваем размер элемента
	else textarea.removeAttribute('style'); //иначе удаляем свойство, иначе уплывает нижняя граница(1px <-> 2px)
},
sha_3(str){
	const r=576;
	const c=1024;
	const l=c/2;
	let msg=new TextEncoder().encode(str).reduce((prev,curr)=>prev+String.fromCharCode(curr),'');
	const state=[[],[],[],[],[]];
	for(let x=0;x<5;x++)for(let y=0;y<5;y++)state[x][y]=0n;
	const q=(r/8)-msg.length%(r/8);
	if (q==1)msg+=String.fromCharCode(0x86);
	else{
		msg+=String.fromCharCode(0x06);
		msg+=String.fromCharCode(0x00).repeat(q-2);
		msg+=String.fromCharCode(0x80);
	};
	const w=64;
	const blocksize=r/w*8;
	const keccak_f_1600=(a)=>{
		const nRounds=24;
		const RC=[
			0x0000000000000001n,0x0000000000008082n,0x800000000000808an,
			0x8000000080008000n,0x000000000000808bn,0x0000000080000001n,
			0x8000000080008081n,0x8000000000008009n,0x000000000000008an,
			0x0000000000000088n,0x0000000080008009n,0x000000008000000an,
			0x000000008000808bn,0x800000000000008bn,0x8000000000008089n,
			0x8000000000008003n,0x8000000000008002n,0x8000000000000080n,
			0x000000000000800an,0x800000008000000an,0x8000000080008081n,
			0x8000000000008080n,0x0000000080000001n,0x8000000080008008n,
		];
		const ROT=(a,d)=>BigInt.asUintN(64,a<<BigInt(d)|a>>BigInt(64-d));
		for(let r=0;r<nRounds;r++){
			const C=[],D =[];
			for(let x=0;x<5;x++){
				C[x]=a[x][0];
				for(let y=1;y<5;y++)C[x]=C[x]^a[x][y];
			};
			for(let x=0;x<5;x++){
				D[x]=C[(x+4)%5]^ROT(C[(x+1)%5],1);
				for(let y=0;y<5;y++)a[x][y]=a[x][y]^D[x];
			};
			let [x,y]=[1,0];
			let current=a[x][y];
			for(let t=0;t<24;t++){
				const [X,Y]=[y,(2*x+3*y)%5];
				const tmp=a[X][Y];
				a[X][Y]=ROT(current,((t+1)*(t+2)/2)%64);
				current=tmp;
				[x,y]=[X,Y];
			};
			for(let y=0;y<5;y++){
				const C=[];
				for(let x=0;x<5;x++)C[x]=a[x][y];
				for(let x=0;x<5;x++)a[x][y]=(C[x]^((~C[(x+1)%5])&C[(x+2)%5]));
			};
			a[0][0]=(a[0][0]^RC[r]);
		};
	};
	const transpose=(array)=>array.map((row,r)=>array.map(col=>col[r]));
	for(let i=0;i<msg.length;i+=blocksize){
		for(let j=0;j<r/w;j++){
			const i64=(BigInt(msg.charCodeAt(i+j*8+0))<<0n)+(BigInt(msg.charCodeAt(i+j*8+1))<<8n)+(BigInt(msg.charCodeAt(i+j*8+2))<<16n)+(BigInt(msg.charCodeAt(i+j*8+3))<<24n)+(BigInt(msg.charCodeAt(i+j*8+4))<<32n)+(BigInt(msg.charCodeAt(i+j*8+5))<<40n)+(BigInt(msg.charCodeAt(i+j*8+6))<<48n)+(BigInt(msg.charCodeAt(i+j*8+7))<<56n);
			const x=j%5;
			const y=Math.floor(j/5);
			state[x][y] = state[x][y] ^ i64;
		};
		keccak_f_1600(state);
	};
	let md=transpose(state)
		.map(plane=>plane.map(lane=>lane.toString(16).padStart(16,'0').match(/.{2}/g).reverse().join('')).join(''))
		.join('')
		.slice(0, l/4);
	return md;
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
	for(var method in obj)if(typeof obj[method]=='function')obj[method]=obj[method].bind(obj);
	return obj;
},
box(obj){//создание и вставка узла
//передавать {array,node,text}
	const c=document.createElement('div');
	if('array' in obj){//если есть массив со значениями атрибутов
		const a=typeof obj.array[0]==='string'?[obj.array]:obj.array; //проверяем, если передан один элемент в массиве, то дополнительно оборачиваем его в массив, иначе пускаем дальше так
		a.forEach(x=>c.setAttribute(x[0],x[1]));
	}
	if('text' in obj)c.innerHTML=obj.text; //если есть текст, то вставляем его
	if('node' in obj)return obj.node.appendChild(c); //если передан родительский объект, то вставляем в него созданный
	else return c; 
},
async ajax(url,obj=0){//AJAX модуль
	const controller=new AbortController(); //объект который позволяет сбросить запрос
	const signal=controller.signal;
	setTimeout(()=>controller.abort(),20000); //таймер на сброс запроса
	const options={ //определяем объект с опциями запроса
		method:'post',
		//headers:{'Content-type':'application/json; charset=utf-8','Accept': 'application/json','X-Requested-With': 'XMLHttpRequest'},
		headers:{"Content-Type":"text/plain;charset=utf-8"},
		cache:'no-cache',
		body:JSON.stringify(obj),
		signal
	}
	//const response=await fetch('https://mighty-lowlands-35866.herokuapp.com/'+url,options); //отправляем запрос
	const response=await fetch(url,options);
	if(!response.ok) throw new Error (response.status+' '+response.statusText); //проверка на ошибки
	const text=await response.text(); //получаем тело ответа
	//if (text.toLowerCase().indexOf("error")!=-1) throw new Error(text); //проверяем проблемы
	const data = JSON.parse(text); //парсим тело ответа в объект
	if(data.alert) throw new Error(data.error); //проверяем есть ли проблемы на стороне сервера
	return data;
},
property(node){ //получает свойства элемента
	const box=node.getBoundingClientRect();
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
red(text){this.timer(this.output(text,'red_report'));},//ошибка
green(text){this.timer(this.output(text,'green_report'));},//информационное сообщение
orange(text){this.output(text,'orange_report');},//важное сообщение
timer(node){ //ставит таймер на удаление сообщения
	const timer=setInterval(()=> {
	  if(!node)clearInterval(timer);
	  else if(!+window.getComputedStyle(this.node).counterReset[6]){//если курсор не наведен, то удаляет сообщение; считывает свойство css(counter-reset), которое меняетсят наведения курсора, + превращает символ в число
		node.remove();  
		clearInterval(timer);  
	  }
	},5000);	
},
output(text,color){ //создает сообщение о ошибке
	switch(color){ 
	case 'red_report':console.error(text);break;
	case 'green_report':console.info(text);break;
	case 'orange_report':console.warn(text);break;
	}
	if(this.node!=0)return $.box({array:['class',color],node:this.node,text:text+'<div date-icon="cross"></div>'});
	else return 0;
},
delete(){ //удаляет сообщение по клику
	if(event.target.hasAttribute('date-icon'))event.target.parentNode.remove();
},
};

(()=>{ //функция для автоматического запуска модулей
	const run=()=>{
		$.event('r',document,'DOMContentLoaded',run);
		const date=[
			_fail.load,
			main.load,
			];
			Promise.all(date.map(Function=>Function()))//промисс параллельного выполнения, метод map проходит по принимаемому массиву и выполняет указанную функцию над каждым элементом 
			.catch(error =>console.error('load error'));	
	}
	$.event('a',document,'DOMContentLoaded',run);
})();

let help ="Для создания записи, открываем сайт без передаваемых аргументов, нажимаем по белому фону в левом верхнем углу. Вводим пароль и текст, далее получаем ссылку на созданную запись. Для получения текста записи, переходим по ранее полученной ссылке, после введения пароля, полученный зашифрованный текст будет расшифрован."
