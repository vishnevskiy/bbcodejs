(function() {
  var key, _COSMETIC_DICT, _COSMETIC_RE, _ESCAPE_DICT, _ESCAPE_RE, _URL_RE;
  var __slice = Array.prototype.slice;
  _ESCAPE_RE = /[&<>"]/g;
  _ESCAPE_DICT = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;'
  };
  _URL_RE = /\b((?:([\w-]+):(\/{1,3})|www[.])(?:(?:(?:[^\s&()]|&amp;|&quot;)*(?:[^!"#$%&'()*+,.:;<=>?@\[\]^`{|}~\s]))|(?:\((?:[^\s&()]|&amp;|&quot;)*\)))+)/g;
  _COSMETIC_DICT = {
    '--': '&ndash;',
    '---': '&mdash;',
    '...': '&#8230;',
    '(c)': '&copy;',
    '(reg)': '&reg;',
    '(tm)': '&trade;'
  };
  _COSMETIC_RE = new RegExp(((function() {
    var _results;
    _results = [];
    for (key in _COSMETIC_DICT) {
      _results.push(key.replace(/(\.|\)|\()/g, '\\$1'));
    }
    return _results;
  })()).join('|'));
  this.bbcode.Renderer = (function() {
    function Renderer() {
      this._contexts = [];
      this.options = {
        linkify: true
      };
    }
    Renderer.prototype.context = function(context, func) {
      var k, newOptions, v, _ref;
      newOptions = {};
      _ref = this.options;
      for (k in _ref) {
        v = _ref[k];
        newOptions[k] = v;
      }
      for (k in context) {
        v = context[k];
        newOptions[k] = v;
      }
      this._contexts.push(this.options);
      this.options = newOptions;
      v = func();
      this.options = this._contexts.pop();
      return v;
    };
    Renderer.prototype.escape = function(value) {
      return value.replace(_ESCAPE_RE, function(match) {
        return _ESCAPE_DICT[match];
      });
    };
    Renderer.prototype.linkify = function(value) {
      return value.replace(_URL_RE, function() {
        var href, match, proto, url;
        match = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
        url = match[1];
        proto = match[2];
        if (proto && (proto !== 'http' && proto !== 'https')) {
          return url;
        }
        href = match[1];
        if (!proto) {
          href = 'http://' + href;
        }
        return "<a href=\"" + href + "\" target=\"_blank\">" + url + "</a>";
      });
    };
    Renderer.prototype.strip = function(text) {
      return text.replace(/^\s+|\s+$/g, '');
    };
    Renderer.prototype.cosmeticReplace = function(value) {
      return value.replace(_COSMETIC_RE, function() {
        var item, match;
        match = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
        item = match[0];
        return _COSMETIC_DICT[item] || item;
      });
    };
    Renderer.prototype.htmlAttributes = function(attributes) {
      var k, v;
      if (!attributes) {
        return '';
      }
      return ((function() {
        var _results;
        _results = [];
        for (k in attributes) {
          v = attributes[k];
          _results.push("" + k + "=\"" + v + "\"");
        }
        return _results;
      })()).join(' ');
    };
    return Renderer;
  })();
}).call(this);
