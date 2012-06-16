(function() {

  this.bbcode = {};

}).call(this);
(function() {
  var key, _COSMETIC_DICT, _COSMETIC_RE, _ESCAPE_DICT, _ESCAPE_RE, _URL_RE,
    __slice = Array.prototype.slice;

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
        if (proto && (proto !== 'http' && proto !== 'https')) return url;
        href = match[1];
        if (!proto) href = 'http://' + href;
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
      if (!attributes) return '';
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
(function() {
  var CenterTag, CodeTag, ColorTag, HorizontalRuleTag, ImageTag, LinkTag, ListItemTag, ListTag, QuoteTag, RightTag, SizeTag, _LINE_BREAK, _NEWLINE_RE,
    __indexOf = Array.prototype.indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; },
    __hasProp = Object.prototype.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor; child.__super__ = parent.prototype; return child; },
    _this = this;

  _NEWLINE_RE = /\r?\n/g;

  _LINE_BREAK = '<br />';

  this.bbcode.Tag = (function() {

    function Tag(renderer, settings) {
      var key, value, _i, _len, _ref, _ref2;
      this.renderer = renderer;
      if (settings == null) settings = {};
      this.CLOSED_BY = [];
      this.SELF_CLOSE = false;
      this.STRIP_INNER = false;
      this.STRIP_OUTER = false;
      this.DISCARD_TEXT = false;
      this.name = settings['name'] || null;
      this.parent = settings['parent'] || null;
      this.text = settings['text'] || '';
      if (this.parent) this.parent.children.push(this);
      if (settings['params'] == null) settings['params'] = [];
      this.params = {};
      _ref = settings['params'];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        _ref2 = _ref[_i], key = _ref2[0], value = _ref2[1];
        if (value) this.params[key] = value;
      }
      this.children = [];
    }

    Tag.prototype.getContent = function(raw) {
      var child, children, content, pieces, text, _i, _len;
      if (raw == null) raw = false;
      pieces = [];
      if (this.text) {
        text = this.renderer.escape(this.text);
        if (!raw) {
          if (this.renderer.options['linkify']) text = this.renderer.linkify(text);
          text = this.renderer.cosmeticReplace(text.replace(_NEWLINE_RE, _LINE_BREAK));
        }
        pieces.push(text);
      }
      children = this.children;
      for (_i = 0, _len = children.length; _i < _len; _i++) {
        child = children[_i];
        if (raw) {
          pieces.push(child.toText());
        } else {
          if (this.DISCARD_TEXT && child.name === null) continue;
          pieces.push(child.toHTML());
        }
      }
      content = pieces.join('');
      if (!raw && this.STRIP_INNER) {
        content = this.renderer.strip(content);
        while (content.slice(0, _LINE_BREAK.length) === _LINE_BREAK) {
          content = content.slice(_LINE_BREAK.length);
        }
        while (content.slice(-_LINE_BREAK.length) === _LINE_BREAK) {
          content = content.slice(0, -_LINE_BREAK.length);
        }
        content = this.renderer.strip(content);
      }
      return content;
    };

    Tag.prototype.toText = function(contentAsHTML) {
      var k, params, pieces, v, _ref;
      if (contentAsHTML == null) contentAsHTML = false;
      pieces = [];
      if (this.name !== null) {
        if (this.params.length) {
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
            pieces.push("[" + this.name + " " + params + "]");
          }
        } else {
          pieces.push("[" + this.name + "]");
        }
      }
      pieces.push(this.getContent(!contentAsHTML));
      if (this.name !== null && (_ref = this.name, __indexOf.call(this.CLOSED_BY, _ref) < 0)) {
        pieces.push("[/" + this.name + "]");
      }
      return pieces.join('');
    };

    Tag.prototype._toHTML = function() {
      return this.toText(true);
    };

    Tag.prototype.toHTML = function() {
      var pieces;
      pieces = this._toHTML();
      if (typeof pieces === 'string') {
        return pieces;
      } else {
        return pieces.join('');
      }
    };

    return Tag;

  })();

  CodeTag = (function(_super) {

    __extends(CodeTag, _super);

    function CodeTag() {
      CodeTag.__super__.constructor.apply(this, arguments);
      this.STRIP_INNER = true;
      this._inline = this.params['code'] === 'inline';
      if (!this._inline) this.STRIP_OUTER = true;
    }

    CodeTag.prototype._toHTML = function() {
      var lang;
      if (this._inline) return ['<code>', this.getContent(true), '</code>'];
      lang = this.params['lang'] || this.params[this.name];
      if (lang) {
        return ["<pre class=\"prettyprint lang-" + lang + "\">", this.getContent(true), '</pre>'];
      } else {
        return ['<pre>', this.getContent(true), '</pre>'];
      }
    };

    return CodeTag;

  })(this.bbcode.Tag);

  ImageTag = (function(_super) {

    __extends(ImageTag, _super);

    function ImageTag() {
      ImageTag.__super__.constructor.apply(this, arguments);
    }

    ImageTag.prototype._toHTML = function() {
      var attributes;
      attributes = {
        src: this.renderer.strip(this.getContent(true))
      };
      if ('width' in this.params) attributes['width'] = this.params['width'];
      if ('height' in this.params) attributes['height'] = this.params['height'];
      return "<img " + (this.renderer.htmlAttributes(attributes)) + " />";
    };

    return ImageTag;

  })(this.bbcode.Tag);

  SizeTag = (function(_super) {

    __extends(SizeTag, _super);

    function SizeTag() {
      SizeTag.__super__.constructor.apply(this, arguments);
    }

    SizeTag.prototype._toHTML = function() {
      var size;
      size = this.params['size'];
      if (isNaN(size)) {
        return this.getContent();
      } else {
        return ["<span style=\"font-size:" + size + "px\">", this.getContent(), '</span>'];
      }
    };

    return SizeTag;

  })(this.bbcode.Tag);

  ColorTag = (function(_super) {

    __extends(ColorTag, _super);

    function ColorTag() {
      ColorTag.__super__.constructor.apply(this, arguments);
    }

    ColorTag.prototype._toHTML = function() {
      var color;
      color = this.params['color'];
      if (color != null) {
        return ["<span style=\"color:" + color + "\">", this.getContent(), '</span>'];
      } else {
        return this.getContent();
      }
    };

    return ColorTag;

  })(this.bbcode.Tag);

  CenterTag = (function(_super) {

    __extends(CenterTag, _super);

    function CenterTag() {
      CenterTag.__super__.constructor.apply(this, arguments);
    }

    CenterTag.prototype._toHTML = function() {
      return ['<div style="text-align:center;">', this.getContent(), '</div>'];
    };

    return CenterTag;

  })(this.bbcode.Tag);

  RightTag = (function(_super) {

    __extends(RightTag, _super);

    function RightTag() {
      RightTag.__super__.constructor.apply(this, arguments);
    }

    RightTag.prototype._toHTML = function() {
      return ['<div style="float:right;">', this.getContent(), '</div>'];
    };

    return RightTag;

  })(this.bbcode.Tag);

  HorizontalRuleTag = (function(_super) {

    __extends(HorizontalRuleTag, _super);

    function HorizontalRuleTag() {
      HorizontalRuleTag.__super__.constructor.apply(this, arguments);
      this.SELF_CLOSE = true;
      this.STRIP_OUTER = true;
    }

    HorizontalRuleTag.prototype._toHTML = function() {
      return '<hr />';
    };

    return HorizontalRuleTag;

  })(this.bbcode.Tag);

  ListTag = (function(_super) {

    __extends(ListTag, _super);

    function ListTag() {
      ListTag.__super__.constructor.apply(this, arguments);
      this.STRIP_INNER = true;
      this.STRIP_OUTER = true;
    }

    ListTag.prototype._toHTML = function() {
      var listType;
      listType = this.params['list'];
      if (listType === '1') {
        return ['<ol>', this.getContent(), '</ol>'];
      } else if (listType === 'a') {
        return ['<ol style="list-style-type:lower-alpha;">', this.getContent(), '</ol>'];
      } else if (listType === 'A') {
        return ['<ol style="list-style-type:upper-alpha;">', this.getContent(), '</ol>'];
      } else {
        return ['<ul>', this.getContent(), '</ul>'];
      }
    };

    return ListTag;

  })(this.bbcode.Tag);

  ListItemTag = (function(_super) {

    __extends(ListItemTag, _super);

    function ListItemTag() {
      ListItemTag.__super__.constructor.apply(this, arguments);
      this.CLOSED_BY = ['*', '/list'];
      this.STRIP_INNER = true;
    }

    ListItemTag.prototype._toHTML = function() {
      return ['<li>', this.getContent(), '</li>'];
    };

    return ListItemTag;

  })(this.bbcode.Tag);

  QuoteTag = (function(_super) {

    __extends(QuoteTag, _super);

    function QuoteTag() {
      QuoteTag.__super__.constructor.apply(this, arguments);
      this.STRIP_INNER = true;
      this.STRIP_OUTER = true;
    }

    QuoteTag.prototype._toHTML = function() {
      var citation, pieces;
      pieces = ['<blockquote>', this.getContent()];
      citation = this.params['quote'];
      if (citation) {
        pieces.push('<small>');
        pieces.push(citation);
        pieces.push('</small>');
      }
      pieces.push('</blockquote>');
      return pieces;
    };

    return QuoteTag;

  })(this.bbcode.Tag);

  LinkTag = (function(_super) {

    __extends(LinkTag, _super);

    function LinkTag() {
      LinkTag.__super__.constructor.apply(this, arguments);
    }

    LinkTag.prototype._toHTML = function() {
      var url,
        _this = this;
      url = this.renderer.strip(this.params[this.name] || this.getContent(true));
      if (/javascript:/i.test(url)) {
        url = '';
      } else if (!/:/.test(url)) {
        url = 'http://' + url;
      }
      if (url) {
        return this.renderer.context({
          'linkify': false
        }, function() {
          return ["<a href=\"" + url + "\" target=\"_blank\">", _this.getContent(), '</a>'];
        });
      } else {
        return this.getContent();
      }
    };

    return LinkTag;

  })(this.bbcode.Tag);

  this.bbcode.createSimpleTag = function(name, attributes) {
    var SimpleTag;
    return SimpleTag = (function(_super) {

      __extends(SimpleTag, _super);

      function SimpleTag() {
        var k, v;
        SimpleTag.__super__.constructor.apply(this, arguments);
        for (k in attributes) {
          v = attributes[k];
          this[k] = v;
        }
      }

      SimpleTag.prototype._toHTML = function() {
        var htmlAttributes;
        htmlAttributes = this.renderer.htmlAttributes(this.params);
        if (htmlAttributes) htmlAttributes = ' ' + htmlAttributes;
        return ["<" + name + htmlAttributes + ">", this.getContent(), "</" + name + ">"];
      };

      return SimpleTag;

    })(_this.bbcode.Tag);
  };

  this.bbcode.BUILTIN = {
    b: this.bbcode.createSimpleTag('strong'),
    i: this.bbcode.createSimpleTag('em'),
    u: this.bbcode.createSimpleTag('u'),
    s: this.bbcode.createSimpleTag('strike'),
    h1: this.bbcode.createSimpleTag('h1', {
      STRIP_OUTER: true
    }),
    h2: this.bbcode.createSimpleTag('h2', {
      STRIP_OUTER: true
    }),
    h3: this.bbcode.createSimpleTag('h3', {
      STRIP_OUTER: true
    }),
    h4: this.bbcode.createSimpleTag('h4', {
      STRIP_OUTER: true
    }),
    h5: this.bbcode.createSimpleTag('h5', {
      STRIP_OUTER: true
    }),
    h6: this.bbcode.createSimpleTag('h6', {
      STRIP_OUTER: true
    }),
    pre: this.bbcode.createSimpleTag('pre'),
    table: this.bbcode.createSimpleTag('table', {
      DISCARD_TEXT: true
    }),
    thead: this.bbcode.createSimpleTag('thead', {
      DISCARD_TEXT: true
    }),
    tbody: this.bbcode.createSimpleTag('tbody', {
      DISCARD_TEXT: true
    }),
    tr: this.bbcode.createSimpleTag('tr', {
      DISCARD_TEXT: true
    }),
    th: this.bbcode.createSimpleTag('th'),
    td: this.bbcode.createSimpleTag('td'),
    code: CodeTag,
    img: ImageTag,
    hr: HorizontalRuleTag,
    size: SizeTag,
    center: CenterTag,
    right: RightTag,
    color: ColorTag,
    list: ListTag,
    '*': ListItemTag,
    quote: QuoteTag,
    url: LinkTag,
    link: LinkTag
  };

}).call(this);
(function() {
  var _SPACE_RE, _START_NEWLINE_RE, _TOKEN_RE,
    __indexOf = Array.prototype.indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

  _SPACE_RE = /^\s*$/;

  _TOKEN_RE = /(\[\/?.+?\])/;

  _START_NEWLINE_RE = /^\r?\n/;

  this.bbcode.Parser = (function() {

    function Parser(allowedTags) {
      var name, tag, _i, _len, _ref;
      if (allowedTags == null) allowedTags = null;
      this.tags = {};
      if (!allowedTags) {
        _ref = bbcode.BUILTIN;
        for (name in _ref) {
          tag = _ref[name];
          this.registerTag(name, tag);
        }
      } else {
        for (_i = 0, _len = allowedTags.length; _i < _len; _i++) {
          name = allowedTags[_i];
          if (__indexOf.call(bbcode.BUILTIN, name) >= 0) {
            this.registerTag(name, bbcode.BUILTIN[name]);
          }
        }
      }
      this.renderer = new bbcode.Renderer();
    }

    Parser.prototype.registerTag = function(name, tag) {
      return this.tags[name] = tag;
    };

    Parser.prototype._parseParams = function(token) {
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
            if (!_SPACE_RE.test(terminate)) skipNext = true;
            target = key = [];
            value = [];
            terminate = ' ';
          }
        }
        params.push([key.join('').toLowerCase(), value.join('')]);
      }
      return params;
    };

    Parser.prototype._createTextNode = function(parent, text) {
      var _ref;
      if ((_ref = parent.children.slice(-1)[0]) != null ? _ref.STRIP_OUTER : void 0) {
        text = text.replace(_START_NEWLINE_RE, '');
      }
      return new bbcode.Tag(this.renderer, {
        text: text,
        parent: parent
      });
    };

    Parser.prototype.parse = function(input) {
      var cls, current, params, root, tag, tagName, token, tokens;
      current = root = new bbcode.Tag(this.renderer);
      tokens = input.split(_TOKEN_RE);
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
            if (current.name === tagName) current = current.parent;
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

    Parser.prototype.toHTML = function(input) {
      var html;
      return html = this.parse(input).toHTML();
    };

    return Parser;

  })();

}).call(this);
(function() {
  var MARKUP;

  MARKUP = {
    bold: {
      keyCode: 66,
      title: 'Bold (Ctrl+B)',
      placeholder: 'bold text',
      open: '[b]',
      close: '[/b]'
    },
    italic: {
      keyCode: 73,
      title: 'Italic (Ctrl+I)',
      placeholder: 'italic text',
      open: '[i]',
      close: '[/i]'
    },
    center: {
      keyCode: 69,
      title: 'Center (Ctrl+E)',
      placeholder: 'center text',
      open: '[center]',
      close: '[/center]'
    },
    hyperlink: {
      keyCode: 76,
      title: 'Hyperlink (Ctrl+L)',
      placeholder: 'link text',
      open: function() {
        var url;
        url = prompt('Please enter the URL of your link', 'http://') || 'link url';
        return "[url=" + url + "]";
      },
      close: '[/url]'
    },
    blockquote: {
      keyCode: 190,
      title: 'Blockquote (Ctrl+.)',
      placeholder: 'blockquote',
      open: '[quote]',
      close: '[/quote]'
    },
    code: {
      keyCode: 76,
      title: 'Code (Ctrl+K)',
      placeholder: 'print("code sample");',
      open: '[code]',
      close: '[/code]'
    },
    image: {
      keyCode: 71,
      placeholder: 'image url',
      open: '[img]',
      close: '[/img]'
    },
    nlist: {
      keyCode: 79,
      title: 'Numbered List (Ctrl+O)',
      placeholder: 'list item',
      open: function(value) {
        var close, open, _ref, _ref2;
        open = ((_ref = value.match(/\[list=1\]/g)) != null ? _ref.length : void 0) || 0;
        close = ((_ref2 = value.match(/\[\/list\]/g)) != null ? _ref2.length : void 0) || 0;
        if (open === close) return '[list=1]\n\t[*]';
        return '\t[*]';
      },
      close: function(value) {
        var close, open, _ref, _ref2;
        open = ((_ref = value.match(/\[list=1\]/g)) != null ? _ref.length : void 0) || 0;
        close = ((_ref2 = value.match(/\[\/list\]/g)) != null ? _ref2.length : void 0) || 0;
        if (open === close) return '\n[/list]';
      }
    },
    list: {
      keyCode: 85,
      title: 'Bulleted List (Ctrl+O)',
      placeholder: 'list item',
      open: function(value) {
        var close, open, _ref, _ref2;
        open = ((_ref = value.match(/\[list\]/g)) != null ? _ref.length : void 0) || 0;
        close = ((_ref2 = value.match(/\[\/list\]/g)) != null ? _ref2.length : void 0) || 0;
        if (open === close) return '[list]\n\t[*]';
        return '\t[*]';
      },
      close: function(value) {
        var close, open, _ref, _ref2;
        open = ((_ref = value.match(/\[list\]/g)) != null ? _ref.length : void 0) || 0;
        close = ((_ref2 = value.match(/\[\/list\]/g)) != null ? _ref2.length : void 0) || 0;
        if (open === close) return '\n[/list]';
      }
    },
    heading: {
      keyCode: 72,
      title: 'Heading (Ctrl+H)',
      placeholder: 'heading',
      open: '[h3]',
      close: '[/h3]',
      before: /\n$/,
      after: /^\n/
    },
    hrule: {
      keyCode: 82,
      title: 'Hprizontal Rule (Ctrl+R)',
      open: '[hr]\n',
      before: /\n\n$/,
      after: /^\n\n/
    }
  };

  this.bbcode.Editor = (function() {

    function Editor(textarea, markup) {
      var _this = this;
      this.markup = markup != null ? markup : MARKUP;
      this.$ = $(textarea);
      this.textarea = this.$[0];
      this.$.on('keydown', function(e) {
        var end, length, line, lines, offset, selection, start, tab, _i, _len, _ref, _ref2, _ref3, _ref4;
        if (e.which === 9) {
          selection = _this.getSelection();
          offset = 0;
          if (selection.start === selection.end && !e.shiftKey) {
            offset++;
            selection.value[1] = "\t" + selection.value[1];
            _this.setValue(selection.value.join(''));
          } else {
            length = 0;
            tab = false;
            lines = [];
            _ref = _this.textarea.value.split('\n');
            for (_i = 0, _len = _ref.length; _i < _len; _i++) {
              line = _ref[_i];
              _ref2 = [length, length += line.length + 1], start = _ref2[0], end = _ref2[1];
              if (!tab && (start <= (_ref3 = selection.start) && _ref3 < end)) {
                tab = true;
              }
              if (tab) {
                if (e.shiftKey) {
                  if (line[0] === '\t') {
                    line = line.slice(1);
                    offset--;
                  }
                } else {
                  line = "\t" + line;
                  offset++;
                }
                tab = !((start <= (_ref4 = selection.end) && _ref4 <= end));
              }
              lines.push(line);
            }
            _this.setValue(lines.join('\n'));
          }
          if (offset > 0) {
            selection.start++;
          } else if (offset < 0) {
            selection.start--;
          }
          _this.select(selection.start, selection.end + offset);
        } else if (!e.ctrlKey || !(_this.getRule(e.which) != null)) {
          return true;
        } else {
          _this.replace(e.which);
        }
        return false;
      });
    }

    Editor.prototype._escapeRe = function(pattern) {
      var escaped, special;
      special = ['/', '.', '*', '+', '?', '|', '(', ')', '[', ']', '{', '}', '\\', '^', '$'];
      escaped = pattern.replace(new RegExp('(\\' + special.join('|\\') + ')', 'g'), '\\$1');
      return new RegExp('^' + escaped.replace(/\d+/, '\\d+') + '$');
    };

    Editor.prototype.getRule = function(keyCode) {
      var key, rule, _ref;
      _ref = this.markup;
      for (key in _ref) {
        rule = _ref[key];
        if (rule.keyCode === keyCode) return rule;
      }
    };

    Editor.prototype.replace = function(keyCode, value, text) {
      var close, open, replacement, rule, selection, start;
      this.$.focus();
      selection = this.getSelection();
      rule = this.getRule(keyCode);
      value = this.textarea.value;
      open = (typeof rule.open === 'function' ? rule.open(selection.value[0]) : rule.open) || '';
      close = (typeof rule.close === 'function' ? rule.close(selection.value[2]) : rule.close) || '';
      if (this._escapeRe(open).test(value.slice(selection.start - open.length, selection.start)) && this._escapeRe(close).test(value.slice(selection.end, selection.end + close.length))) {
        start = selection.start - open.length;
        this.setValue(value.substr(0, start) + selection.value[1] + value.substr(selection.end + close.length, value.length));
        return this.select(start, start + selection.value[1].length);
      } else {
        replacement = open + (text || selection.value[1] || rule.placeholder || '') + close;
        if ((rule.before != null) && !rule.before.test(selection.value[0])) {
          replacement = "\n\n" + replacement;
          selection.start += 2;
        }
        if ((rule.after != null) && !rule.after.test(selection.value[2])) {
          replacement += '\n\n';
          selection.end += 2;
        }
        this.setValue(selection.value[0] + replacement + selection.value[2]);
        return this.select(selection.start + open.length, selection.start + replacement.length - close.length);
      }
    };

    Editor.prototype.setValue = function(value) {
      var position;
      position = this.$.scrollTop();
      this.$.val(value);
      return this.$.scrollTop(position);
    };

    Editor.prototype.select = function(start, end) {
      var range, _ref;
      if (((_ref = document.selection) != null ? _ref.createRange : void 0) != null) {
        range = this.textarea.createTextRange();
        range.collapse(true);
        range.moveStart('character', start);
        range.moveEnd('character', end - start);
        return range.select();
      } else {
        this.textarea.selectionStart = start;
        return this.textarea.selectionEnd = end;
      }
    };

    Editor.prototype.getSelection = function() {
      var close, end, open, range, selection, start, storedRange, value, _ref;
      value = this.textarea.value;
      if (((_ref = document.selection) != null ? _ref.createRange : void 0) != null) {
        if (!/testarea/i.test(this.textarea.tagName)) {
          range = selection.createRange().duplicate();
          range.moveEnd('character', value.length);
          start = range.text === '' ? value.length : value.lastIndexOf(range.text);
          range = selection.createRange().duplicate();
          range.moveStart('character', -value.length);
          end = range.text.length;
        } else {
          range = selection.createRange();
          storedRange = range.duplicate();
          storedRange.moveToElementText(this.textarea);
          storedRange.setEndPoint('EndToEnd', range);
          start = storedRange.text.length - range.text.length;
          end = start + range.text.length;
        }
      } else {
        start = this.textarea.selectionStart;
        end = this.textarea.selectionEnd;
      }
      open = value.substring(0, start);
      close = value.substring(end, value.length);
      return selection = {
        start: start,
        end: end,
        value: [open, value.substring(start, end), close]
      };
    };

    return Editor;

  })();

}).call(this);
