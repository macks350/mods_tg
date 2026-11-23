/* ===== Хранилище (localStorage) ===== */
const $=(s,r=document)=>r.querySelector(s), esc=s=>String(s).replace(/[&<>"']/g,c=>'&#'+c.charCodeAt(0)+';');
const LS=(k,d)=>{try{return JSON.parse(localStorage.getItem(k))??d}catch{return d}};
const put=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v))}catch{toast('Память браузера заполнена')}};
const S={mods:[],cats:[],users:LS('users',[]),me:LS('me',null),likes:LS('likes',{}),favs:LS('favs',[]),rates:LS('rates',{})};
const PER=6, EXT='.tg_mod';
const toast=t=>{const e=$('#toast');e.textContent=t;e.classList.add('show');setTimeout(()=>e.classList.remove('show'),1800)};
const avg=m=>m.rcount?(m.rsum/m.rcount).toFixed(1):'—';
const byId=id=>S.mods.find(m=>m.id==id);
const saveMods=()=>put('mods',S.mods);

/* ===== Генерация превью (если нет скриншота) ===== */
function art(m,i=0){
  if(m.shots&&m.shots[i])return `background-image:url(${m.shots[i]})`;
  const a=(m.id*37+i*53)%180,w=6+(m.id+i)%9;
  return `background:repeating-linear-gradient(${a}deg,var(--fg) 0 ${w}px,var(--bg) ${w}px ${w*2}px)`;
}
const card=m=>`<a class="card" href="#/mod/${m.id}"><div class="art" style="${art(m)}"><b>${esc(m.title[0])}</b></div>
<div class="cb"><span class="badge">${esc(m.cat)}</span><h3>${esc(m.title)}</h3><p class="by">${esc(m.author)}</p>
<p class="st">⭐ ${avg(m)} &nbsp; ⬇ ${m.downloads} &nbsp; ❤ ${m.likes}</p></div></a>`;
const grid=l=>l.length?`<div class="grid">${l.map(card).join('')}</div>`:'<p class="meta">Ничего не найдено.</p>';

/* ===== Страницы ===== */
const V={
 home(){ // Главная: Популярные / Новые / Обновлённые
  const t=(k)=>[...S.mods].sort((a,b)=>typeof a[k]=='string'?b[k].localeCompare(a[k]):b[k]-a[k]).slice(0,4);
  app(`<h1>Моды для Telegram</h1><p class="meta">Скачивай, оценивай, делись своими ${EXT}</p>
  <h2>Популярные</h2>${grid(t('downloads'))}<h2>Новые</h2>${grid(t('date'))}<h2>Обновлённые</h2>${grid(t('updated'))}`)},
 catalog(a,P){ // Каталог: фильтр, сортировка, пагинация
  const cat=P.get('cat')||'',sort=P.get('sort')||'date',q=(P.get('q')||'').toLowerCase(),pg=+(P.get('page')||1);
  let l=S.mods.filter(m=>(!cat||m.cat==cat)&&(!q||(m.title+m.author+m.tags.join(' ')).toLowerCase().includes(q)));
  const key={date:m=>m.date,downloads:m=>m.downloads,rating:m=>m.rcount?m.rsum/m.rcount:0,likes:m=>m.likes}[sort];
  l.sort((x,y)=>key(y)>key(x)?1:-1);
  const pages=Math.max(1,Math.ceil(l.length/PER));
  const u=o=>'#/catalog?'+new URLSearchParams({cat,sort,q,page:1,...o});
  app(`<h1>Каталог</h1><div class="bar">
  <select onchange="location.hash=this.value">${[['date','Новые'],['downloads','Популярные'],['rating','По рейтингу'],['likes','По лайкам']].map(([v,n])=>`<option value="${u({sort:v})}" ${v==sort?'selected':''}>${n}</option>`).join('')}</select>
  <select onchange="location.hash=this.value"><option value="${u({cat:''})}">Все категории</option>${S.cats.map(c=>`<option value="${u({cat:c})}" ${c==cat?'selected':''}>${c}</option>`).join('')}</select></div>
  ${grid(l.slice((pg-1)*PER,pg*PER))}<div class="pager">${Array.from({length:pages},(_,i)=>`<a class="${i+1==pg?'act':''}" href="${u({page:i+1})}">${i+1}</a>`).join('')}</div>`)},
 mod([,id]){ // Страница мода
  const m=byId(id);if(!m)return app('<h1>Мод не найден</h1>');
  const n=Math.max(3,(m.shots||[]).length),my=S.rates[m.id]||0,sim=S.mods.filter(x=>x.cat==m.cat&&x.id!=m.id).slice(0,4);
  app(`<div class="mod"><div><div class="main-shot" id="shot" style="${art(m)}"><b>${esc(m.title[0])}</b></div>
  <div class="thumbs">${Array.from({length:n},(_,i)=>`<div data-act="shot" data-i="${i}" style="${art(m,i)}"></div>`).join('')}</div></div>
  <div><span class="badge">${esc(m.cat)}</span><h1>${esc(m.title)}</h1>
  <p class="meta">Автор: <a href="#/author/${encodeURIComponent(m.author)}"><u>${esc(m.author)}</u></a> · v${esc(m.ver)} · ${m.date}</p>
  <p class="meta" style="margin:8px 0">⭐ ${avg(m)} (${m.rcount}) &nbsp; ⬇ ${m.downloads} &nbsp; ❤ ${m.likes}</p>
  <div class="stars" id="stars">${[1,2,3,4,5].map(i=>`<span class="${i<=my?'on':''}" data-act="rate" data-n="${i}">★</span>`).join('')}</div>
  <div class="bar"><button class="btn" data-act="dl" data-id="${m.id}">⬇ Скачать ${EXT}</button>
  <button class="btn ghost ${S.likes[m.id]?'on':''}" data-act="like" data-id="${m.id}">❤ Лайк</button>
  <button class="btn ghost ${S.favs.includes(m.id)?'on':''}" data-act="fav" data-id="${m.id}">☆ В избранное</button></div>
  ${m.video?`<p><a href="${esc(m.video)}" target="_blank" rel="noopener"><u>▶ Видео</u></a></p>`:''}</div></div>
  <div class="box"><h3>Описание</h3><p>${esc(m.desc)}</p><p class="meta">${m.tags.map(t=>'#'+esc(t)).join(' ')}</p></div>
  <div class="box"><h3>Список изменений</h3><ul style="padding-left:20px">${m.changes.map(c=>`<li>${esc(c)}</li>`).join('')}</ul></div>
  <div class="box"><h3>Комментарии (${m.comments.length})</h3>${m.comments.map(c=>`<div class="cm"><b>${esc(c.u)}</b> <span class="meta">${c.d}</span><br>${esc(c.t)}</div>`).join('')}
  <form data-form="comment" data-id="${m.id}"><textarea name="t" rows="2" required placeholder="Ваш комментарий"></textarea><br><button class="btn sm" style="margin-top:8px">Отправить</button></form></div>
  <h2>Похожие моды</h2>${grid(sim)}`)},
 upload(){ // Загрузка мода
  if(!S.me)return app('<h1>Загрузка</h1><p>Сначала <a href="#/auth"><u>войдите</u></a>.</p>');
  app(`<h1>Загрузить мод</h1><form data-form="upload" style="max-width:560px">
  <label>Название</label><input name="title" required>
  <label>Категория</label><select name="cat">${S.cats.map(c=>`<option>${c}</option>`).join('')}</select>
  <label>Версия</label><input name="ver" value="1.0" required>
  <label>Описание</label><textarea name="desc" rows="4" required></textarea>
  <label>Теги (через запятую)</label><input name="tags">
  <label>Скриншоты (до 3)</label><input type="file" name="shots" accept="image/*" multiple>
  <label>Файл мода (${EXT})</label><input type="file" name="file" accept="${EXT}" required>
  <label>Ссылка на видео</label><input name="video" type="url">
  <br><button class="btn">Опубликовать</button></form>`)},
 author([,n]){ // Профиль автора
  n=decodeURIComponent(n);const l=S.mods.filter(m=>m.author==n),s=k=>l.reduce((a,m)=>a+m[k],0);
  app(`<div style="display:flex;gap:18px;align-items:center;flex-wrap:wrap"><div class="ava">${esc(n[0]||'?')}</div><div><h1 style="margin:0">${esc(n)}</h1>
  <p class="meta">Модов: ${l.length} · ⬇ ${s('downloads')} · ❤ ${s('likes')} · ⭐ ${l.length?(l.reduce((a,m)=>a+(m.rcount?m.rsum/m.rcount:0),0)/l.length).toFixed(1):'—'}</p></div></div><h2>Моды автора</h2>${grid(l)}`)},
 favs(){app(`<h1>Избранное</h1>${grid(S.mods.filter(m=>S.favs.includes(m.id)))}`)},
 auth(){ // Регистрация / вход
  if(S.me)return app(`<h1>${esc(S.me)}</h1><a class="btn" href="#/author/${encodeURIComponent(S.me)}">Мой профиль</a> <button class="btn ghost" data-act="out">Выйти</button>`);
  app(`<h1>Вход / регистрация</h1><form data-form="auth" style="max-width:360px"><label>Ник</label><input name="u" required minlength="2">
  <label>Пароль</label><input name="p" type="password" required minlength="4"><br><button class="btn" name="mode" value="in">Войти</button> <button class="btn ghost" name="mode" value="up">Регистрация</button></form>`)}
};
const app=h=>{$('#app').innerHTML=h};

/* ===== Роутер ===== */
function route(){
  const [p,q]=location.hash.slice(1).split('?'),a=p.split('/').filter(Boolean);
  (V[a[0]]||V.home)(a.slice(0),new URLSearchParams(q||''));scrollTo(0,0);
  $('#who').textContent=S.me||'Войти';
  const cat=new URLSearchParams(q||'').get('cat');
  $('#cats').innerHTML=`<a href="#/catalog" class="${a[0]=='catalog'&&!cat?'act':''}">Все</a>`+S.cats.map(c=>`<a href="#/catalog?cat=${encodeURIComponent(c)}" class="${c==cat?'act':''}">${c}</a>`).join('')+'<a href="#/favs">☆ Избранное</a>';
}

/* ===== Действия (делегирование событий) ===== */
document.addEventListener('click',e=>{
  const b=e.target.closest('[data-act]');if(!b)return;const act=b.dataset.act,id=+b.dataset.id,m=byId(id||location.hash.split('/')[2]);
  if(act=='theme'){const t=document.documentElement.dataset.theme=='dark'?'light':'dark';document.documentElement.dataset.theme=t;put('theme',t)}
  if(act=='out'){S.me=null;put('me',null);route()}
  if(act=='shot')$('#shot').style.cssText=art(m,+b.dataset.i);
  if(act=='like'){S.likes[m.id]?(delete S.likes[m.id],m.likes--):(S.likes[m.id]=1,m.likes++);put('likes',S.likes);saveMods();route()}
  if(act=='fav'){S.favs=S.favs.includes(m.id)?S.favs.filter(x=>x!=m.id):[...S.favs,m.id];put('favs',S.favs);route()}
  if(act=='rate'){const n=+b.dataset.n,old=S.rates[m.id];m.rsum+=n-(old||0);if(!old)m.rcount++;S.rates[m.id]=n;put('rates',S.rates);saveMods();route();toast('Оценка: '+n)}
  if(act=='dl'){ // Скачивание: файл с окончанием .tg_mod
    m.downloads++;saveMods();
    const body=m.fileData||JSON.stringify({name:m.title,version:m.ver,author:m.author,category:m.cat},null,1);
    const a=Object.assign(document.createElement('a'),{href:URL.createObjectURL(new Blob([body])),download:m.title.replace(/\W+/g,'_')+EXT});a.click();route()}
});
document.addEventListener('submit',async e=>{
  const f=e.target.closest('[data-form]');if(!f)return;e.preventDefault();const d=new FormData(f),k=f.dataset.form;
  if(k=='comment'){const m=byId(f.dataset.id);m.comments.push({u:S.me||'Гость',t:d.get('t'),d:new Date().toISOString().slice(0,10)});saveMods();route()}
  if(k=='auth'){const u=d.get('u'),p=btoa(unescape(encodeURIComponent(d.get('p')))),x=S.users.find(z=>z.u==u),up=e.submitter.value=='up';
    if(up){if(x)return toast('Ник занят');S.users.push({u,p});put('users',S.users)}else if(!x||x.p!=p)return toast('Неверный ник или пароль');
    S.me=u;put('me',u);location.hash='#/auth'}
  if(k=='upload'){
    const file=d.get('file');if(!file.name.endsWith(EXT))return toast('Нужен файл '+EXT);
    const rd=f=>new Promise(r=>{const x=new FileReader();x.onload=()=>r(x.result);f.name.endsWith(EXT)?x.readAsText(f):x.readAsDataURL(f)});
    const shots=await Promise.all(d.getAll('shots').slice(0,3).filter(s=>s.size&&s.size<400000).map(rd));
    const today=new Date().toISOString().slice(0,10);
    S.mods.push({id:Math.max(0,...S.mods.map(m=>m.id))+1,title:d.get('title'),author:S.me,cat:d.get('cat'),ver:d.get('ver'),date:today,updated:today,desc:d.get('desc'),
      changes:['Первый релиз'],tags:d.get('tags').split(',').map(t=>t.trim()).filter(Boolean),likes:0,downloads:0,rsum:0,rcount:0,video:d.get('video'),comments:[],shots,fileData:file.size<300000?await rd(file):null});
    saveMods();toast('Опубликовано');location.hash='#/mod/'+S.mods.at(-1).id}
});
/* Живой поиск */
$('#q').addEventListener('input',e=>{
  const v=e.target.value.toLowerCase().trim(),r=$('#sres');
  const l=v?S.mods.filter(m=>(m.title+m.author+m.tags.join(' ')).toLowerCase().includes(v)).slice(0,5):[];
  r.style.display=l.length?'block':'none';r.innerHTML=l.map(m=>`<a href="#/mod/${m.id}">${esc(m.title)} <span class="meta">— ${esc(m.author)}</span></a>`).join('')});
$('#q').addEventListener('keydown',e=>{if(e.key=='Enter'){location.hash='#/catalog?q='+encodeURIComponent(e.target.value);$('#sres').style.display='none'}});
document.addEventListener('click',e=>{if(!e.target.closest('.search'))$('#sres').style.display='none'});
addEventListener('hashchange',route);

/* ===== Старт: данные из localStorage или встроенные (копия data.json, сервер не нужен) ===== */
const SEED={"categories": ["Боты", "Темы", "Плагины", "Стикеры", "Утилиты"], "mods": [{"id": 1, "title": "DarkGram Pro", "author": "Nox", "cat": "Темы", "ver": "2.1", "date": "2026-09-02", "updated": "2026-11-10", "desc": "Глубокая чёрная тема с белыми акцентами для клиента Telegram.", "changes": ["Новые иконки", "Фикс контраста"], "tags": ["тема", "amoled"], "likes": 412, "downloads": 5230, "rsum": 93, "rcount": 20, "video": "", "comments": [{"u": "Kira", "t": "Огонь, батарея живёт дольше.", "d": "2026-11-11"}]}, {"id": 2, "title": "AutoReply Bot", "author": "Vex", "cat": "Боты", "ver": "1.4", "date": "2026-10-12", "updated": "2026-10-30", "desc": "Бот автоответов с шаблонами и расписанием.", "changes": ["Добавлены шаблоны", "Расписание"], "tags": ["бот", "автоответ"], "likes": 230, "downloads": 3100, "rsum": 80, "rcount": 18, "video": "", "comments": []}, {"id": 3, "title": "Ghost Mode", "author": "Nox", "cat": "Плагины", "ver": "3.0", "date": "2026-08-20", "updated": "2026-11-20", "desc": "Скрывает статус «онлайн» и прочтение.", "changes": ["Переписан движок", "Меньше потребляет памяти"], "tags": ["приватность"], "likes": 890, "downloads": 12040, "rsum": 210, "rcount": 48, "video": "", "comments": []}, {"id": 4, "title": "Skull Pack", "author": "Mara", "cat": "Стикеры", "ver": "1.0", "date": "2026-11-18", "updated": "2026-11-18", "desc": "Набор ч/б стикеров в стиле гранж.", "changes": ["Первый релиз"], "tags": ["стикеры", "гранж"], "likes": 120, "downloads": 980, "rsum": 44, "rcount": 10, "video": "", "comments": []}, {"id": 5, "title": "Chat Exporter", "author": "Vex", "cat": "Утилиты", "ver": "1.2", "date": "2026-07-05", "updated": "2026-09-15", "desc": "Экспорт переписки в JSON и TXT.", "changes": ["Экспорт в TXT"], "tags": ["экспорт"], "likes": 98, "downloads": 1500, "rsum": 38, "rcount": 9, "video": "", "comments": []}, {"id": 6, "title": "Paper Light", "author": "Mara", "cat": "Темы", "ver": "1.7", "date": "2026-06-01", "updated": "2026-11-02", "desc": "Светлая газетная тема, чёрный по белому.", "changes": ["Шрифты", "Новые обои"], "tags": ["тема", "light"], "likes": 310, "downloads": 4100, "rsum": 71, "rcount": 16, "video": "", "comments": []}, {"id": 7, "title": "Glitch Fonts", "author": "Nox", "cat": "Плагины", "ver": "0.9", "date": "2026-11-21", "updated": "2026-11-22", "desc": "Глитч-шрифты для сообщений.", "changes": ["Бета"], "tags": ["шрифты"], "likes": 75, "downloads": 620, "rsum": 27, "rcount": 6, "video": "", "comments": []}, {"id": 8, "title": "Mod Manager", "author": "Vex", "cat": "Утилиты", "ver": "2.5", "date": "2026-05-14", "updated": "2026-10-01", "desc": "Менеджер установленных .tg_mod файлов.", "changes": ["Автообновление"], "tags": ["менеджер"], "likes": 502, "downloads": 7700, "rsum": 120, "rcount": 26, "video": "", "comments": []}]};
(()=>{
  document.documentElement.dataset.theme=LS('theme','dark');
  S.cats=SEED.categories;S.mods=LS('mods',null)||SEED.mods;
  route();
})();
