// =====================================================

//  Watch Later Adder PWA - app.js

// =====================================================


// ★ここにGoogle Cloud で取得したWebアプリ用クライアントIDを入れてね

const CLIENT_ID = '955002636085-qugjjokvreomao7ti0tftd7vb4q7v3ac.apps.googleusercontent.com';


const CUSTOM_PLAYLIST_NAME = '後で見る';

const YT_REGEX = /(?:(?:www\.)?youtube(?:-nocookie)?\.com\/(?:watch\?(?:[^"'\s]*&)?v=|embed\/|shorts\/|v\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/g;

const REDIRECT_URI = location.origin + '/watch-later-pwa/';


// =====================================================

//  DOM要素の取得

// =====================================================

const loginSection     = document.getElementById('loginSection');

const loginBtn         = document.getElementById('loginBtn');

const mainSection      = document.getElementById('mainSection');

const mainCardTitle    = document.getElementById('mainCardTitle');

const statusArea       = document.getElementById('statusArea');

const urlPreview       = document.getElementById('urlPreview');

const videoListSection = document.getElementById('videoListSection');

const videoList        = document.getElementById('videoList');

const checkedCountEl   = document.getElementById('checkedCount');

const selectAllBtn     = document.getElementById('selectAllBtn');

const deselectAllBtn   = document.getElementById('deselectAllBtn');

const addBtn           = document.getElementById('addBtn');

const resultMsg        = document.getElementById('resultMsg');

const actionSection    = document.getElementById('actionSection');

const playlistLink     = document.getElementById('playlistLink');


let accessToken = null;

let videos = [];

let playlistId = null;


// =====================================================

//  Service Worker 登録

// =====================================================

if ('serviceWorker' in navigator) {

  navigator.serviceWorker.register('/watch-later-pwa/sw.js');

}


// =====================================================

//  ステータス表示ヘルパー

// =====================================================

function setStatus(icon, text, type = '') {

  statusArea.innerHTML = `

    <div class="status-icon">${icon}</div>

    <div class="status-text ${type}">${text}</div>

  `;

}


// =====================================================

//  YouTube動画ID抽出

// =====================================================

function extractVideoIds(text) {

  const ids = new Set();

  YT_REGEX.lastIndex = 0;

  let match;

  while ((match = YT_REGEX.exec(text)) !== null) {

    ids.add(match[1]);

  }

  return [...ids];

}


// =====================================================

//  Google OAuth - リダイレクト方式

//  同じウィンドウでGoogle認証画面に飛んで戻ってくる

// =====================================================

function loginWithGoogle() {

  // 認証前に共有URLをsessionStorageに退避しておく

  const sharedUrl = getSharedUrl();

  if (sharedUrl) sessionStorage.setItem('pending_url', sharedUrl);


  const params = new URLSearchParams({

    client_id: CLIENT_ID,

    redirect_uri: REDIRECT_URI,

    response_type: 'token',

    scope: 'https://www.googleapis.com/auth/youtube',

    include_granted_scopes: 'true'

  });

  // 同じウィンドウでGoogleの認証画面に遷移する

  location.href = 'https://accounts.google.com/o/oauth2/v2/auth?' + params.toString();

}


// =====================================================

//  認証後のリダイレクトからトークンを取得する

//  GoogleはトークンをURLの # の後ろに付けて戻してくれる

// =====================================================

function getTokenFromRedirect() {

  const hash = new URLSearchParams(location.hash.slice(1));

  const token = hash.get('access_token');

  if (token) {

    sessionStorage.setItem('access_token', token);

    // URLのハッシュを消してスッキリさせる

    history.replaceState(null, '', location.pathname + location.search);

  }

  return token;

}


// =====================================================

//  共有URLをURLパラメータから取得する

// =====================================================

function getSharedUrl() {

  const params = new URLSearchParams(location.search);

  return params.get('url') || params.get('text') || null;

}


// =====================================================

//  ログイン済みの処理

// =====================================================

async function onLoggedIn() {

  loginSection.style.display = 'none';

  mainSection.style.display = 'block';


  // 再生リストIDを取得・キャッシュ

  if (!playlistId) {

    playlistId = await getOrCreatePlaylistId();

    if (playlistId) {

      playlistLink.href = `https://www.youtube.com/playlist?list=${playlistId}`;

      actionSection.style.display = 'block';

    }

  }


  // 共有URLを処理（認証前に退避したものも復元）

  const sharedUrl = getSharedUrl() || sessionStorage.getItem('pending_url');

  sessionStorage.removeItem('pending_url');


  if (sharedUrl) {

    processUrl(sharedUrl);

  } else {

    setStatus('📱', 'ブラウザの「共有」からURLを送ってね！');

  }

}


// =====================================================

//  URLを解析してYouTube動画IDを抽出する

// =====================================================

async function processUrl(url) {

  mainCardTitle.textContent = '📺 ページを解析中...';

  urlPreview.style.display = 'block';

  urlPreview.textContent = url;

  setStatus('🔍', 'YouTube動画を検索中...', 'loading');


  try {

    const res = await fetch(url, { mode: 'cors' });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const html = await res.text();

    const ids = extractVideoIds(html);

    handleFoundVideos(ids);

  } catch (e) {

    // CORS失敗 → URLそのものが動画URLかチェック

    const directIds = extractVideoIds(url);

    if (directIds.length > 0) {

      handleFoundVideos(directIds);

    } else {

      setStatus('😢',

        'ページの取得に失敗したよ。<br>このサイトはCORS制限があるかも。<br>直接YouTubeのURLを共有してみてね！',

        'error'

      );

    }

  }

}


// =====================================================

//  見つかった動画IDの処理

// =====================================================

async function handleFoundVideos(ids) {

  if (ids.length === 0) {

    mainCardTitle.textContent = '📺 結果';

    setStatus('😢', 'YouTube動画が見つかりませんでした', 'error');

    return;

  }


  if (ids.length === 1) {

    // 1本なら即追加

    mainCardTitle.textContent = '📺 追加中...';

    setStatus('📡', '追加中...', 'loading');

    const ok = await addToWatchLater(ids[0]);

    if (ok) {

      mainCardTitle.textContent = '✅ 完了！';

      setStatus('✅', '1本を「後で見る」に追加したよ！', 'success');

    } else {

      setStatus('❌', '追加に失敗しました', 'error');

    }

    return;

  }


  // 2本以上 → タイトル取得して選択UIへ

  mainCardTitle.textContent = `📺 ${ids.length}本の動画が見つかったよ！`;

  setStatus('📋', 'タイトルを取得中...', 'loading');


  const titles = await fetchVideoTitles(ids);

  videos = ids.map(id => ({ id, title: titles[id] || id }));


  mainSection.style.display = 'none';

  videoListSection.style.display = 'block';

  renderVideoList();

}


// =====================================================

//  動画リストの描画

// =====================================================

function renderVideoList() {

  videoList.innerHTML = '';

  videos.forEach((video, index) => {

    const item = document.createElement('div');

    item.className = 'video-item';

    item.dataset.index = index;

    item.innerHTML = `

      <input type="checkbox" id="chk_${index}" checked />

      <div class="video-thumb">

        <img src="https://img.youtube.com/vi/${video.id}/mqdefault.jpg" loading="lazy" />

      </div>

      <div class="video-info">

        <div class="video-title">${escapeHtml(video.title)}</div>

        <div class="video-id">${video.id}</div>

      </div>

    `;

    const cb = item.querySelector('input');

    cb.addEventListener('change', updateCount);

    item.addEventListener('click', (e) => {

      if (e.target !== cb) { cb.checked = !cb.checked; updateCount(); }

    });

    videoList.appendChild(item);

  });

  updateCount();

}


function escapeHtml(t) {

  return t.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');

}


function updateCount() {

  const n = videoList.querySelectorAll('input:checked').length;

  checkedCountEl.textContent = n;

  addBtn.disabled = n === 0;

}


selectAllBtn.addEventListener('click', () => {

  videoList.querySelectorAll('input').forEach(cb => cb.checked = true);

  updateCount();

});

deselectAllBtn.addEventListener('click', () => {

  videoList.querySelectorAll('input').forEach(cb => cb.checked = false);

  updateCount();

});


addBtn.addEventListener('click', async () => {

  addBtn.disabled = true;

  const selected = [];

  videoList.querySelectorAll('input:checked').forEach(cb => {

    const idx = parseInt(cb.closest('.video-item').dataset.index);

    selected.push(videos[idx].id);

  });


  resultMsg.className = 'result-msg';

  let success = 0;

  for (const id of selected) {

    if (await addToWatchLater(id)) success++;

  }


  resultMsg.textContent = `✅ ${success}本を「後で見る」に追加したよ！`;

  resultMsg.className = 'result-msg success';

});


// =====================================================

//  YouTube API: 再生リスト取得 / 作成

// =====================================================

async function getOrCreatePlaylistId() {

  const cached = sessionStorage.getItem('playlist_id');

  if (cached) return cached;


  try {

    const res = await fetch(

      'https://www.googleapis.com/youtube/v3/playlists?part=snippet&mine=true&maxResults=50',

      { headers: { Authorization: `Bearer ${accessToken}` } }

    );

    const data = await res.json();

    const found = data.items?.find(p => p.snippet.title === CUSTOM_PLAYLIST_NAME);

    if (found) {

      sessionStorage.setItem('playlist_id', found.id);

      return found.id;

    }

  } catch (e) { console.warn('[WLA] リスト検索失敗:', e); }


  try {

    const res = await fetch(

      'https://www.googleapis.com/youtube/v3/playlists?part=snippet,status',

      {

        method: 'POST',

        headers: {

          Authorization: `Bearer ${accessToken}`,

          'Content-Type': 'application/json'

        },

        body: JSON.stringify({

          snippet: { title: CUSTOM_PLAYLIST_NAME, description: 'Watch Later Adder PWAが自動作成' },

          status: { privacyStatus: 'private' }

        })

      }

    );

    const data = await res.json();

    sessionStorage.setItem('playlist_id', data.id);

    return data.id;

  } catch (e) {

    console.error('[WLA] リスト作成失敗:', e);

    return null;

  }

}


// =====================================================

//  YouTube API: 動画を再生リストに追加

// =====================================================

async function addToWatchLater(videoId) {

  if (!playlistId) playlistId = await getOrCreatePlaylistId();

  try {

    const res = await fetch(

      'https://www.googleapis.com/youtube/v3/playlistItems?part=snippet',

      {

        method: 'POST',

        headers: {

          Authorization: `Bearer ${accessToken}`,

          'Content-Type': 'application/json'

        },

        body: JSON.stringify({

          snippet: {

            playlistId,

            resourceId: { kind: 'youtube#video', videoId }

          }

        })

      }

    );

    return res.ok;

  } catch (e) {

    console.error('[WLA] 追加失敗:', e);

    return false;

  }

}


// =====================================================

//  YouTube API: 動画タイトル一括取得

// =====================================================

async function fetchVideoTitles(ids) {

  const result = {};

  const chunks = [];

  for (let i = 0; i < ids.length; i += 50) chunks.push(ids.slice(i, i + 50));

  for (const chunk of chunks) {

    try {

      const res = await fetch(

        `https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${chunk.join(',')}`,

        { headers: { Authorization: `Bearer ${accessToken}` } }

      );

      const data = await res.json();

      for (const item of data.items || []) {

        result[item.id] = item.snippet?.title || item.id;

      }

    } catch (e) { console.warn('[WLA] タイトル取得失敗:', e); }

  }

  return result;

}


// =====================================================

//  起動処理

// =====================================================

(async () => {

  // まずリダイレクトで戻ってきた場合のトークンを確認

  const redirectToken = getTokenFromRedirect();

  if (redirectToken) accessToken = redirectToken;


  // セッションストレージのトークンも確認

  if (!accessToken) {

    accessToken = sessionStorage.getItem('access_token');

  }


  if (accessToken) {

    await onLoggedIn();

  } else {

    // 共有URLがあれば先に表示しておく

    const sharedUrl = getSharedUrl();

    if (sharedUrl) {

      mainSection.style.display = 'block';

      setStatus('🔑', 'まずGoogleアカウントでログインが必要だよ！', 'loading');

    }

    loginSection.style.display = 'block';

  }

})();


loginBtn.addEventListener('click', loginWithGoogle);


