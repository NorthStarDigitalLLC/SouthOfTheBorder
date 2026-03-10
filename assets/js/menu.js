(function(){
  const DATA_URLS = ["menu-data.html", "menu-data/"]; // changed from "/menu-data"
  const $ = (id)=>document.getElementById(id);

  function setText(id, text){ const el=$(id); if(el) el.textContent = text || ""; }
  function setList(id, items){
    const ul=$(id); if(!ul) return;
    ul.innerHTML="";
    (items||[]).forEach(t=>{
      const li=document.createElement("li");
      li.textContent=String(t ?? "");
      ul.appendChild(li);
    });
  }

  function escapeHtml(str){
    return String(str ?? "")
      .replace(/&/g,"&amp;")
      .replace(/</g,"&lt;")
      .replace(/>/g,"&gt;")
      .replace(/"/g,"&quot;")
      .replace(/'/g,"&#039;");
  }

  function normalizeItems(arr){
    return Array.isArray(arr) ? arr.map(x=>String(x||"").trim()).filter(Boolean) : [];
  }

  function toISODateLocal(d){
    const y=d.getFullYear();
    const m=String(d.getMonth()+1).padStart(2,"0");
    const day=String(d.getDate()).padStart(2,"0");
    return `${y}-${m}-${day}`;
  }

  function formatDateNice(d){
    return d.toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"});
  }

  function weekdayName(d){
    return d.toLocaleDateString("en-US",{weekday:"long"});
  }

  function parseISODateToLocal(iso){
    const [y,m,d]=String(iso).split("-").map(Number);
    return new Date(y,(m||1)-1,d||1);
  }

  function normalizeDateKey(key){
    const s=String(key||"").trim();
    const m=s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
    if(!m) return null;
    const y=m[1];
    const mo=String(Number(m[2])).padStart(2,"0");
    const da=String(Number(m[3])).padStart(2,"0");
    return `${y}-${mo}-${da}`;
  }

  function showLoadError(msg){
    const err = $("hh-load-error");
    const msgEl = $("hh-load-error-msg");
    if(msgEl) msgEl.textContent = msg || "Please try again.";
    if(err) err.hidden = false;
  }

  async function fetchHtml(url){
    const res = await fetch(url, { credentials:"same-origin", cache:"no-store" });
    if(!res.ok) throw new Error(`Fetch failed ${res.status} at ${url}`);
    return await res.text();
  }

  function extractJsonFromHtml(html, urlLabel){
    const doc = new DOMParser().parseFromString(html, "text/html");
    const script = doc.querySelector("#hh-menu-data");
    if(!script) throw new Error(`No #hh-menu-data found on ${urlLabel}`);
    const raw = (script.textContent || "").trim();
    if(!raw) throw new Error(`#hh-menu-data is empty on ${urlLabel}`);
    return JSON.parse(raw);
  }

  async function readData(){
    // 1) If JSON is on THIS page, use it (great for testing)
    const local = document.querySelector("#hh-menu-data");
    if(local && local.textContent.trim()){
      const data = JSON.parse(local.textContent.trim());
      return normalizeMenus(data);
    }

    // 2) Otherwise fetch from hidden data page
    let lastErr = null;
    for(const url of DATA_URLS){
      try{
        const html = await fetchHtml(url);
        const data = extractJsonFromHtml(html, url);
        return normalizeMenus(data);
      }catch(e){
        lastErr = e;
      }
    }
    throw lastErr || new Error("Menu data could not be read.");
  }

  function normalizeMenus(data){
    const rawMenus=data?.menus||{};
    const normalizedMenus={};
    Object.keys(rawMenus).forEach(k=>{
      const nk=normalizeDateKey(k);
      if(!nk) return;
      normalizedMenus[nk]=rawMenus[k];
    });
    data.menus=normalizedMenus;
    return data;
  }

  function findHours(weekly, dayName){
    return (weekly||[]).find(d => (d.day||"").toLowerCase()===(dayName||"").toLowerCase())
      || {day:dayName, open:"", close:"", breakfast:"", lunch:""};
  }

  function getClosure(data, dayName){
    const c=data?.closures||{};
    const key=Object.keys(c).find(k => (k||"").toLowerCase()===(dayName||"").toLowerCase());
    return key ? c[key] : null;
  }

  function getMenuByDate(data, isoDate){
    return (data?.menus||{})[isoDate] || null;
  }

  function normalizeLunchItems(rawItems){
    const items = Array.isArray(rawItems) ? rawItems : [];
    return items.map(raw=>{
      if(raw && typeof raw === "object"){
        const name = String(raw.name ?? "").trim();
        const desc = String(raw.desc ?? "").trim();
        return { name, desc };
      }
      const s = String(raw ?? "").trim();
      if(!s) return null;
      return { name: s, desc: "" };
    }).filter(Boolean).filter(x=>x.name);
  }

  function setDropdownList(listId, items, noDescText){
    const ul = $(listId); if(!ul) return;
    ul.innerHTML = "";
    items.forEach(it=>{
      const li = document.createElement("li");
      const details = document.createElement("details");
      const summary = document.createElement("summary");
      summary.textContent = it.name;

      const d = document.createElement("div");
      d.className = "hh-desc";
      d.textContent = it.desc ? it.desc : (noDescText || "No description for this item.");

      details.appendChild(summary);
      details.appendChild(d);
      li.appendChild(details);
      ul.appendChild(li);
    });
  }

  function setCrawfishVisibility(prefix, show){
    const tab = $(`hhTab${prefix}Crawfish`);
    const panel = $(`hh-${prefix.toLowerCase()}-crawfish`);
    if(tab) tab.style.display = show ? "" : "none";
    if(!show){
      if(panel) panel.hidden = true;
      if(tab && tab.classList.contains("is-active")){
        const breakfastTab = $(`hhTab${prefix}Breakfast`);
        if(breakfastTab) breakfastTab.click();
      }
      return;
    }
    if(tab && tab.classList.contains("is-active")){
      if(panel) panel.hidden = false;
    }
  }

  function crawfishFor(data, menu){
    const def=data?.defaults?.crawfish||{};
    const c=menu?.crawfish||{};
    const show=(c.show===false) ? false : true;
    const subtitle=(c.subtitle ?? def.subtitle ?? "").trim();
    const items=normalizeItems(c.items ?? def.items ?? []);
    return {show, subtitle, items};
  }

  function getLunchAvailability(data, isoDate, todayISO){
    const msg = data?.settings?.autoClearMessage || "Lunch menu unavailable.";
    const today=parseISODateToLocal(todayISO);
    const cur=parseISODateToLocal(isoDate);
    today.setHours(12,0,0,0);
    cur.setHours(12,0,0,0);

    if(data?.settings?.autoClearPastDays && cur < today) return { ok:false, msg };

    const menu=getMenuByDate(data, isoDate);
    if(!menu) return { ok:false, msg };

    const lunch=menu?.lunch || {};
    if(lunch.show === false) return { ok:false, msg };

    const items = normalizeLunchItems(lunch.items);
    if(items.length === 0) return { ok:false, msg };

    return { ok:true, msg:"" };
  }

  function showLunchUnavailable(prefixIdBase, msg){
    const un = $(`${prefixIdBase}-lunch-unavail`);
    const unTitle = $(`${prefixIdBase}-lunch-unavail-title`);
    const content = $(`${prefixIdBase}-lunch-content`);
    const hint = $(`${prefixIdBase}-lunch-hint`);
    if(un) un.hidden = false;
    if(unTitle) unTitle.textContent = msg || "Lunch menu unavailable.";
    if(content) content.style.display = "none";
    if(hint) hint.hidden = true;
  }

  function showLunchAvailable(prefixIdBase){
    const un = $(`${prefixIdBase}-lunch-unavail`);
    const content = $(`${prefixIdBase}-lunch-content`);
    if(un) un.hidden = true;
    if(content) content.style.display = "";
  }

  function fillTwoDay(prefixIdBase, labelPrefix, isoDate, data, hours, todayISO){
    const defaults=data?.defaults||{};
    const menu=getMenuByDate(data, isoDate) || {};

    // Breakfast
    const b=menu?.breakfast||{};
    const bDef=defaults?.breakfast||{};
    const bHours = hours?.breakfast ? `Breakfast ${hours.breakfast}. ` : "";
    setText(`${prefixIdBase}-breakfast-sub`, (bHours + ((b.subtitle ?? bDef.subtitle ?? "").trim())).trim());
    setList(`${prefixIdBase}-breakfast-plates`, normalizeItems(b.plates ?? bDef.plates ?? []));
    setList(`${prefixIdBase}-breakfast-items`,  normalizeItems(b.items  ?? bDef.items  ?? []));

    // Lunch
    const l=menu?.lunch||{};
    const lDef=defaults?.lunch||{};
    const lHours = hours?.lunch ? `Lunch ${hours.lunch}. ` : "";
    setText(`${prefixIdBase}-lunch-sub`, (lHours + ((l.subtitle ?? lDef.subtitle ?? "").trim())).trim());

    const lunchAvail = getLunchAvailability(data, isoDate, todayISO);
    if(!lunchAvail.ok){
      showLunchUnavailable(prefixIdBase, lunchAvail.msg);
      setList(`${prefixIdBase}-lunch-plates`, []);
      const ul = $(`${prefixIdBase}-lunch-items`);
      if(ul) ul.innerHTML = "";
    } else {
      showLunchAvailable(prefixIdBase);
      setList(`${prefixIdBase}-lunch-plates`, normalizeItems(l.plates ?? lDef.plates ?? []));
      const items = normalizeLunchItems(l.items);
      const hint = $(`${prefixIdBase}-lunch-hint`);
      if(hint){
        hint.textContent = data?.settings?.clickForDescriptionHint || "Tip: click an item for description.";
        hint.hidden = (items.length === 0);
      }
      setDropdownList(`${prefixIdBase}-lunch-items`, items, data?.settings?.noDescriptionText);
    }

    // Crawfish
    const c=crawfishFor(data, menu);
    setText(`${prefixIdBase}-crawfish-sub`, c.subtitle);
    setList(`${prefixIdBase}-crawfish-items`, c.items.length ? c.items : ["Call to ask about crawfish availability."]);
    setCrawfishVisibility(labelPrefix, c.show);

    // Salad
    const s=menu?.salad||{};
    const sDef=defaults?.salad||{};
    setText(`${prefixIdBase}-salad-sub`, (s.subtitle ?? sDef.subtitle ?? "").trim());
    setList(`${prefixIdBase}-salad-pricing`, normalizeItems(s.items ?? sDef.items ?? []));
    setList(`${prefixIdBase}-salad-lettuce`,  normalizeItems(s.saladBar?.lettuce  ?? sDef.saladBar?.lettuce  ?? []));
    setList(`${prefixIdBase}-salad-toppings`, normalizeItems(s.saladBar?.toppings ?? sDef.saladBar?.toppings ?? []));
    setList(`${prefixIdBase}-salad-dressing`, normalizeItems(s.saladBar?.dressing ?? sDef.saladBar?.dressing ?? []));

    // Drinks
    const d=menu?.drinks||{};
    const dDef=defaults?.drinks||{};
    setList(`${prefixIdBase}-drinks-items`, normalizeItems(d.items ?? dDef.items ?? []));

    // Dessert
    const ds=menu?.dessert||{};
    const dsDef=defaults?.dessert||{};
    setText(`${prefixIdBase}-dessert-sub`, (ds.subtitle ?? dsDef.subtitle ?? "").trim());
    const desserts=normalizeItems(ds.items ?? []);
    setList(`${prefixIdBase}-dessert-items`, desserts.length ? desserts : ["(Dessert not posted yet.)"]);
  }

  function buildAdvancedCarousel(data, todayISO){
    const wrap=$("hh-adv-carousel");
    if(!wrap) return;
    wrap.innerHTML="";

    const weekly=data?.hours?.weekly||[];
    const lDef=data?.defaults?.lunch||{};
    const windowDays=Math.max(1, Math.min(31, Number(data?.settings?.advancedWindowDays ?? 7)));
    const start=parseISODateToLocal(todayISO);

    for(let i=0;i<windowDays;i++){
      const d=new Date(start);
      d.setDate(start.getDate()+i);
      const iso=toISODateLocal(d);
      const dayName=weekdayName(d);
      const hours=findHours(weekly, dayName);

      const closure=getClosure(data, dayName);
      const isClosed=!!closure?.closed;
      const menu=getMenuByDate(data, iso) || {};
      const lunch=menu?.lunch||{};
      const items=normalizeLunchItems(lunch.items);

      let state = { kind:"open", msg:"" };
      if(isClosed){
        state = { kind:"closed", msg: closure.message || "See you tomorrow!" };
      } else {
        const avail=getLunchAvailability(data, iso, todayISO);
        if(!avail.ok) state = { kind:"unavailable", msg: avail.msg };
      }

      const card=document.createElement("article");
      card.className="hh-adv-card";

      const head=document.createElement("div");
      head.className="hh-adv-head";
      head.innerHTML=`
        <div>
          <div class="hh-adv-dayname">${escapeHtml(dayName)}</div>
          <div class="hh-adv-date">${escapeHtml(formatDateNice(d))}</div>
        </div>
        <div class="hh-adv-hours">${state.kind==="closed" ? "Closed" : (hours.lunch ? `Lunch ${escapeHtml(hours.lunch)}` : "")}</div>
      `;
      card.appendChild(head);

      if(state.kind!=="open"){
        const st=document.createElement("div");
        st.className="hh-state";
        st.innerHTML=`
          <div class="hh-badge ${state.kind==="unavailable" ? "is-dark" : ""}">${state.kind==="closed" ? "Closed" : "Unavailable"}</div>
          <div class="hh-state-title">${escapeHtml(dayName)}</div>
          <p class="hh-state-msg">${escapeHtml(state.msg)}</p>
        `;
        card.appendChild(st);
      } else {
        const panel=document.createElement("section");
        panel.className="hh-panel";

        const subtitle=((hours.lunch ? `Lunch ${hours.lunch}. ` : "") + ((lunch.subtitle ?? lDef.subtitle ?? "").trim())).trim();
        const plates=normalizeItems(lunch.plates ?? lDef.plates ?? []);
        const hintText=data?.settings?.clickForDescriptionHint || "Tip: click an item for description.";
        const noDesc=data?.settings?.noDescriptionText || "No description for this item.";

        panel.innerHTML=`
          <h3>Lunch</h3>
          <p class="hh-sub">${escapeHtml(subtitle)}</p>
          <h4>Plates</h4>
          <ul class="hh-stack">${plates.map(x=>`<li>${escapeHtml(x)}</li>`).join("")}</ul>
          <h4>${escapeHtml(dayName)} Lunch Items</h4>
          <div class="hh-hintline">${escapeHtml(hintText)}</div>
          <ul class="hh-stack">
            ${items.map(it=>{
              const d = it.desc ? it.desc : noDesc;
              return `<li><details><summary>${escapeHtml(it.name)}</summary><div class="hh-desc">${escapeHtml(d)}</div></details></li>`;
            }).join("")}
          </ul>
        `;
        card.appendChild(panel);
      }

      wrap.appendChild(card);
    }
  }

  function wireTabs(dayPanelEl){
    if(!dayPanelEl) return;
    const tabs=Array.from(dayPanelEl.querySelectorAll(".hh-tab[role='tab']"));
    const panels=Array.from(dayPanelEl.querySelectorAll(".hh-panel[role='tabpanel']"));
    if(!tabs.length || !panels.length) return;

    function activateTab(tab){
      const targetId=tab.getAttribute("aria-controls");
      tabs.forEach(t=>{
        const active=(t===tab);
        t.classList.toggle("is-active", active);
        t.setAttribute("aria-selected", active ? "true" : "false");
      });
      panels.forEach(p=> p.hidden = (p.id !== targetId));
    }
    tabs.forEach(tab=> tab.addEventListener("click", ()=> activateTab(tab)));
  }

  function wireDayTabs(){
    const dayButtons=Array.from(document.querySelectorAll(".hh-day[role='tab']"));
    const dayPanels=Array.from(document.querySelectorAll(".hh-daypanel[role='tabpanel']"));

    function activate(btn){
      const targetId=btn.getAttribute("aria-controls");
      dayButtons.forEach(b=>{
        const active=(b===btn);
        b.classList.toggle("is-active", active);
        b.setAttribute("aria-selected", active ? "true" : "false");
      });
      dayPanels.forEach(p=> p.hidden = (p.id !== targetId));
    }
    dayButtons.forEach(btn=> btn.addEventListener("click", ()=> activate(btn)));
  }

  // ---- INIT ----
  wireDayTabs();
  wireTabs($("hh-day-today"));
  wireTabs($("hh-day-tomorrow"));

  (async function init(){
    try{
      const data = await readData();

      setText("hh-advanced-disclaimer", data?.settings?.advancedDisclaimer || "");
      if(!data?.settings?.showAdvancedTab){
        const advBtn=$("hhDayBtnAdvanced");
        if(advBtn) advBtn.style.display="none";
      }

      const now=new Date();
      const todayISO=toISODateLocal(now);
      const todayName=weekdayName(now);

      const tomorrow=new Date(now); tomorrow.setDate(now.getDate()+1);
      const tomorrowISO=toISODateLocal(tomorrow);
      const tomorrowName=weekdayName(tomorrow);

      setText("hhDayBtnToday", todayName);
      setText("hhDayBtnTomorrow", tomorrowName);

      setText("hh-today-title", `${todayName} (${formatDateNice(now)}) Menu`);
      setText("hh-tomorrow-title", `${tomorrowName} (${formatDateNice(tomorrow)}) Menu`);

      setText("hh-hours-note", data?.hours?.note || "");
      setText("hh-hours-note-2", data?.hours?.note || "");

      const weekly=data?.hours?.weekly||[];
      const hoursToday=findHours(weekly, todayName);
      const hoursTomorrow=findHours(weekly, tomorrowName);

      const closureToday=getClosure(data, todayName);
      const closureTomorrow=getClosure(data, tomorrowName);

      const lineToday = closureToday?.closed ? `${todayName} Hours: Closed`
        : `${todayName} Hours: ${hoursToday.open} – ${hoursToday.close}` +
          (hoursToday.breakfast ? ` • Breakfast ${hoursToday.breakfast}` : "") +
          (hoursToday.lunch ? ` • Lunch ${hoursToday.lunch}` : "");

      const lineTomorrow = closureTomorrow?.closed ? `${tomorrowName} Hours: Closed`
        : `${tomorrowName} Hours: ${hoursTomorrow.open} – ${hoursTomorrow.close}` +
          (hoursTomorrow.breakfast ? ` • Breakfast ${hoursTomorrow.breakfast}` : "") +
          (hoursTomorrow.lunch ? ` • Lunch ${hoursTomorrow.lunch}` : "");

      setText("hh-hours-line", lineToday);
      setText("hh-hours-line-2", lineTomorrow);

      const phone=data?.phoneTel || "#";
      ["hh-call-btn-today-b","hh-call-btn-today-l","hh-call-btn-today-c",
       "hh-call-btn-tomorrow-b","hh-call-btn-tomorrow-l","hh-call-btn-tomorrow-c"
      ].forEach(id=>{ const a=$(id); if(a) a.href=phone; });

      setText("hh-delivery-note", data?.deliveryNote || "");
      setText("hh-delivery-note-2", data?.deliveryNote || "");

      if(closureToday?.closed){
        $("hh-today-closed").hidden=false;
        setText("hh-today-closed-title", `${todayName} (${todayISO})`);
        setText("hh-today-closed-msg", closureToday.message || "See you tomorrow!");
      }
      if(closureTomorrow?.closed){
        $("hh-tomorrow-closed").hidden=false;
        setText("hh-tomorrow-closed-title", `${tomorrowName} (${tomorrowISO})`);
        setText("hh-tomorrow-closed-msg", closureTomorrow.message || "See you tomorrow!");
      }

      fillTwoDay("hh-today", "Today", todayISO, data, hoursToday, todayISO);
      fillTwoDay("hh-tomorrow", "Tomorrow", tomorrowISO, data, hoursTomorrow, todayISO);

      setText("hh-today-lunch-items-title", `${todayName} Lunch Items`);
      setText("hh-tomorrow-lunch-items-title", `${tomorrowName} Lunch Items`);

      buildAdvancedCarousel(data, todayISO);

    }catch(e){
      console.error("HOT HEADZ MENU ERROR:", e);
      setText("hh-hours-line", "Menu unavailable right now.");
      setText("hh-hours-line-2", "Menu unavailable right now.");
      showLoadError(String(e && e.message ? e.message : e));
    }
  })();
})();
