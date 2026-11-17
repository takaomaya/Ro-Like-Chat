// ==========================================
// ステージ全体の基本設定とオブジェクト配置
// ==========================================

// 1. 主人公の初期設定（名前・アバター画像・開始座標）
p.name = 'ふみか';
p.setImage('human.png'); // image/ フォルダ内の画像ファイル名を指定
p.setAdmin(true); // イベント管理者権限を付与（falseにするとプルダウンが消えます）
p.setGM(false);    // GM権限を付与
p.x = 8;
p.y = 8;
p.tx = 8;
p.ty = 8;

// 2. マップの広さ（横マス数, 縦マス数, 奥壁のテクスチャ画像, 奥壁の高さ(96), スカイドーム表示フラグ(boolean), 床を地平線まで伸ばすフラグ(boolean)）
var gameMap = new FieldMap(20, 20, 'green.png', 96, true, true)
  .setFloorColorA('#5c9449')
  .setFloorColorB('#528740')
  .setOuterFloorColor('#4b7c3b') // マップ境界から先の色を単色で指定
  .setSkyDomeEncloseCamera(true);
gameMap.sayRange = 5; // 5マスまで聞こえるように変更（0にするとマップ全域に届く）

// 地平線までを描画するかどうか
// gameMap.setOuterFloorColor('#e6c27a');	// 砂漠の真ん中にあるオアシス風にする場合：
// gameMap.setOuterFloorColor('#1d4ed8');	// 海に浮かぶ島風にする場合：
// 後からON/OFFを切り替える場合：
// gameMap.setExtendFloorToHorizon(false);

// スカイドームのは空の青 #4aa8ff
// 夕方・夜などに空の色を変えたい場合：
// gameMap.setSkyDomeColor('#4aa8ff'); // 空の青(デフォルト色)
// gameMap.setSkyDomeColor('#f97316'); // 夕焼け色
// gameMap.setSkyDomeColor('#1e1b4b'); // 夜空色

// 表示・非表示を切り替えたい場合：
// gameMap.setSkyDomeVisible(false);






// 3. 障害物・LongWallの配置（メソッド呼び出しで動的に追加可能）
// 第1引数に固有のID（キー）を指定して登録（obstacles.delete('wall_1') で個別削除可能）
obstacles.clear();
// addLongWall(ID, x, y, 上面画像, 手前側面画像, 背後ボード画像, 前面右側正方形画像, 向き)
obstacles.addLongWall('wall_1', 5.5, 5.5, 'white.png', 'blue.png', 'green.png', 'black.png', 0)
         .setModalContent('案内掲示板', '<strong>ようこそ広場へ！</strong><br><span style="color:#d97706;">※Shift+クリックでポリンを追尾できます。</span><br><br><br><br><br><br><br><br><br><br><br><br><br><br><br><br><br><br><br><br><br><br><br><br><br><br><br><br><br><br>');

obstacles.addLongWall('wall_2', 14.5, 10.5, 'white.png', 'blue.png', 'white.png', 'green.png', 1)
		 .setModalContent('ショップカウンター', 'ポーション：<b>50 Zeny</b><br><button onclick="p.say(\'ポーションください！\')">注文する</button>');

obstacles.add('box_1', 11.0, 15.0, 1, 1, 'red.png');



// 4. ポリン（NPC/モブ）の配置（削除時のキーとなる任意のキー, x, y, 待機時間, image/内の画像名, 名前）
// 4. ポリン（NPC/モブ）の配置（第1引数にnullを渡すとポリンの名前が自動でタイトルになります）
mobs.clear();
mobs.add('poring_1', 3, 3, 10, 'player.png', 'みかん')
    .setModalContent(null, 'ぷるぷる！一番元気なポリン。<br><b>好きなもの：</b>甘いリンゴ<br><button onclick="mobs.emotion(\'poring_1\', \'3\'); mobs.say(\'poring_1\', \'わーい！\', 180);">なでる</button>');

mobs.add('poring_2', 12, 4, 30, 'player.png', 'さらみ')
    .setModalContent(null, 'ちょっとおっとりした性格。<br>よく昼寝をしています。<br><button onclick="mobs.emotion(\'poring_2\', \'8\');">そっとしておく</button>');

mobs.add('poring_3', 4, 12, 50, 'player.png', 'グングニル')
    .setModalContent(null, '名前だけはとっても強そう！<br>でも中身は普通のポリンです。');

mobs.add('poring_4', 11, 11, 70, 'player.png', 'ちくわ')
    .setModalContent(null, '真ん中に穴は開いていません。<br>広場の中央付近がお気に入り。');

mobs.add('poring_5', 8, 2, 90, 'player.png', 'ぽち')
    .setModalContent(null, 'ワン！……ではなく「ぷるっ」と鳴きます。');

mobs.add('poring_6', 8, 2, 90, 'player.png', 'たま')
    .setModalContent(null, '丸くてつやつやしたボディが自慢！');

mobs.add('poring_7', 8, 2, 90, 'player.png', 'かまぼこ')
    .setModalContent(null, 'きれいなピンク色をしたポリンです。');

mobs.add('poring_8', 8, 2, 90, 'player.png', 'さくら')
    .setModalContent(null, '春が大好き！<br><button onclick="mobs.emotion(\'poring_8\', \'9\');">一緒に歌う</button>');

mobs.add('poring_9', 8, 2, 90, 'player.png', 'あつあげ')
    .setModalContent(null, 'ぽかぽか日向ぼっこ中。');

mobs.add('poring_A', 13, 8, 110, 'player.png', 'ぽりたん')
    .setModalContent(null, '広場の案内係見習い！<br>ダブルクリックすると後ろをついていけるよ。');


// 5. サンプル：ID指定の吹き出しとエモーション
mobs.say('poring_1', 'こんにちわ', 180);
mobs.emotion('poring_1', '3'); // ハート(♥)を表示

gameMap.say('イベント終了まであと10分です！ログアウトの準備は大丈夫でしょうか？準備完了次第ご退場ください。');

setInterval(function() {
  mobs.say('poring_1', 'こんにちわ', 180);
  mobs.emotion('poring_1', '1'); // 定期的にハート(♥)を出す

  mobs.emotion('poring_2', '3'); // 定期的にハート(♥)を出す

  gameMap.say('【緊急】まもなく臨時メンテナンスを開始します', 300);
  
}, 10000);

setInterval(function() {
  gameMap.say('ご来場ありがとうございます！', 300, '運営スタッフ');
}, 15000);

/*
setInterval(function() {
	gameMap.setMaintenanceMode(true, '新マップの追加作業を行っています。<br>終了予定：22:00');
}, 15000);

setInterval(function() {
	gameMap.setMaintenanceMode(false);
}, 20000);
*/