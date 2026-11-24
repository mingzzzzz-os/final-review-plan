/* ==========================================================
   期末复习计划 · 逻辑
   ========================================================== */

/* ---------- 日期工具 ---------- */
const pad = n => String(n).padStart(2, "0");
const toStr = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const parseD = s => { const [y, m, d] = s.split("-").map(Number); return new Date(y, m - 1, d); };

function todayDate() {
  if (CONFIG.today) return parseD(CONFIG.today);
  const n = new Date();
  return new Date(n.getFullYear(), n.getMonth(), n.getDate());
}
const TODAY = todayDate();
const TODAY_STR = toStr(TODAY);

const daysBetween = (a, b) => Math.round((parseD(b) - parseD(a)) / 86400000);
const WD = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];
const inRange = (s, a, b) => s >= a && s <= b;

/* ---------- 状态 ---------- */
const storeKey = d => `plan:v1:${d}`;
const getDone = d => { try { return JSON.parse(localStorage.getItem(storeKey(d)) || "[]"); } catch (e) { return []; } };
const setDone = (d, arr) => localStorage.setItem(storeKey(d), JSON.stringify(arr));

/* ---------- 倒计时 ---------- */
function renderCounters() {
  const c6 = daysBetween(TODAY_STR, CONFIG.cet6.slice(0, 10));
  /* 「期末首场」= 考试表里第一场还没考的（材料 12/16 的线上窗口也算一场） */
  const upcoming = EXAMS.filter(e => e.date >= TODAY_STR)
    .slice().sort((x, y) => (x.date < y.date ? -1 : 1))[0];
  const fn = daysBetween(TODAY_STR, upcoming ? upcoming.date : CONFIG.finalStart);
  const lbl = document.querySelector("#c-fin .label span");
  if (lbl && upcoming) {
    lbl.textContent = upcoming.date.slice(5).replace("-", "/")
      + (upcoming.subject.indexOf("材料") === 0 ? " 起" : "");
  }
  const box = (id, v) => {
    const el = document.querySelector(id + " .num span");
    if (!el) return;
    el.textContent = v > 0 ? v : (v === 0 ? "今天" : "已过");
    if (v <= 7 && v > 0) document.querySelector(id).classList.add("soon");
  };
  box("#c-cet", c6);
  box("#c-fin", fn);
}

/* ---------- 阶段 ---------- */
function currentPhase() {
  return PHASES.find(p => inRange(TODAY_STR, p.from, p.to)) || null;
}

/* ---------- 今日任务生成 ---------- */
function todayTasks() {
  const ph = currentPhase();
  if (!ph) return { tasks: [], note: "计划区间是 2026-11-17 到 2027-01-10。今天不在区间内，改 data.js 里的阶段日期即可。" };

  /* 阶段 B：六级考试当天 */
  if (ph.id === "B") {
    return {
      note: "今天只做一件事：把六级考完。上午别做新题，让耳朵和眼睛醒过来就行。",
      tasks: [
        { t: "09:00-10:20", name: "过作文模板", detail: "只看自己写过的 5 篇，背 3 个开头 + 3 个结尾。不写新作文。" },
        { t: "10:30-11:20", name: "听力热身", detail: "一段真题讲座，只听不做题，让耳朵熟悉语速。" },
        { t: "12:00-13:30", name: "吃饭 + 睡 20 分钟", detail: "别喝太多水，下午 130 分钟没法上厕所。" },
        { t: "14:00-14:30", name: "到考场", detail: "准考证、身份证、耳机、2B 铅笔、黑色签字笔。14:30 之后不得入场。" },
        { t: "15:00-17:25", name: "考试", detail: "顺序：写作 30′ → 听力 30′ → 阅读 40′ → 翻译 30′。听力结束立刻收答题卡，别拖。" },
        { t: "19:00-21:00", name: "什么都不做", detail: "六级到此为止。今晚不看期末，明天再开始。" },
      ],
    };
  }

  /* 阶段 E：考试周 */
  if (ph.id === "E") {
    const ex = EXAMS.find(e => e.date === TODAY_STR) || {};
    return {
      note: "考试周。今天考什么已经定了，就别再看别的科目。考完一门立刻放下，晚上只准备明天那门。",
      tasks: [
        { t: "08:00-08:50", name: "考前最后一眼", detail: "只看自己写的那一页框架 + 错题本，50 分钟内不碰新题、不翻书找细节。" },
        { t: "09:00-11:00", name: "考试", detail: (ex.subject && ex.subject !== "待定") ? ex.subject : "按教务安排" },
        { t: "14:00-16:00", name: "下一门的框架页", detail: "把明天那门的一页框架重画一遍，只看高频点，不做整套题。" },
        { t: "19:00-21:00", name: "明天的错题", detail: "只翻错题本，每道题想「当时为什么错」，想不出来再看解答。" },
      ],
    };
  }

  /* 阶段 C / D：按科目块 */
  if (ph.id === "C" || ph.id === "D") {
    const blk = BLOCKS.find(b => inRange(TODAY_STR, b.from, b.to));
    if (!blk) {
      return {
        note: "今天没有排科目块，属于缓冲日。补上前面没完成的那一科，或者干脆休息。",
        tasks: [{ t: "19:00-21:00", name: "补欠账 / 休息", detail: "哪科的一页框架还没写，今天补哪科。都写完了就休息。" }],
      };
    }
    const off = daysBetween(blk.from, TODAY_STR);
    const day = blk.days[Math.min(off, blk.days.length - 1)];
    const tasks = [
      { t: "12:10-12:40", name: `${blk.subject} · 错题回看`, detail: "昨天错的那几道，只看不做，回忆思路。" },
      { t: "19:00-21:30", name: `${blk.subject} · ${blk.round}`, detail: day.task },
      { t: "21:30-21:50", name: "留一页纸", detail: "合上书，写今天这节的一页框架。写不出就是没懂，明天第一件事补它。" },
    ];
    if (ph.id === "D") {
      tasks.push({ t: "碎片时间", name: "过公式表 / 背诵点", detail: "排队、坐车的时候翻一页，不占整块时间。" });
    }
    return { note: `${blk.round}第 ${off + 1} 天。${ph.goal}`, tasks };
  }

  /* 阶段 A：六级 + 铺底 */
  const wd = TODAY.getDay();
  const isMock = MOCK_DAYS.includes(TODAY_STR);
  const dayPlan = (typeof CET6_DAILY !== "undefined") ? CET6_DAILY[TODAY_STR] : null;
  const dayFocus = dayPlan && dayPlan.focus ? dayPlan.focus : "";
  let tasks;
  if (dayPlan) {
    tasks = dayPlan.tasks.map(x => ({ ...x }));
  } else if (isMock) {
    tasks = [
      { t: "09:00-10:00", name: "本周错题回看", detail: "只翻错题，不做新题。" },
      { t: "10:10-11:40", name: "作文 + 翻译", detail: "各写一篇，限时。" },
      { t: "15:00-17:25", name: "全真模考", detail: "130 分钟，按考试顺序。手机放远，中途不查词。" },
      { t: "19:00-20:30", name: "模考复盘", detail: "算分、标出每个失分点属于哪种错（没听懂 / 定位错 / 时间不够）。" },
    ];
  } else if (wd === 0 || wd === 6) {
    tasks = CET6_WEEKEND.map(x => ({ ...x }));
  } else {
    tasks = CET6_WEEKDAY.map(x => ({ ...x }));
  }

  /* 期末铺底：模考日不加（免得挤掉六级）；铺底排到 12/11 为止，12/12 是六级考试 */
  const fo = FOUNDATION.find(f => inRange(TODAY_STR, f.from, f.to));
  const skipFoundation = isMock || TODAY_STR > "2026-12-11";
  if (fo && !skipFoundation) {
    const fday = fo.days ? fo.days[daysBetween(fo.from, TODAY_STR)] : null;
    tasks.push({ t: "21:00-21:50", name: `期末铺底 · ${fo.subject}`, detail: fday || fo.task });
  }

  let note = dayFocus || "六级冲刺期：六级为主，期末只铺底。今天六级的事做完，期末那 50 分钟尽力就行。";
  if (!dayPlan && TODAY_STR === "2026-12-01") note += "　另外：今天 9 点起可以打印六级笔试准考证了。";

  return { note, tasks };
}

/* ---------- 渲染今日 ---------- */
function renderToday() {
  document.getElementById("today-label").textContent =
    `${TODAY.getMonth() + 1} 月 ${TODAY.getDate()} 日　${WD[TODAY.getDay()]}`;

  const ph = currentPhase();
  document.getElementById("phase-label").textContent = ph ? `阶段 ${ph.id} · ${ph.name}` : "不在计划区间";

  const { tasks, note } = todayTasks();
  document.getElementById("phase-note").textContent = note;

  const done = getDone(TODAY_STR);
  const list = document.getElementById("task-list");
  list.innerHTML = "";

  if (!tasks.length) {
    list.innerHTML = `<div class="empty">今天没有任务。</div>`;
  }

  const nowMin = new Date().getHours() * 60 + new Date().getMinutes();
  const nowStr = CONFIG.today ? 19 * 60 + 30 : nowMin;   // 调试时假装 19:30

  tasks.forEach((tk, i) => {
    const el = document.createElement("div");
    el.className = "task" + (done.includes(i) ? " done" : "");
    const isNow = (() => {
      const m = /^(\d{1,2}):(\d{2})-(\d{1,2}):(\d{2})/.exec(tk.t || "");
      if (!m) return false;
      const a = +m[1] * 60 + +m[2], b = +m[3] * 60 + +m[4];
      return nowStr >= a && nowStr < b;
    })();
    el.innerHTML = `
      <div class="box"></div>
      <div class="body">
        <div class="name">
          <span class="time">${tk.t || ""}</span>${tk.name}
          ${isNow ? '<span class="nowtag">现在</span>' : ""}
        </div>
        <div class="detail">${tk.detail || ""}</div>
      </div>`;
    el.addEventListener("click", () => {
      const cur = getDone(TODAY_STR);
      const idx = cur.indexOf(i);
      if (idx >= 0) cur.splice(idx, 1); else cur.push(i);
      setDone(TODAY_STR, cur);
      renderToday();
    });
    list.appendChild(el);
  });

  const total = tasks.length;
  const ok = done.filter(i => i < total).length;
  document.getElementById("bar").style.width = total ? `${(ok / total) * 100}%` : "0";
  document.getElementById("prog-text").textContent = `${ok} / ${total}`;

  const mock = MOCK_DAYS.includes(TODAY_STR);
  document.getElementById("card-mock").style.display = mock ? "block" : "none";
}

/* ---------- 渲染全程 ---------- */
function renderPlan() {
  const tl = document.getElementById("timeline");
  tl.innerHTML = PHASES.map(p => {
    const now = inRange(TODAY_STR, p.from, p.to);
    const rg = p.from === p.to
      ? p.from.slice(5).replace("-", "/")
      : `${p.from.slice(5).replace("-", "/")} – ${p.to.slice(5).replace("-", "/")}`;
    return `<div class="tl-item${now ? " now" : ""}" style="--ph:${p.color}">
      <div class="ph">${p.id}　${p.name}${now ? '<span class="nowtag">当前</span>' : ""}
        <span class="rg">${rg}</span></div>
      ${typeof PHASE_SUB !== "undefined" && PHASE_SUB[p.id] ? `<div class="psub">${PHASE_SUB[p.id]}</div>` : ""}
      <div class="gl">${p.goal}</div>
    </div>`;
  }).join("");

  /* 六级 25 天逐日表 */
  const cetWrap = document.getElementById("cet6list");
  if (cetWrap && typeof CET6_DAILY !== "undefined") {
    const WEEKS = [
      ["第 1 周 · 摸底 + 听力入门", "2026-11-17", "2026-11-22"],
      ["第 2 周 · 讲座专项", "2026-11-23", "2026-11-29"],
      ["第 3 周 · 阅读提速 + 作文定型", "2026-11-30", "2026-12-06"],
      ["第 4 周 · 只保温不做新题", "2026-12-07", "2026-12-12"],
    ];
    const WD2 = ["日", "一", "二", "三", "四", "五", "六"];
    cetWrap.innerHTML = WEEKS.map(([label, a, b]) => {
      const days = Object.keys(CET6_DAILY).filter(k => k >= a && k <= b).sort();
      const body = days.map(k => {
        const dt = new Date(k + "T00:00:00");
        const cls = k === TODAY_STR ? " now" : (k < TODAY_STR ? " past" : "");
        const items = CET6_DAILY[k].tasks
          .map(t => `<li><b>${t.t}</b>　${t.name}</li>`).join("");
        return `<div class="cd${cls}">
          <div class="ch">${dt.getMonth() + 1}/${dt.getDate()} 周${WD2[dt.getDay()]}
            ${k === TODAY_STR ? '<span class="nowtag">今天</span>' : ""}</div>
          <div class="cf">${CET6_DAILY[k].focus}</div>
          <ul class="ct">${items}</ul>
        </div>`;
      }).join("");
      const open = TODAY_STR >= a && TODAY_STR <= b ? " open" : "";
      return `<details class="wk"${open}><summary><span class="lb">${label}</span><span class="rg">${a.slice(5).replace("-", "/")} – ${b.slice(5).replace("-", "/")}</span></summary>
        ${body}</details>`;
    }).join("");
  }

  /* 科目块 */
  const wrap = document.getElementById("blocks");
  const groups = {};
  BLOCKS.forEach(b => {
    const k = b.phase + "|" + b.subject;
    (groups[k] = groups[k] || []).push(b);
  });
  wrap.innerHTML = Object.keys(groups).map(k => {
    const arr = groups[k];
    const first = arr[0];
    const from = arr[0].from, to = arr[arr.length - 1].to;
    const rg = from === to ? from.slice(5).replace("-", "/")
      : `${from.slice(5).replace("-", "/")} – ${to.slice(5).replace("-", "/")}`;
    const items = arr.flatMap(b => b.days.map(d => `<li>${d.task}</li>`)).join("");
    return `<div class="blockrow">
      <div class="bt">
        <span>${first.subject}<span class="round">${first.round}</span></span>
        <span class="rg">${rg}</span>
      </div>
      <ul>${items}</ul>
    </div>`;
  }).join("");

  /* 考试 */
  document.getElementById("exams").innerHTML = EXAMS.map(e => `
    <div class="rule">
      <span class="n" style="background:${e.subject === "待定" ? "#B5B1A6" : "#2F4A47"}">${e.date.slice(8)}</span>
      <span><b>${e.date.slice(5).replace("-", "/")}</b>　${e.subject}
        <span style="color:var(--soft);font-size:12px">　${e.note}</span></span>
    </div>`).join("")
    + `<p style="font-size:12.5px;color:var(--soft);margin:10px 0 0">
        材料 12/16–12/25 是线上窗口、电工 12/26 已定。剩下四门还按 1/5–1/10 连续考估着，
        教务安排一出来，把日期和科目填进 data.js 的 EXAMS，再按「先考的先二刷」调 D 阶段的顺序。</p>`;
}

/* ==========================================================
   进度追踪：分P打卡
   状态存在 localStorage 的 track:v1，键 = 课程id:组序:条序
   值 d = 已看，s = 暂不学（从分母里扣），空 = 未看
   ========================================================== */
const TK_KEY = "track:v1";
let TS = (() => { try { return JSON.parse(localStorage.getItem(TK_KEY) || "{}"); } catch (e) { return {}; } })();
const saveTS = () => { try { localStorage.setItem(TK_KEY, JSON.stringify(TS)); } catch (e) { } };
const tkey = (id, gi, ii) => id + ":" + gi + ":" + ii;
/* 记住哪些清单是展开的，重绘后保持展开，不然勾一节就收起一次 */
let OPENED = new Set();

function stOf(t, gi, ii, it) {
  const k = tkey(t.id, gi, ii);
  if (k in TS) return TS[k];
  if (it.sk) return "s";
  if (it.d) return "d";
  return "";
}

function trackStats(t) {
  let doneCnt = 0, needCnt = 0, skipCnt = 0, doneM = 0, needM = 0, skipM = 0, allCnt = 0;
  t.groups.forEach((g, gi) => g.items.forEach((it, ii) => {
    allCnt++;
    const s = stOf(t, gi, ii, it);
    if (s === "s") { skipCnt++; skipM += it.m || 0; return; }
    needCnt++;
    needM += it.m || 0;
    if (s === "d") { doneCnt++; doneM += it.m || 0; }
  }));
  /* estMin：智慧树这类不给时长的课，按每节实测均值估算（t.estMin = 分钟/节） */
  const est = t.estMin || 0;
  const byCount = !!t.byCount || needM === 0;
  const pct = needCnt ? doneCnt / needCnt : 1;
  const days = Math.max(1, daysBetween(TODAY_STR, t.due) + 1);
  return {
    doneCnt, needCnt, skipCnt, allCnt, doneM, needM, skipM, pct, byCount, days, est,
    leftM: Math.max(0, needM - doneM),
    leftCnt: Math.max(0, needCnt - doneCnt)
  };
}

const hm = m => (m >= 60 ? Math.floor(m / 60) + "h" + (Math.round(m % 60) ? Math.round(m % 60) + "m" : "") : Math.round(m) + "m");

function trackHTML(t) {
  const s = trackStats(t);
  const pct = Math.round(s.pct * 100);
  // 进度条按「节数」画：绿=已看，黄=暂不学，剩下灰=未看
  const allC = s.allCnt || 1;
  const gw = (s.doneCnt / allC) * 100;
  const yw = (s.skipCnt / allC) * 100;

  /* 时长文本：有真实时长的直接给，智慧树这类按每节均值估算的加「约」 */
  const useEst = s.needM === 0 && s.est > 0;
  const T = (cnt, min) => (useEst ? `约 ${hm(cnt * s.est)}` : hm(min));

  const perDay = s.byCount
    ? `每天 ${Math.ceil(s.leftCnt / s.days)} 节`
    : `每天 ${hm(s.leftM / s.days)}`;
  /* 还没到这门课的开始日，就别显示「每天要多少」，改成「几天后开始」 */
  const notYet = t.start && TODAY_STR < t.start;
  const tail = notYet
    ? `${daysBetween(TODAY_STR, t.start)} 天后开始`
    : `剩 ${s.days} 天 · ${perDay}`;

  const skipTxt = s.skipCnt
    ? `　跳过 ${s.skipCnt} 节${s.skipM >= 1 || useEst ? " " + T(s.skipCnt, s.skipM) : ""}`
    : "";

  const info = `<div>共 ${T(s.needCnt, s.needM)}　已看 ${T(s.doneCnt, s.doneM)}　待学 ${T(s.leftCnt, s.leftM)}${skipTxt}</div>
    <div class="tk2">${tail}</div>`;

  /* 默认只展开「第一个还有没看的」那一章，其余折叠 */
  let firstOpen = 0;
  outer: for (let gi = 0; gi < t.groups.length; gi++) {
    for (let ii = 0; ii < t.groups[gi].items.length; ii++) {
      if (stOf(t, gi, ii, t.groups[gi].items[ii]) === "") { firstOpen = gi; break outer; }
    }
  }

  const body = t.groups.map((g, gi) => {
    const gd = g.items.filter((it, ii) => stOf(t, gi, ii, it) === "d").length;
    const gs = g.items.filter((it, ii) => stOf(t, gi, ii, it) === "s").length;
    const rows = g.items.map((it, ii) => {
      const st = stOf(t, gi, ii, it);
      const cls = st === "d" ? "done" : st === "s" ? "skip" : "";
      const mk = st === "d" ? "✓" : st === "s" ? "⏸" : "";
      return `<div class="ti ${cls}" data-k="${tkey(t.id, gi, ii)}">
        <span class="mk">${mk}</span>
        <span class="tin">${it.n}</span>
        ${it.m ? `<span class="tim">${Math.round(it.m)}′</span>` : ""}
        <span class="tsk" data-k="${tkey(t.id, gi, ii)}" role="button" aria-label="暂不学">⏸</span>
      </div>`;
    }).join("");
    /* 这一章合计要看多久（估时课按节数×均值） */
    const gAll = g.items.reduce((a, it) => a + (it.m || 0), 0);
    const gRaw = useEst ? g.items.length * s.est : gAll;
    const gTxt = gRaw >= 1 ? (useEst ? `约 ${hm(gRaw)}` : hm(gRaw)) : "";
    const allSkip = gs === g.items.length;
    return `<details class="tg${allSkip ? " allskip" : ""}"${gi === firstOpen ? " open" : ""}>
      <summary>${g.g}<span>${gTxt ? gTxt + " · " : ""}${gd}/${g.items.length}</span></summary>
      ${rows}
    </details>`;
  }).join("");

  return `<div class="tk" data-tk="${t.id}">
    <div class="tkhead">
      <span class="tkt">${t.name}</span>
      <span class="tksrc">${t.bv ? `<a href="https://www.bilibili.com/video/${t.bv}" target="_blank" rel="noopener">${t.bv}</a>` : "智慧树"}</span>
      <span class="tkpct">${pct}%</span>
    </div>
    <div class="tkbar"><i class="g" style="width:${gw}%"></i><i class="y" style="width:${yw}%"></i></div>
    <div class="tkinfo">${info}</div>
    <button class="tkmore" data-tk="${t.id}">${OPENED.has(t.id) ? "收起清单" : "展开清单"}</button>
    <div class="tkbody" id="tkb-${t.id}"${OPENED.has(t.id) ? "" : " hidden"}>${body}</div>
  </div>`;
}

function bindTrack() {
  document.querySelectorAll(".tkmore").forEach(b => {
    b.addEventListener("click", () => {
      const id = b.dataset.tk;
      const box = document.getElementById("tkb-" + id);
      if (!box) return;
      box.hidden = !box.hidden;
      b.textContent = box.hidden ? "展开清单" : "收起清单";
      if (box.hidden) OPENED.delete(id); else OPENED.add(id);
    });
  });

  document.querySelectorAll(".ti").forEach(row => {
    row.addEventListener("click", e => {
      const k = row.dataset.k;
      const isSkipBtn = e.target.classList.contains("tsk");
      const cur = TS[k] || (row.classList.contains("skip") ? "s" : row.classList.contains("done") ? "d" : "");
      if (isSkipBtn) {
        TS[k] = cur === "s" ? "" : "s";
        if (TS[k] === "") delete TS[k];
      } else {
        if (cur === "d") { delete TS[k]; }
        else { TS[k] = "d"; }
      }
      saveTS();
      renderSubjects();
    });
  });
}

/* ---------- 渲染科目 ---------- */
function renderSubjects() {
  document.getElementById("subjects").innerHTML = SUBJECTS.map(s => {
    const tks = TRACK.filter(t => t.subject === s.name);
    /* 一门课有多套网课时（电工上＋下），给一行合计 */
    let agg = null;
    if (tks.length > 1) {
      agg = { need: 0, done: 0, left: 0, est: false };
      tks.forEach(t => {
        const k = trackStats(t);
        const f = k.needM === 0 && k.est > 0;
        if (f) agg.est = true;
        const need = k.needM || k.needCnt * k.est;
        const done = k.doneM || k.doneCnt * k.est;
        const left = k.leftM || k.leftCnt * k.est;
        agg.need += need; agg.done += done; agg.left += left;
      });
    }
    return `
    <div class="subj" style="--sc:${s.color}">
      <div class="top">
        <span class="nm">${s.name}</span>
        <span class="df">${s.diff} · ${s.days} 天</span>
      </div>
      ${agg ? `<div class="sum">${tks.length} 套网课合计 ${agg.est ? "约 " : ""}${hm(agg.need)}　已看 ${hm(agg.done)}　待学 ${hm(agg.left)}</div>` : ""}
      ${tks.length ? `<div class="tkwrap">${tks.map(trackHTML).join("")}</div>` : ""}
      <div class="why">${s.why}</div>
      ${s.res ? `<div class="res">${s.res}</div>` : ""}
      <div class="row">
        <span class="k">必拿</span>
        <span class="klist">${s.key.map(k => `<span>${k}</span>`).join("")}</span>
      </div>
      <div class="trap">易错：${s.trap}</div>
    </div>`;
  }).join("");
  bindTrack();
}

/* ---------- 六级分项对照 ---------- */
function renderCET6Parts() {
  const box = document.getElementById("cetparts");
  if (!box || typeof CET6_PARTS === "undefined") return;
  box.innerHTML = `
    <div class="cp-total">六级总分 ${CET6_TOTAL.full}　·　你四级 ${CET6_TOTAL.lv4}　·　目标 ${CET6_TOTAL.goal}</div>
    <table class="cpt">
      <thead><tr><th>分项</th><th>满分</th><th>四级</th><th>六级目标</th></tr></thead>
      <tbody>${CET6_PARTS.map(p => `<tr>
        <td class="cpk">${p.k}</td><td>${p.full}</td>
        <td>${p.lv4 === null ? `<span class="cpm">${p.lv4r}</span>` : p.lv4}</td>
        <td class="cpg">${p.goal}</td></tr>`).join("")}</tbody>
    </table>
    <div class="cp-acts">${CET6_PARTS.map(p => `<div class="cpa"><b>${p.k}</b>${p.act}</div>`).join("")}</div>`;
}

/* ---------- 备份：导出 / 导入 ---------- */
function exportProgress() {
  const all = {};
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k.indexOf("plan:v1:") === 0 || k === TK_KEY) all[k] = localStorage.getItem(k);
  }
  const blob = new Blob([JSON.stringify({ v: 1, at: new Date().toISOString(), data: all }, null, 2)],
    { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "复习进度-" + TODAY_STR + ".json";
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(a.href), 3000);
  const tip = document.getElementById("bk-tip");
  if (tip) tip.textContent = "已导出 " + Object.keys(all).length + " 项，存到手机/电脑都行";
}

function importProgress(file) {
  const r = new FileReader();
  r.onload = () => {
    try {
      const o = JSON.parse(r.result);
      if (!o || !o.data) throw new Error("格式不对");
      let n = 0;
      Object.keys(o.data).forEach(k => {
        if (k.indexOf("plan:v1:") === 0 || k === TK_KEY) { localStorage.setItem(k, o.data[k]); n++; }
      });
      const tip = document.getElementById("bk-tip");
      if (tip) tip.textContent = "已导入 " + n + " 项，2 秒后刷新";
      setTimeout(() => location.reload(), 1200);
    } catch (e) {
      const tip = document.getElementById("bk-tip");
      if (tip) tip.textContent = "这个文件读不出来，要选之前导出的 .json";
    }
  };
  r.readAsText(file);
}

function bindBackup() {
  const b1 = document.getElementById("bk-exp");
  const b2 = document.getElementById("bk-imp");
  const f = document.getElementById("bk-file");
  if (b1) b1.addEventListener("click", exportProgress);
  if (b2 && f) {
    b2.addEventListener("click", () => f.click());
    f.addEventListener("change", () => { if (f.files[0]) importProgress(f.files[0]); });
  }
}

/* ---------- 规矩 ---------- */
function renderRules() {
  document.getElementById("rules").innerHTML = RULES.map((r, i) => `
    <div class="rule"><span class="n">${i + 1}</span><span>${r}</span></div>`).join("");
}

/* ---------- Tab ---------- */
function bindTabs() {
  document.querySelectorAll("nav button").forEach(b => {
    b.addEventListener("click", () => {
      document.querySelectorAll("nav button").forEach(x => x.classList.remove("on"));
      document.querySelectorAll(".page").forEach(x => x.classList.remove("on"));
      b.classList.add("on");
      document.getElementById("page-" + b.dataset.page).classList.add("on");
      window.scrollTo({ top: 0, behavior: "instant" });
    });
  });
}

/* ---------- 启动 ---------- */
renderCounters();
renderToday();
renderPlan();
renderCET6Parts();
renderSubjects();
renderRules();
bindTabs();
bindBackup();
