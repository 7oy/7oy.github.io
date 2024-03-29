"use strict";

let main={
address:"https://script.google.com/macros/s/AKfycbyq-zVq4JyIK0sXLV2hil82smssD61Cy3EeFVUUV1DxwUg2wyeIjSnjXXiQ0kYlVII/exec", //адрес макроса выдачи/записи данных
text:null,
load(){//инициализация модуля ошибок
	$.bind_all(main);//биндим объект, чтобы в функциях можно было использовать "this"
	$.d.head.after(main.bar=$.d.createElement("bar"));//создаем контейнер для индикации загрузки и вставляем его в head
	main.bar.setAttribute("c","");
	window.char=(x)=>String.fromCharCode(x);//возвращает символ, получая его код
	window.int=(x)=>parseInt(x,16);//анализирует строковый аргумент и возвращает целое число по 16-ой системе счисления
	main.body=document.body;
	if(window.location.search.length==0)$.event("a",main.body,"click",main.protect_encode);/*обработчик для клика на верхней правой части экрана, навешивается для входа на страницу на которой создаем запись*/
	else if(window.location.search.length>100) fail.red("Превышен размер переданных данных!");
	else main.window_decode(window.location.search);//выполняется для входа на страницу на которой получаем и дешифруем запись
},
window_decode(text){//функция запроса сообщения и его декодировки
	let find=text.substring(1,5);//отпиливаем от адреса 4 символа, начиная с 1 ("0" это знак "?"), получаем идентификатор записи в базе 
	$.ajax(this.address,{find:find})//отправляем запрос(идентификатор записи) по адресу базы данных
	.then(response=>{
		if("result" in response){//если есть положительный ответ
			this.text=this.a[1].innerText=response.result;//записываем полученный результат в текстовое поле
			this.resize_text();//корректируем размер текстового поля под текст
		}
		else if("error" in response)throw new Error(response.error);//если база данных отправила ошибку
		this.wait();
		})
	.catch(error=>{//обработка ошибок произошедших на сервере
		fail.red(error);
		this.wait();//убираем экран ожидания
	});
	this.layout();//вставка макета формы
	this.a[2].innerText='Декодировать';//обзываем кнопку формы
	$.event(
			["a",this.a[2],"click",this.event_decode],//обработчик клика по кнопке декодировать
			["a",this.a[0],"keyup",this.event_decode]//обработчик отпускания физической кнопки "Enter" в поле ввода пароля
	);
	this.wait(1);//показываем экран ожидания, снимется асинхронно, когда придёт ответ от сервера
},
event_encode(){//функция, которая висит на кнопке "кодировать", кодирует и отправляет сообщения на сервер
	let password=this.a[0].value,
		text=this.a[1].innerText;
	if((password.length==0)||(text.length==0))fail.red("Необходимые данные для отправки данных отсутствуют!");//проверка на наличие дынных в текстовом поле и в поле пароля
	else{
		let message=this.encrypt(password,text);//кодируем текст
		this.wait(1);//показываем экран ожидания
		$.ajax(this.address,{set:message})//отправка данных на сервер
		.then(response=>{
			if("id" in response)this.show_link(response.id);//если в ответе есть "id", то запись выполнена успешно
			else if("error" in response)throw new Error(response.error);//если в ответе есть "error", то возникли ошибки на стороне сервера
		})
		.catch(error =>{//обработка ошибок произошедших на стороне сервера
			fail.red(error);
			this.wait();//убираем экран ожидания
		});
	};
},
event_decode(){//при нажатии по кнопке декодирует сообщение
	let a=this.a;
	if((event.type=="keyup")&&(event.key!="Enter")) return;//если функция вызвана отпусканием кнопки и это не "Enter" то выходим из функции 
	let text=(event.ctrlKey)?a[1].innerText:this.text; /*если нажат "Ctrl", то расшифровываем введённый текст, иначе берем раннее полученные данные с сервера(сделано, чтобы можно было расшифровывать данные не только с сервера)*/
	if((a[0].value.length==0)||(this.text==null))fail.red("Необходимые данные для расшифровки отсутствуют!");
	else{
		text=this.decrypt(a[0].value,text);//декодируем текст с помощь введённого пароля
		if(text==null)this.red(a[0]);//если пароль не действителен то мигаем рамкой
		else{
			a[1].innerText=text;//this.text, расшифровка зашифрованного текста
			this.resize_text();//корректируем размер текстового поля под текст
		}
	};
},
protect_encode(){//обработчик клика для вставки формы создания записи, срабатывает если кликнуть мышью в верхнем левом углу, также ширина и длина блока страницы должна быть больше 300 
	let property=event.target.getBoundingClientRect(),//метод предоставляющий информацию о размере элемента и его положении относительно области просмотра
		width=property.width,//ширина объекта на котором сработало событие
		height=property.height,//длинна объекта на котором сработало событие
		x=event.offsetX,//координаты клика мыши от верхнего левого угла объекта на котором сработало событие
		y=event.offsetY;
	if((width>300)&&(height>300)&&(x<300)&&(y<300)){//проверка на попадание в координаты
		$.event("r",main.body,"click",main.protect_encode);//удаляем обработчик на вставку формы создания записи
		this.layout();//вставка макета формы
		this.a[2].innerText="Кодировать";//обзываем кнопку формы
		$.event("a",this.a[2],"click",this.event_encode);//вешаем обработчик на кнопку для кодирования и отправки записи на сервер
	};
},
layout(){//макет на основе которого создается формы
	let b="<input type='password'placeholder='Пароль' t><t i='Текст'contentEditable='plaintext-only'spellcheck='false' t></t><k c>";//поле для ввода пароля и кнопка
	this.body.innerHTML=b;
	this.a=this.body.querySelectorAll("*");//создаём ссылки на элементы
	//0: input - ссылка на поле с паролем
	//1: t	 - ссылка на текстовое поле
	//2: k	 - ссылка на кнопку
	$.event(
		["a",this.a[1],"input",this.resize_text],//вешаем обработчик на textarea для автоматической подстройки размера
		["a",window,"resize",this.resize_text],//подстраивает текстовое поле под изменение размера экрана
	);
},
wait(i=0){//показывает/скрывает экран ожидания(бар/линию загрузки)
	this.bar.id=i==1?"s":"";
},
red(x){//функция которая при вводе неправильного пароля, окрашивает на время рамку поля ввода пароля красным цветом
	//x - объект на который вешаем ошибку
	//id="r" - с помощью идентификатора, css навешивает ошибку
	if(x.id=="r")return;//если id "r" уже висит на заданном поле ввода, то выходим из функции
	x.id="r";//вешаем id "r" на объект
	setTimeout(()=>{x.id=""},500);//ставим таймер на последующее удаление id "r" с объекта
},
resize_text(){//изменение длины текстового поля, для подстройки под размер его наполнения
	let t=this.a[1];//переопределение ссылки для удобства
	t.style.height="auto";//измеряем полосу прокрутки
	if(t.scrollHeight>=60)t.style.height=3+(t.scrollHeight)+"px";//если в элементе больше одной строки, то увеличиваем размер элемента
	else t.removeAttribute("style");//иначе удаляем свойство, иначе уплывает нижняя граница(1px <-> 2px)
},
show_link(link){//выводит ссылку для сообщения
	this.wait();//выключаем экран ожидания
	$.event(
		["r",this.a[2],"click",this.event_encode],
		["r",this.a[1],"input",this.resize_text]
	);
	let actual=window.location.origin+"?"+link;//присобачиваем идентификатор записи к адресу
	if(actual[0]=="h"){//если страница находится в интернете
		actual=actual.substring(8,actual.length);//отпиливаем "htpps://" и выводим ссылку 
	}else{//если страница находится в локальном месте
		let name=window.location.pathname;
		actual="file:///"+name.substr(1,name.length)+"?"+link;//для ДОМА
	}
	this.body.innerHTML="<k c>Скопировать ссылку";//вставка контейнера с адресом записи в тело страницы
	this.body.id="link";
	$.event("a",$.d.querySelector("k"),"click",()=>{navigator.clipboard.writeText(actual).catch(e=>console.log(e))});//копировать в буфер при клике по кнопке(ссылку на запрос информации)
},
ingot(password,length){//функция заготовки, создает на основе password и length хеш заданной длины
	let n=length*8,//количество перестановочных шаблонов, 8 это 128/16, где 128 длина хэша, 16 - длина перестановочного шаблона
		hash="",//переменная для хранения оконечного значения хэша
		val=[],//переменная для хранения промежуточных значений
		array=[],//переменная для хранения массива перестановочных шаблонов
		permutation=(hash,password)=>{//функция для создания одного перестановочного шаблона из хэш значения
			let template="";//перестановочный шаблон
			while(!(template.length==16)){//цикл будет продолжаться пока размер шаблона не станет равным 16
				hash=this.sha_3(password+hash);//вычисляем хэш на основе шаблона и предыдущего использованного хэша
				for(let i=0;i<hash.length;i++)if(!template.includes(hash[i]))template+=hash[i];//проходим по длине хэша,вставляем в шаблон уникальные символы из хэша
			};
			return[template,hash];//возвращаем перестановочный шаблон и крайний использованный хэш
		};
	for(let i=0;i<n;i++){//создаем массив перестановочных шаблонов необходимой длины 
		val=permutation(hash,password);
		hash=val[1];//получаем новый хэш после каждой итерации
		array[i]=val[0];
	};
	let mask_1="",//первая маска, служит основой
		mask_2="",//вторая маска служит заготовкой для последующей маски
		mask_3="",//маска, полученная смещением второй маски она скроет закономерности
		mask="";//суммирование масок
	for(let i=0;i<length;i++)mask_1+=hash=this.sha_3(password+hash);//рассчитываем первую маску

	for(let i=0;i<length;i++)mask_2+=hash=this.sha_3(password+hash);//рассчитываем вторую маску

	mask_3=mask_2.slice(-2)+mask_2.slice(0,-2);//преобразовываем вторую маску	
	for(let i=0;i<mask_1.length;i++)mask+=(parseInt(mask_1[i],16)^parseInt(mask_3[i],16)).toString(16);//суммируем маски
	return [array,mask];//возвращает массив перестановочных шаблонов, маску которые будут накладываться на текст
},
encrypt(password,text){//функция шифровки текста, путем накладывания на него маски
	text.normalize();//приводит буквы к нормальному виду
	let string_16=Array.from(new TextEncoder().encode(text),x=>x.toString(16).padStart(2,"0")).join(""),//строка индексов символов текста
		//new TextEncoder().encode(text) - переводит символы в буквенные коды(utf-8), а именно 8-битный массив
		//затем в Array.from обрабатывается методом toString(16) который превращает цифры из десятичной системы в шестнадцатеричную(в виде строки)
		//затем метод padStart(2,"0") добавляет впереди 0 если число состоит из одного символа
		//ну затем все шестнадцатеричные представления сливаются в одну строку с помощью join("")
		n=Math.ceil((string_16.length)/128)+1,//округление до большего целого, рассчитываем длину строки из нескольких хэшей, +1 чтобы учитывать добавление хэша текста
		[array,//массив перестановочных шаблонов
		mask]=this.ingot(password,n),//кодирующая маска
		h_text="",//переменная для хранения текста полученного при конкатенации элементов массива хэшев(кроме 0 и крайнего элементов),скрывающая маска
		hidden="",//1 стадия наложения скрывающей изменения маски на текст
		impose="",//2 стадия наложения кодирования
		mix="",//3 стадия перемешивания
		h_array=[];//массив хэшей текста, (количеством n+2, где 2: [0] это ключ на основе которого вычисляются остальные хэши, [крайний] хэш нужен чтобы сделать(дозаполнить) текст кратным 128)
	//где: [ключ(хэш сгенерированный на основе текста),...остальные хэши сгенерированные на основе ключа и самих себя...., хэш который используется чтобы дозаполнить текст(сделать его кратным 128, по количеству символов)]
	//РАСЧЁТ (массива)ХЭША ТЕКСТА, нужно чтобы, при одинаковом пароле и минимуме изменений в тексте, результат(уже закодированный текст) менялся полностью
	n=n-1;//далее n используется, для создания массива хэшей текста, но на сам "ключ" этот массив накладывать не надо, поэтому отнимаем 1
	let l=n*128;//количество символов в накладываемой на текст маске скрытия, 128 это длина хэша
	//заполняем массив хэшей
	h_array[0]=this.sha_3(text);//ключ на основе которого вычисляются остальные хэши
	for(let i=1;i<(n+2);i++){//n+2, - потому, что нужно учитывать ещё два элемента, - ключ и заполнитель
		h_array[i]=this.sha_3(h_array[i-1]);};//заполняем массив вычисленными на основе текста(и самих себя) хэшами
	//вычисляем нужно ли дозаполнять текст(чтобы сделать его кратным 128)
	let x=string_16.length==l,//если количество символов обработанного текста кратно 128(то есть не нужно добавлять иной текст чтобы текст стал кратен 128)
	/*чтобы не вырезать символы текста, нужно как-то отличить его от хэша, которым будем дозаполнять текст
	  для этого символ(в хэше), перед которым вырезается подстрока(из хэша), должен отличаться от последнего в символа в тексте*/
		a=x?127:l-string_16.length;//определяем положение символа в хэше который будем сравнивать с конечным символом обработанного текста, они не должны совпадать
	while(h_array[n+1][127-a]==string_16[string_16.length-1]){//проверяем на совпадение символов, крайнего перед вырезаемой строкой из хэша и крайнего символа из текста
		for(let i=0;i<(n+1);i++)h_array[i]=h_array[i+1];//если всё-таки совпали, то удаляем первый хэш(0) и смещаем по позициям остальные хэши
		h_array[n+1]=this.sha_3(h_array[n]);//генерируем крайний хэш
	};
	if(!x)string_16=string_16+h_array[n+1].substring(128-a);//если нужно дозаполнить текст до кратности 128, то вырезаем подстроку(с нужным количеством символов) и крайнего хэша
	for(let i=1;i<(n+1);i++){//создаём скрывающую маску
		h_text+=h_array[i];};//складываем элементы хэша, для образовании маски которую будем накладывать на текст, чтобы в случае одинакового пароля и минимальных изменений в тексте результат кодирования менялся полностью
	for(let i=0;i<string_16.length;i++)hidden+=(parseInt(h_text[i],16)^parseInt(string_16[i],16)).toString(16);//накладываем скрывающую маску на текст
	hidden=hidden+h_array[0];//добавляем к тексту с наложенной изменяющей маске, ключ(хэш) на основе которого можно вычислить наложенную на текст скрывающую маску
	for(let i=0;i<mask.length;i++)impose+=(parseInt(mask[i],16)^parseInt(hidden[i],16)).toString(16);//накладываем маску на текст
	for(let i=0;i<array.length;i++)for(let y=0;y<16;y++)mix+=impose[i*16+parseInt(array[i][y],16)];//переставляем символы в строке согласно шаблону
	return mix;//возвращает зашифрованный текст
},
decrypt(password,text){//функция дешифровки зашифрованного текста, путем накладывания на него маски
	let n=Math.ceil((text.length)/128),//округление до большего целого, рассчитываем длину хэш строки
		[array,//массив перестановочных шаблонов
		mask]=this.ingot(password,n),//кодирующая маска
		temp=[],//временная переменная
		h_array=[],//массив хэшей текста, (количеством n+2, где 2: [0] это ключ на основе которого вычисляются остальные хэши, [крайний] хэш нужен чтобы сделать(дозаполнить) текст кратным 128)
		h_text="",//переменная для хранения текста полученного при конкатенации элементов массива хэшев(кроме 0 и крайнего элементов), скрывающая маска
		separate="",//1 стадия, собираем закодированное сообщение из перемешанных символов
		hidden="",//2 стадия, снимаем с текста скрывающую маску
		string_16="";//3 стадия, осталось перевести коды символов в символы
	for(let i=0;i<array.length;i++){//по перестановочному шаблону получаем зашифрованный текст
		for(let y=0;y<16;y++){
			temp[parseInt(array[i][y],16)]=text[i*16+y];//строка из 16 символов собранная по перестановочному шаблону
		};
	separate+=temp.join("");//объединяем массивы символов в строку
	};
	for(let i=0;i<mask.length;i++){//накладываем маску на текст
		hidden+=(parseInt(mask[i],16)^parseInt(separate[i],16)).toString(16);
	};
	//этап снятия скрывающей маски
	let key=hidden.substring(hidden.length-128);//вырезаем ключ(хэш), на основе которого будет получена скрывающая маска и хэш для дозаполнения текста(нужного для кратности текста 128)
	hidden=hidden.substring(0,hidden.length-128);//текст без вырезанного ключа но скрывающая маска ещё наложена
	h_array[0]=key;//первый элемент массива это ключ переданный в закодированном тексте
	for(let i=1;i<(n+1);i++)h_array[i]=this.sha_3(h_array[i-1]);//заполняем массив полученными на основе ключа хэшами
	for(let i=1;i<(n+1);i++){
		h_text+=h_array[i];};//слаживаем элементы хэша, для образовании маски которую будем накладывать на текст, чтобы в случае одинакового пароля и минимальных изменений в тексте результат кодирования менялся полностью
	temp="";//временная переменная для хранения текста со снятой скрывающей 
	for(let i=0;i<hidden.length;i++)temp+=(parseInt(h_text[i],16)^parseInt(hidden[i],16)).toString(16);//вырезаем скрывающую маску с текста
	hidden=temp;//переносим результат обратно результирующую переменную
	//этап отделения от текста строки для дозаполнения(для кратности текста 128)
	let placeholder=h_array[n],//последний элемент массива это хэш, который служит для дозаполнения текста(для кратности текста 128)
		cut=hidden.substring(hidden.length-128),//128 с конца текста с наложенным дозаполняющим хэшем(чтобы не городить лишние, сравним 128 символов из одного "набора" с другим "набором")
		a=0;//переменная которая показывает где заканчивается текст и начинается дозапоняющий хэш
	for(let i=0;i<128;i++){//собственно поиск этой позиции
		let l=127-i;
		if(placeholder[l]!=cut[l]){//посимвольно сравниваем отпиленный кусок текста и дозаполняющий хэш
			a=i;//где символы отличатся, значит это уже начался текст
			break;
		}
	};
	string_16=hidden.substring(0,hidden.length-a);//вырезаем дозапоняющий хэш из текста
	//return null;//если не нашли, значит, текст не расшифрован
	let result=new TextDecoder().decode(new Uint8Array(string_16.match(/.{2}/g).map(x=>parseInt(x,16))));
	//string_16.match(/.{2}/g) - разбивает результат на массив из 2 символов
	//map(x=>parseInt(x,16)) - преобразует шестнадцатеричную строку из двух символов в число
	//new TextDecoder().decode() - преобразует массив кодов символов в текст
	return result;//расшифрованный текст
},
sha_3(str){//хэш функция SHA3_512
	let r=576,
		c=1024,
		l=c/2,
		msg=new TextEncoder().encode(str).reduce((prev,curr)=>prev+char(curr),""),
		state=[[],[],[],[],[]];
	for(let x=0;x<5;x++)for(let y=0;y<5;y++)state[x][y]=0n;
	let q=(r/8)-msg.length%(r/8);
	if(q==1)msg+=char(0x86);
	else{
		msg+=char(0x06);
		msg+=char(0x00).repeat(q-2);
		msg+=char(0x80);
	};
	let w=64,
	blocksize=r/w*8,
	keccak_f_1600=(a)=>{
		let nRounds=24,
			RC=[
			0x0000000000000001n,0x0000000000008082n,0x800000000000808an,
			0x8000000080008000n,0x000000000000808bn,0x0000000080000001n,
			0x8000000080008081n,0x8000000000008009n,0x000000000000008an,
			0x0000000000000088n,0x0000000080008009n,0x000000008000000an,
			0x000000008000808bn,0x800000000000008bn,0x8000000000008089n,
			0x8000000000008003n,0x8000000000008002n,0x8000000000000080n,
			0x000000000000800an,0x800000008000000an,0x8000000080008081n,
			0x8000000000008080n,0x0000000080000001n,0x8000000080008008n,
			],
			ROT=(a,d)=>BigInt.asUintN(64,a<<BigInt(d)|a>>BigInt(64-d));
		for(let r=0;r<nRounds;r++){
			let C=[],D =[];
			for(let x=0;x<5;x++){
				C[x]=a[x][0];
				for(let y=1;y<5;y++)C[x]=C[x]^a[x][y];
			};
			for(let x=0;x<5;x++){
				D[x]=C[(x+4)%5]^ROT(C[(x+1)%5],1);
				for(let y=0;y<5;y++)a[x][y]=a[x][y]^D[x];
			};
			let [x,y]=[1,0],
				current=a[x][y];
			for(let t=0;t<24;t++){
				let [X,Y]=[y,(2*x+3*y)%5],
					tmp=a[X][Y];
				a[X][Y]=ROT(current,((t+1)*(t+2)/2)%64);
				current=tmp;
				[x,y]=[X,Y];
			};
			for(let y=0;y<5;y++){
				let C=[];
				for(let x=0;x<5;x++)C[x]=a[x][y];
				for(let x=0;x<5;x++)a[x][y]=(C[x]^((~C[(x+1)%5])&C[(x+2)%5]));
			};
			a[0][0]=(a[0][0]^RC[r]);
		};
	};
	let transpose=(array)=>array.map((row,r)=>array.map(col=>col[r]));
	for(let i=0;i<msg.length;i+=blocksize){
		for(let j=0;j<r/w;j++){
			let i64=(BigInt(msg.charCodeAt(i+j*8+0))<<0n)+(BigInt(msg.charCodeAt(i+j*8+1))<<8n)+(BigInt(msg.charCodeAt(i+j*8+2))<<16n)+(BigInt(msg.charCodeAt(i+j*8+3))<<24n)+(BigInt(msg.charCodeAt(i+j*8+4))<<32n)+(BigInt(msg.charCodeAt(i+j*8+5))<<40n)+(BigInt(msg.charCodeAt(i+j*8+6))<<48n)+(BigInt(msg.charCodeAt(i+j*8+7))<<56n),
				x=j%5,
				y=Math.floor(j/5);
			state[x][y]=state[x][y]^i64;
		};
		keccak_f_1600(state);
	};
	let md=transpose(state)
		.map(plane=>plane.map(lane=>lane.toString(16).padStart(16,"0").match(/.{2}/g).reverse().join("")).join(""))
		.join("")
		.slice(0,l/4);
	return md;
},
};

let $={//Объект, упрощающий жизнь
d:document,
event(...array){//навешивает/удаляет обработчик на объект/массив объектов
	let a=typeof array[0]==="string"?[array]:array;//если строка запихиваем её в массив
	a.forEach((x)=>{//навешиваем/удаляем обработчик на объект
			switch(x[0]){
				case "a":x[1].addEventListener(x[2],x[3]);
				break;
				case "r":x[1].removeEventListener(x[2],x[3]);
				break;
				default:fail.red("Для назначения события передан не тот параметр");return;
			}
	});
},
bind_all(obj){for(let method in obj)if(typeof obj[method]=="function")obj[method]=obj[method].bind(obj);},//задаёт функциям ссылку на родительский объект
async ajax(url,obj=0){//AJAX модуль
	let controller=new AbortController();//объект который позволяет сбросить запрос
	let signal=controller.signal;
	setTimeout(()=>controller.abort(),20000);//таймер на сброс запроса
	let options={//определяем объект с опциями запроса
		method:"post",
		headers:{"Content-Type":"text/plain;charset=utf-8"},
		cache:"no-cache",
		body:JSON.stringify(obj),
		signal
	}
	let response=await fetch(url,options);
	if(!response.ok) throw new Error (response.status+" "+response.statusText);//проверка на ошибки
	let text=await response.text();//получаем тело ответа
	//if (text.toLowerCase().indexOf("error")!=-1) throw new Error(text);//проверяем проблемы
	let data=JSON.parse(text);//парсим тело ответа в объект
	if(data.alert) throw new Error(data.error);//проверяем есть ли проблемы на стороне сервера
	return data;
}
};

let fail={//Модуль ошибок
load(){//инициализация модуля ошибок
	$.bind_all(fail);
	$.d.head.after(fail.alarm=$.d.createElement("alarm"));//создаем контейнер для сообщений и вставляем его в head
	$.event("a",fail.alarm,"click",fail.delete);//вешаем обработчик на кнопки закрытия сообщений
},
red(text){console.error(text);this.timer(this.paste(text,"red"));},//ошибка
green(text){console.info(text);this.timer(this.paste(text,"green"));},//информационное сообщение
orange(text){console.warn;this.paste(text,"orange");},//важное сообщение
timer(node){//ставит таймер на удаление сообщения
	let timer=setInterval(()=>{
		if(!node)clearInterval(timer);
		else if(!+window.getComputedStyle(this.alarm).order){
/*
	Если курсор не наведен, то удаляет сообщение;
	считывает свойство CSS(order), которое меняется от наведения курсора,
	"+" превращает символ в число.
*/
		node.remove();
		clearInterval(timer);
	  }
	},5000);
},
delete(){//удаляет сообщение по клику
	if(event.target.tagName=="X")event.target.parentNode.remove();
},
paste(text,color){
	let a=$.d.createElement(color);
	a.innerHTML=text+"<x c>";//текст + кнопка закрытия сообщения
	a.setAttribute("r","");//атрибут для CSS
	return this.alarm.appendChild(a);//вставляем сообщение в контейнер
}
};

(()=>{//функция для автоматического запуска модулей
	let run=()=>{
		$.event("r",document,"DOMContentLoaded",run);
		let date=[
			fail.load,
			main.load,
			];
			Promise.all(date.map(Function=>Function()))//промисс параллельного выполнения, метод map проходит по принимаемому массиву и выполняет указанную функцию над каждым элементом 
			.catch(error=>console.error('load error'));	
	}
	$.event("a",document,"DOMContentLoaded",run);
})();

let help ="Для создания записи, открываем сайт без передаваемых аргументов, нажимаем по белому фону в левом верхнем углу. Вводим пароль и текст, далее получаем ссылку на созданную запись. Для получения текста записи, переходим по ранее полученной ссылке, после введения пароля, полученный зашифрованный текст будет расшифрован."
