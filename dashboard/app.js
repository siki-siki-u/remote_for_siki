/* 반도체 선행지표 대시보드 — 그리기 코드. 숫자는 data/*.js 에서만 고치세요. */
(function () {
  "use strict";
  const S = D.sources;
  const TYPE_LABEL = { official: "회사 공식", guidance: "가이던스", estimate: "증권가·리서치 추정/계산", market: "시장 관측값" };
  const missing = []; // 확인 못 한 항목 모음 {sec, item, why}

  // ── 색 (dataviz 기본 팔레트, 고정 순서) ──
  const PAL_L = ["#2a78d6", "#eb6834", "#1baf7a", "#eda100", "#e87ba4", "#008300", "#6250d6", "#e34948"];
  const PAL_D = ["#3987e5", "#d95926", "#199e70", "#c98500", "#d55181", "#008300", "#9085e9", "#e66767"];
  const isDark = () => document.documentElement.dataset.theme === "dark" ||
    (document.documentElement.dataset.theme !== "light" && matchMedia("(prefers-color-scheme: dark)").matches);
  const pal = (i) => (isDark() ? PAL_D : PAL_L)[i % 8];
  const css = (v) => getComputedStyle(document.documentElement).getPropertyValue(v).trim();
  const alpha = (hex, a) => { const n = parseInt(hex.slice(1), 16); return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${a})`; };
  const patterns = {};
  function hatch(color) { // 가이던스용 빗금 채우기
    if (patterns[color]) return patterns[color];
    const c = document.createElement("canvas"); c.width = c.height = 8;
    const g = c.getContext("2d"); g.fillStyle = alpha(color, 0.25); g.fillRect(0, 0, 8, 8);
    g.strokeStyle = color; g.lineWidth = 2; g.beginPath(); g.moveTo(0, 8); g.lineTo(8, 0); g.moveTo(-2, 2); g.lineTo(2, -2); g.moveTo(6, 10); g.lineTo(10, 6); g.stroke();
    return (patterns[color] = g.createPattern(c, "repeat"));
  }
  // 점 하나의 '근거 종류'에 따른 채우기
  function fillFor(p, color) {
    if (!p) return color;
    if (p.uv) return alpha(color, 0.3);
    if (p.t === "guidance") return hatch(color);
    if (p.t === "estimate") return alpha(color, 0.12);
    return color;
  }
  const isWeak = (p) => p && (p.uv || p.t === "estimate" || p.t === "guidance");

  // ── 출처 툴팁 ──
  function srcLines(p) {
    if (!p) return ["값 없음(확인 못 함)"];
    const out = [];
    out.push("구분: " + (TYPE_LABEL[p.t] || "-") + (p.uv ? " · ⚠ 검증 대기" : ""));
    const s = S[p.s];
    if (s) { out.push("출처: " + s.name + " (" + s.date + ")"); if (s.url) out.push(s.url); }
    if (p.n) wrap(p.n, 46).forEach((l, i) => out.push((i ? "  " : "메모: ") + l));
    return out;
  }
  function wrap(t, w) { const r = []; let s = String(t); while (s.length > w) { r.push(s.slice(0, w)); s = s.slice(w); } r.push(s); return r; }
  const val = (p) => (p && p.v != null ? p.v : null);

  // ── Chart.js 공통 ──
  const charts = [];
  function baseOpts(extra) {
    const grid = css("--line"), tick = css("--text2");
    return deepMerge({
      responsive: true, maintainAspectRatio: false, animation: false,
      interaction: { mode: "nearest", intersect: false },
      plugins: {
        legend: { labels: { color: tick, boxWidth: 12, boxHeight: 12, usePointStyle: false } },
        tooltip: {
          backgroundColor: isDark() ? "#2a2a28" : "#ffffff", titleColor: css("--text"), bodyColor: css("--text"), footerColor: css("--text2"),
          borderColor: grid, borderWidth: 1, padding: 10, footerFont: { weight: "normal", size: 11 },
          callbacks: { footer: (items) => { const it = items[0]; const m = it.dataset._meta; return m ? srcLines(m[it.dataIndex]) : []; } }
        }
      },
      scales: {
        x: { ticks: { color: tick }, grid: { color: "transparent" }, border: { color: grid } },
        y: { ticks: { color: tick }, grid: { color: grid }, border: { display: false } }
      }
    }, extra || {});
  }
  function deepMerge(a, b) { for (const k in b) { if (b[k] && typeof b[k] === "object" && !Array.isArray(b[k]) && !(b[k] instanceof CanvasPattern)) { a[k] = deepMerge(a[k] || {}, b[k]); } else a[k] = b[k]; } return a; }
  function mk(id, cfg) {
    const el = document.getElementById(id); if (!el) return;
    charts.push(new Chart(el, cfg));
  }
  function emptyMsg(id, msg) {
    const el = document.getElementById(id); if (!el) return;
    const d = document.createElement("div"); d.className = "empty"; d.innerHTML = "<div>" + msg + "</div>"; el.parentElement.appendChild(d); el.style.opacity = 0.25;
  }
  const fmt = (v, d = 1) => (v == null ? "—" : Number(v).toLocaleString("ko-KR", { maximumFractionDigits: d }));
  const signed = (v, d = 1) => (v == null ? "—" : (v > 0 ? "+" : "") + fmt(v, d));
  const srcLink = (k) => { const s = S[k]; return s ? (s.url ? `<a href="${s.url}" target="_blank" rel="noopener">${esc(s.name)}</a>` : esc(s.name)) + ` <span class="muted">(${s.date})</span>` : ""; };
  function esc(t) { return String(t).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c])); }
  const ST = { "맑음": ["good", "☀️ 맑음"], "구름": ["warn", "☁️ 구름"], "경고": ["crit", "⚠️ 경고"], "부족": ["good", "부족"], "정상": ["warn", "정상"], "증가": ["crit", "증가"] };
  const badge = (s) => s && ST[s] ? `<span class="st ${ST[s][0]}">${ST[s][1]}</span>` : `<span class="st none">확인 못 함</span>`;

  // ───────────────────────── 섹션 1. 수요 ─────────────────────────
  function sec1() {
    const dm = D.demand, Q = dm.quarters, cos = Object.keys(dm.capexQ);
    cos.forEach((co) => {
      const nul = Q.filter((q, i) => !dm.capexQ[co][i]), uv = Q.filter((q, i) => dm.capexQ[co][i] && dm.capexQ[co][i].uv);
      if (nul.length) missing.push({ sec: "1 수요", item: `${co} 분기 설비투자 빈칸 ${nul.length}개 (${nul.join(", ")})` });
      if (uv.length) missing.push({ sec: "1 수요", item: `${co} 분기 설비투자 ${uv.join(", ")}`, why: "작성자 기억 기반 숫자 — 1차 공시(실적 보도자료)로 재확인 필요" });
    });
    // ① 누적 막대
    mk("c_capexQ", {
      type: "bar",
      data: { labels: Q, datasets: cos.map((co, i) => ({
        label: co, data: dm.capexQ[co].map(val), _meta: dm.capexQ[co], stack: "s",
        backgroundColor: dm.capexQ[co].map((p) => fillFor(p, pal(i))), borderColor: pal(i),
        borderWidth: dm.capexQ[co].map((p) => (isWeak(p) && !p.uv ? 1.5 : 0)), borderSkipped: false,
        borderRadius: 2, maxBarThickness: 46
      })) },
      options: baseOpts({ scales: { x: { stacked: true }, y: { stacked: true, title: { display: true, text: "십억 달러", color: css("--text2") } } },
        plugins: { tooltip: { mode: "nearest", intersect: true, callbacks: { label: (c) => `${c.dataset.label}: ${fmt(c.raw)}B$` } } } })
    });

    // ③ 4대 합계 전년비
    const big4 = ["마이크로소프트", "알파벳", "아마존", "메타"];
    const yoy = [], yoyMeta = [], yoyLabels = [];
    for (let i = 4; i < Q.length; i++) {
      let now = 0, prev = 0, ok = true, weak = false;
      big4.forEach((co) => { const a = dm.capexQ[co][i], b = dm.capexQ[co][i - 4]; if (!a || !b) ok = false; else { now += a.v; prev += b.v; if (isWeak(a) || isWeak(b)) weak = true; } });
      yoyLabels.push(Q[i]);
      if (!ok) { yoy.push(null); yoyMeta.push(null); continue; }
      const g = (now / prev - 1) * 100;
      yoy.push(+g.toFixed(1));
      yoyMeta.push({ v: g, t: weak ? "estimate" : "official", uv: weak, s: "", n: `계산값: ${Q[i]} 합계 ${fmt(now)}B$ ÷ ${Q[i - 4]} 합계 ${fmt(prev)}B$ − 1.${weak ? " 입력 중 검증 대기·추정치 포함" : ""}` });
    }
    D._calc = D._calc || {}; D._calc.yoy = { labels: yoyLabels, v: yoy };
    mk("c_yoy", {
      type: "line",
      data: { labels: yoyLabels, datasets: [{ label: "4대 합계 YoY", data: yoy, _meta: yoyMeta, borderColor: pal(0), backgroundColor: pal(0), borderWidth: 2,
        pointRadius: 5, pointHoverRadius: 7, pointBackgroundColor: yoyMeta.map((p) => (p && p.uv ? css("--surface") : pal(0))), pointBorderColor: pal(0), pointBorderWidth: 2,
        segment: { borderDash: (c) => (yoyMeta[c.p0DataIndex]?.uv || yoyMeta[c.p1DataIndex]?.uv ? [5, 4] : undefined) }, spanGaps: true }] },
      options: baseOpts({ plugins: { legend: { display: false }, tooltip: { callbacks: { label: (c) => `전년 대비 ${signed(c.raw)}%` } } },
        scales: { y: { title: { display: true, text: "%", color: css("--text2") } } } })
    });
    const lastTwo = yoy.filter((v) => v != null).slice(-3);
    document.getElementById("yoyNote").textContent =
      "속이 빈 점·점선 = 검증 대기 숫자가 섞인 계산값. 최근 3개 분기: " + lastTwo.map((v) => signed(v) + "%").join(" → ") +
      ". 1차 공시로 2024~25년 값을 확인하면 더 정확해집니다.";

    // ② 가이던스 이력
    const gk = Object.keys(dm.guidance).filter((k) => !k.startsWith("오라클"));
    const months = [...new Set(gk.flatMap((k) => dm.guidance[k].map((g) => g.d)))].sort();
    mk("c_guid", {
      type: "line",
      data: { labels: months, datasets: gk.map((k, i) => {
        const arr = months.map((m) => dm.guidance[k].find((g) => g.d === m) || null);
        return { label: k, data: arr.map((g) => (g ? (g.lo + g.hi) / 2 : null)), _meta: arr.map((g) => g && Object.assign({}, g, { n: `범위 ${g.lo}~${g.hi}B$` + (g.n ? " · " + g.n : "") })),
          borderColor: pal(i), backgroundColor: pal(i), borderWidth: 2, pointRadius: 5, spanGaps: true, borderDash: [6, 3] };
      }) },
      options: baseOpts({ plugins: { tooltip: { callbacks: { label: (c) => `${c.dataset.label}: 중간값 ${fmt(c.raw)}B$` } } },
        scales: { y: { title: { display: true, text: "십억 달러", color: css("--text2") } } } })
    });
    let h = "<tr><th>회사</th><th>시점</th><th>범위(B$)</th><th>변화</th><th>근거</th></tr>";
    Object.keys(dm.guidance).forEach((k) => {
      let prev = null;
      dm.guidance[k].forEach((g) => {
        const mid = (g.lo + g.hi) / 2; let ch = "처음";
        if (prev != null) ch = mid > prev ? "▲ 상향" : mid < prev ? "▼ 하향" : "→ 유지";
        if (prev != null && k.startsWith("오라클")) ch = mid > prev ? "▲ 증가" : "→";
        prev = mid;
        h += `<tr><td>${esc(k)}</td><td>${g.d}</td><td>${g.lo === g.hi ? fmt(g.lo) : fmt(g.lo) + "~" + fmt(g.hi)}</td><td>${ch}</td><td>${srcLink(g.s)}${g.n ? "<br><span class='muted'>" + esc(g.n) + "</span>" : ""}</td></tr>`;
      });
    });
    document.getElementById("guidTable").innerHTML = h;
    ["애플", "엔비디아", "테슬라"].forEach((c) => missing.push({ sec: "1 수요", item: `${c} 분기 Capex·연간 가이던스`, why: "이번 검색에서 확인 못 함" }));

    // ④ FCF
    const f = dm.fcf.filter((r) => r.ocf || r.capex || r.fcf);
    dm.fcf.forEach((r) => ["ocf", "capex", "fcf"].forEach((k) => { if (!r[k]) missing.push({ sec: "1 수요", item: `${r.co} 26Q3 ${k === "ocf" ? "영업현금흐름" : k === "capex" ? "설비투자" : "FCF"}` }); }));
    const fk = [["ocf", "영업현금흐름", 2], ["capex", "설비투자", 1], ["fcf", "FCF", 7]];
    mk("c_fcf", {
      type: "bar",
      data: { labels: f.map((r) => r.co), datasets: fk.map(([k, lab, ci]) => ({ label: lab, data: f.map((r) => val(r[k])), _meta: f.map((r) => r[k]),
        backgroundColor: f.map((r) => fillFor(r[k], pal(ci))), borderColor: pal(ci), borderWidth: f.map((r) => (isWeak(r[k]) ? 1.5 : 0)), borderRadius: 2, maxBarThickness: 26 })) },
      options: baseOpts({ plugins: { tooltip: { intersect: true, callbacks: { label: (c) => `${c.dataset.label}: ${fmt(c.raw)}B$` } } } })
    });
    // CDS
    const cds = dm.cds;
    cds.forEach((r) => { if (!r.now) missing.push({ sec: "1 수요", item: `${r.co} 5년물 CDS` }); if (!r.start) missing.push({ sec: "1 수요", item: `${r.co} 연초 CDS(비교 기준)` }); });
    mk("c_cds", {
      type: "bar",
      data: { labels: cds.map((r) => r.co), datasets: [
        { label: "2026년 초", data: cds.map((r) => val(r.start)), _meta: cds.map((r) => r.start), backgroundColor: alpha(pal(0), 0.45), borderRadius: 2, maxBarThickness: 18 },
        { label: dm.cdsAsOf, data: cds.map((r) => val(r.now)), _meta: cds.map((r) => r.now), backgroundColor: pal(7), borderRadius: 2, maxBarThickness: 18 }] },
      options: baseOpts({ indexAxis: "y", plugins: { tooltip: { intersect: true, callbacks: { label: (c) => `${c.dataset.label}: ${fmt(c.raw, 0)}bp` } } },
        scales: { x: { grid: { color: css("--line") }, title: { display: true, text: "bp", color: css("--text2") } }, y: { grid: { color: "transparent" } } } })
    });
  }

  // ───────────────────────── 섹션 2. 재고 ─────────────────────────
  function sec2() {
    const iv = D.inventory, Q = iv.quarters;
    [["inv", "c_inv", "재고자산"], ["dio", "c_dio", "재고일수"]].forEach(([k, id, lab]) => {
      const cos = Object.keys(iv[k]);
      let any = false;
      cos.forEach((co) => { const nn = iv[k][co].filter((x) => x != null).length; if (nn) any = true; if (nn < Q.length) missing.push({ sec: "2 재고", item: `${co} 분기 ${lab} (${Q.length - nn}개 분기 빈칸)`, why: "10-Q·실적자료 숫자 미확인" }); });
      mk(id, { type: "line", data: { labels: Q, datasets: cos.map((co, i) => { const arr = iv[k][co].map((x) => (x == null ? null : typeof x === "object" ? x : { v: x, t: "official" }));
        return { label: co, data: arr.map(val), _meta: arr, borderColor: pal(i), backgroundColor: pal(i), borderWidth: 2, pointRadius: 4, spanGaps: true }; }) }, options: baseOpts() });
      if (!any) emptyMsg(id, `아직 숫자가 없습니다.<br>각 회사 분기보고서의 재고자산을 <b>data/inventory.js</b>에 넣으면 그려집니다.`);
    });
    document.getElementById("oemNotes").innerHTML = iv.oemNotes.map((o) => `<li><b>${esc(o.co)}</b> (${o.d}) — ${esc(o.txt)} · ${srcLink(o.s)}</li>`).join("");
    const c = iv.calls;
    let h = `<tr><th>회사</th>${c.quarters.map((q) => `<th>${q}</th>`).join("")}</tr>`;
    Object.keys(c.rows).forEach((co) => {
      h += `<tr><td><b>${esc(co)}</b></td>` + c.rows[co].map((r, i) => {
        if (!r) { missing.push({ sec: "2 재고", item: `${co} ${c.quarters[i]} 실적 콜 '고객 재고' 표현` }); return `<td>${badge(null)}</td>`; }
        return `<td>${badge(r.st)}<br><span class="muted">${esc(r.txt)}</span><br>${srcLink(r.s)}</td>`;
      }).join("") + "</tr>";
    });
    document.getElementById("callTable").innerHTML = h;
    document.getElementById("callNote").textContent = c.note;
  }

  // ───────────────────────── 섹션 3. 가격 ─────────────────────────
  let spotChart = null;
  function localSpots() { try { return JSON.parse(localStorage.getItem("spotManual") || "[]"); } catch (e) { return []; } }
  function sec3() {
    const pr = D.prices;
    // ① 현물: 기사 점 + spot_log + 브라우저 임시 입력
    const all = { "DDR4 16Gb": [], "DDR5 16Gb": [] };
    Object.keys(pr.spot).forEach((k) => pr.spot[k].forEach((p) => all[k].push(p)));
    const log = (D.spotLog || []).map((r) => Object.assign({ how: "auto" }, r)).concat(localSpots().map((r) => Object.assign({}, r, { how: "manual-temp" })));
    log.forEach((r) => {
      const t = "market", note = r.how === "manual-temp" ? "브라우저 임시 입력(파일 미저장)" : r.how === "manual" ? "수동 입력" : "자동 기록";
      if (r.ddr4_16gb != null) all["DDR4 16Gb"].push({ d: r.d, v: +r.ddr4_16gb, t, n: note + (r.src ? " · " + r.src : ""), uv: r.how === "manual-temp" });
      if (r.ddr5_16gb != null) all["DDR5 16Gb"].push({ d: r.d, v: +r.ddr5_16gb, t, n: note + (r.src ? " · " + r.src : ""), uv: r.how === "manual-temp" });
    });
    const dates = [...new Set(Object.values(all).flat().map((p) => p.d))].sort();
    const ds = Object.keys(all).map((k, i) => { const arr = dates.map((d) => all[k].find((p) => p.d === d && p.v != null) || null);
      return { label: k, data: arr.map(val), _meta: arr, borderColor: pal(i), backgroundColor: pal(i), borderWidth: 2, pointRadius: 5, spanGaps: true }; });
    if (spotChart) { spotChart.data.labels = dates; spotChart.data.datasets = ds; spotChart.update(); }
    else { mk("c_spot", { type: "line", data: { labels: dates, datasets: ds }, options: baseOpts({ scales: { y: { title: { display: true, text: "달러", color: css("--text2") } } } }) }); spotChart = charts[charts.length - 1]; }
    D._calc = D._calc || {}; D._calc.spot = all;

    // ② 계약가 + 전월비
    const c = pr.contract, L = c.map((r) => r.m);
    c.forEach((r) => { if (r.v == null) missing.push({ sec: "3 가격", item: `DDR4 8Gb 고정거래가격 ${r.m}` }); else if (r.uv) missing.push({ sec: "3 가격", item: `DDR4 8Gb 고정거래가격 ${r.m} = ${r.v}$`, why: r.n }); });
    missing.push({ sec: "3 가격", item: "DDR4 16Gb·DDR5 16Gb 월별 계약가 시리즈", why: "공개 기사에서 확인 못 함 — 트렌드포스 유료 데이터" });
    missing.push({ sec: "3 가격", item: "2026년 1~9월 D램 현물가 일별 시리즈", why: "기사 점 2개만 확인. 이후 기록 스크립트로 쌓임" });
    mk("c_contract", { type: "bar", data: { labels: L, datasets: [{ label: "DDR4 8Gb 계약가", data: c.map(val), _meta: c,
      backgroundColor: c.map((p) => fillFor(p, pal(0))), borderColor: pal(0), borderWidth: c.map((p) => (isWeak(p) && !p.uv ? 1.5 : 0)), borderRadius: 2, maxBarThickness: 30 }] },
      options: baseOpts({ plugins: { legend: { display: false }, tooltip: { callbacks: { label: (x) => `${fmt(x.raw, 2)}$` } } } }) });
    const mom = c.map((r, i) => {
      if (r.mom != null) return { v: r.mom, t: r.t, s: r.s, n: "기사에 나온 전월 대비 값" };
      const p = c[i - 1]; if (!p || p.v == null || r.v == null) return null;
      return { v: +((r.v / p.v - 1) * 100).toFixed(2), t: "estimate", uv: r.uv || p.uv, s: r.s, n: `계산값: ${r.v}$ ÷ ${p.v}$ − 1` };
    });
    D._calc.mom = mom;
    mk("c_mom", { type: "bar", data: { labels: L, datasets: [{ label: "전월 대비 %", data: mom.map(val), _meta: mom,
      backgroundColor: mom.map((p) => fillFor(p, p && p.v < 0 ? pal(7) : pal(2))), borderColor: mom.map((p) => (p && p.v < 0 ? pal(7) : pal(2))),
      borderWidth: mom.map((p) => (isWeak(p) && !(p && p.uv) ? 1.5 : 0)), borderRadius: 2, maxBarThickness: 30 }] },
      options: baseOpts({ plugins: { legend: { display: false }, tooltip: { callbacks: { label: (x) => `${signed(x.raw, 2)}%` } } } }) });
    const mv = mom.map(val).filter((v) => v != null);
    document.getElementById("momNote").textContent = `최근 전월비: ${mv.slice(-4).map((v) => signed(v, 1) + "%").join(" → ")}. 1월 +23.7%에서 9~10월 +4~6%대로 상승 속도는 줄었지만 아직 플러스입니다. 빈 칸 = 5월 값 미확인.`;
  }
  function spotForm() {
    const f = document.getElementById("fSpot"), out = document.getElementById("copyOut");
    f.d.value = new Date().toISOString().slice(0, 10);
    f.addEventListener("submit", (e) => {
      e.preventDefault();
      const r = { d: f.d.value, ddr4_16gb: f.ddr4.value === "" ? null : +f.ddr4.value, ddr5_16gb: f.ddr5.value === "" ? null : +f.ddr5.value, src: f.src.value || "", how: "manual" };
      if (r.ddr4_16gb == null && r.ddr5_16gb == null) { alert("가격을 하나 이상 넣어 주세요."); return; }
      const a = localSpots().filter((x) => x.d !== r.d); a.push(r); a.sort((x, y) => (x.d < y.d ? -1 : 1));
      try { localStorage.setItem("spotManual", JSON.stringify(a)); } catch (err) { alert("이 브라우저에서는 임시 저장이 안 됩니다. [기록 파일용 복사]를 사용하세요."); }
      sec3Refresh();
    });
    document.getElementById("bCopy").addEventListener("click", () => {
      const a = localSpots();
      if (!a.length) { out.hidden = false; out.textContent = "임시 입력이 없습니다. 먼저 [추가]를 눌러 주세요."; return; }
      const cmd = a.map((r) => `python3 scripts/add_spot.py --date ${r.d}` + (r.ddr4_16gb != null ? ` --ddr4 ${r.ddr4_16gb}` : "") + (r.ddr5_16gb != null ? ` --ddr5 ${r.ddr5_16gb}` : "") + ` --src "${(r.src || "manual").replace(/"/g, "'")}"`).join("\n");
      out.hidden = false; out.textContent = "# dashboard 폴더에서 실행하세요\n" + cmd;
      try { navigator.clipboard.writeText(cmd); } catch (e) { /* 클립보드 불가 시 화면에서 복사 */ }
    });
    document.getElementById("bClear").addEventListener("click", () => { try { localStorage.removeItem("spotManual"); } catch (e) {} sec3Refresh(); out.hidden = true; });
  }
  function sec3Refresh() { sec3SpotOnly(); }
  function sec3SpotOnly() { // 현물 그래프만 다시 그림
    const keep = missing.length; sec3Spot(); missing.length = keep;
  }
  function sec3Spot() {
    const pr = D.prices, all = { "DDR4 16Gb": [], "DDR5 16Gb": [] };
    Object.keys(pr.spot).forEach((k) => pr.spot[k].forEach((p) => all[k].push(p)));
    const log = (D.spotLog || []).concat(localSpots().map((r) => Object.assign({}, r, { how: "manual-temp" })));
    log.forEach((r) => { const n = (r.how === "manual-temp" ? "브라우저 임시 입력(파일 미저장)" : r.how === "manual" ? "수동 입력" : "자동 기록") + (r.src ? " · " + r.src : "");
      if (r.ddr4_16gb != null) all["DDR4 16Gb"].push({ d: r.d, v: +r.ddr4_16gb, t: "market", n, uv: r.how === "manual-temp" });
      if (r.ddr5_16gb != null) all["DDR5 16Gb"].push({ d: r.d, v: +r.ddr5_16gb, t: "market", n, uv: r.how === "manual-temp" }); });
    const dates = [...new Set(Object.values(all).flat().map((p) => p.d))].sort();
    spotChart.data.labels = dates;
    Object.keys(all).forEach((k, i) => { const arr = dates.map((d) => all[k].filter((p) => p.d === d && p.v != null).pop() || null); spotChart.data.datasets[i].data = arr.map(val); spotChart.data.datasets[i]._meta = arr; });
    spotChart.update(); D._calc.spot = all;
  }

  // ───────────────────────── 섹션 4. 공급 ─────────────────────────
  function sec4() {
    const sp = D.supply, Y = sp.years, cos = Object.keys(sp.capex);
    const toUSD = (cur, v) => (cur === "KRW" ? (v * 1000) / sp.fx.KRW : cur === "CNY" ? v / sp.fx.CNY : v);
    const ds = cos.map((co, i) => {
      const c = sp.capex[co];
      const meta = c.vals.map((p) => p && Object.assign({}, p, { t: c.china && p.t === "official" ? "estimate" : p.t,
        n: (c.cur !== "USD" ? `원래 값 ${p.v}${c.unit} → ${c.cur === "KRW" ? sp.fx.KRW + "원" : sp.fx.CNY + "위안"}/$ 환산. ` : "") + (c.fiscal ? c.fiscal + ". " : "") + (c.china ? "[중국 업체: 추정치] " : "") + (p.n || "") }));
      c.vals.forEach((p, j) => { if (!p && !(co.startsWith("CXMT+"))) missing.push({ sec: "4 공급", item: `${co} ${Y[j]}년 설비투자`, why: c.china ? "중국 업체는 공식 공시 없음" : (j === 3 && c.note) || "" }); else if (p && p.uv) missing.push({ sec: "4 공급", item: `${co} ${Y[j]}년 설비투자 = ${p.v}${c.unit}`, why: p.n }); });
      return { label: co + (c.china ? " (추정)" : ""), data: c.vals.map((p) => (p ? +toUSD(c.cur, p.v).toFixed(1) : null)), _meta: meta,
        backgroundColor: meta.map((p) => fillFor(p, pal(i))), borderColor: pal(i), borderWidth: meta.map((p) => (isWeak(p) && !p.uv ? 1.5 : 0)), borderRadius: 2, maxBarThickness: 28 };
    }).filter((d) => d.data.some((v) => v != null));
    mk("c_supCapex", { type: "bar", data: { labels: Y, datasets: ds },
      options: baseOpts({ plugins: { tooltip: { intersect: true, callbacks: { label: (c) => `${c.dataset.label}: ${fmt(c.raw)}B$` } } }, scales: { y: { title: { display: true, text: "십억 달러(환산)", color: css("--text2") } } } }) });
    document.getElementById("supNote").textContent = sp.fx.note + " 하이닉스 2027년: " + (sp.capex["SK하이닉스"].note || "") + ".";
    document.getElementById("supNotes").innerHTML = sp.capexNotes.map((t) => `<li>${esc(t)} <span class="muted">(추정·2차 자료)</span></li>`).join("");

    // ② 간트
    const PH = { build: ["건설 (착공→클린룸)", 1], tool: ["클린룸 개방·장비 반입", 2], ramp: ["양산 램프업", 3], full: ["풀캐파", 4] };
    const seq = isDark() ? ["#5598e7", "#3987e5", "#2a78d6", "#1c5cab", "#184f95"] : ["#b7d3f6", "#86b6ef", "#5598e7", "#2a78d6", "#184f95"];
    const fabs = sp.fabs, names = fabs.map((f) => f.name + (f.china ? " (추정)" : ""));
    fabs.forEach((f) => { if (!f.phases.length) missing.push({ sec: "4 공급", item: `${f.name} 일정`, why: f.note || "공개 일정 없음" });
      if (f.capa && f.capa.uv) missing.push({ sec: "4 공급", item: `${f.name} 캐파 월 ${f.capa.v / 10}만 장`, why: f.capa.n });
      f.phases.forEach((p) => { if (p.uv) missing.push({ sec: "4 공급", item: `${f.name} — ${PH[p.p][0]} 시점`, why: p.n }); }); });
    const gds = Object.keys(PH).map((ph) => {
      const items = [], meta = [];
      fabs.forEach((f, i) => f.phases.filter((p) => p.p === ph).forEach((p) => { items.push({ x: [p.a, p.b], y: names[i] }); meta.push(Object.assign({}, p, { n: `${ym(p.a)} ~ ${ym(p.b)} · ${f.product}` + (f.capa && f.capa.v ? ` · 캐파 ${f.capa.v}${f.capa.unit}(추정)` : "") + (p.n ? " · " + p.n : "") })); }));
      const col = seq[PH[ph][1]];
      return { label: PH[ph][0], data: items, _meta: meta, grouped: false, backgroundColor: meta.map((p) => fillFor(p, col)), borderColor: col,
        borderWidth: meta.map((p) => (isWeak(p) && !p.uv ? 1.5 : 0)), borderSkipped: false, borderRadius: 3, barPercentage: 0.6, categoryPercentage: 0.9 };
    });
    const band = { id: "y2028", beforeDatasetsDraw(ch) { const { ctx, chartArea: a, scales: { x } } = ch;
      [[2028, 2028.5, "28 상반기"], [2028.5, 2029, "28 하반기"]].forEach(([s, e, t], k) => { const x0 = x.getPixelForValue(s), x1 = x.getPixelForValue(e);
        ctx.save(); ctx.fillStyle = css("--hl"); ctx.fillRect(x0, a.top, x1 - x0, a.bottom - a.top);
        ctx.fillStyle = css("--text2"); ctx.font = "600 11px sans-serif"; ctx.textAlign = "center"; ctx.fillText(t, (x0 + x1) / 2, a.bottom - 6);
        ctx.strokeStyle = css("--line"); ctx.setLineDash([3, 3]); ctx.beginPath(); ctx.moveTo(x1, a.top); ctx.lineTo(x1, a.bottom); ctx.stroke(); ctx.restore(); });
      // 오늘 표시
      const now = new Date(), t = now.getFullYear() + now.getMonth() / 12, xp = x.getPixelForValue(t);
      ctx.save(); ctx.strokeStyle = css("--crit"); ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(xp, a.top); ctx.lineTo(xp, a.bottom); ctx.stroke();
      ctx.fillStyle = css("--crit"); ctx.font = "11px sans-serif"; ctx.fillText("오늘", xp + 3, a.top + 10); ctx.restore(); } };
    mk("c_gantt", { type: "bar", data: { labels: names, datasets: gds }, plugins: [band],
      options: baseOpts({ indexAxis: "y", interaction: { mode: "nearest", intersect: true },
        scales: { x: { type: "linear", min: 2024, max: 2031, ticks: { stepSize: 1, callback: (v) => v + "년" }, grid: { color: css("--line") } }, y: { stacked: true, grid: { color: "transparent" } } },
        plugins: { tooltip: { callbacks: { label: (c) => c.dataset.label } } } }) });

    // ③ 2028 집중 표
    const ov = (p, s, e) => p.a < e && p.b > s && (p.p === "tool" || p.p === "ramp");
    const rows = fabs.map((f) => ({ f, h1: f.phases.some((p) => ov(p, 2028, 2028.5)), h2: f.phases.some((p) => ov(p, 2028.5, 2029)) })).filter((r) => r.h1 || r.h2);
    D._calc.fab2028 = rows.length;
    let h = "<tr><th>팹</th><th>제품</th><th>28 상반기</th><th>28 하반기</th><th>캐파(추정)</th><th>근거</th></tr>";
    rows.forEach((r) => { const p = r.f.phases.find((p) => ov(p, 2028, 2029)) || {};
      h += `<tr class="${r.h2 ? "hl" : ""}"><td><b>${esc(r.f.name)}</b></td><td>${esc(r.f.product)}</td><td>${r.h1 ? "● 가동·램프" : ""}</td><td>${r.h2 ? "● 가동·램프" : ""}</td><td>${r.f.capa && r.f.capa.v ? fmt(r.f.capa.v / 10, 1) + "만 장/월" + (r.f.capa.uv ? " ⚠검증대기" : "") : "—"}</td><td>${TYPE_LABEL[p.t] || ""}${p.uv ? " ⚠" : ""} · ${srcLink(p.s)}</td></tr>`; });
    h += `<tr><td colspan="6" class="muted">2028년 램프업이 겹치는 팹 ${rows.length}곳. 하반기(노란 줄)에 몰리면 "3사 신규 물량 동시 출회" 우려 구간입니다. 단, HBM 비중이 높을수록 일반 D램 비트 증가는 작아집니다(웨이퍼 2배 이상 사용).</td></tr>`;
    document.getElementById("t2028").innerHTML = h;
  }
  const ym = (x) => { const y = Math.floor(x), m = Math.round((x - y) * 12) + 1; return `${y}.${String(Math.min(m, 12)).padStart(2, "0")}`; };

  // ───────────────────────── 섹션 5. 결과 ─────────────────────────
  function sec5() {
    const r = D.results, Q = r.quarters, wrapEl = document.getElementById("pqCharts");
    const breaks = {};
    Object.keys(r.bgasp).forEach((co, i) => {
      const id = "c_pq" + i, card = document.createElement("div"); card.className = "card";
      card.innerHTML = `<h4>${esc(co)} D램 B/G vs ASP (전분기 대비 %)</h4><div class="cv"><canvas id="${id}"></canvas></div>`;
      wrapEl.appendChild(card);
      const bg = r.bgasp[co].bg, asp = r.bgasp[co].asp;
      Q.forEach((q, j) => { if (!bg[j]) missing.push({ sec: "5 결과", item: `${co} ${q} D램 B/G` }); if (!asp[j]) missing.push({ sec: "5 결과", item: `${co} ${q} D램 ASP 변화율` }); });
      // 깨짐 판정: ASP<0 이고 ASP+B/G<0
      let streak = 0, maxStreak = 0, count = 0;
      Q.forEach((q, j) => { const a = val(asp[j]), b = val(bg[j]); if (a != null && b != null && a < 0 && a + b < 0) { streak++; count++; maxStreak = Math.max(maxStreak, streak); } else if (a != null && b != null) streak = 0; });
      breaks[co] = { count, maxStreak };
      mk(id, { type: "bar", data: { labels: Q, datasets: [
        { label: "B/G (Q)", data: bg.map(val), _meta: bg, backgroundColor: bg.map((p) => fillFor(p, pal(0))), borderColor: pal(0), borderWidth: bg.map((p) => (isWeak(p) ? 1.5 : 0)), borderRadius: 2, maxBarThickness: 18 },
        { label: "ASP (P)", data: asp.map(val), _meta: asp, backgroundColor: asp.map((p) => fillFor(p, pal(1))), borderColor: pal(1), borderWidth: asp.map((p) => (isWeak(p) ? 1.5 : 0)), borderRadius: 2, maxBarThickness: 18 }] },
        options: baseOpts({ plugins: { tooltip: { intersect: true, callbacks: { label: (c) => `${c.dataset.label}: ${signed(c.raw)}%` } } } }) });
    });
    D._calc.breaks = breaks;
    const cos = Object.keys(r.opm);
    cos.forEach((co) => r.opm[co].forEach((p, j) => { if (!p) missing.push({ sec: "5 결과", item: `${co} ${Q[j]} 이익률` }); }));
    mk("c_opm", { type: "line", data: { labels: Q, datasets: cos.map((co, i) => ({ label: co, data: r.opm[co].map(val), _meta: r.opm[co], borderColor: pal(i), backgroundColor: pal(i),
      borderWidth: 2, pointRadius: 5, spanGaps: true, borderDash: i ? [5, 4] : undefined })) },
      options: baseOpts({ plugins: { tooltip: { callbacks: { label: (c) => `${c.dataset.label}: ${fmt(c.raw)}%` } } }, scales: { y: { suggestedMin: 0, suggestedMax: 100, title: { display: true, text: "%", color: css("--text2") } } } }) });
  }

  // ───────────────────────── 섹션 6. 점검판 ─────────────────────────
  function judge(id) {
    const C = D._calc, dm = D.demand;
    switch (id) {
      case "capexYoY": {
        const v = C.yoy.v.filter((x) => x != null); if (v.length < 2) return ["구름", "데이터 부족"];
        const [a, b, c] = v.slice(-3).reverse(); // c=3분기 전, b=직전, a=최신
        const txt = `4대 합계 YoY ${v.slice(-3).map((x) => signed(x, 0) + "%").join(" → ")}`;
        if (a < 20 || (c != null && a < b && b < c)) return ["경고", txt + " (2분기 연속 둔화 또는 +20% 미만)"];
        if (a < b) return ["구름", txt + " (직전보다 둔화)"];
        return ["맑음", txt + " (가속 중, 단 일부 검증 대기 값 포함)"];
      }
      case "guidance": {
        let down = [], up = [];
        Object.keys(dm.guidance).forEach((k) => { const g = dm.guidance[k]; if (g.length < 2 || k.startsWith("오라클")) return; const a = g[g.length - 1], b = g[g.length - 2], ma = (a.lo + a.hi) / 2, mb = (b.lo + b.hi) / 2; if (ma < mb) down.push(k.split(" ")[0]); if (ma > mb) up.push(k.split(" ")[0]); });
        const txt = `최근 개정: 상향 ${up.join("·") || "없음"} / 하향 ${down.join("·") || "없음"}`;
        if (down.length >= 2) return ["경고", txt];
        if (down.length === 1) return ["구름", txt + " (MS 하향은 회계 변경 영향이라고 설명)"];
        return ["맑음", txt];
      }
      case "funding": {
        const neg = dm.fcf.filter((r) => r.fcf && r.fcf.v < 0).map((r) => r.co);
        const top = dm.cds.filter((r) => r.now).sort((a, b) => b.now.v - a.now.v)[0];
        const txt = `26Q3 FCF 마이너스: ${neg.join("·")} (${neg.length}곳). CDS 최고 ${top ? top.co + " " + top.now.v + "bp" : "-"}`;
        return [neg.length >= 3 ? "경고" : neg.length ? "구름" : "맑음", txt];
      }
      case "inventory": {
        const rows = D.inventory.calls.rows; let inc = false, short = 0;
        Object.values(rows).forEach((a) => { const l = a.filter(Boolean).pop(); if (l && l.st === "증가") inc = true; if (l && l.st === "부족") short++; });
        const anyNum = Object.values(D.inventory.inv).some((a) => a.some((x) => x != null));
        if (inc) return ["경고", "메모리 콜에서 '고객 재고 증가' 표현 등장"];
        return ["구름", `메모리 ${short}사 모두 '공급 부족' 발언. 하지만 서버·PC 재고 숫자${anyNum ? "" : "가 아직 없어"} 비축(미리 사두기) 여부 확인 불가`];
      }
      case "contract": {
        const m = C.mom.map(val), idx = m.map((v, i) => (v != null ? i : -1)).filter((i) => i >= 0);
        const last = m[idx[idx.length - 1]], three = m[idx[idx.length - 4]];
        const txt = `전월비 최신 ${signed(last, 1)}% (3개월 전 ${signed(three, 1)}%)`;
        if (last < 0) return ["경고", txt + " — 마이너스 전환"];
        if (three != null && last < three) return ["구름", txt + " — 오르긴 하지만 상승 속도 둔화"];
        return ["맑음", txt + " — 상승 폭 유지·확대"];
      }
      case "spot": {
        const a = (C.spot["DDR4 16Gb"] || []).filter((p) => p.v != null).sort((x, y) => (x.d < y.d ? -1 : 1));
        if (a.length < 2) return ["구름", "기록 2개 미만 — 매일 기록을 쌓아야 판단 가능"];
        const l = a[a.length - 1], p = a[a.length - 2];
        const txt = `DDR4 16Gb ${p.d} ${p.v}$ → ${l.d} ${l.v}$`;
        if (l.v < p.v) return ["구름", txt + " (하락)"];
        const b = (C.spot["DDR5 16Gb"] || []).filter((x) => x.v != null).pop();
        return ["맑음", txt + (b ? ` · DDR5 ${b.v}$. DDR4–DDR5 격차는 축소 중` : "")];
      }
      case "supplyCapex": {
        const mu = D.supply.capex["마이크론"].vals, g = mu[3] && mu[2] ? (mu[3].v / mu[2].v - 1) * 100 : null;
        const n = (g != null && g >= 30 ? 1 : 0) + 1; // 하이닉스: '2027년 크게 증가' 발언(금액 미제시)을 1곳으로 계산
        const txt = `마이크론 FY27 ${g != null ? signed(g, 0) + "%(추정)" : "?"} · 하이닉스 '2027년 크게 증가'(금액 미제시) · 삼성 미확인`;
        return [n >= 2 ? "경고" : n === 1 ? "구름" : "맑음", txt];
      }
      case "fab2028": {
        const n = C.fab2028; return [n >= 3 ? "경고" : n >= 1 ? "구름" : "맑음", `2028년에 장비반입·램프가 겹치는 팹 ${n}곳 (하이닉스 Y1, 삼성 P5, 마이크론 ID1·ID2·히로시마 등)`];
      }
      case "pq": {
        const b = C.breaks, worst = Math.max(...Object.values(b).map((x) => x.maxStreak)), cnt = Object.values(b).reduce((s, x) => s + x.count, 0);
        const txt = `ASP 하락폭 > B/G인 분기: ${cnt}번 (연속 최대 ${worst}번). 26Q3 하이닉스 B/G +10%, ASP +20%대 후반 → P와 Q 모두 플러스`;
        return [worst >= 2 ? "경고" : cnt ? "구름" : "맑음", txt];
      }
      case "opm": {
        const v = D.results.opm["SK하이닉스"].map(val).filter((x) => x != null), n = v.length;
        const txt = `하이닉스 ${v.map((x) => Math.round(x) + "%").join(" → ")}`;
        if (v[n - 1] < v[n - 2] && v[n - 2] < v[n - 3]) return ["경고", txt + " (2분기 연속 하락)"];
        if (v[n - 1] < v[n - 2]) return ["구름", txt + " (하락)"];
        const d1 = v[n - 1] - v[n - 2], d0 = v[n - 2] - v[n - 3];
        return ["맑음", txt + (d1 < d0 ? ` (상승 폭은 +${d0.toFixed(1)}%p → +${d1.toFixed(1)}%p로 축소)` : "")];
      }
    }
    return [null, ""];
  }
  function sec6() {
    let h = "<tr><th>지표</th><th>분류</th><th>지금 상태</th><th>판단 근거 (데이터 자동 판정)</th><th>경고 신호</th><th>확인 시기</th></tr>";
    D.checklist.rows.forEach((r) => {
      let [st, why] = judge(r.id); if (r.override) { st = r.override; why = (r.reason || "") + " (수동)"; }
      h += `<tr><td><a href="#${r.sec}"><b>${esc(r.name)}</b></a></td><td><span class="kind">${r.kind}</span></td><td>${badge(st)}</td><td>${esc(why)}<br><span class="muted" style="font-size:12px">규칙: ${esc(r.rule)}</span></td><td>${esc(r.signal)}</td><td>${esc(r.when)}</td></tr>`;
    });
    document.getElementById("checkTable").innerHTML = h;
    const hy = D.checklist.hypothesis;
    const li = (a) => a.map((x) => `<tr><td><b>${esc(x.t)}</b></td><td>${esc(x.d)}</td><td class="muted">${esc(x.check)}</td></tr>`).join("");
    document.getElementById("hypo").innerHTML = `<div class="claim">가설: ${esc(hy.claim)}</div>
      <div class="hypo"><div class="card"><h4>👍 근거</h4><table class="grid small"><tr><th>근거</th><th>내용·현황</th><th>볼 섹션</th></tr>${li(hy.pro)}</table></div>
      <div class="card"><h4>👎 반대 근거</h4><table class="grid small"><tr><th>반대 근거</th><th>내용·현황</th><th>볼 섹션</th></tr>${li(hy.con)}</table></div></div>
      <div class="card"><h4>🚨 가설이 깨지는 신호</h4><ul class="notes">${hy.breaks.map((b) => `<li>${esc(b)}</li>`).join("")}</ul></div>`;
  }

  // ── 확인 못 한 항목 / 출처 ──
  function finish() {
    missing.push({ sec: "1 수요", item: "마이크로소프트 2026 가이던스(190→175→170B$)", why: "출처 간 숫자·회계연도 기준 충돌" });
    missing.push({ sec: "4 공급", item: "하이닉스 LTA '27·28년 캐파 50% 이상'", why: "헤드라인만 확인, 본문 근거 미확인 (점검판 가설표 참고)" });
    missing.push({ sec: "4 공급", item: "삼성 P5 '물량 본격화 2028년 하반기'(씨티 이세철 전무)", why: "원문 미확인" });
    const groups = {};
    missing.forEach((m) => (groups[m.sec] = groups[m.sec] || []).push(m));
    document.getElementById("missList").innerHTML = Object.keys(groups).sort().map((g) => `<div class="card"><h4>${g} <small>${groups[g].length}개</small></h4><ul class="notes">${
      groups[g].map((m) => `<li>${esc(m.item)}${m.why ? ` <span class="muted">— ${esc(m.why)}</span>` : ""}</li>`).join("")}</ul></div>`).join("");
    document.getElementById("srcTable").innerHTML = "<tr><th>이름</th><th>발표일</th><th>링크</th></tr>" +
      Object.keys(S).map((k) => `<tr><td>${esc(S[k].name)}</td><td>${S[k].date}</td><td>${S[k].url ? `<a href="${S[k].url}" target="_blank" rel="noopener">열기</a>` : "—"}</td></tr>`).join("");
    document.getElementById("asof").textContent = "데이터 기준: 2026-11-11 웹 검색 · 마지막 갱신은 data/ 파일 수정일 기준";
  }

  function renderAll() {
    charts.splice(0).forEach((c) => c.destroy());
    document.querySelectorAll(".empty").forEach((e) => e.remove());
    document.getElementById("pqCharts").innerHTML = "";
    missing.length = 0; spotChart = null;
    sec1(); sec2(); sec3(); sec4(); sec5(); sec6(); finish();
  }
  if (!window.Chart) { document.body.insertAdjacentHTML("afterbegin", '<p style="padding:16px;background:#fbe5e5;color:#c62f2f">그래프 라이브러리(Chart.js)를 불러오지 못했습니다. 인터넷 연결을 확인하세요.</p>'); return; }
  Chart.defaults.font.family = getComputedStyle(document.body).fontFamily;
  renderAll(); spotForm();
  window.sec3Refresh = sec3Refresh;
  matchMedia("(prefers-color-scheme: dark)").addEventListener("change", renderAll);
})();
