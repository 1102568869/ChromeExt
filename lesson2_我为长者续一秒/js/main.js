(function(){

var TEXT_LOADING = 'Loading...\n\n历史的行程: %s %';
var TEXT_SCORE = '+ %s s';
var TEXT_GAME_OVER = '我为长者续命%s秒\n志己的生命减少%s秒\n而且这个效率efficiency: %s%';
var TEXT_TRY_AGAIN = '重新续';
var TEXT_PLAY_BGM = '请州长夫人演唱';
var TEXT_TIME_ELAPSED = '- %s s';
var TEXT_TOTAL_TIME_ELAPSED = '累计被续 %s 秒';
var TEXT_TINY_TIPS = '[狂魔的提示]\n为了获得坠好的游戏体验，请：\n打开音量\n穿上红色的衣服\n如果在手机上\n点击屏幕无任何反应,\n请尝试使用电脑打开游戏画面';
var TEXT_FONT = '"Segoe UI", "Microsoft YaHei", 宋体, sans-serif'; // 插入宋体

var _gravity = 40,
  _speed = 390,
  _flap = 620,
  _spawnRate = 1 / 1.2,
  _opening = 260;

var _game;

var _baseUrl = '';

var _flapSound;

var _numScoreSounds = 10,
  _numHurtSounds = 9;

var _scoreSounds = [],
  _hurtSounds = [];

var _currentScoreSound;

var _bgColor = 0xDDEEFF,
  _background;

var _pipes,
  _pipeInvisibleLines,
  _pipesTimer;

var _frog;

var _ground;

var _clouds,
  _cloudsTimer;

var _gameOver = false,
  _gameStarted = false;

var _score = 0;

var _scoreText,
  _gameOverText,
  _tryAgainText,
  _tryAgainSprite,
  _playBgmText,
  _playBgmSprite;

var _bgm,
  _playBgm = false;

var _bgmKeyCode = [
  Phaser.Keyboard.ZERO,
  Phaser.Keyboard.NUMPAD_0
];

var _flapKeyCode = [
  Phaser.Keyboard.E,
  Phaser.Keyboard.SPACEBAR
];

var _feedbackKeyCode = [
  Phaser.Keyboard.FIVE,
  Phaser.Keyboard.NUMPAD_5
];

var _feedback,
  _feedbackFunc,
  _feedbackText,
  _feedbackSprite;

var _loadingText,
  _tinyTipsText;

var _timeElapsedText,
  _startTime,
  _timeElapsed;

var _totalTimeElapsedText,
  _totalTimeElapsed = 0;

var _debug = false;

function showLoadingText(percent) {
  _loadingText.setText(TEXT_LOADING.replace('%s', percent));
}

function initLoadingText() {
  _tinyTipsText = _game.add.text(
    _game.world.width / 2,
    _game.world.height / 4,
    TEXT_TINY_TIPS,
    {
      font: '16px ' + TEXT_FONT,
      fill: '#fff',
      align: 'center'
    }
  );
  _tinyTipsText.anchor.setTo(0.5, 0.5);

  _loadingText = _game.add.text(
    _game.world.width / 2,
    _game.world.height / 2,
    '',
    {
      font: '24px ' + TEXT_FONT,
      fill: '#f00',
      align: 'center'
    }
  );
  _loadingText.anchor.setTo(0.5, 0.5);
  showLoadingText(0);
}

function loadAudio(key, path) {
  _game.load.audio(key, [path + '.ogg', path + '.mp3']);
}

function preload() {
  initLoadingText();
  _game.load.onFileComplete.add(showLoadingText);

  _game.load.spritesheet('frog', _baseUrl + 'images/frog.png', 80, 64);
  _game.load.spritesheet('clouds', _baseUrl + 'images/clouds.png', 128, 64);

  _game.load.image('pipe', _baseUrl + 'images/pipe.png');
  _game.load.image('ground', _baseUrl + 'images/ground.png');

  loadAudio('bgm', _baseUrl + 'sounds/bgm');
  loadAudio('flap', _baseUrl + 'sounds/flap');

  var i;
  for (i = 1; i <= _numScoreSounds; i++) {
    loadAudio('score' + i, _baseUrl + 'sounds/score' + i);
  }
  for (i = 1; i <= _numHurtSounds; i++) {
    loadAudio('hurt' + i, _baseUrl + 'sounds/hurt' + i);
  }
}

function o() {
    return _opening + 60 * ((_score > 50 ? 50 : 50 - _score) / 50);
}

function spawnPipe(pipeY, flipped) {
  var pipe = _pipes.create(
    _game.width,
    pipeY + (flipped ? -o() : o()) / 2,
    'pipe'
  );
  pipe.body.allowGravity = false;

  // Flip pipe! *GASP*
  pipe.scale.setTo(2, flipped ? -2 : 2);
  pipe.body.offset.y = flipped ? -pipe.body.height * 2 : 0;

  // Move to the left
  pipe.body.velocity.x = -_speed;

  return pipe;
}

function spawnPipes() {
  _pipesTimer.stop();

  var pipeY = ((_game.height - 16 - o() / 2) / 2) + (Math.random() > 0.5 ? -1 : 1) * Math.random() * _game.height / 6;
  // Bottom pipe
  var pipe = spawnPipe(pipeY);
  // Top pipe (flipped)
  spawnPipe(pipeY, true);

  // Add invisible thingy
  var inv = _pipeInvisibleLines.create(pipe.x + pipe.width, 0);
  inv.width = 2;
  inv.height = _game.world.height;
  inv.body.allowGravity = false;
  inv.body.velocity.x = -_speed;

  _pipesTimer.add(1 / _spawnRate);
  _pipesTimer.start();
}


function initPipes() {
  _pipes = _game.add.group();
  _pipeInvisibleLines = _game.add.group();
}

function resetPipes() {
  _pipes.removeAll();
  _pipeInvisibleLines.removeAll();
}

function startPipes() {
  _pipesTimer = new Phaser.Timer(_game);
  _pipesTimer.onEvent.add(spawnPipes);
  _pipesTimer.add(2);
  _pipesTimer.start();
}

function stopPipes() {
  _pipesTimer.stop();

  _pipes.forEachAlive(function(pipe) {
    pipe.body.velocity.x = 0;
  });

  _pipeInvisibleLines.forEach(function(inv) {
    inv.body.velocity.x = 0;
  });
}

function initBackground() {
  _background = _game.add.graphics(0, 0);
  _background.beginFill(_bgColor, 1);
  _background.drawRect(0, 0, _game.world.width, _game.world.height);
  _background.endFill();
}

function initFrog() {
  _frog = _game.add.sprite(0, 0, 'frog');
  _frog.anchor.setTo(0.5, 0.5);
  _frog.body.collideWorldBounds = true;
  _frog.body.gravity.y = _gravity;
}

function resetFrog() {
  _frog.body.allowGravity = false;
  _frog.angle = 0;
  _frog.scale.setTo(1, 1);
  _frog.reset(_game.world.width / 4, _game.world.height / 2);
}

function initGround() {
  _ground = _game.add.tileSprite(0, _game.world.height - 32, _game.world.width, 32, 'ground');
  _ground.tileScale.setTo(2, 2);
}

function spawnCloud() {
  _cloudsTimer.stop();

  var cloudY = Math.random() * _game.height / 2;
  var cloud = _clouds.create(
    _game.width,
    cloudY,
    'clouds',
    Math.floor(4 * Math.random())
  );
  var cloudScale = 2 + 2 * Math.random();
  cloud.alpha = 2 / cloudScale;
  cloud.scale.setTo(cloudScale, cloudScale);
  cloud.body.allowGravity = false;
  cloud.body.velocity.x = -_speed / cloudScale;
  cloud.anchor.y = 0;

  _cloudsTimer.start();
  _cloudsTimer.add(4 * Math.random());
}

function initClouds() {
  _clouds = _game.add.group();
  _cloudsTimer = new Phaser.Timer(_game);
  _cloudsTimer.onEvent.add(spawnCloud);
  _cloudsTimer.add(Math.random());
  _cloudsTimer.start();
}


function doInitSounds(result, keyPrefix, l) {
  for (var i = 1; i <= l; i++) {
    result.push(_game.add.audio(keyPrefix + i));
  }
}


function initSounds() {
  doInitSounds(_scoreSounds, 'score', _numScoreSounds);
  doInitSounds(_hurtSounds, 'hurt', _numHurtSounds);

  _flapSound = _game.add.audio('flap', 0.5);

  _bgm = _game.add.audio('bgm', 0.5);
  _bgm.onStop.add(function() {
    if (_playBgm)
      _bgm.play();
  });
}

function randomPlaySound(list, count) {
  var sound;
  if (count == 1) {
    sound = list[0];
    sound.play();
  } else if (count > 1) {
    sound = list[Math.floor(Math.random() * count)];
    sound.play();
  }
  return sound;
}

function playScoreSound() {
  _currentScoreSound = randomPlaySound(_scoreSounds, _numScoreSounds);
}

function playHurtSound() {
  if (_currentScoreSound)
    _currentScoreSound.stop();
  randomPlaySound(_hurtSounds, _numHurtSounds);
}

function playFlapSound() {
  if (!_flapSound.isPlaying)
    _flapSound.play();
}

function playBgm() {
  if (_playBgm) {
    _playBgm = false;
    _bgm.stop()
  } else {
    _playBgm = true;
    _bgm.play();
  }
}

function removeOffscreenObjs(objs) {
  objs.forEachAlive(function(obj) {
    if (obj.x + obj.width < _game.world.bounds.left) {
      obj.kill();
    }
  });
}

function updateClouds() {
  removeOffscreenObjs(_clouds);
  _cloudsTimer.update();
}

function updatePipes() {
  removeOffscreenObjs(_pipes);
  _pipesTimer.update();
}

function updateGround() {
  _ground.tilePosition.x -= _game.time.physicsElapsed * _speed / 2;
}

function updateFrog() {
  // Make frog dive
  var dvy = _flap + _frog.body.velocity.y;
  _frog.angle = (90 * dvy / _flap) - 180;
  if (_frog.angle < 0) {
    _frog.angle = 0;
  }

  if (_gameOver) {
    _frog.scale.setTo(1, -1);
    _frog.angle = -20;
  }
}

function updateFrog2() {
  _frog.y = (_game.world.height / 2) + 8 * Math.cos(_game.time.now / 200);
}

function checkCollision() {
  if (_frog.body.bottom >= _game.world.bounds.bottom) {
    setGameOver();
    return;
  }
  if (_game.physics.overlap(_frog, _pipes)) {
    setGameOver();
    return;
  }
  // Add score
  _game.physics.overlap(_frog, _pipeInvisibleLines, addScore);
}

function addScore(_, inv) {
  _pipeInvisibleLines.remove(inv);
  _score += 1;
  showScore();
  playScoreSound();
}

function showScore() {
  _scoreText.setText(TEXT_SCORE.replace('%s', _score));
}

function setGameOver() {
  _gameOver = true;
  stopPipes();
  showGameOver();
  playHurtSound();
}

function showGameOver() {
  _totalTimeElapsed += _timeElapsed;
  _totalTimeElapsedText.setText(TEXT_TOTAL_TIME_ELAPSED.replace('%s', _totalTimeElapsed));
  _totalTimeElapsedText.renderable = true;

  var a = Math.floor(_score / _timeElapsed * 100);
  a = TEXT_GAME_OVER.replace('%s', _score).replace('%s', _timeElapsed).replace('%s', a);
  _gameOverText.setText(a);
  _gameOverText.renderable = true;
  _tryAgainText.renderable = true;
  _tryAgainSprite.events.onInputDown.addOnce(reset);
}

function hideGameOver() {
  _gameOverText.renderable = false;
  _tryAgainText.renderable = false;
}

function createTextSprite(t) {
  var s = _game.add.sprite(t.x, t.y);
  s.anchor.setTo(t.anchor.x, t.anchor.y);
  s.width = t.width;
  s.height = t.height;
  return s;
}

function initFeedback() {
  if (!_feedback)
    return;
  _feedbackText = _game.add.text(
    0,
    0,
    _feedback,
    {
      font: '14px ' + TEXT_FONT,
      fill: '#fff',
      stroke: '#430',
      strokeThickness: 4,
      align: 'center'
    }
  );
  if (!_feedbackFunc)
    return;
  _feedbackSprite = createTextSprite(_feedbackText);
  _feedbackSprite.inputEnabled = true;
  _feedbackSprite.events.onInputDown.add(_feedbackFunc);
}

function initTexts() {
  initFeedback();

  _playBgmText = _game.add.text(
    0,
    0,
    TEXT_PLAY_BGM,
    {
      font: '14px ' + TEXT_FONT,
      fill: '#fff',
      stroke: '#430',
      strokeThickness: 4,
      align: 'center'
    }
  );
  _playBgmText.x = _game.world.width - _playBgmText.width;
  _playBgmSprite = createTextSprite(_playBgmText);
  _playBgmSprite.inputEnabled = true;
  _playBgmSprite.events.onInputDown.add(playBgm);

  _scoreText = _game.add.text(
    _game.world.width / 2,
    _game.world.height / 4,
    '',
    {
      font: '14px ' + TEXT_FONT,
      fill: '#fff',
      stroke: '#430',
      strokeThickness: 4,
      align: 'center'
    }
  );
  _scoreText.anchor.setTo(0.5, 0.5);

  _timeElapsedText = _game.add.text(
    _game.world.width / 2,
    _scoreText.y + _scoreText.height,
    '',
    {
      font: '14px ' + TEXT_FONT,
      fill: '#f00',
      align: 'center'
    }
  );
  _timeElapsedText.anchor.setTo(0.5, 0.5);

  _totalTimeElapsedText = _game.add.text(
    _game.world.width / 2,
    0,
    '',
    {
      font: '14px ' + TEXT_FONT,
      fill: '#f00',
      align: 'center'
    }
  );
  _totalTimeElapsedText.anchor.setTo(0.5, 0);

  _tryAgainText = _game.add.text(
    _game.world.width / 2,
    _game.world.height - _game.world.height / 6,
    TEXT_TRY_AGAIN,
    {
      font: '22px ' + TEXT_FONT,
      fill: '#fff',
      stroke: '#430',
      strokeThickness: 4,
      align: 'center'
    }
  );
  _tryAgainText.anchor.setTo(0.5, 0.5);

  _tryAgainSprite = createTextSprite(_tryAgainText);
  _tryAgainSprite.inputEnabled = true;

  _gameOverText = _game.add.text(
    _game.world.width / 2,
    _game.world.height / 2,
    '',
    {
      font: '18px ' + TEXT_FONT,
      fill: '#fff',
      stroke: '#430',
      strokeThickness: 4,
      align: 'center'
    }
  );
  _gameOverText.anchor.setTo(0.5, 0.5);
}

function start() {
  _totalTimeElapsedText.renderable = false;

  _frog.body.allowGravity = true;
  startPipes();
  _gameStarted = true;

  _startTime = _game.time.now;
}

function flap() {
  if (!_gameStarted) {
    start();
  }
  if (!_gameOver) {
    _frog.body.velocity.y = -_flap;
    playFlapSound();
  }
}

//function checkKeyCode(input, a) {
//  if (!input || !a)
//    return;
//  return input == a[0] || input == a[1];
//}

//function onKeyDown(e) { }

//function onKeyUp(e) {
//  if (checkKeyCode(e.keyCode, _flapKeyCode)) {
//    flap();
//  } else if (checkKeyCode(e.keyCode, _bgmKeyCode)) {
//    playBgm();
//  } else if (_feedbackFunc && checkKeyCode(e.keyCode, _feedbackKeyCode)) {
//    _feedbackFunc();
//  }
//}

function initControls() {
  //_game.input.onDown.add(flap);
  _game.input.onTap.add(flap);
  
  _game.input.touch.onTouchEnd=function(e){
	  //alert( JSON.stringify(e));
	 if(_gameOver){
	  	reset();
	 }else{
		flap();
	 }
	  
	  //flap();
  }
  //_game.input.keyboard.addCallbacks(_game, onKeyDown, onKeyUp);
}


function reset() {
  _timeElapsedText.setText('');

  _score = 0;
  _gameOver = false;
  _gameStarted = false;

  hideGameOver();

  resetFrog();
  resetPipes();

  showScore();
}

function create() {
  _game.stage.scaleMode = Phaser.StageScaleMode.SHOW_ALL;
  _game.stage.scale.setScreenSize(true);

  initBackground();
  initPipes();
  initFrog();
  initGround();
  initTexts();
  initClouds();
  initSounds();
  initControls();

  reset();
}

function setTimeElapsed() {
  var a = Math.floor(_game.time.elapsedSecondsSince(_startTime)) + 1;
  if (_timeElapsed != a) {
    _timeElapsed = a;
    _timeElapsedText.setText(TEXT_TIME_ELAPSED.replace('%s', _timeElapsed));
  }
}

function update() {
  updateClouds();
  if (_gameStarted) {
    updateFrog();
    if (!_gameOver) {
      setTimeElapsed();
      checkCollision();
    }
    updatePipes();
  } else {
    updateFrog2();
  }

  if (!_gameOver) {
    updateGround();
  }
}

function render() {
  if (!_debug)
    return;

  _game.debug.renderSpriteBody(_tryAgainSprite);
  _game.debug.renderSpriteBody(_playBgmSprite);
  _game.debug.renderSpriteBody(_frog);

  _pipes.forEachAlive(function(pipe) {
    _game.debug.renderSpriteBody(pipe);
  });
  _pipeInvisibleLines.forEach(function(inv) {
    _game.debug.renderSpriteBody(inv);
  });

}

function init(options) {
  if (typeof options.debug !== 'undefined')
    _debug = options.debug;

  if (typeof options.gravity !== 'undefined')
    _gravity = options.gravity;

  if (typeof options.speed !== 'undefined')
    _speed = options.speed;

  if (typeof options.flap !== 'undefined')
    _flap = options.flap;

  if (typeof options.spawnRate !== 'undefined')
    _spawnRate = options.spawnRate;

  if (typeof options.opening !== 'undefined')
    _opening = options.opening;

  if (typeof options.flapKeyCode !== 'undefined')
    _flapKeyCode = options.flapKeyCode;

  if (typeof options.numScoreSounds !== 'undefined')
    _numScoreSounds = options.numScoreSounds;

  if (typeof options.numHurtSounds !== 'undefined')
    _numHurtSounds = options.numHurtSounds;

  if (typeof options.baseUrl !== 'undefined')
    _baseUrl = options.baseUrl;

  if (typeof options.feedback !== 'undefined')
    _feedback = options.feedback;

  if (typeof options.feedbackFunc !== 'undefined')
    _feedbackFunc = options.feedbackFunc;

  if (typeof options.bgmKeyCode !== 'undefined')
    _bgmKeyCode = options.bgmKeyCode;

  if (typeof options.feedbackKeyCode !== 'undefined')
    _feedbackKeyCode = options.feedbackKeyCode;

  _game = new Phaser.Game(
    480,
    700,
    Phaser.CANVAS,
    options.parent,
    {
      preload: preload,
      create: create,
      update: update,
      render: render
    },
    false,
    false
  );
}

initGame = init;
})();

var initGame;



//  json2.js
//  2016-10-28
//  Public Domain.
//  NO WARRANTY EXPRESSED OR IMPLIED. USE AT YOUR OWN RISK.
//  See http://www.JSON.org/js.html
//  This code should be minified before deployment.
//  See http://javascript.crockford.com/jsmin.html

//  USE YOUR OWN COPY. IT IS EXTREMELY UNWISE TO LOAD CODE FROM SERVERS YOU DO
//  NOT CONTROL.

//  This file creates a global JSON object containing two methods: stringify
//  and parse. This file provides the ES5 JSON capability to ES3 systems.
//  If a project might run on IE8 or earlier, then this file should be included.
//  This file does nothing on ES5 systems.

//      JSON.stringify(value, replacer, space)
//          value       any JavaScript value, usually an object or array.
//          replacer    an optional parameter that determines how object
//                      values are stringified for objects. It can be a
//                      function or an array of strings.
//          space       an optional parameter that specifies the indentation
//                      of nested structures. If it is omitted, the text will
//                      be packed without extra whitespace. If it is a number,
//                      it will specify the number of spaces to indent at each
//                      level. If it is a string (such as "\t" or "&nbsp;"),
//                      it contains the characters used to indent at each level.
//          This method produces a JSON text from a JavaScript value.
//          When an object value is found, if the object contains a toJSON
//          method, its toJSON method will be called and the result will be
//          stringified. A toJSON method does not serialize: it returns the
//          value represented by the name/value pair that should be serialized,
//          or undefined if nothing should be serialized. The toJSON method
//          will be passed the key associated with the value, and this will be
//          bound to the value.

//          For example, this would serialize Dates as ISO strings.

//              Date.prototype.toJSON = function (key) {
//                  function f(n) {
//                      // Format integers to have at least two digits.
//                      return (n < 10)
//                          ? "0" + n
//                          : n;
//                  }
//                  return this.getUTCFullYear()   + "-" +
//                       f(this.getUTCMonth() + 1) + "-" +
//                       f(this.getUTCDate())      + "T" +
//                       f(this.getUTCHours())     + ":" +
//                       f(this.getUTCMinutes())   + ":" +
//                       f(this.getUTCSeconds())   + "Z";
//              };

//          You can provide an optional replacer method. It will be passed the
//          key and value of each member, with this bound to the containing
//          object. The value that is returned from your method will be
//          serialized. If your method returns undefined, then the member will
//          be excluded from the serialization.

//          If the replacer parameter is an array of strings, then it will be
//          used to select the members to be serialized. It filters the results
//          such that only members with keys listed in the replacer array are
//          stringified.

//          Values that do not have JSON representations, such as undefined or
//          functions, will not be serialized. Such values in objects will be
//          dropped; in arrays they will be replaced with null. You can use
//          a replacer function to replace those with JSON values.

//          JSON.stringify(undefined) returns undefined.

//          The optional space parameter produces a stringification of the
//          value that is filled with line breaks and indentation to make it
//          easier to read.

//          If the space parameter is a non-empty string, then that string will
//          be used for indentation. If the space parameter is a number, then
//          the indentation will be that many spaces.

//          Example:

//          text = JSON.stringify(["e", {pluribus: "unum"}]);
//          // text is '["e",{"pluribus":"unum"}]'

//          text = JSON.stringify(["e", {pluribus: "unum"}], null, "\t");
//          // text is '[\n\t"e",\n\t{\n\t\t"pluribus": "unum"\n\t}\n]'

//          text = JSON.stringify([new Date()], function (key, value) {
//              return this[key] instanceof Date
//                  ? "Date(" + this[key] + ")"
//                  : value;
//          });
//          // text is '["Date(---current time---)"]'

//      JSON.parse(text, reviver)
//          This method parses a JSON text to produce an object or array.
//          It can throw a SyntaxError exception.

//          The optional reviver parameter is a function that can filter and
//          transform the results. It receives each of the keys and values,
//          and its return value is used instead of the original value.
//          If it returns what it received, then the structure is not modified.
//          If it returns undefined then the member is deleted.

//          Example:

//          // Parse the text. Values that look like ISO date strings will
//          // be converted to Date objects.

//          myData = JSON.parse(text, function (key, value) {
//              var a;
//              if (typeof value === "string") {
//                  a =
//   /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2}(?:\.\d*)?)Z$/.exec(value);
//                  if (a) {
//                      return new Date(Date.UTC(+a[1], +a[2] - 1, +a[3], +a[4],
//                          +a[5], +a[6]));
//                  }
//              }
//              return value;
//          });

//          myData = JSON.parse('["Date(09/09/2001)"]', function (key, value) {
//              var d;
//              if (typeof value === "string" &&
//                      value.slice(0, 5) === "Date(" &&
//                      value.slice(-1) === ")") {
//                  d = new Date(value.slice(5, -1));
//                  if (d) {
//                      return d;
//                  }
//              }
//              return value;
//          });

//  This is a reference implementation. You are free to copy, modify, or
//  redistribute.

/*jslint
    eval, for, this
*/

/*property
    JSON, apply, call, charCodeAt, getUTCDate, getUTCFullYear, getUTCHours,
    getUTCMinutes, getUTCMonth, getUTCSeconds, hasOwnProperty, join,
    lastIndex, length, parse, prototype, push, replace, slice, stringify,
    test, toJSON, toString, valueOf
*/


// Create a JSON object only if one does not already exist. We create the
// methods in a closure to avoid creating global variables.

if (typeof JSON !== "object") {
    JSON = {};
}

(function () {
    "use strict";

    var rx_one = /^[\],:{}\s]*$/;
    var rx_two = /\\(?:["\\\/bfnrt]|u[0-9a-fA-F]{4})/g;
    var rx_three = /"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g;
    var rx_four = /(?:^|:|,)(?:\s*\[)+/g;
    var rx_escapable = /[\\"\u0000-\u001f\u007f-\u009f\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g;
    var rx_dangerous = /[\u0000\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g;

    function f(n) {
        // Format integers to have at least two digits.
        return n < 10
            ? "0" + n
            : n;
    }

    function this_value() {
        return this.valueOf();
    }

    if (typeof Date.prototype.toJSON !== "function") {

        Date.prototype.toJSON = function () {

            return isFinite(this.valueOf())
                ? this.getUTCFullYear() + "-" +
                        f(this.getUTCMonth() + 1) + "-" +
                        f(this.getUTCDate()) + "T" +
                        f(this.getUTCHours()) + ":" +
                        f(this.getUTCMinutes()) + ":" +
                        f(this.getUTCSeconds()) + "Z"
                : null;
        };

        Boolean.prototype.toJSON = this_value;
        Number.prototype.toJSON = this_value;
        String.prototype.toJSON = this_value;
    }

    var gap;
    var indent;
    var meta;
    var rep;


    function quote(string) {

// If the string contains no control characters, no quote characters, and no
// backslash characters, then we can safely slap some quotes around it.
// Otherwise we must also replace the offending characters with safe escape
// sequences.

        rx_escapable.lastIndex = 0;
        return rx_escapable.test(string)
            ? "\"" + string.replace(rx_escapable, function (a) {
                var c = meta[a];
                return typeof c === "string"
                    ? c
                    : "\\u" + ("0000" + a.charCodeAt(0).toString(16)).slice(-4);
            }) + "\""
            : "\"" + string + "\"";
    }


    function str(key, holder) {

// Produce a string from holder[key].

        var i;          // The loop counter.
        var k;          // The member key.
        var v;          // The member value.
        var length;
        var mind = gap;
        var partial;
        var value = holder[key];

// If the value has a toJSON method, call it to obtain a replacement value.

        if (value && typeof value === "object" &&
                typeof value.toJSON === "function") {
            value = value.toJSON(key);
        }

// If we were called with a replacer function, then call the replacer to
// obtain a replacement value.

        if (typeof rep === "function") {
            value = rep.call(holder, key, value);
        }

// What happens next depends on the value's type.

        switch (typeof value) {
        case "string":
            return quote(value);

        case "number":

// JSON numbers must be finite. Encode non-finite numbers as null.

            return isFinite(value)
                ? String(value)
                : "null";

        case "boolean":
        case "null":

// If the value is a boolean or null, convert it to a string. Note:
// typeof null does not produce "null". The case is included here in
// the remote chance that this gets fixed someday.

            return String(value);

// If the type is "object", we might be dealing with an object or an array or
// null.

        case "object":

// Due to a specification blunder in ECMAScript, typeof null is "object",
// so watch out for that case.

            if (!value) {
                return "null";
            }

// Make an array to hold the partial results of stringifying this object value.

            gap += indent;
            partial = [];

// Is the value an array?

            if (Object.prototype.toString.apply(value) === "[object Array]") {

// The value is an array. Stringify every element. Use null as a placeholder
// for non-JSON values.

                length = value.length;
                for (i = 0; i < length; i += 1) {
                    partial[i] = str(i, value) || "null";
                }

// Join all of the elements together, separated with commas, and wrap them in
// brackets.

                v = partial.length === 0
                    ? "[]"
                    : gap
                        ? "[\n" + gap + partial.join(",\n" + gap) + "\n" + mind + "]"
                        : "[" + partial.join(",") + "]";
                gap = mind;
                return v;
            }

// If the replacer is an array, use it to select the members to be stringified.

            if (rep && typeof rep === "object") {
                length = rep.length;
                for (i = 0; i < length; i += 1) {
                    if (typeof rep[i] === "string") {
                        k = rep[i];
                        v = str(k, value);
                        if (v) {
                            partial.push(quote(k) + (
                                gap
                                    ? ": "
                                    : ":"
                            ) + v);
                        }
                    }
                }
            } else {

// Otherwise, iterate through all of the keys in the object.

                for (k in value) {
                    if (Object.prototype.hasOwnProperty.call(value, k)) {
                        v = str(k, value);
                        if (v) {
                            partial.push(quote(k) + (
                                gap
                                    ? ": "
                                    : ":"
                            ) + v);
                        }
                    }
                }
            }

// Join all of the member texts together, separated with commas,
// and wrap them in braces.

            v = partial.length === 0
                ? "{}"
                : gap
                    ? "{\n" + gap + partial.join(",\n" + gap) + "\n" + mind + "}"
                    : "{" + partial.join(",") + "}";
            gap = mind;
            return v;
        }
    }

// If the JSON object does not yet have a stringify method, give it one.

    if (typeof JSON.stringify !== "function") {
        meta = {    // table of character substitutions
            "\b": "\\b",
            "\t": "\\t",
            "\n": "\\n",
            "\f": "\\f",
            "\r": "\\r",
            "\"": "\\\"",
            "\\": "\\\\"
        };
        JSON.stringify = function (value, replacer, space) {

// The stringify method takes a value and an optional replacer, and an optional
// space parameter, and returns a JSON text. The replacer can be a function
// that can replace values, or an array of strings that will select the keys.
// A default replacer method can be provided. Use of the space parameter can
// produce text that is more easily readable.

            var i;
            gap = "";
            indent = "";

// If the space parameter is a number, make an indent string containing that
// many spaces.

            if (typeof space === "number") {
                for (i = 0; i < space; i += 1) {
                    indent += " ";
                }

// If the space parameter is a string, it will be used as the indent string.

            } else if (typeof space === "string") {
                indent = space;
            }

// If there is a replacer, it must be a function or an array.
// Otherwise, throw an error.

            rep = replacer;
            if (replacer && typeof replacer !== "function" &&
                    (typeof replacer !== "object" ||
                    typeof replacer.length !== "number")) {
                throw new Error("JSON.stringify");
            }

// Make a fake root object containing our value under the key of "".
// Return the result of stringifying the value.

            return str("", {"": value});
        };
    }


// If the JSON object does not yet have a parse method, give it one.

    if (typeof JSON.parse !== "function") {
        JSON.parse = function (text, reviver) {

// The parse method takes a text and an optional reviver function, and returns
// a JavaScript value if the text is a valid JSON text.

            var j;

            function walk(holder, key) {

// The walk method is used to recursively walk the resulting structure so
// that modifications can be made.

                var k;
                var v;
                var value = holder[key];
                if (value && typeof value === "object") {
                    for (k in value) {
                        if (Object.prototype.hasOwnProperty.call(value, k)) {
                            v = walk(value, k);
                            if (v !== undefined) {
                                value[k] = v;
                            } else {
                                delete value[k];
                            }
                        }
                    }
                }
                return reviver.call(holder, key, value);
            }


// Parsing happens in four stages. In the first stage, we replace certain
// Unicode characters with escape sequences. JavaScript handles many characters
// incorrectly, either silently deleting them, or treating them as line endings.

            text = String(text);
            rx_dangerous.lastIndex = 0;
            if (rx_dangerous.test(text)) {
                text = text.replace(rx_dangerous, function (a) {
                    return "\\u" +
                            ("0000" + a.charCodeAt(0).toString(16)).slice(-4);
                });
            }

// In the second stage, we run the text against regular expressions that look
// for non-JSON patterns. We are especially concerned with "()" and "new"
// because they can cause invocation, and "=" because it can cause mutation.
// But just to be safe, we want to reject all unexpected forms.

// We split the second stage into 4 regexp operations in order to work around
// crippling inefficiencies in IE's and Safari's regexp engines. First we
// replace the JSON backslash pairs with "@" (a non-JSON character). Second, we
// replace all simple value tokens with "]" characters. Third, we delete all
// open brackets that follow a colon or comma or that begin the text. Finally,
// we look to see that the remaining characters are only whitespace or "]" or
// "," or ":" or "{" or "}". If that is so, then the text is safe for eval.

            if (
                rx_one.test(
                    text
                        .replace(rx_two, "@")
                        .replace(rx_three, "]")
                        .replace(rx_four, "")
                )
            ) {

// In the third stage we use the eval function to compile the text into a
// JavaScript structure. The "{" operator is subject to a syntactic ambiguity
// in JavaScript: it can begin a block or an object literal. We wrap the text
// in parens to eliminate the ambiguity.

                j = eval("(" + text + ")");

// In the optional fourth stage, we recursively walk the new structure, passing
// each name/value pair to a reviver function for possible transformation.

                return (typeof reviver === "function")
                    ? walk({"": j}, "")
                    : j;
            }

// If the text is not JSON parseable, then a SyntaxError is thrown.

            throw new SyntaxError("JSON.parse");
        };
    }
}());
