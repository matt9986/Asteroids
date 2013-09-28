//     (c) 2011-2012 Thomas Fuchs
//     keymaster.js may be freely distributed under the MIT license.

;(function(global){
  var k,
    _handlers =3D {},
    _mods =3D { 16: false, 18: false, 17: false, 91: false },
    _scope =3D 'all',
    // modifier keys
    _MODIFIERS =3D {
      '=E2=87=A7': 16, shift: 16,
      '=E2=8C=A5': 18, alt: 18, option: 18,
      '=E2=8C=83': 17, ctrl: 17, control: 17,
      '=E2=8C=98': 91, command: 91
    },
    // special keys
    _MAP =3D {
      backspace: 8, tab: 9, clear: 12,
      enter: 13, 'return': 13,
      esc: 27, escape: 27, space: 32,
      left: 37, up: 38,
      right: 39, down: 40,
      del: 46, 'delete': 46,
      home: 36, end: 35,
      pageup: 33, pagedown: 34,
      ',': 188, '.': 190, '/': 191,
      '`': 192, '-': 189, '=3D': 187,
      ';': 186, '\'': 222,
      '[': 219, ']': 221, '\\': 220
    },
    code =3D function(x){
      return _MAP[x] || x.toUpperCase().charCodeAt(0);
    },
    _downKeys =3D [];

  for(k=3D1;k&lt;20;k++) _MAP['f'+k] =3D 111+k;

  // IE doesn't support Array#indexOf, so have a simple replacement
  function index(array, item){
    var i =3D array.length;
    while(i--) if(array[i]=3D=3D=3Ditem) return i;
    return -1;
  }

  // for comparing mods before unassignment
  function compareArray(a1, a2) {
    if (a1.length !=3D a2.length) return false;
    for (var i =3D 0; i &lt; a1.length; i++) {
        if (a1[i] !=3D=3D a2[i]) return false;
    }
    return true;
  }

  var modifierMap =3D {
      16:'shiftKey',
      18:'altKey',
      17:'ctrlKey',
      91:'metaKey'
  };
  function updateModifierKey(event) {
      for(k in _mods) _mods[k] =3D event[modifierMap[k]];
  };

  // handle keydown event
  function dispatch(event) {
    var key, handler, k, i, modifiersMatch, scope;
    key =3D event.keyCode;

    if (index(_downKeys, key) =3D=3D -1) {
        _downKeys.push(key);
    }

    // if a modifier key, set the key.&lt;modifierkeyname&gt; property to t=
rue and return
    if(key =3D=3D 93 || key =3D=3D 224) key =3D 91; // right command on web=
kit, command on Gecko
    if(key in _mods) {
      _mods[key] =3D true;
      // 'assignKey' from inside this closure is exported to window.key
      for(k in _MODIFIERS) if(_MODIFIERS[k] =3D=3D key) assignKey[k] =3D tr=
ue;
      return;
    }
    updateModifierKey(event);

    // see if we need to ignore the keypress (filter() can can be overridde=
n)
    // by default ignore key presses if a select, textarea, or input is foc=
used
    if(!assignKey.filter.call(this, event)) return;

    // abort if no potentially matching shortcuts found
    if (!(key in _handlers)) return;

    scope =3D getScope();

    // for each potential shortcut
    for (i =3D 0; i &lt; _handlers[key].length; i++) {
      handler =3D _handlers[key][i];

      // see if it's in the current scope
      if(handler.scope =3D=3D scope || handler.scope =3D=3D 'all'){
        // check if modifiers match if any
        modifiersMatch =3D handler.mods.length &gt; 0;
        for(k in _mods)
          if((!_mods[k] &amp;&amp; index(handler.mods, +k) &gt; -1) ||
            (_mods[k] &amp;&amp; index(handler.mods, +k) =3D=3D -1)) modifi=
ersMatch =3D false;
        // call the handler and stop the event if neccessary
        if((handler.mods.length =3D=3D 0 &amp;&amp; !_mods[16] &amp;&amp; !=
_mods[18] &amp;&amp; !_mods[17] &amp;&amp; !_mods[91]) || modifiersMatch){
          if(handler.method(event, handler)=3D=3D=3Dfalse){
            if(event.preventDefault) event.preventDefault();
              else event.returnValue =3D false;
            if(event.stopPropagation) event.stopPropagation();
            if(event.cancelBubble) event.cancelBubble =3D true;
          }
        }
      }
    }
  };

  // unset modifier keys on keyup
  function clearModifier(event){
    var key =3D event.keyCode, k,
        i =3D index(_downKeys, key);

    // remove key from _downKeys
    if (i &gt;=3D 0) {
        _downKeys.splice(i, 1);
    }

    if(key =3D=3D 93 || key =3D=3D 224) key =3D 91;
    if(key in _mods) {
      _mods[key] =3D false;
      for(k in _MODIFIERS) if(_MODIFIERS[k] =3D=3D key) assignKey[k] =3D fa=
lse;
    }
  };

  function resetModifiers() {
    for(k in _mods) _mods[k] =3D false;
    for(k in _MODIFIERS) assignKey[k] =3D false;
  };

  // parse and assign shortcut
  function assignKey(key, scope, method){
    var keys, mods;
    keys =3D getKeys(key);
    if (method =3D=3D=3D undefined) {
      method =3D scope;
      scope =3D 'all';
    }

    // for each shortcut
    for (var i =3D 0; i &lt; keys.length; i++) {
      // set modifier keys if any
      mods =3D [];
      key =3D keys[i].split('+');
      if (key.length &gt; 1){
        mods =3D getMods(key);
        key =3D [key[key.length-1]];
      }
      // convert to keycode and...
      key =3D key[0]
      key =3D code(key);
      // ...store handler
      if (!(key in _handlers)) _handlers[key] =3D [];
      _handlers[key].push({ shortcut: keys[i], scope: scope, method: method=
, key: keys[i], mods: mods });
    }
  };

  // unbind all handlers for given key in current scope
  function unbindKey(key, scope) {
    var multipleKeys, keys,
      mods =3D [],
      i, j, obj;

    multipleKeys =3D getKeys(key);

    for (j =3D 0; j &lt; multipleKeys.length; j++) {
      keys =3D multipleKeys[j].split('+');

      if (keys.length &gt; 1) {
        mods =3D getMods(keys);
        key =3D keys[keys.length - 1];
      }

      key =3D code(key);

      if (scope =3D=3D=3D undefined) {
        scope =3D getScope();
      }
      if (!_handlers[key]) {
        return;
      }
      for (i in _handlers[key]) {
        obj =3D _handlers[key][i];
        // only clear handlers if correct scope and mods match
        if (obj.scope =3D=3D=3D scope &amp;&amp; compareArray(obj.mods, mod=
s)) {
          _handlers[key][i] =3D {};
        }
      }
    }
  };

  // Returns true if the key with code 'keyCode' is currently down
  // Converts strings into key codes.
  function isPressed(keyCode) {
      if (typeof(keyCode)=3D=3D'string') {
        keyCode =3D code(keyCode);
      }
      return index(_downKeys, keyCode) !=3D -1;
  }

  function getPressedKeyCodes() {
      return _downKeys.slice(0);
  }

  function filter(event){
    var tagName =3D (event.target || event.srcElement).tagName;
    // ignore keypressed in any elements that support keyboard data input
    return !(tagName =3D=3D 'INPUT' || tagName =3D=3D 'SELECT' || tagName =
=3D=3D 'TEXTAREA');
  }

  // initialize key.&lt;modifier&gt; to false
  for(k in _MODIFIERS) assignKey[k] =3D false;

  // set current scope (default 'all')
  function setScope(scope){ _scope =3D scope || 'all' };
  function getScope(){ return _scope || 'all' };

  // delete all handlers for a given scope
  function deleteScope(scope){
    var key, handlers, i;

    for (key in _handlers) {
      handlers =3D _handlers[key];
      for (i =3D 0; i &lt; handlers.length; ) {
        if (handlers[i].scope =3D=3D=3D scope) handlers.splice(i, 1);
        else i++;
      }
    }
  };

  // abstract key logic for assign and unassign
  function getKeys(key) {
    var keys;
    key =3D key.replace(/\s/g, '');
    keys =3D key.split(',');
    if ((keys[keys.length - 1]) =3D=3D '') {
      keys[keys.length - 2] +=3D ',';
    }
    return keys;
  }

  // abstract mods logic for assign and unassign
  function getMods(key) {
    var mods =3D key.slice(0, key.length - 1);
    for (var mi =3D 0; mi &lt; mods.length; mi++)
    mods[mi] =3D _MODIFIERS[mods[mi]];
    return mods;
  }

  // cross-browser events
  function addEvent(object, event, method) {
    if (object.addEventListener)
      object.addEventListener(event, method, false);
    else if(object.attachEvent)
      object.attachEvent('on'+event, function(){ method(window.event) });
  };

  // set the handlers globally on document
  addEvent(document, 'keydown', function(event) { dispatch(event) }); // Pa=
ssing _scope to a callback to ensure it remains the same by execution. Fixe=
s #48
  addEvent(document, 'keyup', clearModifier);

  // reset modifiers to false whenever the window is (re)focused.
  addEvent(window, 'focus', resetModifiers);

  // store previously defined key
  var previousKey =3D global.key;

  // restore previously defined key and return reference to our key object
  function noConflict() {
    var k =3D global.key;
    global.key =3D previousKey;
    return k;
  }

  // set window.key and window.key.set/get/deleteScope, and the default fil=
ter
  global.key =3D assignKey;
  global.key.setScope =3D setScope;
  global.key.getScope =3D getScope;
  global.key.deleteScope =3D deleteScope;
  global.key.filter =3D filter;
  global.key.isPressed =3D isPressed;
  global.key.getPressedKeyCodes =3D getPressedKeyCodes;
  global.key.noConflict =3D noConflict;
  global.key.unbind =3D unbindKey;

  if(typeof module !=3D=3D 'undefined') module.exports =3D key;

})(this);