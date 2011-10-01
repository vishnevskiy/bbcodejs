(function() {
  var _SPACE_RE, _START_NEWLINE_RE, _TOKEN_RE;
  var __indexOf = Array.prototype.indexOf || function(item) {
    for (var i = 0, l = this.length; i < l; i++) {
      if (this[i] === item) return i;
    }
    return -1;
  };
  _SPACE_RE = /^\s*$/;
  _TOKEN_RE = /(\[\/?.+?\])/;
  _START_NEWLINE_RE = /^\r?\n/;
  window.BBCodeParser = (function() {
    function BBCodeParser(allowedTags) {
      var name, tag, _i, _len;
      if (allowedTags == null) {
        allowedTags = null;
      }
      this.tags = {};
      if (!allowedTags) {
        for (name in BBCODE_TAGS) {
          tag = BBCODE_TAGS[name];
          this.registerTag(name, tag);
        }
      } else {
        for (_i = 0, _len = allowedTags.length; _i < _len; _i++) {
          name = allowedTags[_i];
          if (__indexOf.call(BBCODE_TAGS, name) >= 0) {
            this.registerTag(name, BBCODE_TAGS[name]);
          }
        }
      }
      this.renderer = new BBCodeRenderer();
    }
    BBCodeParser.prototype.registerTag = function(name, tag) {
      return this.tags[name] = tag;
    };
    BBCodeParser.prototype._parseParams = function(token) {
      var c, key, params, skipNext, target, terminate, value, _i, _len;
      params = [];
      if (token) {
        target = key = [];
        value = [];
        terminate = ' ';
        skipNext = false;
        for (_i = 0, _len = token.length; _i < _len; _i++) {
          c = token[_i];
          if (skipNext) {
            skipNext = false;
          } else if (target === key && c === '=') {
            target = value;
          } else if (!value.length && c === '"') {
            terminate = c;
          } else if (c !== terminate) {
            target.push(c);
          } else {
            params.push([key.join('').toLowerCase(), value.join('')]);
            if (!_SPACE_RE.test(terminate)) {
              skipNext = true;
            }
            target = key = [];
            value = [];
            terminate = ' ';
          }
        }
        params.push([key.join('').toLowerCase(), value.join('')]);
      }
      return params;
    };
    BBCodeParser.prototype._createTextNode = function(parent, text) {
      var _ref;
      if ((_ref = parent.children.slice(-1)[0]) != null ? _ref.STRIP_OUTER : void 0) {
        text = text.replace(_START_NEWLINE_RE, '');
      }
      return new BBCodeTag(this.renderer, {
        text: text,
        parent: parent
      });
    };
    BBCodeParser.prototype.parse = function(bbcode) {
      var cls, current, params, root, tag, tagName, token, tokens;
      current = root = new BBCodeTag(this.renderer);
      tokens = bbcode.split(_TOKEN_RE);
      while (tokens.length) {
        token = tokens.shift();
        if (token.match(_TOKEN_RE)) {
          params = this._parseParams(token.slice(1, -1));
          tagName = params[0][0];
          if (__indexOf.call(current.CLOSED_BY, tagName) >= 0) {
            tokens.unshift(token);
            tagName = '/' + current.name;
            params = [];
          }
          if (tagName[0] === '/') {
            tagName = tagName.slice(1);
            if (!(tagName in this.tags)) {
              this._createTextNode(current, token);
              continue;
            }
            if (current.name === tagName) {
              current = current.parent;
            }
          } else {
            cls = this.tags[tagName];
            if (!cls) {
              this._createTextNode(current, token);
              continue;
            }
            tag = new cls(this.renderer, {
              name: tagName,
              parent: current,
              params: params
            });
            if (!tag.SELF_CLOSE && (__indexOf.call(tag.CLOSED_BY, tagName) < 0 || current.name !== tagName)) {
              current = tag;
            }
          }
        } else {
          this._createTextNode(current, token);
        }
      }
      return root;
    };
    BBCodeParser.prototype.toHTML = function(bbcode) {
      var html;
      return html = this.parse(bbcode).toHTML();
    };
    return BBCodeParser;
  })();
}).call(this);
