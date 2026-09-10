/* Döcke чердачные лестницы — рендер каталога.
   Плитки + таблица подбора + модальное окно; данные в assets/data.js. */

/* На GitHub Pages сайт лежит целиком и пути в data.js относительные.
   В блоке T123 страницу отдаёт Тильда, а картинки и скрипты остаются на
   Pages — тогда блок заранее кладёт адрес Pages в window.DK_ASSET_BASE,
   и все относительные пути склеиваются с ним. */
var DK_BASE = (typeof window !== 'undefined' && typeof window.DK_ASSET_BASE === 'string')
  ? window.DK_ASSET_BASE : '';

function asset(p) {
  if (!p || !DK_BASE || p.indexOf('http') === 0 || p.indexOf('//') === 0) return p;
  return DK_BASE + p;
}

function esc(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function priceHtml(m) {
  if (!m.price) return '<span class="price price-ask">Цена по запросу</span>';
  return '<span class="price">от ' + esc(m.price) + ' <small>' + esc(m.unit || '') + '</small></span>';
}

/* Цены из блока T123 (DK_PRICES) перекрывают то, что лежит в data.js.
   Ключ — точное название модели; неизвестный ключ пишет предупреждение
   в консоль, иначе опечатку в названии не заметить. */
function applyPrices(map, unit, list) {
  if (!map) return;
  var known = {};
  (list || []).forEach(function (m) {
    known[m.name] = true;
    if (Object.prototype.hasOwnProperty.call(map, m.name)) {
      m.price = String(map[m.name]).trim();
      if (unit) m.unit = unit;
    }
  });
  Object.keys(map).forEach(function (k) {
    if (!known[k]) console.warn('DK_PRICES: позиция «' + k + '» не найдена — проверьте название');
  });
}

/* Реестр моделей: slug -> модель. Нужен плиткам, таблице и окну. */
var MODEL_INDEX = {};

/* ---------- плитка ---------- */
function modelTile(m) {
  return '<a href="#' + m.slug + '" class="model-tile" data-key="' + m.slug + '">' +
    '<span class="model-tile-media">' +
      '<img class="docke-badge" src="' + asset('assets/images/docke-logo.svg') + '" alt="Döcke">' +
      '<img src="' + asset(m.hero) + '" alt="Чердачная лестница Döcke ' + esc(m.name) + '" loading="lazy">' +
      '<span class="model-tile-hint">Подробнее</span>' +
    '</span>' +
    '<span class="model-tile-body">' +
      '<span class="model-tile-name">' + esc(m.name) + '</span>' +
      '<span class="model-tile-short">' + esc(m.short) + '</span>' +
      '<span class="model-tile-meta">' + priceHtml(m) +
        '<span class="width">' + esc(m.meta || '') + '</span>' +
      '</span>' +
    '</span>' +
  '</a>';
}

/* Каталог рисуется группами: подзаголовок + своя сетка плиток. */
function renderCatalog(hostId, models) {
  var host = document.getElementById(hostId);
  if (!host || !models || !models.length) return;

  var order = [], byGroup = {};
  models.forEach(function (m) {
    MODEL_INDEX[m.slug] = m;
    if (!byGroup[m.group]) { byGroup[m.group] = []; order.push(m.group); }
    byGroup[m.group].push(m);
  });

  host.innerHTML = order.map(function (g, gi) {
    return '<h3 class="group-heading"' + (gi ? ' id="accessories"' : '') + '>' + esc(g) +
      '<span class="count-badge">' + byGroup[g].length + '</span></h3>' +
      '<div class="model-grid">' + byGroup[g].map(modelTile).join('') + '</div>';
  }).join('');
}

/* ---------- таблица подбора ---------- */
function renderTable(hostId, models) {
  var host = document.getElementById(hostId);
  if (!host) return;
  var rows = models.filter(function (m) { return m.group !== 'Аксессуары'; });

  host.innerHTML =
    '<table class="pick-table">' +
      '<thead><tr>' +
        '<th>Модель</th><th>Потолок</th><th>Проём</th><th>Утепление люка</th>' +
        '<th>Нагрузка</th><th>Вес</th><th>Цена</th>' +
      '</tr></thead><tbody>' +
      rows.map(function (m) {
        return '<tr data-key="' + m.slug + '">' +
          '<td class="pick-name">' + esc(m.name) + '</td>' +
          '<td>' + esc(m.ceiling) + '</td>' +
          '<td>' + esc(m.hole) + '</td>' +
          '<td>' + esc(m.ins) + '</td>' +
          '<td>' + esc(m.load) + '</td>' +
          '<td>' + esc(m.weight) + '</td>' +
          '<td class="pick-price">' + (m.price ? 'от ' + esc(m.price) + ' ' + esc(m.unit || '') : '—') + '</td>' +
        '</tr>';
      }).join('') +
      '</tbody></table>';
}

/* ---------- содержимое окна ---------- */
function modelDetailHtml(key) {
  var m = MODEL_INDEX[key];
  if (!m) return '';

  var propsHtml = (m.props || []).map(function (p) {
    return '<div><span class="k">' + esc(p[0]) + '</span><span class="v">' + esc(p[1]) + '</span></div>';
  }).join('');

  var shots = [m.hero].concat(m.gallery || []);
  var thumbs = shots.length < 2 ? '' :
    '<div class="model-thumbs">' + shots.map(function (src, i) {
      return '<button type="button" class="model-thumb' + (i === 0 ? ' is-active' : '') + '"' +
        ' data-img="' + asset(src) + '" aria-label="Фото ' + (i + 1) + '">' +
        '<img src="' + asset(src) + '" alt="" loading="lazy"></button>';
    }).join('') + '</div>';

  return '<div class="collection-head">' +
      '<div class="collection-hero-col">' +
        '<div class="collection-hero">' +
          '<img class="docke-badge" src="' + asset('assets/images/docke-logo.svg') + '" alt="Döcke">' +
          '<img class="model-modal-photo" src="' + asset(m.hero) + '" alt="Чердачная лестница Döcke ' + esc(m.name) + '">' +
        '</div>' +
        thumbs +
        '<a href="#contacts" class="btn">Где купить</a>' +
      '</div>' +
      '<div class="collection-head-text">' +
        '<span class="collection-tag">' + esc(m.group) + '</span>' +
        '<div class="collection-title-row">' +
          '<h3 class="section-title collection-title" style="font-size:22px">' + esc(m.name) + '</h3>' +
          (m.price
            ? '<div class="collection-price">Цена от <span>' + esc(m.price) + '</span> ' + esc(m.unit || '') + '</div>'
            : '') +
        '</div>' +
        '<p class="section-sub">' + esc(m.desc) + '</p>' +
        (propsHtml ? '<div class="model-props">' + propsHtml + '</div>' : '') +
        (m.note ? '<p class="model-note">' + esc(m.note) + '</p>' : '') +
      '</div>' +
    '</div>';
}

/* ---------- окно ---------- */
var MODAL = null;          // корневой элемент окна
var MODAL_PUSHED = false;  // добавляли ли мы запись в историю
var MODAL_SCROLL = null;   // сохранённые inline-стили overflow

function modalRoot() {
  if (MODAL) return MODAL;
  MODAL = document.createElement('div');
  MODAL.className = 'model-modal';
  MODAL.setAttribute('role', 'dialog');
  MODAL.setAttribute('aria-modal', 'true');
  MODAL.innerHTML =
    '<div class="model-modal-backdrop" data-close="1"></div>' +
    '<div class="model-modal-dialog">' +
      '<button type="button" class="model-modal-close" data-close="1" aria-label="Закрыть">&times;</button>' +
      '<div class="model-modal-body"></div>' +
    '</div>';
  /* Внутрь блока, а не в body: в Тильде весь CSS ограничен областью
     видимости .dk, и окно, висящее в body, осталось бы без стилей. */
  (document.querySelector('.dk') || document.body).appendChild(MODAL);

  MODAL.addEventListener('click', function (e) {
    var t = e.target;
    if (t.getAttribute && t.getAttribute('data-close')) { e.preventDefault(); closeModel(); return; }

    var th = t.closest ? t.closest('.model-thumb') : null;
    if (th) {
      var photo = MODAL.querySelector('.model-modal-photo');
      if (photo) photo.src = th.getAttribute('data-img');
      Array.prototype.forEach.call(MODAL.querySelectorAll('.model-thumb'), function (x) {
        x.classList.remove('is-active');
      });
      th.classList.add('is-active');
      return;
    }

    var cta = t.closest ? t.closest('a[href="#contacts"]') : null;
    if (cta) {
      e.preventDefault();
      /* историю правим сами: history.back() вернул бы прокрутку
         на прежнее место и отменил переход к контактам */
      MODAL_PUSHED = false;
      try { history.replaceState(null, '', location.pathname + location.search); } catch (err) {}
      closeModel(true);
      var c = document.getElementById('contacts');
      if (c) c.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });

  return MODAL;
}

function openModel(key, push) {
  if (!MODEL_INDEX[key]) return;
  var el = modalRoot();
  el.querySelector('.model-modal-body').innerHTML = modelDetailHtml(key);
  el.classList.add('is-open');
  el.scrollTop = 0;

  if (MODAL_SCROLL === null) {
    MODAL_SCROLL = [document.documentElement.style.overflow, document.body.style.overflow];
    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';
  }
  if (push) {
    try { history.pushState({ dkModel: key }, '', '#' + key); MODAL_PUSHED = true; } catch (err) {}
  }
  var close = el.querySelector('.model-modal-close');
  if (close) close.focus();
}

function closeModel(fromHistory) {
  if (!MODAL || !MODAL.classList.contains('is-open')) return;
  MODAL.classList.remove('is-open');
  MODAL.querySelector('.model-modal-body').innerHTML = '';
  if (MODAL_SCROLL) {
    document.documentElement.style.overflow = MODAL_SCROLL[0];
    document.body.style.overflow = MODAL_SCROLL[1];
    MODAL_SCROLL = null;
  }
  if (!fromHistory) {
    if (MODAL_PUSHED) { MODAL_PUSHED = false; history.back(); }
    else {
      try { history.replaceState(null, '', location.pathname + location.search); } catch (err) {}
    }
  }
}

function initModelModal() {
  document.addEventListener('click', function (e) {
    var src = e.target.closest
      ? (e.target.closest('.model-tile') || e.target.closest('.pick-table tbody tr'))
      : null;
    if (!src) return;
    var key = src.getAttribute('data-key');
    if (!MODEL_INDEX[key]) return;
    e.preventDefault();
    openModel(key, true);
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' || e.keyCode === 27) closeModel();
  });

  window.addEventListener('popstate', function () {
    var key = (location.hash || '').replace(/^#/, '');
    MODAL_PUSHED = false;
    if (MODEL_INDEX[key]) openModel(key, false);
    else closeModel(true);
  });

  var start = (location.hash || '').replace(/^#/, '');
  if (MODEL_INDEX[start]) openModel(start, false);
}
