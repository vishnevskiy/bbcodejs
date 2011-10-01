_WHITESPACE = ' '
_SPACE_RE = /^\s*$/
_TOKEN_RE = /(\[\/?.+?\])/
_START_NEWLINE_RE = /'^\r?\n'/

_ESCAPE_RE = /'[&<>"]'/
_ESCAPE_DICT =
  '&': '&amp;'
  '<': '&lt;'
  '>': '&gt;'
  '"': '&quot;'

_URL_RE = /\b((?:([\w-]+):(\/{1,3})|www[.])(?:(?:(?:[^\s&()]|&amp;|&quot;)*(?:[^!"#$%&'()*+,.:;<=>?@\[\]^`{|}~\s]))|(?:\((?:[^\s&()]|&amp;|&quot;)*\)))+)/

_NEWLINE_RE = /\r?\n/g
_LINE_BREAK = /<br \/>/g

class Renderer
  constructor: ->
    @_contexts = []
    @options =
      linkify: true

  escape: (value) ->
    value  

  linkify: (text) ->
    text

  cosmetic_replace: (s) ->
    s

  html_attributes: (attributes) ->
    if not attributes.length
      return ''

    return ("#{item[0]}=\"#{item[1]}\"" for item in attributes).join(' ')

class Tag
  constructor: (@renderer, kwargs={}) ->
    @CLOSED_BY = []
    @SELF_CLOSE = false
    @STRIP_INNER = false
    @STRIP_OUTER = false
    @DISCARD_TEXT = false

    @name = kwargs['name'] or null
    @parent = kwargs['parent'] or null
    @text = kwargs['text'] or ''

    if @parent
      @parent.children.push(@)

    kwargs['params'] ?= []

    @params = {}

    for [key, value] in kwargs['params']
      if value
        @params[key] = value

    @children = []

  get_content: (raw=false) ->
    pieces = []

    if @text
      text = @renderer.escape(@text)

      if not raw
        if @renderer.options['linkify']
          text = @renderer.linkify(text)

        text = @renderer.cosmetic_replace(text.replace(_NEWLINE_RE))

      pieces.push(text)

    children = @children

    for child in children
      if raw
        pieces.push(child.to_text())
      else
        if @DISCARD_TEXT and child.name is null
          continue

        pieces.push(child.to_html())

    content = pieces.join('')
    
#    if not raw and selfSTRIP_INNER:
#        content = content.strip()
#
#        while content.startswith(_LINE_BREAK):
#            content = content[len(_LINE_BREAK):]
#
#        while content.endswith(_LINE_BREAK):
#            content = content[:-len(_LINE_BREAK)]
#
#        content = content.strip()

    return content

  to_text: (content_as_html=false) ->
    pieces = []

    if @name isnt null
      if @params
        params = ([k, v].join('=') for k, v of @params).join(' ')

        if @name of @params
          pieces.push("[#{params}]")
        else
          pieces.push("[#{name} #{params}]")
      else
        pieces.push("[#{name}]")

    pieces.push(@get_content(not content_as_html))

    if @name isnt null and @name not in @CLOSED_BY
      pieces.push("[/#{name}]")

    pieces.join('')

  _to_html: ->
    [@to_text(true)]

  to_html: ->
    @_to_html().join('') 

class CodeTag extends Tag
    constructor: ->
      super

      @STRIP_INNER = true
      @_inline = @params['code'] is 'inline'

      if not @_inline
        @STRIP_OUTER = true

    _to_html: ->
        if @_inline
            return ['<code>', @get_content(true), '</code>']

        lang = @params['lang'] or @params[@name]

        if lang
            return ["<pre class=\"prettyprint lang-#{lang}\">", @get_content(true), '</pre>']
        else
            return ['<pre>', @get_content(true), '</pre>']

create_simple_tag = (name, attributes) ->
  class SimpleTag extends Tag
    constructor: ->
      super

      for k ,v of attributes
        @[k] = v

    _to_html: ->
      html_attributes = @renderer.html_attributes(@params)

      if html_attributes
        html_attributes = ' ' + html_attributes

      return ["<#{name}#{html_attributes}>", @get_content(), "</#{name}>"]

BUILTIN_TAGS =
  b: create_simple_tag('strong')
  i: create_simple_tag('em')
  u: create_simple_tag('u')
  s: create_simple_tag('strike')
  h1: create_simple_tag('h1', {STRIP_OUTER: true})
  h2: create_simple_tag('h2', {STRIP_OUTER: true})
  h3: create_simple_tag('h3', {STRIP_OUTER: true})
  h4: create_simple_tag('h4', {STRIP_OUTER: true})
  h5: create_simple_tag('h5', {STRIP_OUTER: true})
  h6: create_simple_tag('h6', {STRIP_OUTER: true})
  pre: create_simple_tag('pre')
  table: create_simple_tag('table', {DISCARD_TEXT: true})
  thead: create_simple_tag('thead', {DISCARD_TEXT: true})
  tbody: create_simple_tag('tbody', {DISCARD_TEXT: true})
  tr: create_simple_tag('tr', {DISCARD_TEXT: true})
  th: create_simple_tag('th')
  td: create_simple_tag('td')
  code: CodeTag

class window.Parser
  constructor: (allowed_tags=null) ->
    if not allowed_tags
      @tags = BUILTIN_TAGS
    else
      @tags = {}

      for tag in allowed_tags
        if tag in BUILTIN_TAGS
          @tags[tag] = BUILTIN_TAGS[tag]

    @renderer = new Renderer()

  register_tag: (name, tag) ->
    @tags[name] = tag

  _parse_params: (token) ->
    params = []

    if token
      target = key = []
      value = []
      terminate = _WHITESPACE
      skip_next = false

      for c in token
        if skip_next
          skip_next = false
        else if target is key and c is '='
          target = value
        else if not value.length and c is '"'
          terminate = c
        else if c isnt terminate
          target.push(c)
        else
          params.push([key.join('').toLowerCase(), value.join('')])

          if not _SPACE_RE.test(terminate)
            skip_next = True

          target = key = []
          value = []
          terminate = _WHITESPACE

      params.push([key.join('').toLowerCase(), value.join('')])

    return params

  _create_text_node: (parent, text) ->
    if parent.children.length and parent.children.slice(-1)[0].STRIP_OUTER
      text = text.replace(_START_NEWLINE_RE, '')

    new Tag(@renderer,
      text: text
      parent: parent
    )

  parse: (bbcode) ->
    current = root = new Tag(@renderer)

    tokens = bbcode.split(_TOKEN_RE)

    while tokens.length
      token = tokens.shift()

      if token.match(_TOKEN_RE)
        params = @_parse_params(token[1...-1])
        tag_name = params[0][0]

        if tag_name in current.CLOSED_BY
          tokens.splice(0, 0, token)
          tag_name = '/' + current.name
          params = []

        if tag_name[0] is '/'
          tag_name = tag_name.slice(1)

          if tag_name not of @tags
            @_create_text_node(current, token)
            continue

          if current.name is tag_name
            current = current.parent
        else
          cls = @tags[tag_name]

          if not cls
            @_create_text_node(current, token)
            continue

          tag = new cls(@renderer,
            name: tag_name
            parent: current
            params: params
          )

          if not tag.SELF_CLOSE.length and (tag_name not in tag.CLOSED_BY or current.name isnt tag_name)
            current = tag
      else
        @_create_text_node(current, token)

    return root

  to_html: (bbcode, prettify=false) ->
    html = @parse(bbcode).to_html()


