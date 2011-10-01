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
    function BBCodeParser(allowed_tags) {
      var name, tag, _i, _len;
      if (allowed_tags == null) {
        allowed_tags = null;
      }
      this.tags = {};
      if (!allowed_tags) {
        for (name in BBCODE_TAGS) {
          tag = BBCODE_TAGS[name];
          this.register_tag(name, tag);
        }
      } else {
        for (_i = 0, _len = allowed_tags.length; _i < _len; _i++) {
          name = allowed_tags[_i];
          if (__indexOf.call(BBCODE_TAGS, name) >= 0) {
            this.register_tag(name, BBCODE_TAGS[name]);
          }
        }
      }
      this.renderer = new BBCodeRenderer();
    }
    BBCodeParser.prototype.register_tag = function(name, tag) {
      return this.tags[name] = tag;
    };
    BBCodeParser.prototype._parse_params = function(token) {
      var c, key, params, skip_next, target, terminate, value, _i, _len;
      params = [];
      if (token) {
        target = key = [];
        value = [];
        terminate = ' ';
        skip_next = false;
        for (_i = 0, _len = token.length; _i < _len; _i++) {
          c = token[_i];
          if (skip_next) {
            skip_next = false;
          } else if (target === key && c === '=') {
            target = value;
          } else if (!value.length && c === '"') {
            terminate = c;
          } else if (c !== terminate) {
            target.push(c);
          } else {
            params.push([key.join('').toLowerCase(), value.join('')]);
            if (!_SPACE_RE.test(terminate)) {
              skip_next = true;
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
    BBCodeParser.prototype._create_text_node = function(parent, text) {
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
      var cls, current, params, root, tag, tag_name, token, tokens;
      current = root = new BBCodeTag(this.renderer);
      tokens = bbcode.split(_TOKEN_RE);
      while (tokens.length) {
        token = tokens.shift();
        if (token.match(_TOKEN_RE)) {
          params = this._parse_params(token.slice(1, -1));
          tag_name = params[0][0];
          if (__indexOf.call(current.CLOSED_BY, tag_name) >= 0) {
            tokens.unshift(token);
            tag_name = '/' + current.name;
            params = [];
          }
          if (tag_name[0] === '/') {
            tag_name = tag_name.slice(1);
            if (!(tag_name in this.tags)) {
              this._create_text_node(current, token);
              continue;
            }
            if (current.name === tag_name) {
              current = current.parent;
            }
          } else {
            cls = this.tags[tag_name];
            if (!cls) {
              this._create_text_node(current, token);
              continue;
            }
            tag = new cls(this.renderer, {
              name: tag_name,
              parent: current,
              params: params
            });
            if (!tag.SELF_CLOSE && (__indexOf.call(tag.CLOSED_BY, tag_name) < 0 || current.name !== tag_name)) {
              current = tag;
            }
          }
        } else {
          this._create_text_node(current, token);
        }
      }
      return root;
    };
    BBCodeParser.prototype.to_html = function(bbcode, prettify) {
      var html;
      if (prettify == null) {
        prettify = false;
      }
      return html = this.parse(bbcode).to_html();
    };
    return BBCodeParser;
  })();
}).call(this);
