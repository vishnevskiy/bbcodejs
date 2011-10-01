(function() {
  var BUILTIN_TAGS, CodeTag, Renderer, Tag, create_simple_tag, _ESCAPE_DICT, _ESCAPE_RE, _LINE_BREAK, _NEWLINE_RE, _SPACE_RE, _START_NEWLINE_RE, _TOKEN_RE, _URL_RE, _WHITESPACE;
  var __indexOf = Array.prototype.indexOf || function(item) {
    for (var i = 0, l = this.length; i < l; i++) {
      if (this[i] === item) return i;
    }
    return -1;
  }, __hasProp = Object.prototype.hasOwnProperty, __extends = function(child, parent) {
    for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; }
    function ctor() { this.constructor = child; }
    ctor.prototype = parent.prototype;
    child.prototype = new ctor;
    child.__super__ = parent.prototype;
    return child;
  };
  _WHITESPACE = ' ';
  _SPACE_RE = /^\s*$/;
  _TOKEN_RE = /(\[\/?.+?\])/;
  _START_NEWLINE_RE = /'^\r?\n'/;
  _ESCAPE_RE = /'[&<>"]'/;
  _ESCAPE_DICT = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;'
  };
  _URL_RE = /\b((?:([\w-]+):(\/{1,3})|www[.])(?:(?:(?:[^\s&()]|&amp;|&quot;)*(?:[^!"#$%&'()*+,.:;<=>?@\[\]^`{|}~\s]))|(?:\((?:[^\s&()]|&amp;|&quot;)*\)))+)/;
  _NEWLINE_RE = /\r?\n/g;
  _LINE_BREAK = /<br \/>/g;
  Renderer = (function() {
    function Renderer() {
      this._contexts = [];
      this.options = {
        linkify: true
      };
    }
    Renderer.prototype.escape = function(value) {
      return value;
    };
    Renderer.prototype.linkify = function(text) {
      return text;
    };
    Renderer.prototype.cosmetic_replace = function(s) {
      return s;
    };
    Renderer.prototype.html_attributes = function(attributes) {
      var item;
      if (!attributes.length) {
        return '';
      }
      return ((function() {
        var _i, _len, _results;
        _results = [];
        for (_i = 0, _len = attributes.length; _i < _len; _i++) {
          item = attributes[_i];
          _results.push("" + item[0] + "=\"" + item[1] + "\"");
        }
        return _results;
      })()).join(' ');
    };
    return Renderer;
  })();
  Tag = (function() {
    function Tag(renderer, kwargs) {
      var key, value, _i, _len, _ref, _ref2, _ref3;
      this.renderer = renderer;
      if (kwargs == null) {
        kwargs = {};
      }
      this.CLOSED_BY = [];
      this.SELF_CLOSE = false;
      this.STRIP_INNER = false;
      this.STRIP_OUTER = false;
      this.DISCARD_TEXT = false;
      this.name = kwargs['name'] || null;
      this.parent = kwargs['parent'] || null;
      this.text = kwargs['text'] || '';
      if (this.parent) {
        this.parent.children.push(this);
      }
            if ((_ref = kwargs['params']) != null) {
        _ref;
      } else {
        kwargs['params'] = [];
      };
      this.params = {};
      _ref2 = kwargs['params'];
      for (_i = 0, _len = _ref2.length; _i < _len; _i++) {
        _ref3 = _ref2[_i], key = _ref3[0], value = _ref3[1];
        if (value) {
          this.params[key] = value;
        }
      }
      this.children = [];
    }
    Tag.prototype.get_content = function(raw) {
      var child, children, content, pieces, text, _i, _len;
      if (raw == null) {
        raw = false;
      }
      pieces = [];
      if (this.text) {
        text = this.renderer.escape(this.text);
        if (!raw) {
          if (this.renderer.options['linkify']) {
            text = this.renderer.linkify(text);
          }
          text = this.renderer.cosmetic_replace(text.replace(_NEWLINE_RE));
        }
        pieces.push(text);
      }
      children = this.children;
      for (_i = 0, _len = children.length; _i < _len; _i++) {
        child = children[_i];
        if (raw) {
          pieces.push(child.to_text());
        } else {
          if (this.DISCARD_TEXT && child.name === null) {
            continue;
          }
          pieces.push(child.to_html());
        }
      }
      content = pieces.join('');
      return content;
    };
    Tag.prototype.to_text = function(content_as_html) {
      var k, params, pieces, v, _ref;
      if (content_as_html == null) {
        content_as_html = false;
      }
      pieces = [];
      if (this.name !== null) {
        if (this.params) {
          params = ((function() {
            var _ref, _results;
            _ref = this.params;
            _results = [];
            for (k in _ref) {
              v = _ref[k];
              _results.push([k, v].join('='));
            }
            return _results;
          }).call(this)).join(' ');
          if (this.name in this.params) {
            pieces.push("[" + params + "]");
          } else {
            pieces.push("[" + name + " " + params + "]");
          }
        } else {
          pieces.push("[" + name + "]");
        }
      }
      pieces.push(this.get_content(!content_as_html));
      if (this.name !== null && (_ref = this.name, __indexOf.call(this.CLOSED_BY, _ref) < 0)) {
        pieces.push("[/" + name + "]");
      }
      return pieces.join('');
    };
    Tag.prototype._to_html = function() {
      return [this.to_text(true)];
    };
    Tag.prototype.to_html = function() {
      return this._to_html().join('');
    };
    return Tag;
  })();
  CodeTag = (function() {
    __extends(CodeTag, Tag);
    function CodeTag() {
      CodeTag.__super__.constructor.apply(this, arguments);
      this.STRIP_INNER = true;
      this._inline = this.params['code'] === 'inline';
      if (!this._inline) {
        this.STRIP_OUTER = true;
      }
    }
    CodeTag.prototype._to_html = function() {
      var lang;
      if (this._inline) {
        return ['<code>', this.get_content(true), '</code>'];
      }
      lang = this.params['lang'] || this.params[this.name];
      if (lang) {
        return ["<pre class=\"prettyprint lang-" + lang + "\">", this.get_content(true), '</pre>'];
      } else {
        return ['<pre>', this.get_content(true), '</pre>'];
      }
    };
    return CodeTag;
  })();
  create_simple_tag = function(name, attributes) {
    var SimpleTag;
    return SimpleTag = (function() {
      __extends(SimpleTag, Tag);
      function SimpleTag() {
        var k, v;
        SimpleTag.__super__.constructor.apply(this, arguments);
        for (k in attributes) {
          v = attributes[k];
          this[k] = v;
        }
      }
      SimpleTag.prototype._to_html = function() {
        var html_attributes;
        html_attributes = this.renderer.html_attributes(this.params);
        if (html_attributes) {
          html_attributes = ' ' + html_attributes;
        }
        return ["<" + name + html_attributes + ">", this.get_content(), "</" + name + ">"];
      };
      return SimpleTag;
    })();
  };
  BUILTIN_TAGS = {
    b: create_simple_tag('strong'),
    i: create_simple_tag('em'),
    u: create_simple_tag('u'),
    s: create_simple_tag('strike'),
    h1: create_simple_tag('h1', {
      STRIP_OUTER: true
    }),
    h2: create_simple_tag('h2', {
      STRIP_OUTER: true
    }),
    h3: create_simple_tag('h3', {
      STRIP_OUTER: true
    }),
    h4: create_simple_tag('h4', {
      STRIP_OUTER: true
    }),
    h5: create_simple_tag('h5', {
      STRIP_OUTER: true
    }),
    h6: create_simple_tag('h6', {
      STRIP_OUTER: true
    }),
    pre: create_simple_tag('pre'),
    table: create_simple_tag('table', {
      DISCARD_TEXT: true
    }),
    thead: create_simple_tag('thead', {
      DISCARD_TEXT: true
    }),
    tbody: create_simple_tag('tbody', {
      DISCARD_TEXT: true
    }),
    tr: create_simple_tag('tr', {
      DISCARD_TEXT: true
    }),
    th: create_simple_tag('th'),
    td: create_simple_tag('td'),
    code: CodeTag
  };
  window.Parser = (function() {
    function Parser(allowed_tags) {
      var tag, _i, _len;
      if (allowed_tags == null) {
        allowed_tags = null;
      }
      if (!allowed_tags) {
        this.tags = BUILTIN_TAGS;
      } else {
        this.tags = {};
        for (_i = 0, _len = allowed_tags.length; _i < _len; _i++) {
          tag = allowed_tags[_i];
          if (__indexOf.call(BUILTIN_TAGS, tag) >= 0) {
            this.tags[tag] = BUILTIN_TAGS[tag];
          }
        }
      }
      this.renderer = new Renderer();
    }
    Parser.prototype.register_tag = function(name, tag) {
      return this.tags[name] = tag;
    };
    Parser.prototype._parse_params = function(token) {
      var c, key, params, skip_next, target, terminate, value, _i, _len;
      params = [];
      if (token) {
        target = key = [];
        value = [];
        terminate = _WHITESPACE;
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
              skip_next = True;
            }
            target = key = [];
            value = [];
            terminate = _WHITESPACE;
          }
        }
        params.push([key.join('').toLowerCase(), value.join('')]);
      }
      return params;
    };
    Parser.prototype._create_text_node = function(parent, text) {
      if (parent.children.length && parent.children.slice(-1)[0].STRIP_OUTER) {
        text = text.replace(_START_NEWLINE_RE, '');
      }
      return new Tag(this.renderer, {
        text: text,
        parent: parent
      });
    };
    Parser.prototype.parse = function(bbcode) {
      var cls, current, params, root, tag, tag_name, token, tokens;
      current = root = new Tag(this.renderer);
      tokens = bbcode.split(_TOKEN_RE);
      while (tokens.length) {
        token = tokens.shift();
        if (token.match(_TOKEN_RE)) {
          params = this._parse_params(token.slice(1, -1));
          tag_name = params[0][0];
          if (__indexOf.call(current.CLOSED_BY, tag_name) >= 0) {
            tokens.splice(0, 0, token);
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
            if (!tag.SELF_CLOSE.length && (__indexOf.call(tag.CLOSED_BY, tag_name) < 0 || current.name !== tag_name)) {
              current = tag;
            }
          }
        } else {
          this._create_text_node(current, token);
        }
      }
      return root;
    };
    Parser.prototype.to_html = function(bbcode, prettify) {
      var html;
      if (prettify == null) {
        prettify = false;
      }
      return html = this.parse(bbcode).to_html();
    };
    return Parser;
  })();
}).call(this);
