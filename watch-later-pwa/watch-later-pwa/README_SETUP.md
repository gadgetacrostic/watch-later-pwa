# Watch Later Adder PWA - セットアップ手順

## 全体の流れ
1. GitHubでホスティング（無料）
2. Google OAuthの設定（Web用を追加）
3. AndroidにPWAをインストール

---

## STEP 1: GitHubアカウントを作る

1. https://github.com を開く
2. 「Sign up」をクリック
3. メールアドレス・パスワード・ユーザー名を設定
4. 無料プランで進む

---

## STEP 2: 新しいリポジトリを作る

1. ログイン後、右上の「+」→「New repository」
2. Repository name に「watch-later-pwa」と入力
3. 「Public」を選択（GitHub Pagesに必要）
4. 「Create repository」をクリック

---

## STEP 3: ファイルをアップロードする

1. 作成したリポジトリのページで「uploading an existing file」をクリック
2. このZIPを解凍したファイルを全部ドラッグ＆ドロップ
   （iconsフォルダの中身も忘れずに！）
3. 「Commit changes」をクリック

---

## STEP 4: GitHub Pagesを有効にする

1. リポジトリの「Settings」タブ
2. 左メニュー「Pages」
3. Source を「Deploy from a branch」に設定
4. Branch を「main」、フォルダを「/(root)」に設定
5. 「Save」をクリック
6. 数分後に「https://あなたのID.github.io/watch-later-pwa」が表示される！

---

## STEP 5: Google OAuthにWebアプリを追加

1. https://console.cloud.google.com を開く
2. 以前作ったプロジェクトを選択
3. 「APIとサービス」→「認証情報」
4. 「認証情報を作成」→「OAuthクライアントID」
5. アプリケーションの種類：「ウェブアプリケーション」
6. 名前：「watch-later-pwa」
7. 承認済みのJavaScriptの生成元に追加：
   「https://あなたのID.github.io」
8. 承認済みのリダイレクトURIに追加：
   「https://あなたのID.github.io/watch-later-pwa/auth-callback.html」
9. 「作成」→クライアントIDをコピー

---

## STEP 6: app.jsにクライアントIDを設定

1. GitHubのリポジトリで「app.js」を開く
2. 右上の鉛筆アイコン（Edit）をクリック
3. 1行目の「YOUR_CLIENT_ID...」を取得したクライアントIDに書き換え
4. 「Commit changes」で保存

---

## STEP 7: AndroidにPWAをインストール

1. Androidで「https://あなたのID.github.io/watch-later-pwa」を開く
2. ブラウザのメニュー（⋮）→「ホーム画面に追加」
3. 「追加」をタップ
4. ホーム画面にアイコンが追加される！

---

## 使い方

1. Androidのブラウザで好きなページを開く
2. 共有ボタン（↑）をタップ
3. 「Watch Later Adder」をタップ
4. 初回はGoogleログインが必要
5. 自動で動画を検出して追加！
