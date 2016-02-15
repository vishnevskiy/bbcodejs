_NEWLINE_RE = /\r?\n/g
_LINE_BREAK = '<br />'

bbcode = @bbcode;

class @bbcode.Tag
  constructor: (@renderer, settings={}) ->
    @CLOSED_BY = []
    @SELF_CLOSE = false
    @STRIP_INNER = false
    @STRIP_OUTER = false
    @DISCARD_TEXT = false

    @name = settings['name'] or null
    @parent = settings['parent'] or null
    @text = settings['text'] or ''

    if @parent
      @parent.children.push(@)

    settings['params'] ?= []

    @params = {}

    for [key, value] in settings['params']
      if value
        @params[key] = value

    @children = []

  getContent: (raw=false) ->
    pieces = []

    if @text
      text = @renderer.escape(@text)
      
      if not raw
        if @renderer.options['linkify']
          text = @renderer.linkify(text)

        text = @renderer.cosmeticReplace(text.replace(_NEWLINE_RE, _LINE_BREAK))

      pieces.push(text)

    children = @children

    for child in children
      if raw
        pieces.push(child.toText())
      else
        if @DISCARD_TEXT and child.name is null
          continue

        pieces.push(child.toHTML())

    content = pieces.join('')

    if not raw and @STRIP_INNER
        content = @renderer.strip(content)

        while content[0..._LINE_BREAK.length] is _LINE_BREAK
            content = content.slice(_LINE_BREAK.length)

        while content.slice(-_LINE_BREAK.length) is _LINE_BREAK
            content = content.slice(0, -_LINE_BREAK.length)

        content = @renderer.strip(content)

    return content

  toText: (contentAsHTML=false) ->
    pieces = []

    if @name isnt null
      if @params.length
        params = ([k, v].join('=') for k, v of @params).join(' ')

        if @name of @params
          pieces.push("[#{params}]")
        else
          pieces.push("[#{@name} #{params}]")
      else
        pieces.push("[#{@name}]")

    pieces.push(@getContent(not contentAsHTML))

    if @name isnt null and @name not in @CLOSED_BY
      pieces.push("[/#{@name}]")

    pieces.join('')

  _toHTML: ->
    @toText(true)

  toHTML: ->
    pieces = @_toHTML()
    if typeof pieces is 'string' then pieces else pieces.join('')

class CodeTag extends @bbcode.Tag
  constructor: ->
    super

    @STRIP_INNER = true

    @_inline = @params['code'] is 'inline'

    if not @_inline
      @STRIP_OUTER = true

  _toHTML: ->
      if @_inline
          return ['<code>', @getContent(true), '</code>']

      lang = @params['lang'] or @params[@name]

      if lang
          ["<pre class=\"prettyprint lang-#{lang}\">", @getContent(true), '</pre>']
      else
          ['<pre>', @getContent(true), '</pre>']

class ImageTag extends @bbcode.Tag
  _toHTML: ->
    attributes =
      src: @renderer.strip(@getContent(true))

    if 'width' of @params
      attributes['width'] = @params['width']

    if 'height' of @params
      attributes['height'] = @params['height']

    "<img #{@renderer.htmlAttributes(attributes)} />"

class SizeTag extends @bbcode.Tag
  _toHTML: ->
    size = @params['size']

    if isNaN(size)
      @getContent()
    else
      ["<span style=\"font-size:#{size}px\">", @getContent(), '</span>']

class ColorTag extends @bbcode.Tag
  _toHTML: ->
    color = @params['color']

    if color?
      ["<span style=\"color:#{color}\">", @getContent(), '</span>']
    else
      @getContent()

class CenterTag extends @bbcode.Tag
  _toHTML: ->
    ['<div style="text-align:center;">', @getContent(), '</div>']

class RightTag extends @bbcode.Tag
  _toHTML: ->
    ['<div style="float:right;">', @getContent(), '</div>']

class HorizontalRuleTag extends @bbcode.Tag
  constructor: ->
    super

    @SELF_CLOSE = true
    @STRIP_OUTER = true

  _toHTML: ->
    '<hr />'

class ListTag extends @bbcode.Tag
  constructor: ->
    super

    @STRIP_INNER = true
    @STRIP_OUTER = true

  _toHTML: ->
    listType = @params['list']

    if listType is '1'
        ['<ol>', @getContent(), '</ol>']
    else if listType is 'a'
        ['<ol style="list-style-type:lower-alpha;">', @getContent(), '</ol>']
    else if listType == 'A'
        ['<ol style="list-style-type:upper-alpha;">', @getContent(), '</ol>']
    else
        ['<ul>', @getContent(), '</ul>']

class ListItemTag extends @bbcode.Tag
  constructor: ->
    super

    @CLOSED_BY = ['*', '/list']
    @STRIP_INNER = true

  _toHTML: ->
      ['<li>', @getContent(), '</li>']

class QuoteTag extends @bbcode.Tag
  constructor: ->
    super

    @STRIP_INNER = true
    @STRIP_OUTER = true

  _toHTML: ->
    pieces = ['<blockquote>', @getContent()]

    citation = @params['quote']

    if citation
      pieces.push('<small>')
      pieces.push(citation)
      pieces.push('</small>')

    pieces.push('</blockquote>')

    return pieces

class LinkTag extends @bbcode.Tag
  _toHTML: ->
    url = @renderer.strip(@params[@name] or @getContent(true))

    if /javascript:/i.test(url)
      url = ''

    if url
      @renderer.context {'linkify': false}, =>
        ["<a href=\"#{url}\" target=\"_blank\">", @getContent(), '</a>']
    else
      @getContent()

@bbcode.createSimpleTag = (name, attributes) =>
  class SimpleTag extends @bbcode.Tag
    constructor: ->
      super

      for k ,v of attributes
        @[k] = v

    _toHTML: ->
      htmlAttributes = @renderer.htmlAttributes(@params)

      if htmlAttributes
        htmlAttributes = ' ' + htmlAttributes

      return ["<#{name}#{htmlAttributes}>", @getContent(), "</#{name}>"]

@bbcode.BUILTIN =
  b: @bbcode.createSimpleTag('strong')
  i: @bbcode.createSimpleTag('em')
  u: @bbcode.createSimpleTag('u')
  s: @bbcode.createSimpleTag('strike')
  h1: @bbcode.createSimpleTag('h1', {STRIP_OUTER: true})
  h2: @bbcode.createSimpleTag('h2', {STRIP_OUTER: true})
  h3: @bbcode.createSimpleTag('h3', {STRIP_OUTER: true})
  h4: @bbcode.createSimpleTag('h4', {STRIP_OUTER: true})
  h5: @bbcode.createSimpleTag('h5', {STRIP_OUTER: true})
  h6: @bbcode.createSimpleTag('h6', {STRIP_OUTER: true})
  pre: @bbcode.createSimpleTag('pre')
  table: @bbcode.createSimpleTag('table', {DISCARD_TEXT: true})
  thead: @bbcode.createSimpleTag('thead', {DISCARD_TEXT: true})
  tbody: @bbcode.createSimpleTag('tbody', {DISCARD_TEXT: true})
  tr: @bbcode.createSimpleTag('tr', {DISCARD_TEXT: true})
  th: @bbcode.createSimpleTag('th')
  td: @bbcode.createSimpleTag('td')
  code: CodeTag
  img: ImageTag
  hr: HorizontalRuleTag
  size: SizeTag
  center: CenterTag
  right: RightTag
  color: ColorTag
  list: ListTag
  '*': ListItemTag
  quote: QuoteTag
  url: LinkTag
  link: LinkTag
