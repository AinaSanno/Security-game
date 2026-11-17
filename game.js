(() => {
  'use strict';

  /* ============================================================
   * インシデント・ゼロアワー
   * 攻撃 → 特定 → 解決 の3フェーズ / 全5ステージ
   * ※ IBM銀行はゲーム上の架空の銀行です。攻撃AI・数値も架空です
   * ============================================================ */

  const $ = (id) => document.getElementById(id);

  const PHASES = ['attack', 'detect', 'resolve'];

  /* ---------- IBM製品図鑑 ----------
   * role = 何のために使うか（目的） / desc = 何をしているか
   */
  const PRODUCTS = {
    instana: {
      name: 'IBM Instana Observability',
      role: 'いつもと違う動きに気づく',
      desc: 'システムの普段の動きを学び、アクセスの急増など「いつもと違う」ことを見つけて知らせてくれます。今回は、夜中の不自然なアクセス増に最初に気づく役目です。'
    },
    qradar: {
      name: 'IBM QRadar Suite',
      role: 'バラバラの警告をつなげて、攻撃の流れを見えるようにする',
      desc: 'たくさん鳴る警告を1つの事件としてまとめ、「いつ・どこから・何をされたか」を時間順に整理します。次にやるべき対応も提案してくれます。'
    },
    registry: {
      name: 'IBM Cloud Container Registry（Vulnerability Advisor）',
      role: '侵入された入口の「弱点」を調べる',
      desc: 'システムの部品を自動でチェックして、古くて危ない部分と、その直し方を教えてくれます。'
    },
    concert: {
      name: 'IBM Concert',
      role: '「何から直すか」を決める',
      desc: '数百件ある弱点や問題を、システム全体のつながりと合わせて見て、危険度の高い順に並べます。おすすめの対応も示してくれます。'
    },
    vault: {
      name: 'IBM HashiCorp Vault',
      role: '漏れた鍵を使えなくして、鍵を安全に守る',
      desc: 'パスワードなどの「鍵」を1か所で厳重に管理します。漏れた鍵はすぐ無効にでき、短時間で自動的に切れる「使い捨ての鍵」も発行できます。誰がいつ使ったかも記録されます。'
    },
    apic: {
      name: 'IBM API Connect',
      role: 'システムの入口で、大量のアクセスをさばく',
      desc: '外とのやり取りの入口で、短時間に何度も来るアクセスの回数を制限したり、本人確認のルールを適用したりします。'
    },
    verify: {
      name: 'IBM Security Verify Access',
      role: '怪しいときだけ、追加で本人確認をする',
      desc: 'いつもと違う場所や端末からのログインを見つけると、確認コードなどの追加の本人確認を求めます。普段どおりのお客様には、手間をかけません。'
    },
    protect: {
      name: 'IBM Storage Protect',
      role: '壊されたデータを、元の状態に戻す',
      desc: 'データのバックアップを保管しておき、書き換えや故障が起きる前の時点まで復元します。'
    }
  };
  const CODEX_ORDER = Object.keys(PRODUCTS);

  /* ---------- 登場人物 ---------- */
  const WHO = {
    narr: { c: 'narr', n: '', p: '' },
    ai: { c: 'ai', n: 'FRONTIER-AI（攻撃側のAI）', p: 'AI' },
    ally1: { c: 'ally1', n: 'ミナト（監視担当）', p: 'ミ' },
    ally2: { c: 'ally2', n: 'ケイ（システム担当）', p: 'ケ' },
    ally3: { c: 'ally3', n: 'ヒロセ（責任者）', p: 'ヒ' }
  };

  /* ============================================================
   * シナリオ（全5ステージ / 約5分）
   * ============================================================ */
  const say = (who, text, extra) => Object.assign({ t: 'say', who, text }, extra);

  const STAGES = [
    /* ---------------- STAGE 1 : 攻撃 ---------------- */
    {
      phase: 'attack',
      title: '静かな侵入',
      sub: 'フロンティアAIは、人間よりずっと速く弱点を探し当てる。',
      goal: '目標：攻撃を体験し、最初の判断を間違えない',
      place: 'IBM銀行 / ネットバンキング',
      clock: '02:14',
      steps: [
        say('narr', '午前2時14分。IBM銀行のネットバンキングは、いつも通り静かに動いている。……はずだった。'),
        say('ai', '銀行のシステムを総チェック。……見つけた。何年も更新されていない古いシステムだ。\nしかも中に、使い回しの「合鍵」（パスワードのようなもの）が置きっぱなしになっている。', {
          log: [
            '[AI] 銀行のシステムを総チェック中 ...',
            '[AI] 古いシステムを発見（弱点あり）',
            '[AI] 置きっぱなしの合鍵を発見'
          ],
          fx: 'shake',
          leak: 1200
        }),
        say('narr', '正規の合鍵を使っているので、警報は鳴らない。\nお客様の口座情報が、静かに外へ持ち出されていく。', {
          log: ['[口座DB] 4,800件のデータを読み出し', '[ネット] 外への送信が始まった'],
          logCls: 'bad',
          fx: 'flash',
          leak: 4800,
          trust: -10,
          clock: '02:31'
        }),
        say('ally1', '{name}さん！ 夜中なのに、口座データへのアクセスが急に増えています！\nエラーは出ていないのに、量だけおかしくて……どうしましょう！？'),
        {
          t: 'choice',
          q: '最初の一手は？',
          options: [
            { text: 'あわてて、全サーバーを再起動する', why: '再起動すると、攻撃の手がかり（記録）が消えてしまい、原因を調べにくくなります。' },
            { text: '記録を残したまま、何が起きているか調べ始める', ok: true, why: '手がかりを残して調べるのが基本です。次の「特定」で必ず役に立ちます。' },
            { text: '夜中なので、朝まで様子を見る', why: 'AIは眠りません。時間がたつほど被害が広がります。' }
          ]
        }
      ]
    },

    /* ---------------- STAGE 2 : 特定 ---------------- */
    {
      phase: 'detect',
      title: '何が起きたのか突き止める',
      sub: '3つのIBM製品で、「異常」「攻撃の流れ」「入口の弱点」を順に調べる。',
      goal: '目標：原因を突き止める',
      place: '監視センター',
      clock: '03:05',
      steps: [
        say('ally1', '調査のフェーズです。まず、「いつもと違う動き」を探しましょう。', {
          log: ['[ネット] 外への送信が続いています ...'],
          logCls: 'bad',
          leak: 1800
        }),
        { t: 'learn', id: 'instana' },
        {
          t: 'choice',
          q: 'Instanaが「おかしい」と知らせてきました。最も怪しいのは？',
          options: [
            { text: '深夜に、古いシステムへのアクセスが普段の約40倍。しかもエラーなしで成功している', ok: true, why: 'エラーなしで大量にアクセスできているのは、正規の鍵が使われている疑いがあります。' },
            { text: 'ロゴ画像の表示が、少し遅い', why: '攻撃とは関係のない、ただのノイズです。' },
            { text: '社内の資料サイトへのアクセスが、少し増えた', why: '調べものをしている人が増えただけです。' }
          ]
        },
        say('ally1', '次は、バラバラに鳴っている警告をつなげて、攻撃の全体像を見ましょう。'),
        { t: 'learn', id: 'qradar' },
        {
          t: 'choice',
          q: 'QRadarに「外への怪しい通信」「鍵の不正使用」「管理者権限への不審な操作」の警告が並んでいます。どうする？',
          options: [
            { text: 'まとめて1つの事件として、つなげて流れを見る', ok: true, why: 'QRadarは警告を1つの事件にまとめ、時間順に攻撃の流れを示します。点がつながると、全体像が見えてきます。' },
            { text: '重要度の低い警告は、無視する', why: '小さな警告が、攻撃の最初の痕跡であることはよくあります。' },
            { text: '警告ごとに、別々の担当が調べる', why: 'つなげないと全体像が見えず、対応が遅れます。' }
          ]
        },
        say('ally2', '入口になったのは、古いシステムのようです。部品に弱点がないか調べてみましょう。'),
        { t: 'learn', id: 'registry' },
        say('narr', '調査レポートが表示された。', {
          log: ['[調査] 古い部品に、既知の弱点が7件', '[調査] 修正版あり（更新すれば直せる）'],
          logCls: 'info'
        }),
        {
          t: 'order',
          q: 'ここまでの調査結果から、攻撃の流れを順番に並べよう。',
          hint: '上から順に、タップして並べてください。',
          items: [
            '古いシステムの弱点を見つけて、侵入する',
            'システム内に置きっぱなしの合鍵を手に入れる',
            '合鍵を使って、正規ユーザーのふりで口座データにアクセスする',
            'データを少しずつ、外に送り出す'
          ],
          why: '「弱い入口 → 合鍵を入手 → 正規ユーザーのふり → 持ち出し」の流れです。'
        },
        say('ally3', '原因が分かった。「古くて弱い部分」と「何年も使い回した合鍵」だ。\n問題は、直すべき点が多すぎて、優先順位をつけられなかったことだな。\n\nここから「解決」フェーズだ。IBM製品で立て直そう。')
      ]
    },

    /* ---------------- STAGE 3 : 解決 (Concert) ---------------- */
    {
      phase: 'resolve',
      title: 'Concertで、直す順番を決める',
      sub: '直す点は数百件。朝までに全部は直せない。',
      goal: '目標：IBM Concertで、最優先の3つを選ぶ',
      place: '対策本部',
      clock: '04:20',
      steps: [
        say('ally3', '直すべき点は数百件ある。朝までに全部は無理だ。\n何から直すか、根拠を持って決めたい。', {
          log: ['[ネット] 外への送信が続いています ...'],
          logCls: 'bad',
          leak: 900
        }),
        say('ally2', 'IBM Concertを使いましょう。システム全体のつながりと問題点をまとめて見て、危険な順に並べてくれます。'),
        { t: 'learn', id: 'concert' },
        {
          t: 'pick',
          n: 3,
          q: 'Concertが並べた候補から、今すぐ直す3つを選ぼう。',
          hint: '見るポイント：①外から狙われるか ②すでに悪用されているか ③業務への影響が大きいか',
          options: [
            { text: '社内ポータルの部品（社内だけで使用・悪用の形跡なし）', sub: '危険度 41', why: '社内限定で、悪用の形跡もありません。後回しでOKです。' },
            { text: '古い口座システム（外に公開・今回の侵入口・口座データにつながる）', sub: '危険度 98', ok: true, why: '外に公開 × すでに悪用 × 大事なデータ。最優先です。' },
            { text: '開発用テスト環境の古い部品（隔離済み・本物のデータなし）', sub: '危険度 29', why: '隔離されていて、本物のデータもありません。後回しでOKです。' },
            { text: '漏れた合鍵（今も悪用中）', sub: '危険度 97', ok: true, why: '今この瞬間も使われています。すぐに止める必要があります。' },
            { text: '同じ弱点を持つ、外に公開されている別のシステム2つ', sub: '危険度 88', ok: true, why: '同じ手口で次に狙われます。早めの確認が必要です。' }
          ]
        },
        say('ally2', 'Concertのおすすめはこうです。\n① 古いシステムを一時停止して修理\n② 漏れた合鍵を今すぐ使えなくして、鍵の管理を作り直す\n③ 同じ弱点を持つ他のシステムも確認\n\n②は、IBM HashiCorp Vaultの出番です。')
      ]
    },

    /* ---------------- STAGE 4 : 解決 (Vault) ---------------- */
    {
      phase: 'resolve',
      title: 'Vaultで、鍵を止めて守る',
      sub: '根本の原因は、何年も使い回した合鍵。',
      goal: '目標：IBM HashiCorp Vaultで流出を止め、再発を防ぐ',
      place: 'システム運用室',
      clock: '05:00',
      steps: [
        say('ally2', '合鍵がシステムの中に置きっぱなしだったのが原因です。\nVaultで鍵を1か所に集めて管理し、漏れた鍵を使えなくします。'),
        { t: 'learn', id: 'vault' },
        {
          t: 'order',
          q: 'Vaultでの対応を、正しい順に並べよう。',
          hint: 'まず被害を止める。そのあと、同じことが起きない仕組みへ。',
          items: [
            '漏れた合鍵を無効にして、攻撃者が使えないようにする',
            '置きっぱなしの合鍵をやめ、短時間で自動的に切れる「使い捨ての鍵」に切り替える',
            'システムごとに、必要な鍵だけを渡す',
            '誰がいつ鍵を使ったか、記録を残す'
          ],
          why: '「被害を止める → 使い回さない → 必要最小限だけ渡す → 記録を残す」の順です。まず止めることが最優先です。'
        },
        say('ally1', 'Vaultで合鍵を無効にしたら、外への送信が止まりました！\n流出は{leak}件で止まっています。', {
          log: ['[Vault] 漏れた鍵を無効化', '[ネット] 外への送信が停止', '[監視] 流出の拡大を止めた'],
          logCls: 'good',
          stopLeak: true,
          clock: '05:42'
        }),
        say('ally3', '流出は止まった。だが、AIは必ず別の入口を探してくる。\n……来るぞ。')
      ]
    },

    /* ---------------- STAGE 5 : 解決 (最終) ---------------- */
    {
      phase: 'resolve',
      title: 'AIの再襲来',
      sub: '入口・本人確認・データ復旧を守り、AIを退ける。',
      goal: '目標：目的に合うIBM製品を選んで、AIの攻撃を退ける',
      place: 'ネットバンキング',
      clock: '06:30',
      steps: [
        say('ai', '鍵が使えない？ ならば別の入口を探すまで。\nもう一度、全力で攻める。', { fx: 'shake', log: ['[AI] 再攻撃を開始'], clock: '06:30' }),
        {
          t: 'battle',
          boss: 'FRONTIER-AI',
          label: '攻撃の勢い',
          dmg: 34,
          turns: [
            {
              ai: '古いシステムに、パスワードを何千回も試す大量アクセスを仕掛けてくる。',
              log: ['[AI] パスワードを大量に試行中 ...'],
              options: [
                { text: 'サーバーを増やして、全部受け止める', why: '入口を守れていません。お金がかかるだけです。' },
                { text: 'IBM API Connectで、短時間のアクセス回数を制限する', ok: true, unlock: 'apic', why: 'API Connectは、入口で「一定時間に何回まで」と制限できます。大量に試す攻撃を抑えられます。' },
                { text: 'AIが疲れるのを待つ', why: 'AIは疲れません。' }
              ]
            },
            {
              ai: '盗んだお客様のIDとパスワードで、不正ログインを試みる。',
              log: ['[AI] 盗んだ情報でログインを試行中 ...'],
              options: [
                { text: 'パスワードの文字数ルールを厳しくする', why: 'すでに盗まれたパスワードには効きません。' },
                { text: 'ログイン画面を閉じてしまう', why: '被害は止まりますが、正規のお客様も使えなくなります。' },
                { text: 'IBM Security Verify Accessで、いつもと違うログインにだけ追加の本人確認を求める', ok: true, unlock: 'verify', why: '怪しいときだけ確認コードなどを求めるので、普段のお客様に手間をかけずに守れます。' }
              ]
            },
            {
              ai: '残ったデータを書き換えて、業務を止めようとする。',
              log: ['[AI] 口座データを書き換え中 ...'],
              fx: 'shake',
              options: [
                { text: 'IBM Storage Protectのバックアップから、書き換えられる前の状態に戻す', ok: true, unlock: 'protect', why: 'バックアップがあれば、書き換えられる前の時点に戻せます。最後の砦です。' },
                { text: '書き換えられたまま、業務を続ける', why: 'まちがった残高のまま営業することになります。' },
                { text: '要求に応じて、お金を払う', why: '解決にならず、再び狙われる原因にもなります。' }
              ]
            }
          ]
        },
        say('ai', '……この手は、もう通らないか。撤退する。', { log: ['[AI] 接続が切れた'], logCls: 'good' }),
        say('narr', '午前6時58分。窓の外が明るくなってきた。\n長い夜が、ようやく明ける。', { clock: '06:58' })
      ]
    }
  ];

  /* ============================================================
   * 状態
   * ============================================================ */
  const state = {};
  function resetState(name) {
    Object.assign(state, { name, trust: 100, leak: 0, score: 0, wrong: 0, stopped: false, codex: [], si: 0, pi: 0, snap: null });
  }

  /* ============================================================
   * DOM ユーティリティ
   * ============================================================ */
  function h(tag, cls, text) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text !== undefined && text !== null) e.textContent = text;
    return e;
  }
  function btn(label, cls, fn) {
    const b = h('button', cls, label);
    b.type = 'button';
    if (fn) b.addEventListener('click', fn);
    return b;
  }
  function once(fn) {
    let done = false;
    return (...a) => { if (done) return; done = true; fn(...a); };
  }
  function fmt(s) {
    return String(s).replace(/\{name\}/g, state.name).replace(/\{leak\}/g, state.leak.toLocaleString('ja-JP'));
  }
  function shuffle(a) {
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }
  const panel = () => $('panel');
  function clearPanel() { const p = panel(); p.replaceChildren(); p.scrollTop = 0; }

  /* ---------- HUD ---------- */
  function renderHud() {
    const t = state.trust;
    const bar = $('trustBar');
    bar.style.width = t + '%';
    bar.className = t <= 30 ? 'low' : t <= 60 ? 'mid' : '';
    $('trustNum').textContent = t;
    $('leakNum').textContent = state.leak.toLocaleString('ja-JP');
    $('leakStat').classList.toggle('stopped', state.stopped);
    $('scoreNum').textContent = state.score.toLocaleString('ja-JP');
    $('codexCount').textContent = state.codex.length + '/' + CODEX_ORDER.length;
  }
  function setPhase(p) {
    document.body.dataset.phase = p;
    const idx = PHASES.indexOf(p);
    document.querySelectorAll('.pill').forEach((el) => {
      const i = PHASES.indexOf(el.dataset.p);
      el.classList.toggle('active', i === idx);
      el.classList.toggle('done', i < idx);
    });
  }
  function setClock(s) { $('clock').textContent = 'TIME ' + s; }

  function toast(text, cls) {
    const t = h('div', 'toast ' + (cls || ''), text);
    $('toasts').append(t);
    setTimeout(() => t.remove(), 2000);
  }
  function fx(kind) {
    const vp = $('viewport');
    vp.classList.remove('shake', 'flash');
    void vp.offsetWidth;
    vp.classList.add('shake');
    if (kind === 'flash') vp.classList.add('flash');
  }

  /* ---------- ターミナルログ（順序保証キュー） ---------- */
  const logQ = [];
  let logBusy = false;
  function log(lines, cls) {
    lines.forEach((l) => logQ.push([fmt(l), cls || '']));
    if (!logBusy) pump();
  }
  function pump() {
    const it = logQ.shift();
    if (!it) { logBusy = false; return; }
    logBusy = true;
    const el = h('div', 'ln ' + it[1], it[0]);
    const term = $('term');
    term.append(el);
    while (term.children.length > 16) term.firstChild.remove();
    setTimeout(pump, 140);
  }

  /* ---------- ステータス変更 ---------- */
  function addTrust(d) {
    state.trust = Math.max(0, Math.min(100, state.trust + d));
    if (d < 0) toast('信頼 ' + d, 'bad');
    renderHud();
  }
  function addLeak(n) {
    if (state.stopped) return;
    state.leak += n;
    toast('流出 +' + n.toLocaleString('ja-JP') + '件', 'bad');
    renderHud();
  }
  function addScore(n) {
    state.score += n;
    renderHud();
  }
  function unlock(id) {
    if (state.codex.includes(id)) return;
    state.codex.push(id);
    toast('図鑑に登録：' + PRODUCTS[id].name, 'good');
    renderHud();
  }
  function grade(ok, penalty) {
    if (ok) { addScore(100); toast('+100', 'good'); }
    else { state.wrong++; addTrust(-(penalty || 10)); }
  }

  /* ============================================================
   * 進行
   * ============================================================ */
  function startStage(i) {
    state.si = i;
    state.pi = 0;
    state.snap = { trust: state.trust, leak: state.leak, score: state.score, wrong: state.wrong, stopped: state.stopped, codex: state.codex.slice() };
    const st = STAGES[i];
    setPhase(st.phase);
    $('place').textContent = st.place;
    setClock(st.clock);
    $('stageName').textContent = 'STAGE ' + (i + 1) + ' / ' + STAGES.length + ' ・ ' + st.title;
    log(['── STAGE ' + (i + 1) + ': ' + st.title + ' ──'], 'info');

    const p = panel();
    p.replaceChildren();
    p.scrollTop = 0;
    const phaseLabel = { attack: '攻撃フェーズ', detect: '特定フェーズ', resolve: '解決フェーズ' }[st.phase];
    const card = h('div', 'card');
    card.append(h('p', 'kicker', 'STAGE ' + (i + 1) + ' / ' + STAGES.length + ' ・ ' + phaseLabel));
    card.append(h('h2', null, st.title));
    card.append(h('p', 'sub', st.sub));
    card.append(h('p', 'goal', st.goal));
    p.append(card);
    p.append(btn('はじめる', 'btn primary', runStep));
  }

  function runStep() {
    if (state.trust <= 0) return gameOver();
    const st = STAGES[state.si];
    const step = st.steps[state.pi];
    if (!step) {
      return state.si + 1 < STAGES.length ? startStage(state.si + 1) : renderEnd();
    }
    enter(step);
    if (state.trust <= 0) return gameOver();
    clearPanel();
    RENDER[step.t](step);
  }
  function next() { state.pi++; runStep(); }

  function enter(step) {
    if (step.clock) setClock(step.clock);
    if (step.log) log(step.log, step.logCls || (step.who === 'ai' ? 'bad' : ''));
    if (step.fx) fx(step.fx);
    if (step.leak) addLeak(step.leak);
    if (step.trust) addTrust(step.trust);
    if (step.stopLeak) {
      state.stopped = true;
      toast('流出の拡大を停止', 'good');
      renderHud();
    }
  }

  /* ============================================================
   * 画面パーツ
   * ============================================================ */
  function feedback(ok, lines) {
    const f = h('div', 'fb ' + (ok ? 'ok' : 'ng'));
    f.append(h('p', null, ok ? '正解！' : '惜しい…'));
    lines.forEach((l) => f.append(h('p', 'why', l)));
    return f;
  }

  function mountOptions(parent, options, cb) {
    const wrap = h('div', 'options');
    const btns = options.map((o, i) => {
      const b = h('button', 'opt');
      b.type = 'button';
      b.append(h('span', null, fmt(o.text)));
      b.addEventListener('click', () => {
        btns.forEach((x) => { x.disabled = true; });
        const good = options.findIndex((x) => x.ok);
        btns[good].classList.add('correct');
        if (!o.ok) b.classList.add('wrong');
        cb(i, o, options[good]);
      });
      wrap.append(b);
      return b;
    });
    parent.append(wrap);
    return btns;
  }

  /* ============================================================
   * ステップ描画
   * ============================================================ */
  const RENDER = {
    say(step) {
      const w = WHO[step.who];
      const go = once(next);
      const d = h('div', 'dialog ' + w.c);
      if (w.p) d.append(h('div', 'portrait', w.p));
      const body = h('div');
      if (w.n) body.append(h('div', 'dname', w.n));
      body.append(h('p', 'dtext', fmt(step.text)));
      d.append(body);
      d.addEventListener('click', go);
      panel().append(d, btn('次へ', 'btn primary', go));
    },

    learn(step) {
      unlock(step.id);
      const p = PRODUCTS[step.id];
      const c = h('div', 'card unlock');
      c.append(h('p', 'kicker', 'この製品の役割'));
      c.append(h('h2', null, p.role));
      c.append(h('p', 'desc', p.desc));
      c.append(h('p', 'prod', 'IBM製品：' + p.name));
      panel().append(c, btn('次へ', 'btn primary', once(next)));
    },

    choice(step) {
      const p = panel();
      p.append(h('p', 'question', fmt(step.q)));
      if (step.hint) p.append(h('p', 'hint', step.hint));
      mountOptions(p, step.options, (i, o, good) => {
        grade(o.ok);
        p.append(feedback(o.ok, o.ok ? [o.why] : [o.why, '正解：' + good.why]));
        p.append(btn('次へ', 'btn primary', once(next)));
        p.scrollTop = p.scrollHeight;
      });
    },

    pick(step) {
      const p = panel();
      p.append(h('p', 'question', fmt(step.q)));
      p.append(h('p', 'hint', step.n + '個選んでください。' + (step.hint ? '\n' + step.hint : '')));
      const sel = new Set();
      const wrap = h('div', 'options');
      const ok = btn('確定', 'btn primary');
      ok.disabled = true;
      const btns = step.options.map((o, i) => {
        const b = h('button', 'opt');
        b.type = 'button';
        b.append(h('span', null, o.text));
        if (o.sub) b.append(h('small', null, o.sub));
        b.addEventListener('click', () => {
          if (sel.has(i)) sel.delete(i);
          else if (sel.size < step.n) sel.add(i);
          b.classList.toggle('sel', sel.has(i));
          ok.disabled = sel.size !== step.n;
        });
        wrap.append(b);
        return b;
      });
      p.append(wrap, ok);
      ok.addEventListener('click', once(() => {
        ok.remove();
        let good = 0;
        step.options.forEach((o, i) => {
          btns[i].disabled = true;
          btns[i].classList.remove('sel');
          if (o.ok) btns[i].classList.add('correct');
          else if (sel.has(i)) btns[i].classList.add('wrong');
          btns[i].append(h('small', null, o.why));
          if (o.ok && sel.has(i)) good++;
        });
        const bad = step.n - good;
        addScore(good * 70);
        if (bad > 0) { state.wrong++; addTrust(-5 * bad); }
        p.append(feedback(bad === 0, [bad === 0 ? 'リスクに基づいて、優先順位を正しくつけられました。' : good + ' / ' + step.n + ' 個正解。外部公開・悪用済み・業務重要度で見直しましょう。']));
        p.append(btn('次へ', 'btn primary', once(next)));
        p.scrollTop = p.scrollHeight;
      }));
    },

    order(step) {
      const p = panel();
      p.append(h('p', 'question', fmt(step.q)));
      if (step.hint) p.append(h('p', 'hint', step.hint));
      const n = step.items.length;
      const pool = shuffle([...Array(n).keys()]);
      if (pool.every((v, i) => v === i)) pool.reverse();
      const placed = [];
      let done = false;
      const area = h('div');
      p.append(area);

      function draw() {
        area.replaceChildren();
        const slots = h('div', 'slots');
        for (let k = 0; k < n; k++) {
          const s = h('div', 'slot');
          s.append(h('span', 'no', String(k + 1)));
          if (placed[k] !== undefined) {
            const c = h('button', 'chip', step.items[placed[k]]);
            c.type = 'button';
            c.disabled = done;
            if (!done) c.addEventListener('click', () => { placed.splice(k, 1); draw(); });
            s.append(c);
            if (done) s.classList.add(placed[k] === k ? 'ok' : 'ng');
          } else {
            s.append(h('span', 'empty', 'タップして選ぶ'));
          }
          slots.append(s);
        }
        area.append(slots);
        if (!done) {
          area.append(h('p', 'pool-title', '選択肢'));
          const pl = h('div', 'pool');
          pool.filter((v) => !placed.includes(v)).forEach((v) => {
            const c = h('button', 'chip', step.items[v]);
            c.type = 'button';
            c.addEventListener('click', () => { placed.push(v); draw(); });
            pl.append(c);
          });
          area.append(pl);
          const ok = btn('この順で確定', 'btn primary', once(() => {
            done = true;
            const good = placed.every((v, k) => v === k);
            grade(good);
            draw();
            const lines = [step.why];
            if (!good) lines.push('正しい順：\n' + step.items.map((s, i) => (i + 1) + '. ' + s).join('\n'));
            const fb = feedback(good, lines);
            fb.querySelectorAll('.why').forEach((e) => { e.style.whiteSpace = 'pre-wrap'; });
            p.append(fb, btn('次へ', 'btn primary', once(next)));
            p.scrollTop = p.scrollHeight;
          }));
          ok.disabled = placed.length !== n;
          area.append(ok);
        }
      }
      draw();
    },

    battle(step) {
      const p = panel();
      let hp = 100;
      let ti = 0;
      const boss = h('div', 'boss');
      const nm = h('div', 'nm');
      nm.append(h('span', null, step.boss), h('span', null, step.label + ' ' + hp + '%'));
      const bar = h('div', 'hpbar');
      const fill = h('i');
      bar.append(fill);
      boss.append(nm, bar);
      p.append(boss);
      const area = h('div');
      p.append(area);

      function setHp() {
        fill.style.width = hp + '%';
        nm.lastChild.textContent = step.label + ' ' + hp + '%';
      }
      function turn() {
        area.replaceChildren();
        const t = step.turns[ti];
        area.append(h('p', 'hint', 'TURN ' + (ti + 1) + ' / ' + step.turns.length));
        area.append(h('p', 'atk', fmt(t.ai)));
        if (t.log) log(t.log, 'bad');
        if (t.fx) fx(t.fx);
        area.append(h('p', 'question', 'どう対応する？'));
        mountOptions(area, t.options, (i, o, good) => {
          grade(o.ok);
          if (o.ok) {
            hp = Math.max(0, hp - step.dmg);
            setHp();
            if (o.unlock) unlock(o.unlock);
          }
          if (t.leak) addLeak(o.ok ? t.leak[0] : t.leak[1]);
          area.append(feedback(o.ok, o.ok ? [o.why] : [o.why, '正解：' + good.why]));
          const last = ti === step.turns.length - 1;
          area.append(btn(last ? '次へ' : '次のターン', 'btn primary', once(() => {
            if (last) next();
            else { ti++; turn(); p.scrollTop = 0; }
          })));
          p.scrollTop = p.scrollHeight;
        });
      }
      setHp();
      turn();
    }
  };

  /* ============================================================
   * オーバーレイ（タイトル / 図鑑 / ゲームオーバー）
   * ============================================================ */
  let overlayKind = null;
  function openOverlay(kind, build) {
    const ov = $('overlay');
    ov.replaceChildren();
    const sheet = h('div', 'sheet');
    build(sheet);
    ov.append(sheet);
    ov.classList.remove('hidden');
    overlayKind = kind;
  }
  function closeOverlay() {
    $('overlay').classList.add('hidden');
    overlayKind = null;
  }

  function showTitle() {
    resetState('リーダー');
    renderHud();
    setPhase('attack');
    $('term').replaceChildren();
    $('place').textContent = '';
    $('clock').textContent = '';
    $('stageName').textContent = '';
    clearPanel();
    openOverlay('title', (s) => {
      s.append(h('p', 'logo', 'INCIDENT ZERO HOUR'));
      s.append(h('h1', null, 'インシデント・ゼロアワー'));
      s.append(h('p', 'lead', 'あなたは「IBM銀行」の事故対応リーダー。\n攻撃側のAIが、システムの弱点を突いてくる。\n攻撃を受け、原因を突き止め、IBM製品で解決しよう。'));
      const flow = h('div', 'flow');
      flow.append(h('span', 'a', '攻撃'), h('span', 'd', '特定'), h('span', 'r', '解決'));
      s.append(flow);
      const box = h('div');
      const lb = h('label', null, 'あなたの名前');
      lb.htmlFor = 'nameInput';
      const input = h('input');
      input.type = 'text';
      input.id = 'nameInput';
      input.maxLength = 12;
      input.placeholder = 'リーダー';
      input.autocomplete = 'off';
      box.append(lb, input);
      s.append(box);
      const start = once(() => {
        resetState(input.value.trim() || 'リーダー');
        renderHud();
        closeOverlay();
        startStage(0);
      });
      input.addEventListener('keydown', (e) => { if (e.key === 'Enter') start(); });
      s.append(btn('ゲーム開始', 'btn primary', start));
      s.append(h('p', 'note', '全5ステージ / 約5分。スマホ・PCどちらでも遊べます。\nIBM銀行はゲーム上の架空の銀行です。攻撃AIや数値も架空で、実在の攻撃手順は含まれません。'));
    });
  }

  function openCodex() {
    if (overlayKind) return;
    openOverlay('codex', (s) => {
      s.append(h('h1', null, 'IBM製品図鑑'));
      s.append(h('p', 'note', 'ゲーム中に登場したIBM製品が登録されます。（' + state.codex.length + '/' + CODEX_ORDER.length + '）'));
      const list = h('div', 'codex-list');
      CODEX_ORDER.forEach((id) => {
        const has = state.codex.includes(id);
        const it = h('div', 'codex-item' + (has ? '' : ' locked'));
        if (has) {
          it.append(h('b', null, PRODUCTS[id].role), h('p', null, PRODUCTS[id].desc), h('span', 'role', PRODUCTS[id].name));
        } else {
          it.append(h('b', null, '？？？'), h('p', null, 'まだ出会っていないIBM製品です。'));
        }
        list.append(it);
      });
      s.append(list, btn('閉じる', 'btn', closeOverlay));
    });
  }

  function gameOver() {
    openOverlay('over', (s) => {
      s.append(h('p', 'logo', 'GAME OVER'));
      s.append(h('h1', null, '銀行の信頼を失った…'));
      s.append(h('p', 'lead', '判断の誤りが重なり、顧客の信頼を取り戻せなくなりました。\nこのステージの最初から、もう一度挑戦できます。'));
      s.append(btn('このステージからやり直す', 'btn primary', () => {
        const sn = state.snap;
        Object.assign(state, sn, { codex: sn.codex.slice(), trust: Math.max(sn.trust, 50) });
        renderHud();
        closeOverlay();
        startStage(state.si);
      }));
      s.append(btn('最初から', 'btn ghost', showTitle));
    });
  }

  /* ============================================================
   * エンディング
   * ============================================================ */
  function renderEnd() {
    setPhase('resolve');
    $('stageName').textContent = 'CLEAR';
    log(['[SOC] incident closed. thank you, ' + state.name + '.'], 'good');
    const w = state.wrong;
    const rank = w === 0 ? 'S' : w <= 2 ? 'A' : w <= 5 ? 'B' : 'C';
    const title = { S: '伝説の指揮官', A: '頼れるリーダー', B: '一人前の対応担当', C: '要訓練……だが夜は明けた' }[rank];

    const p = clearPanelAndGet();
    const r = h('div', 'rank');
    r.append(h('div', 'r', rank), h('div', 't', state.name + '：' + title));
    const kv = h('div', 'kv');
    [['銀行の信頼', state.trust], ['流出件数', state.leak.toLocaleString('ja-JP')], ['図鑑', state.codex.length + '/' + CODEX_ORDER.length]].forEach(([k, v]) => {
      const d = h('div', null, k);
      d.append(h('b', null, String(v)));
      kv.append(d);
    });
    r.append(kv);
    p.append(r);

    p.append(h('p', 'section-title', '今回の学び'));
    const ul = h('ul', 'learn');
    [
      '攻撃：古いシステムと、使い回した合鍵が入口になる。AIは弱点を探すのが速い。',
      '特定：Instanaで「いつもと違う」に気づき、QRadarで攻撃の流れをつなげ、入口の弱点を調べる。',
      '解決：Concertで直す順番を決め、Vaultで漏れた鍵を止めて、使い捨ての鍵に切り替える。',
      '守りを重ねる：API Connectで入口、Security Verify Accessで本人確認、Storage Protectでデータ復旧を備える。'
    ].forEach((t) => ul.append(h('li', null, t)));
    p.append(ul);

    p.append(h('p', 'section-title', '登場したIBM製品'));
    const pl = h('div', 'product-list');
    state.codex.forEach((id) => {
      const d = h('div');
      d.append(h('b', null, PRODUCTS[id].name), document.createTextNode('：' + PRODUCTS[id].role));
      pl.append(d);
    });
    p.append(pl);
    p.append(h('p', 'hint', '製品の最新の機能や構成は、IBMの公式ドキュメントでご確認ください。'));
    p.append(btn('図鑑を見る', 'btn', openCodex), btn('もう一度遊ぶ', 'btn primary', showTitle));
  }
  function clearPanelAndGet() { clearPanel(); return panel(); }

  /* ============================================================
   * 起動
   * ============================================================ */
  $('codexBtn').addEventListener('click', openCodex);
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && overlayKind === 'codex') closeOverlay();
  });
  showTitle();
})();
