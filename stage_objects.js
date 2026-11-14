// ==========================================
// マップ上の障害物・LongWallの配置リスト
// dir: 0=北手前･南後ろ / 1=東手前･西後ろ / 2=南手前･北後ろ / 3=西手前･東後ろ
// ==========================================
var obstacles = new Array(
  new LongWall(5.5, 5.5, 'blue.png', 'green.png', 'white.png', 'black.png', 0),
  new LongWall(14.5, 10.5, 'blue.png', 'green.png', 'black.png', 'white.png', 1),
  new Obstacle(11.0, 15.0, 1, 1, 'red.png')
);