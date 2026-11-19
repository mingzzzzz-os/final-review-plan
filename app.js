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
  const fn = daysBetween(TODAY_STR, CONFIG.finalStart);
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
    const idx = daysBetween(CONFIG.finalStart, TODAY_STR);
    const ex = EXAMS[idx] || {};
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

  /* 期末铺底：模考日和最后一周不加，免得挤掉六级 */
  const fo = FOUNDATION.find(f => inRange(TODAY_STR, f.from, f.to));
  const skipFoundation = isMock || TODAY_STR >= "2026-12-07";
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
        这六天是按 1/5–1/10 连续考估的。教务安排一出来，把日期和科目填进 data.js 的 EXAMS，
        再按「先考的先二刷」调一下 D 阶段的顺序。</p>`;
}

/* ---------- 渲染科目 ---------- */
function renderSubjects() {
  document.getElementById("subjects").innerHTML = SUBJECTS.map(s => `
    <div class="subj" style="--sc:${s.color}">
      <div class="top">
        <span class="nm">${s.name}</span>
        <span class="df">${s.diff} · ${s.days} 天</span>
      </div>
      <div class="why">${s.why}</div>
      ${s.res ? `<div class="res">${s.res}</div>` : ""}
      <div class="row">
        <span class="k">必拿</span>
        <span class="klist">${s.key.map(k => `<span>${k}</span>`).join("")}</span>
      </div>
      <div class="trap">易错：${s.trap}</div>
    </div>`).join("");
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
renderSubjects();
renderRules();
bindTabs();
